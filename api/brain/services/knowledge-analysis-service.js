/**
 * Knowledge Analysis Service
 * Analyzes knowledge patterns, extracts concepts, and identifies relationships
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
 * Analyze domain knowledge
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeDomainKnowledge(domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  try {
    // Get all knowledge
    const { data: knowledge, error } = await supabase
      .from("brain_knowledge")
      .select("id, title, content, tags, metadata, created_at")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get knowledge: ${error.message}`);
    }

    if (!knowledge || knowledge.length === 0) {
      return {
        patterns: [],
        concepts: [],
        relationships: [],
        topics: [],
        summary: "No knowledge to analyze",
      };
    }

    // Prepare knowledge for analysis
    const knowledgeText = knowledge
      .slice(0, 100) // Limit to 100 items
      .map((k) => `Title: ${k.title}\nContent: ${k.content.substring(0, 500)}\nTags: ${k.tags?.join(", ") || "none"}`)
      .join("\n\n---\n\n");

    // Analyze with AI
    const prompt = `Analyze the following knowledge base and extract:

1. **Patterns** - Recurring themes, structures, or approaches
2. **Key Concepts** - Important ideas, terms, or principles
3. **Relationships** - Connections between concepts
4. **Topics** - Main subject areas

Knowledge Base:
${knowledgeText}

Return as JSON:
{
  "patterns": [{"name": "...", "description": "...", "frequency": "high|medium|low", "examples": [...]}],
  "concepts": [{"term": "...", "definition": "...", "importance": "high|medium|low", "related_terms": [...]}],
  "relationships": [{"concept1": "...", "concept2": "...", "type": "...", "strength": "strong|medium|weak"}],
  "topics": [{"name": "...", "description": "...", "knowledge_count": N, "key_concepts": [...]}],
  "summary": "Overall analysis summary"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return {
      patterns: analysis.patterns || [],
      concepts: analysis.concepts || [],
      relationships: analysis.relationships || [],
      topics: analysis.topics || [],
      summary: analysis.summary || "Analysis completed",
      knowledgeItemsAnalyzed: knowledge.length,
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error("[Knowledge Analysis] Error:", error);
    throw error;
  }
}

/**
 * Get knowledge patterns
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Patterns array
 */
async function getKnowledgePatterns(domainId, userId) {
  const analysis = await analyzeDomainKnowledge(domainId, userId);
  return analysis.patterns || [];
}

/**
 * Get key concepts
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Concepts array
 */
async function getKeyConcepts(domainId, userId) {
  const analysis = await analyzeDomainKnowledge(domainId, userId);
  return analysis.concepts || [];
}

/**
 * Get relationships
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Relationships array
 */
async function getRelationships(domainId, userId) {
  const analysis = await analyzeDomainKnowledge(domainId, userId);
  return analysis.relationships || [];
}

/**
 * Get topics
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Topics array
 */
async function getTopics(domainId, userId) {
  const analysis = await analyzeDomainKnowledge(domainId, userId);
  return analysis.topics || [];
}

module.exports = {
  analyzeDomainKnowledge,
  getKnowledgePatterns,
  getKeyConcepts,
  getRelationships,
  getTopics,
  isConfigured: !!supabase && !!openai,
};

