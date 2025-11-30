/**
 * Bulk Operations Service
 * Handles bulk import, export, delete, and update operations
 */

const { createClient } = require("@supabase/supabase-js");
const embeddingService = require("./embedding-service");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Bulk ingest knowledge
 * @param {Array} knowledgeArray - Array of knowledge items
 * @param {string} userId - User ID
 * @param {Function} progressCallback - Optional progress callback
 * @returns {Promise<Object>} - Results with success/failure counts
 */
async function bulkIngestKnowledge(knowledgeArray, userId, progressCallback = null) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!embeddingService.isConfigured) {
    throw new Error("Embedding service not configured");
  }

  if (!Array.isArray(knowledgeArray) || knowledgeArray.length === 0) {
    throw new Error("Knowledge array is required and must not be empty");
  }

  if (knowledgeArray.length > 100) {
    throw new Error("Maximum 100 items per bulk operation");
  }

  const results = {
    total: knowledgeArray.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < knowledgeArray.length; i += batchSize) {
      const batch = knowledgeArray.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (knowledge, index) => {
          try {
            const { domainId, title, content, contentType = "document", tags = [], metadata = {} } = knowledge;

            if (!domainId || !title || !content) {
              results.failed++;
              results.errors.push({
                index: i + index,
                error: "Missing required fields: domainId, title, or content",
              });
              return;
            }

            // Generate embedding
            const textToEmbed = `${title}\n\n${content}`;
            const embedding = await embeddingService.generateEmbedding(textToEmbed);

            // Insert knowledge
            const { data, error } = await supabase
              .from("brain_knowledge")
              .insert({
                domain_id: domainId,
                title,
                content,
                content_type: contentType,
                embedding,
                tags,
                metadata,
                user_id: userId,
              })
              .select()
              .single();

            if (error) {
              results.failed++;
              results.errors.push({
                index: i + index,
                title,
                error: error.message,
              });
            } else {
              results.successful++;
            }

            // Progress callback
            if (progressCallback) {
              progressCallback({
                processed: i + index + 1,
                total: knowledgeArray.length,
                successful: results.successful,
                failed: results.failed,
              });
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              index: i + index,
              error: error.message,
            });
          }
        })
      );
    }

    return results;
  } catch (error) {
    console.error("[Bulk Operations] Bulk ingest error:", error);
    throw error;
  }
}

/**
 * Export domain data
 * @param {string} domainId - Domain ID
 * @param {string} userId - User ID
 * @param {string} format - Export format ('json' or 'csv')
 * @returns {Promise<Object|string>} - Exported data
 */
async function exportDomain(domainId, userId, format = "json") {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    // Get domain
    const { data: domain, error: domainError } = await supabase
      .from("brain_domains")
      .select("*")
      .eq("id", domainId)
      .eq("user_id", userId)
      .single();

    if (domainError || !domain) {
      throw new Error("Domain not found");
    }

    // Get all knowledge
    const { data: knowledge, error: knowledgeError } = await supabase
      .from("brain_knowledge")
      .select("*")
      .eq("domain_id", domainId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (knowledgeError) {
      throw new Error(`Failed to get knowledge: ${knowledgeError.message}`);
    }

    // Get statistics
    const { data: stats } = await supabase
      .from("brain_domain_stats")
      .select("*")
      .eq("domain_id", domainId)
      .single();

    const exportData = {
      domain: {
        id: domain.id,
        name: domain.name,
        description: domain.description,
        color: domain.color,
        icon: domain.icon,
        agent_config: domain.agent_config,
        created_at: domain.created_at,
        updated_at: domain.updated_at,
      },
      knowledge: (knowledge || []).map((k) => ({
        id: k.id,
        title: k.title,
        content: k.content,
        content_type: k.content_type,
        tags: k.tags,
        metadata: k.metadata,
        source_url: k.source_url,
        source_file: k.source_file,
        created_at: k.created_at,
        updated_at: k.updated_at,
        // Note: embeddings are not exported for security
      })),
      statistics: stats || null,
      exported_at: new Date().toISOString(),
      version: "1.0",
    };

    if (format === "csv") {
      return convertToCSV(exportData);
    }

    return exportData;
  } catch (error) {
    console.error("[Bulk Operations] Export error:", error);
    throw error;
  }
}

/**
 * Bulk delete knowledge
 * @param {string[]} knowledgeIds - Array of knowledge IDs
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Deletion results
 */
async function bulkDeleteKnowledge(knowledgeIds, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!Array.isArray(knowledgeIds) || knowledgeIds.length === 0) {
    throw new Error("Knowledge IDs array is required");
  }

  if (knowledgeIds.length > 100) {
    throw new Error("Maximum 100 items per bulk delete");
  }

  try {
    // Verify ownership and delete
    const { data, error } = await supabase
      .from("brain_knowledge")
      .delete()
      .in("id", knowledgeIds)
      .eq("user_id", userId)
      .select("id");

    if (error) {
      throw new Error(`Failed to delete knowledge: ${error.message}`);
    }

    return {
      requested: knowledgeIds.length,
      deleted: data?.length || 0,
      failed: knowledgeIds.length - (data?.length || 0),
    };
  } catch (error) {
    console.error("[Bulk Operations] Bulk delete error:", error);
    throw error;
  }
}

/**
 * Bulk update knowledge
 * @param {Array} updates - Array of {id, updates} objects
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Update results
 */
async function bulkUpdateKnowledge(updates, userId) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error("Updates array is required");
  }

  if (updates.length > 50) {
    throw new Error("Maximum 50 items per bulk update");
  }

  const results = {
    total: updates.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Process updates sequentially to avoid conflicts
    for (const update of updates) {
      try {
        const { id, ...updateData } = update;

        if (!id) {
          results.failed++;
          results.errors.push({ id, error: "ID is required" });
          continue;
        }

        // If content changed, regenerate embedding
        if (updateData.content) {
          const { data: existing } = await supabase
            .from("brain_knowledge")
            .select("title, content")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

          if (existing && (existing.title !== updateData.title || existing.content !== updateData.content)) {
            const textToEmbed = `${updateData.title || existing.title}\n\n${updateData.content}`;
            updateData.embedding = await embeddingService.generateEmbedding(textToEmbed);
          }
        }

        const { error } = await supabase
          .from("brain_knowledge")
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          results.failed++;
          results.errors.push({ id, error: error.message });
        } else {
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: update.id, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error("[Bulk Operations] Bulk update error:", error);
    throw error;
  }
}

/**
 * Convert export data to CSV
 */
function convertToCSV(exportData) {
  const lines = [];

  // Header
  lines.push("Domain,Title,Content,Content Type,Tags,Source URL,Created At");

  // Knowledge rows
  exportData.knowledge.forEach((k) => {
    const tags = Array.isArray(k.tags) ? k.tags.join("; ") : "";
    const content = (k.content || "").replace(/"/g, '""'); // Escape quotes
    lines.push(
      `"${exportData.domain.name}","${k.title}","${content}","${k.content_type}","${tags}","${k.source_url || ""}","${k.created_at}"`
    );
  });

  return lines.join("\n");
}

module.exports = {
  bulkIngestKnowledge,
  exportDomain,
  bulkDeleteKnowledge,
  bulkUpdateKnowledge,
  isConfigured: !!supabase,
};

