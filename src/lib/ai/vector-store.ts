/**
 * Vector Database & RAG (Retrieval Augmented Generation) Implementation
 * Uses Supabase pgvector for semantic search and knowledge retrieval
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export interface Document {
  id?: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export class VectorStore {
  private static EMBEDDING_MODEL = 'text-embedding-3-small';
  private static EMBEDDING_DIMENSIONS = 1536;

  /**
   * Generate embedding vector for text
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text,
        dimensions: this.EMBEDDING_DIMENSIONS,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embedding', error);
      throw new Error('Embedding generation failed');
    }
  }

  /**
   * Store document with embedding in vector database
   */
  static async storeDocument(doc: Document): Promise<string> {
    try {
      // Generate embedding if not provided
      const embedding = doc.embedding || (await this.generateEmbedding(doc.content));

      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          content: doc.content,
          embedding,
          metadata: doc.metadata || {},
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      logger.info('Document stored in vector database', { id: data.id });
      return data.id;
    } catch (error) {
      logger.error('Failed to store document', error);
      throw error;
    }
  }

  /**
   * Semantic search using vector similarity
   */
  static async semanticSearch(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      filter?: Record<string, unknown>;
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 5, threshold = 0.7 } = options;

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Perform similarity search using pgvector
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) throw error;

      logger.info('Semantic search completed', { results: data?.length || 0 });

      return (
        data?.map((doc) => ({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata || {},
          similarity: doc.similarity,
        })) || []
      );
    } catch (error) {
      logger.error('Semantic search failed', error);
      throw error;
    }
  }

  /**
   * RAG: Answer question using retrieved context
   */
  static async answerWithRAG(
    question: string,
    options: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<{
    answer: string;
    sources: SearchResult[];
    tokensUsed: number;
  }> {
    const { systemPrompt = 'You are a helpful AI assistant.', temperature = 0.7, maxTokens = 1000 } = options;

    try {
      // 1. Retrieve relevant context
      const sources = await this.semanticSearch(question, {
        limit: 3,
        threshold: 0.75,
      });

      if (sources.length === 0) {
        return {
          answer: "I don't have enough information to answer this question accurately.",
          sources: [],
          tokensUsed: 0,
        };
      }

      // 2. Build context from retrieved documents
      const context = sources.map((doc, idx) => `[${idx + 1}] ${doc.content}`).join('\n\n');

      // 3. Generate answer using GPT-4 with context
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nUse the following context to answer questions. Cite sources using [1], [2], etc.`,
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${question}`,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const answer = response.choices[0].message.content || 'No answer generated';
      const tokensUsed = response.usage?.total_tokens || 0;

      logger.info('RAG answer generated', { tokensUsed, sourcesUsed: sources.length });

      return {
        answer,
        sources,
        tokensUsed,
      };
    } catch (error) {
      logger.error('RAG answer generation failed', error);
      throw error;
    }
  }

  /**
   * Batch import documents into vector store
   */
  static async batchImport(documents: Document[]): Promise<string[]> {
    const ids: string[] = [];

    for (const doc of documents) {
      try {
        const id = await this.storeDocument(doc);
        ids.push(id);
      } catch (error) {
        logger.error('Failed to import document', { doc, error });
      }
    }

    logger.info(`Batch import completed: ${ids.length}/${documents.length} documents`);
    return ids;
  }

  /**
   * Update document in vector store
   */
  static async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.content) {
        updateData.content = updates.content;
        updateData.embedding = await this.generateEmbedding(updates.content);
      }

      if (updates.metadata) {
        updateData.metadata = updates.metadata;
      }

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase.from('knowledge_base').update(updateData).eq('id', id);

      if (error) throw error;

      logger.info('Document updated', { id });
    } catch (error) {
      logger.error('Failed to update document', error);
      throw error;
    }
  }

  /**
   * Delete document from vector store
   */
  static async deleteDocument(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('knowledge_base').delete().eq('id', id);

      if (error) throw error;

      logger.info('Document deleted', { id });
    } catch (error) {
      logger.error('Failed to delete document', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  static async getDocument(id: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase.from('knowledge_base').select('*').eq('id', id).single();

      if (error) throw error;

      return {
        id: data.id,
        content: data.content,
        metadata: data.metadata || {},
        embedding: data.embedding,
      };
    } catch (error) {
      logger.error('Failed to get document', error);
      return null;
    }
  }

  /**
   * Clear all documents (use with caution!)
   */
  static async clearAll(): Promise<void> {
    try {
      const { error } = await supabase.from('knowledge_base').delete().neq('id', '');

      if (error) throw error;

      logger.info('All documents cleared from vector store');
    } catch (error) {
      logger.error('Failed to clear vector store', error);
      throw error;
    }
  }
}

/**
 * Helper: Import documentation into vector store
 */
export async function importDocumentation(docs: { title: string; content: string; category: string }[]) {
  const documents: Document[] = docs.map((doc) => ({
    content: `${doc.title}\n\n${doc.content}`,
    metadata: {
      title: doc.title,
      category: doc.category,
      type: 'documentation',
    },
  }));

  return await VectorStore.batchImport(documents);
}

/**
 * Helper: Create AI assistant with RAG
 */
export async function createRAGAssistant(systemPrompt: string) {
  return {
    async ask(question: string) {
      return await VectorStore.answerWithRAG(question, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500,
      });
    },
    async addKnowledge(content: string, metadata?: Record<string, unknown>) {
      return await VectorStore.storeDocument({ content, metadata });
    },
    async search(query: string, limit = 5) {
      return await VectorStore.semanticSearch(query, { limit });
    },
  };
}
