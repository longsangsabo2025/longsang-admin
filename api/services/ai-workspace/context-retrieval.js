/**
 * Context Retrieval Service for AI Workspace
 * Retrieves relevant context from RAG for AI assistants
 */

const embeddingService = require('./embedding-service');

class ContextRetrievalService {
  constructor() {
    this.maxContextTokens = 4000; // ~16k chars
  }

  /**
   * Retrieve relevant context for a query
   */
  async retrieve({ query, userId, assistantType, maxDocs = 5 }) {
    if (!query || !userId || !assistantType) {
      throw new Error('query, userId, and assistantType are required');
    }

    try {
      // Determine source types based on assistant
      const sourceTypes = this.getSourceTypes(assistantType);

      // Search for relevant documents
      const results = await embeddingService.search({
        query,
        userId,
        limit: maxDocs,
        threshold: 0.7,
        sourceTypes,
      });

      // Format and truncate context
      const documents = results.map((doc) => ({
        content: doc.content,
        similarity: doc.similarity,
        source: doc.metadata?.source || doc.source_type || 'unknown',
        metadata: doc.metadata,
      }));

      // Estimate tokens (rough: 4 chars = 1 token)
      let totalTokens = 0;
      const truncatedDocs = [];

      for (const doc of documents) {
        const docTokens = Math.ceil(doc.content.length / 4);
        if (totalTokens + docTokens <= this.maxContextTokens) {
          truncatedDocs.push(doc);
          totalTokens += docTokens;
        } else {
          // Truncate last doc if needed
          const remainingTokens = this.maxContextTokens - totalTokens;
          if (remainingTokens > 100) {
            const truncatedContent = doc.content.substring(0, remainingTokens * 4);
            truncatedDocs.push({
              ...doc,
              content: truncatedContent + '...',
            });
          }
          break;
        }
      }

      return {
        documents: truncatedDocs,
        summary: this.createSummary(truncatedDocs),
        totalTokens,
      };
    } catch (error) {
      console.error('[ContextRetrievalService] Error in retrieve:', error);
      return {
        documents: [],
        summary: 'No relevant context found.',
        totalTokens: 0,
      };
    }
  }

  /**
   * Get source types based on assistant type
   */
  getSourceTypes(assistantType) {
    const mapping = {
      course: ['note', 'file', 'project'],
      financial: ['file', 'workflow', 'note'],
      research: ['note', 'file', 'chat', 'project'],
      news: ['chat', 'workflow', 'note'],
      career: ['note', 'file', 'project'],
      daily: ['chat', 'workflow', 'note', 'project'],
    };
    return mapping[assistantType] || ['note', 'file', 'chat'];
  }

  /**
   * Create summary of retrieved documents
   */
  createSummary(docs) {
    if (docs.length === 0) {
      return 'No relevant context found.';
    }
    return `Found ${docs.length} relevant document(s) for context.`;
  }

  /**
   * Format context for LLM prompt
   */
  formatContextForPrompt(context) {
    if (!context || context.documents.length === 0) {
      return 'No relevant context available.';
    }

    return context.documents
      .map((doc, idx) => {
        return `[Context ${idx + 1} - Source: ${doc.source}, Similarity: ${(doc.similarity * 100).toFixed(1)}%]\n${doc.content}`;
      })
      .join('\n\n---\n\n');
  }
}

module.exports = new ContextRetrievalService();

