/**
 * Core Logic Distillation Service
 * Distills knowledge into first principles, mental models, decision rules, and anti-patterns
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
 * Distill core logic from domain knowledge
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @param {Object} options - Distillation options
 * @returns {Promise<Object>} - Distilled core logic
 */
async function distillCoreLogic(domainId, userId, options = {}) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  try {
    console.log(`[Core Logic] Starting distillation for domain ${domainId}`);

    // Get domain info
    const { data: domain, error: domainError } = await supabase
      .from("brain_domains")
      .select("*")
      .eq("id", domainId)
      .eq("user_id", userId)
      .single();

    if (domainError || !domain) {
      throw new Error("Domain not found");
    }

    // Get all knowledge for this domain
    const { data: knowledge, error: knowledgeError } = await supabase
      .from("brain_knowledge")
      .select("id, title, content, tags, metadata")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (knowledgeError) {
      throw new Error(`Failed to get knowledge: ${knowledgeError.message}`);
    }

    if (!knowledge || knowledge.length === 0) {
      throw new Error("No knowledge found in this domain");
    }

    // Get existing core logic to understand context
    const { data: existingCoreLogic } = await supabase
      .from("brain_core_logic")
      .select("*")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    // Prepare knowledge summary for AI
    const knowledgeSummary = knowledge
      .slice(0, 50) // Limit to 50 most recent items
      .map((k) => `- ${k.title}: ${k.content.substring(0, 300)}`)
      .join("\n");

    // Build prompt for distillation
    const prompt = buildDistillationPrompt(domain, knowledgeSummary, existingCoreLogic, options);

    // Call OpenAI for distillation
    const completion = await openai.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert knowledge distiller. Extract core logic from knowledge: first principles, mental models, decision rules, and anti-patterns. Return structured JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Validate and structure the result
    const coreLogic = {
      first_principles: result.first_principles || [],
      mental_models: result.mental_models || [],
      decision_rules: result.decision_rules || [],
      anti_patterns: result.anti_patterns || [],
      cross_domain_links: result.cross_domain_links || [],
    };

    // Get next version number
    const { data: versions } = await supabase
      .from("brain_core_logic")
      .select("version")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = versions && versions.length > 0 ? versions[0].version + 1 : 1;

    // Build changelog
    const changelog = buildChangelog(coreLogic, existingCoreLogic, nextVersion);

    // Save to database
    const { data: savedCoreLogic, error: saveError } = await supabase
      .from("brain_core_logic")
      .insert({
        domain_id: domainId,
        version: nextVersion,
        parent_version_id: existingCoreLogic?.id || null,
        first_principles: coreLogic.first_principles,
        mental_models: coreLogic.mental_models,
        decision_rules: coreLogic.decision_rules,
        anti_patterns: coreLogic.anti_patterns,
        cross_domain_links: coreLogic.cross_domain_links,
        changelog: changelog,
        last_distilled_at: new Date().toISOString(),
        is_active: true,
        change_summary: result.summary || `Distilled from ${knowledge.length} knowledge items`,
        user_id: userId,
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save core logic: ${saveError.message}`);
    }

    // Deactivate previous version
    if (existingCoreLogic) {
      await supabase
        .from("brain_core_logic")
        .update({ is_active: false })
        .eq("id", existingCoreLogic.id);
    }

    console.log(`[Core Logic] Distillation completed: version ${nextVersion}`);

    return {
      id: savedCoreLogic.id,
      domainId,
      version: nextVersion,
      ...coreLogic,
      changelog,
      knowledgeItemsProcessed: knowledge.length,
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error("[Core Logic] Distillation error:", error);
    throw error;
  }
}

/**
 * Build distillation prompt
 */
function buildDistillationPrompt(domain, knowledgeSummary, existingCoreLogic, options) {
  let prompt = `Distill core logic from the following knowledge domain.

Domain: ${domain.name}
${domain.description ? `Description: ${domain.description}` : ""}

Knowledge Items (${knowledgeSummary.split("\n").length} items):
${knowledgeSummary}

`;

  if (existingCoreLogic) {
    prompt += `Previous Core Logic (Version ${existingCoreLogic.version}):
- First Principles: ${existingCoreLogic.first_principles?.length || 0} items
- Mental Models: ${existingCoreLogic.mental_models?.length || 0} items
- Decision Rules: ${existingCoreLogic.decision_rules?.length || 0} items
- Anti-patterns: ${existingCoreLogic.anti_patterns?.length || 0} items

Please update and refine the core logic based on new knowledge.
`;
  }

  prompt += `
Extract and structure the following:

1. **First Principles** (fundamental truths):
   - Core concepts that are always true
   - Foundational principles
   - Universal rules

2. **Mental Models** (ways of thinking):
   - Frameworks for understanding
   - Cognitive models
   - Thinking patterns

3. **Decision Rules** (guidelines for decisions):
   - When-then rules
   - Decision criteria
   - Action guidelines

4. **Anti-patterns** (things to avoid):
   - Common mistakes
   - Bad practices
   - Warning signs

5. **Cross-domain Links** (connections to other domains):
   - Related concepts from other domains
   - Interdisciplinary connections

Return as JSON:
{
  "first_principles": [{"title": "...", "description": "...", "examples": [...]}],
  "mental_models": [{"name": "...", "description": "...", "application": "..."}],
  "decision_rules": [{"condition": "...", "action": "...", "rationale": "..."}],
  "anti_patterns": [{"name": "...", "description": "...", "alternative": "..."}],
  "cross_domain_links": [{"domain": "...", "concept": "...", "relationship": "..."}],
  "summary": "Brief summary of what was distilled"
}`;

  return prompt;
}

/**
 * Build changelog
 */
function buildChangelog(newCoreLogic, existingCoreLogic, version) {
  const changelog = [];

  if (existingCoreLogic) {
    // Compare and identify changes
    const changes = {
      version,
      type: "update",
      timestamp: new Date().toISOString(),
      changes: {
        first_principles: {
          added: newCoreLogic.first_principles.length - (existingCoreLogic.first_principles?.length || 0),
        },
        mental_models: {
          added: newCoreLogic.mental_models.length - (existingCoreLogic.mental_models?.length || 0),
        },
        decision_rules: {
          added: newCoreLogic.decision_rules.length - (existingCoreLogic.decision_rules?.length || 0),
        },
        anti_patterns: {
          added: newCoreLogic.anti_patterns.length - (existingCoreLogic.anti_patterns?.length || 0),
        },
      },
    };

    changelog.push(changes);
  } else {
    // First version
    changelog.push({
      version,
      type: "initial",
      timestamp: new Date().toISOString(),
      summary: "Initial core logic distillation",
    });
  }

  return changelog;
}

/**
 * Get core logic for domain
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @param {number} version - Optional version number
 * @returns {Promise<Object>} - Core logic
 */
async function getCoreLogic(domainId, userId, version = null) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    let query = supabase
      .from("brain_core_logic")
      .select("*")
      .eq("domain_id", domainId)
      .eq("user_id", userId);

    if (version) {
      query = query.eq("version", version);
    } else {
      // Get latest active version
      const { data: latest } = await supabase.rpc("get_latest_core_logic", {
        p_domain_id: domainId,
        p_user_id: userId,
      });

      if (latest && latest.length > 0) {
        return latest[0];
      }
      return null;
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get core logic: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("[Core Logic] Get error:", error);
    throw error;
  }
}

/**
 * Get all versions for domain
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of versions
 */
async function getCoreLogicVersions(domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const { data, error } = await supabase
      .from("brain_core_logic")
      .select("*")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .order("version", { ascending: false });

    if (error) {
      throw new Error(`Failed to get versions: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("[Core Logic] Get versions error:", error);
    throw error;
  }
}

/**
 * Compare two versions
 * @param {string} version1Id - First version ID
 * @param {string} version2Id - Second version ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Comparison result
 */
async function compareVersions(version1Id, version2Id, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const { data, error } = await supabase.rpc("compare_core_logic_versions", {
      p_version1_id: version1Id,
      p_version2_id: version2Id,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to compare versions: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("[Core Logic] Compare error:", error);
    throw error;
  }
}

/**
 * Rollback to previous version
 * @param {string} domainId - Domain ID
 * @param {number} targetVersion - Target version number
 * @param {string} userId - User ID
 * @param {string} reason - Rollback reason
 * @returns {Promise<Object>} - New version created from rollback
 */
async function rollbackVersion(domainId, targetVersion, userId, reason = null) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const { data, error } = await supabase.rpc("rollback_core_logic_version", {
      p_domain_id: domainId,
      p_target_version: targetVersion,
      p_user_id: userId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(`Failed to rollback: ${error.message}`);
    }

    // Get the new version
    const newVersion = await getCoreLogic(domainId, userId);

    return newVersion;
  } catch (error) {
    console.error("[Core Logic] Rollback error:", error);
    throw error;
  }
}

module.exports = {
  distillCoreLogic,
  getCoreLogic,
  getCoreLogicVersions,
  compareVersions,
  rollbackVersion,
  isConfigured: !!supabase && !!openai,
};

