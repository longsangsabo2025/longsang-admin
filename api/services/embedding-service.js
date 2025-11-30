/**
 * 🔮 Embedding Service
 *
 * Generates vector embeddings for entities using OpenAI
 * Stores embeddings in Supabase for semantic search
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Embedding model: text-embedding-3-small (1536 dimensions)
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text is required and must be non-empty');
    }

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
async function generateEmbeddings(texts) {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts array is required and must be non-empty');
    }

    // OpenAI supports up to 2048 inputs per batch
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const allEmbeddings = [];

    for (const batch of batches) {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch.map(t => t.trim()).filter(t => t.length > 0),
        dimensions: EMBEDDING_DIMENSIONS,
      });

      allEmbeddings.push(...response.data.map(item => item.embedding));
    }

    return allEmbeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}

/**
 * Store embedding in database
 * @param {object} params - Embedding parameters
 * @param {string} params.entityType - Type of entity (project, workflow, execution, etc.)
 * @param {string} params.entityId - UUID of entity
 * @param {string} params.entityName - Name of entity
 * @param {string} params.entityDescription - Description of entity
 * @param {number[]} params.embedding - Embedding vector
 * @param {string} params.projectId - Optional project ID
 * @param {object} params.metadata - Optional metadata
 * @returns {Promise<object>} Stored embedding record
 */
async function storeEmbedding({
  entityType,
  entityId,
  entityName,
  entityDescription,
  embedding,
  projectId = null,
  metadata = {},
}) {
  try {
    const { data, error } = await supabase
      .from('context_embeddings')
      .upsert({
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        entity_description: entityDescription || null,
        embedding: embedding, // Array format - Supabase/pgvector handles conversion
        project_id: projectId || null,
        metadata: metadata,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'entity_type,entity_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }
}

/**
 * Generate and store embedding for an entity
 * @param {object} params - Entity parameters
 * @returns {Promise<object>} Stored embedding record
 */
async function generateAndStoreEmbedding({
  entityType,
  entityId,
  entityName,
  entityDescription,
  projectId = null,
  metadata = {},
}) {
  try {
    // Build text for embedding (combine name and description)
    const textForEmbedding = [
      entityName,
      entityDescription || '',
      metadata.tags ? metadata.tags.join(' ') : '',
      metadata.domain || '',
    ]
      .filter(Boolean)
      .join(' ');

    if (!textForEmbedding.trim()) {
      throw new Error('Cannot generate embedding for empty text');
    }

    // Generate embedding
    const embedding = await generateEmbedding(textForEmbedding);

    // Store embedding
    const stored = await storeEmbedding({
      entityType,
      entityId,
      entityName,
      entityDescription,
      embedding,
      projectId,
      metadata,
    });

    return stored;
  } catch (error) {
    console.error('Error in generateAndStoreEmbedding:', error);
    throw error;
  }
}

/**
 * Search similar entities using semantic search
 * @param {string} queryText - Query text
 * @param {object} options - Search options
 * @param {string} options.entityType - Filter by entity type
 * @param {string} options.projectId - Filter by project ID
 * @param {number} options.similarityThreshold - Minimum similarity (0-1)
 * @param {number} options.maxResults - Maximum number of results
 * @returns {Promise<Array>} Similar entities with similarity scores
 */
async function semanticSearch(queryText, options = {}) {
  try {
    const {
      entityType = null,
      projectId = null,
      similarityThreshold = 0.7,
      maxResults = 10,
    } = options;

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText);

    // Call Supabase function for semantic search
    // Note: Supabase pgvector expects array format, not string
    const { data, error } = await supabase.rpc('semantic_search', {
      query_embedding: queryEmbedding, // Array format for pgvector
      entity_type_filter: entityType,
      project_id_filter: projectId,
      similarity_threshold: similarityThreshold,
      max_results: maxResults,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error in semantic search:', error);
    throw error;
  }
}

/**
 * Delete embedding for an entity
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteEmbedding(entityType, entityId) {
  try {
    const { error } = await supabase
      .from('context_embeddings')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting embedding:', error);
    throw error;
  }
}

/**
 * Update embedding when entity changes
 * @param {object} params - Update parameters
 * @returns {Promise<object>} Updated embedding record
 */
async function updateEmbedding({
  entityType,
  entityId,
  entityName,
  entityDescription,
  projectId = null,
  metadata = {},
}) {
  try {
    // Re-generate and store embedding
    return await generateAndStoreEmbedding({
      entityType,
      entityId,
      entityName,
      entityDescription,
      projectId,
      metadata,
    });
  } catch (error) {
    console.error('Error updating embedding:', error);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  storeEmbedding,
  generateAndStoreEmbedding,
  semanticSearch,
  deleteEmbedding,
  updateEmbedding,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
};


