/**
 * Retrieval Service
 * Performs vector similarity search using Supabase RPC
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Use service role key for RPC calls, fallback to anon key
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Perform vector similarity search
 * @param {number[]} queryEmbedding - The query embedding vector (1536 dimensions)
 * @param {Object} options - Search options
 * @param {number} options.matchThreshold - Minimum similarity score (0-1), default 0.7
 * @param {number} options.matchCount - Maximum number of results, default 10
 * @param {string[]} options.domainIds - Optional array of domain IDs to filter by
 * @param {string} options.userId - Optional user ID for filtering
 * @returns {Promise<Array>} - Array of matching knowledge chunks with similarity scores
 */
async function vectorSearch(queryEmbedding, options = {}) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 1536) {
    throw new Error("Query embedding must be a 1536-dimensional vector");
  }

  const { matchThreshold = 0.7, matchCount = 10, domainIds = null, userId = null } = options;

  try {
    console.log(
      `[Retrieval] Searching with threshold: ${matchThreshold}, count: ${matchCount}, domains: ${
        domainIds?.length || "all"
      }`
    );

    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc("match_knowledge", {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      domain_ids: domainIds || null,
      user_id_filter: userId || null,
    });

    if (error) {
      console.error("[Retrieval] RPC error:", error);
      throw new Error(`Vector search failed: ${error.message}`);
    }

    console.log(`[Retrieval] Found ${data?.length || 0} results`);

    // Format results
    return (data || []).map((result) => ({
      id: result.id,
      domainId: result.domain_id,
      title: result.title,
      content: result.content,
      contentType: result.content_type,
      sourceUrl: result.source_url,
      tags: result.tags || [],
      similarity: result.similarity,
      metadata: result.metadata || {},
      createdAt: result.created_at,
    }));
  } catch (error) {
    console.error("[Retrieval] Error performing vector search:", error);
    throw error;
  }
}

/**
 * Search knowledge by text query (generates embedding first)
 * @param {string} queryText - Text query to search for
 * @param {Object} options - Search options
 * @param {Function} generateEmbeddingFn - Function to generate embedding (from embedding-service)
 * @returns {Promise<Array>} - Array of matching knowledge chunks
 */
async function searchByText(queryText, generateEmbeddingFn, options = {}) {
  if (!generateEmbeddingFn) {
    throw new Error("generateEmbeddingFn is required");
  }

  if (!queryText || queryText.trim().length === 0) {
    throw new Error("Query text cannot be empty");
  }

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbeddingFn(queryText);

    // Perform vector search
    const results = await vectorSearch(queryEmbedding, options);

    return results;
  } catch (error) {
    console.error("[Retrieval] Error in searchByText:", error);
    throw error;
  }
}

/**
 * Get knowledge by ID
 * @param {string} knowledgeId - Knowledge ID
 * @returns {Promise<Object|null>} - Knowledge object or null if not found
 */
async function getKnowledgeById(knowledgeId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const { data, error } = await supabase
      .from("brain_knowledge")
      .select("*")
      .eq("id", knowledgeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      throw new Error(`Failed to get knowledge: ${error.message}`);
    }

    return {
      id: data.id,
      domainId: data.domain_id,
      title: data.title,
      content: data.content,
      contentType: data.content_type,
      sourceUrl: data.source_url,
      sourceFile: data.source_file,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("[Retrieval] Error getting knowledge by ID:", error);
    throw error;
  }
}

/**
 * Get multiple knowledge items by IDs
 * @param {string[]} knowledgeIds - Array of knowledge IDs
 * @returns {Promise<Array>} - Array of knowledge objects
 */
async function getKnowledgeByIds(knowledgeIds) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!Array.isArray(knowledgeIds) || knowledgeIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("brain_knowledge")
      .select("*")
      .in("id", knowledgeIds);

    if (error) {
      throw new Error(`Failed to get knowledge: ${error.message}`);
    }

    return (data || []).map((item) => ({
      id: item.id,
      domainId: item.domain_id,
      title: item.title,
      content: item.content,
      contentType: item.content_type,
      sourceUrl: item.source_url,
      sourceFile: item.source_file,
      tags: item.tags || [],
      metadata: item.metadata || {},
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error("[Retrieval] Error getting knowledge by IDs:", error);
    throw error;
  }
}

module.exports = {
  vectorSearch,
  searchByText,
  getKnowledgeById,
  getKnowledgeByIds,
  isConfigured: !!supabase,
};
