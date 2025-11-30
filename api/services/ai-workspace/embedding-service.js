/**
 * Embedding Service for AI Workspace RAG
 * Generates embeddings using OpenAI and stores in Supabase pgvector
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { getAPIKeys } = require('./env-loader');

// Load API keys from .env.local
const keys = getAPIKeys();

const openai = new OpenAI({
  apiKey: keys.openai,
});

const supabase = createClient(
  keys.supabaseUrl,
  keys.supabaseServiceKey || keys.supabaseAnonKey
);

class EmbeddingService {
  constructor() {
    this.model = 'text-embedding-3-small';
    this.dimensions = 1536;
  }

  /**
   * Generate embedding for text
   */
  async embed(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text must be a non-empty string');
    }

    try {
      const response = await openai.embeddings.create({
        model: this.model,
        input: text.trim(),
        dimensions: this.dimensions,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('[EmbeddingService] Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Store document with embedding
   */
  async storeDocument({ content, sourceType, sourceId, metadata = {}, userId }) {
    if (!content || !sourceType || !userId) {
      throw new Error('content, sourceType, and userId are required');
    }

    try {
      const embedding = await this.embed(content);

      const { data, error } = await supabase
        .from('documents')
        .insert({
          content: content.trim(),
          embedding: embedding,
          source_type: sourceType,
          source_id: sourceId || null,
          metadata: metadata,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('[EmbeddingService] Error storing document:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[EmbeddingService] Error in storeDocument:', error);
      throw error;
    }
  }

  /**
   * Semantic search with similarity threshold
   */
  async search({ query, userId, limit = 5, threshold = 0.7, sourceTypes = null }) {
    if (!query || !userId) {
      throw new Error('query and userId are required');
    }

    try {
      const queryEmbedding = await this.embed(query);

      // Using Supabase RPC for vector similarity search
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        filter_user_id: userId,
        filter_source_types: sourceTypes || null,
      });

      if (error) {
        console.error('[EmbeddingService] Error in search:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[EmbeddingService] Error in search:', error);
      throw error;
    }
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('texts must be a non-empty array');
    }

    try {
      const response = await openai.embeddings.create({
        model: this.model,
        input: texts.map(t => t.trim()),
        dimensions: this.dimensions,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('[EmbeddingService] Error in embedBatch:', error);
      throw error;
    }
  }
}

// Singleton export
module.exports = new EmbeddingService();

