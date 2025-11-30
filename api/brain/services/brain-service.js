/**
 * Brain Service
 * Main orchestrator for AI Second Brain operations
 * Coordinates between embedding and retrieval services
 */

const { createClient } = require("@supabase/supabase-js");
const embeddingService = require("./embedding-service");
const retrievalService = require("./retrieval-service");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Ingest knowledge into the brain
 * @param {Object} knowledgeData - Knowledge data
 * @param {string} knowledgeData.domainId - Domain ID
 * @param {string} knowledgeData.title - Title
 * @param {string} knowledgeData.content - Content
 * @param {string} knowledgeData.contentType - Content type (default: 'document')
 * @param {string[]} knowledgeData.tags - Tags array
 * @param {string} knowledgeData.sourceUrl - Source URL (optional)
 * @param {string} knowledgeData.sourceFile - Source file (optional)
 * @param {Object} knowledgeData.metadata - Additional metadata (optional)
 * @param {string} userId - User ID (from auth)
 * @returns {Promise<Object>} - Created knowledge object
 */
async function ingestKnowledge(knowledgeData, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!embeddingService.isConfigured) {
    throw new Error("Embedding service not configured");
  }

  const {
    domainId,
    title,
    content,
    contentType = "document",
    tags = [],
    sourceUrl = null,
    sourceFile = null,
    metadata = {},
  } = knowledgeData;

  // Validate required fields
  if (!domainId || !title || !content) {
    throw new Error("domainId, title, and content are required");
  }

  if (!userId) {
    throw new Error("userId is required");
  }

  try {
    console.log(`[Brain] Ingesting knowledge: ${title.substring(0, 50)}...`);

    // Generate embedding for the content
    // Use title + content for better context
    const textToEmbed = `${title}\n\n${content}`;
    const embedding = await embeddingService.generateEmbedding(textToEmbed);

    // Insert into database
    const { data, error } = await supabase
      .from("brain_knowledge")
      .insert({
        domain_id: domainId,
        title,
        content,
        content_type: contentType,
        embedding,
        tags,
        source_url: sourceUrl,
        source_file: sourceFile,
        metadata,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("[Brain] Error inserting knowledge:", error);
      throw new Error(`Failed to ingest knowledge: ${error.message}`);
    }

    console.log(`[Brain] Knowledge ingested successfully: ${data.id}`);

    return {
      id: data.id,
      domainId: data.domain_id,
      title: data.title,
      content: data.content,
      contentType: data.content_type,
      tags: data.tags || [],
      sourceUrl: data.source_url,
      sourceFile: data.source_file,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("[Brain] Error in ingestKnowledge:", error);
    throw error;
  }
}

/**
 * Search knowledge by text query
 * @param {string} query - Search query text
 * @param {Object} options - Search options
 * @param {string[]} options.domainIds - Filter by domain IDs
 * @param {number} options.matchThreshold - Similarity threshold (0-1)
 * @param {number} options.matchCount - Maximum results
 * @param {string} userId - User ID (from auth)
 * @returns {Promise<Array>} - Array of matching knowledge chunks
 */
async function searchKnowledge(query, options = {}, userId = null) {
  if (!embeddingService.isConfigured) {
    throw new Error("Embedding service not configured");
  }

  if (!retrievalService.isConfigured) {
    throw new Error("Retrieval service not configured");
  }

  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  try {
    console.log(`[Brain] Searching knowledge: ${query.substring(0, 50)}...`);

    const searchOptions = {
      ...options,
      userId, // Add user ID to options
    };

    // Use retrieval service's searchByText which handles embedding generation
    const results = await retrievalService.searchByText(
      query,
      embeddingService.generateEmbedding,
      searchOptions
    );

    console.log(`[Brain] Found ${results.length} results`);

    return results;
  } catch (error) {
    console.error("[Brain] Error in searchKnowledge:", error);
    throw error;
  }
}

/**
 * Get domain by ID
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID (for RLS)
 * @returns {Promise<Object|null>} - Domain object or null
 */
async function getDomainById(domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const { data, error } = await supabase
      .from("brain_domains")
      .select("*")
      .eq("id", domainId)
      .eq("user_id", userId) // RLS will handle this, but explicit for clarity
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get domain: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("[Brain] Error getting domain:", error);
    throw error;
  }
}

/**
 * Get all domains for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of domain objects
 */
async function getDomains(userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const { data, error } = await supabase
      .from("brain_domains")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get domains: ${error.message}`);
    }

    return (data || []).map((domain) => ({
      id: domain.id,
      name: domain.name,
      description: domain.description,
      color: domain.color,
      icon: domain.icon,
      createdAt: domain.created_at,
      updatedAt: domain.updated_at,
    }));
  } catch (error) {
    console.error("[Brain] Error getting domains:", error);
    throw error;
  }
}

/**
 * Create a new domain
 * @param {Object} domainData - Domain data
 * @param {string} domainData.name - Domain name
 * @param {string} domainData.description - Description (optional)
 * @param {string} domainData.color - Color hex (optional)
 * @param {string} domainData.icon - Icon name (optional)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Created domain object
 */
async function createDomain(domainData, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { name, description = null, color = null, icon = null } = domainData;

  if (!name || name.trim().length === 0) {
    throw new Error("Domain name is required");
  }

  if (!userId) {
    throw new Error("userId is required");
  }

  try {
    const { data, error } = await supabase
      .from("brain_domains")
      .insert({
        name: name.trim(),
        description,
        color,
        icon,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        throw new Error("Domain with this name already exists");
      }
      throw new Error(`Failed to create domain: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("[Brain] Error creating domain:", error);
    throw error;
  }
}

/**
 * Update a domain
 * @param {string} domainId - Domain ID
 * @param {Object} updates - Fields to update
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated domain object
 */
async function updateDomain(domainId, updates, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const { data, error } = await supabase
      .from("brain_domains")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", domainId)
      .eq("user_id", userId) // Ensure user owns the domain
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Domain not found or access denied");
      }
      throw new Error(`Failed to update domain: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("[Brain] Error updating domain:", error);
    throw error;
  }
}

/**
 * Delete a domain
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteDomain(domainId, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const { error } = await supabase
      .from("brain_domains")
      .delete()
      .eq("id", domainId)
      .eq("user_id", userId); // Ensure user owns the domain

    if (error) {
      throw new Error(`Failed to delete domain: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("[Brain] Error deleting domain:", error);
    throw error;
  }
}

/**
 * Get Supabase client instance
 * @returns {import("@supabase/supabase-js").SupabaseClient} Supabase client
 */
function getSupabase() {
  return supabase;
}

/**
 * Generate embedding for text
 * Exposed for use in knowledge update
 */
async function generateEmbedding(text) {
  return embeddingService.generateEmbedding(text);
}

module.exports = {
  ingestKnowledge,
  searchKnowledge,
  getDomainById,
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
  getSupabase,
  generateEmbedding,
  isConfigured: !!supabase && embeddingService.isConfigured && retrievalService.isConfigured,
};
