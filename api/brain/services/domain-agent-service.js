/**
 * Domain Agent Service
 * Provides domain-specific AI agent capabilities
 */

const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "";
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * Query domain agent with context
 * @param {string} question - User question
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Agent response
 */
async function queryDomainAgent(question, domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  if (!question || question.trim().length === 0) {
    throw new Error("Question is required");
  }

  try {
    console.log(`[Domain Agent] Querying domain ${domainId}: ${question.substring(0, 50)}...`);

    // Get domain agent context
    const { data: context, error: contextError } = await supabase.rpc(
      "get_domain_agent_context",
      {
        p_domain_id: domainId,
        p_user_id: userId,
      }
    );

    if (contextError) {
      throw new Error(`Failed to get domain context: ${contextError.message}`);
    }

    if (!context || !context.domain) {
      throw new Error("Domain not found or access denied");
    }

    const domain = context.domain;
    const agentConfig = domain.agent_config || {};

    // Check if agent is enabled
    if (agentConfig.enabled === false) {
      throw new Error("Domain agent is disabled");
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(domain, agentConfig, context);

    // Get relevant knowledge for context
    const retrievalService = require("./retrieval-service");
    const embeddingService = require("./embedding-service");

    const relevantKnowledge = await retrievalService.searchByText(
      question,
      embeddingService.generateEmbedding,
      {
        domainIds: [domainId],
        userId,
        matchThreshold: 0.6,
        matchCount: 5,
      }
    );

    // Build messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...relevantKnowledge.slice(0, 3).map((k) => ({
        role: "system",
        content: `Relevant knowledge: ${k.title}\n${k.content.substring(0, 500)}`,
      })),
      { role: "user", content: question },
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: agentConfig.model || "gpt-4o-mini",
      messages,
      temperature: agentConfig.temperature || 0.7,
      max_tokens: agentConfig.max_tokens || 2000,
    });

    const response = completion.choices[0]?.message?.content || "No response generated";

    // Update domain agent stats
    await updateAgentStats(domainId, userId, true);

    // Log query
    await logDomainQuery(domainId, userId, question, response);

    return {
      response,
      domainId,
      domainName: domain.name,
      relevantKnowledge: relevantKnowledge.map((k) => ({
        id: k.id,
        title: k.title,
        similarity: k.similarity,
      })),
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error("[Domain Agent] Error:", error);
    await updateAgentStats(domainId, userId, false);
    throw error;
  }
}

/**
 * Auto-tag knowledge based on domain rules
 * @param {Object} knowledge - Knowledge object
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} - Suggested tags
 */
async function autoTagKnowledge(knowledge, domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  try {
    // Get domain and agent config
    const { data: domain, error } = await supabase
      .from("brain_domains")
      .select("name, agent_config")
      .eq("id", domainId)
      .eq("user_id", userId)
      .single();

    if (error || !domain) {
      throw new Error("Domain not found");
    }

    const agentConfig = domain.agent_config || {};
    const autoTagging = agentConfig.auto_tagging || {};

    if (autoTagging.enabled !== true) {
      return knowledge.tags || [];
    }

    // Get existing tags from domain
    const { data: existingKnowledge } = await supabase
      .from("brain_knowledge")
      .select("tags")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .limit(100);

    const existingTags = new Set();
    existingKnowledge?.forEach((k) => {
      k.tags?.forEach((tag) => existingTags.add(tag));
    });

    // Build prompt for tagging
    const prompt = `Analyze this knowledge and suggest relevant tags.

Domain: ${domain.name}
Title: ${knowledge.title}
Content: ${knowledge.content.substring(0, 1000)}

Existing tags in this domain: ${Array.from(existingTags).slice(0, 20).join(", ")}

Auto-tagging rules: ${JSON.stringify(autoTagging.rules || [])}

Suggest 3-5 relevant tags. Return as JSON array: ["tag1", "tag2", "tag3"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"tags": []}');
    const suggestedTags = result.tags || [];

    // Merge with existing tags
    const mergedTags = [...new Set([...(knowledge.tags || []), ...suggestedTags])];

    return mergedTags.slice(0, 10); // Max 10 tags
  } catch (error) {
    console.error("[Domain Agent] Auto-tag error:", error);
    return knowledge.tags || [];
  }
}

/**
 * Get domain-specific suggestions
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @param {number} limit - Number of suggestions
 * @returns {Promise<Array>} - Suggested knowledge items
 */
async function getDomainSuggestions(domainId, userId, limit = 5) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    // Get recent queries for this domain
    const { data: recentQueries } = await supabase
      .from("brain_query_history")
      .select("query, knowledge_ids")
      .eq("user_id", userId)
      .contains("domain_ids", [domainId])
      .order("created_at", { ascending: false })
      .limit(10);

    // Get knowledge that was frequently accessed
    const knowledgeIds = new Map();
    recentQueries?.forEach((q) => {
      q.knowledge_ids?.forEach((id) => {
        knowledgeIds.set(id, (knowledgeIds.get(id) || 0) + 1);
      });
    });

    const topKnowledgeIds = Array.from(knowledgeIds.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (topKnowledgeIds.length === 0) {
      // Fallback: get recent knowledge
      const { data: recentKnowledge } = await supabase
        .from("brain_knowledge")
        .select("id, title, content, tags")
        .eq("domain_id", domainId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      return (recentKnowledge || []).map((k) => ({
        id: k.id,
        title: k.title,
        preview: k.content.substring(0, 200),
        tags: k.tags || [],
        reason: "Recently added",
      }));
    }

    // Get suggested knowledge
    const retrievalService = require("./retrieval-service");
    const suggestions = await retrievalService.getKnowledgeByIds(topKnowledgeIds);

    return suggestions.map((k, index) => ({
      id: k.id,
      title: k.title,
      preview: k.content.substring(0, 200),
      tags: k.tags || [],
      reason: `Frequently accessed (${knowledgeIds.get(k.id)} times)`,
    }));
  } catch (error) {
    console.error("[Domain Agent] Get suggestions error:", error);
    return [];
  }
}

/**
 * Generate domain summary
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Domain summary
 */
async function generateDomainSummary(domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  try {
    // Get domain info
    const { data: domain, error } = await supabase
      .from("brain_domains")
      .select("*")
      .eq("id", domainId)
      .eq("user_id", userId)
      .single();

    if (error || !domain) {
      throw new Error("Domain not found");
    }

    // Get recent knowledge
    const { data: knowledge } = await supabase
      .from("brain_knowledge")
      .select("title, content, tags")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Get statistics
    const { data: stats } = await supabase
      .from("brain_domain_stats")
      .select("*")
      .eq("domain_id", domainId)
      .single();

    // Build prompt
    const prompt = `Generate a comprehensive summary for this knowledge domain.

Domain: ${domain.name}
Description: ${domain.description || "No description"}

Statistics:
- Total knowledge items: ${stats?.total_knowledge_count || 0}
- This week: ${stats?.knowledge_count_this_week || 0}
- This month: ${stats?.knowledge_count_this_month || 0}
- Top tags: ${stats?.top_tags?.map((t) => t.tag).join(", ") || "None"}

Recent knowledge (sample):
${knowledge?.slice(0, 5).map((k) => `- ${k.title}: ${k.content.substring(0, 200)}`).join("\n") || "No knowledge yet"}

Generate a summary with:
1. Domain overview (2-3 sentences)
2. Key themes and topics
3. Recent activity highlights
4. Notable insights

Return as JSON:
{
  "overview": "...",
  "keyThemes": ["theme1", "theme2"],
  "recentActivity": "...",
  "insights": ["insight1", "insight2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const summary = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return {
      domainId,
      domainName: domain.name,
      summary,
      statistics: stats || {},
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Domain Agent] Generate summary error:", error);
    throw error;
  }
}

/**
 * Build system prompt for domain agent
 */
function buildSystemPrompt(domain, agentConfig, context) {
  const basePrompt = `You are a specialized AI assistant for the "${domain.name}" knowledge domain.

${domain.description ? `Domain Description: ${domain.description}` : ""}

Your role:
- Answer questions using knowledge from this domain
- Provide context-aware responses
- Reference specific knowledge items when relevant
- Be concise but comprehensive
- Use Vietnamese mixed with English technical terms naturally

Available Context:
- Recent knowledge items in this domain
- Core logic and principles (if available)
- Domain-specific patterns and rules`;

  const customPrompt = agentConfig.system_prompt;
  if (customPrompt) {
    return `${basePrompt}\n\nCustom Instructions:\n${customPrompt}`;
  }

  return basePrompt;
}

/**
 * Update agent statistics
 */
async function updateAgentStats(domainId, userId, success) {
  if (!supabase) return;

  try {
    const { data: domain } = await supabase
      .from("brain_domains")
      .select("agent_total_queries, agent_success_rate")
      .eq("id", domainId)
      .eq("user_id", userId)
      .single();

    if (!domain) return;

    const totalQueries = (domain.agent_total_queries || 0) + 1;
    const currentSuccessRate = domain.agent_success_rate || 1.0;
    const newSuccessRate = success
      ? (currentSuccessRate * (totalQueries - 1) + 1) / totalQueries
      : (currentSuccessRate * (totalQueries - 1)) / totalQueries;

    await supabase
      .from("brain_domains")
      .update({
        agent_last_used_at: new Date().toISOString(),
        agent_total_queries: totalQueries,
        agent_success_rate: newSuccessRate,
      })
      .eq("id", domainId)
      .eq("user_id", userId);
  } catch (error) {
    console.error("[Domain Agent] Update stats error:", error);
  }
}

/**
 * Log domain query
 */
async function logDomainQuery(domainId, userId, question, response) {
  if (!supabase) return;

  try {
    await supabase.from("brain_query_history").insert({
      query: question,
      response: response.substring(0, 1000), // Truncate long responses
      domain_ids: [domainId],
      user_id: userId,
    });
  } catch (error) {
    console.error("[Domain Agent] Log query error:", error);
  }
}

module.exports = {
  queryDomainAgent,
  autoTagKnowledge,
  getDomainSuggestions,
  generateDomainSummary,
  isConfigured: !!supabase && !!openai,
};

