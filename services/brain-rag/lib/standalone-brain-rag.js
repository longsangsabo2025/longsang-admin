const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

class StandaloneBrainRAGService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    this.supabaseKey =
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    this.userId = process.env.BRAIN_USER_ID || '';
    this.embeddingModel = 'text-embedding-3-small';
    this.embeddingCache = new Map();
    this.projectKeywords = new Set([
      'brain',
      'rag',
      'knowledge',
      'domain',
      'project',
      'supabase',
      'api',
      'dự án',
      'hệ thống',
      'kiến thức',
      'longsang',
      'sabo',
      'ai',
    ]);

    this.supabase = this.supabaseUrl && this.supabaseKey
      ? createClient(this.supabaseUrl, this.supabaseKey)
      : null;

    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  getResolvedUserId(options = {}) {
    return options.userId || this.userId || null;
  }

  normalizeKnowledge(row, relevance = 0) {
    return {
      ...row,
      relevance: Math.round(relevance * 100),
      summary: row.summary || row.content?.slice(0, 280) || '',
    };
  }

  tokenize(query) {
    return query
      .toLowerCase()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
  }

  scoreByText(query, row) {
    const haystack = [row.title, row.summary, row.content, ...(row.tags || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const tokens = this.tokenize(query);
    if (!tokens.length) {
      return 0;
    }

    const matches = tokens.filter((token) => haystack.includes(token)).length;
    return matches / tokens.length;
  }

  async generateEmbedding(query) {
    if (!this.openai) {
      return null;
    }

    const cacheKey = query.toLowerCase().trim();
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: query,
    });

    const embedding = response.data?.[0]?.embedding || null;
    if (embedding) {
      this.embeddingCache.set(cacheKey, embedding);
      if (this.embeddingCache.size > 100) {
        const firstKey = this.embeddingCache.keys().next().value;
        this.embeddingCache.delete(firstKey);
      }
    }

    return embedding;
  }

  async searchViaRpc(queryEmbedding, limit, threshold, options = {}) {
    if (!this.supabase || !queryEmbedding) {
      return null;
    }

    const userId = this.getResolvedUserId(options);
    const v2Payload = {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      user_id_filter: userId,
      importance_weight: 0.2,
      time_decay_days: 30,
    };

    const { data: v2Data, error: v2Error } = await this.supabase.rpc('match_knowledge_v2', v2Payload);
    if (!v2Error && Array.isArray(v2Data)) {
      return v2Data.map((row) => this.normalizeKnowledge(row, row.relevance || 0));
    }

    const { data: v1Data, error: v1Error } = await this.supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      user_id_filter: userId,
    });

    if (!v1Error && Array.isArray(v1Data)) {
      return v1Data.map((row) => this.normalizeKnowledge(row, row.relevance || 0));
    }

    return null;
  }

  async searchViaTable(query, limit, options = {}) {
    if (!this.supabase) {
      return [];
    }

    const userId = this.getResolvedUserId(options);
    let request = this.supabase
      .from('knowledge_base')
      .select('id, title, content, summary, tags, category, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(Math.max(limit * 5, 25));

    if (userId) {
      request = request.eq('user_id', userId);
    }

    const { data, error } = await request;
    if (error || !Array.isArray(data)) {
      return [];
    }

    return data
      .map((row) => this.normalizeKnowledge(row, this.scoreByText(query, row)))
      .filter((row) => row.relevance > 0)
      .sort((left, right) => right.relevance - left.relevance)
      .slice(0, limit);
  }

  async searchKnowledge(query, limit = 5, threshold = 0.3, options = {}) {
    if (!query?.trim()) {
      return [];
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const rpcResults = await this.searchViaRpc(queryEmbedding, limit, threshold, options);
      if (rpcResults?.length) {
        return rpcResults;
      }

      return await this.searchViaTable(query, limit, options);
    } catch (error) {
      console.error('[Brain RAG] searchKnowledge failed:', error.message);
      return this.searchViaTable(query, limit, options);
    }
  }

  async buildRAGContext(query, options = {}) {
    const minRelevance = options.minRelevance || 30;
    const results = await this.searchKnowledge(query, options.limit || 5, minRelevance / 100, options);
    const filtered = results.filter((row) => (row.relevance || 0) >= minRelevance);

    return {
      context: filtered
        .map((row) => `# ${row.title || 'Untitled'}\n${row.summary || row.content || ''}`)
        .join('\n\n'),
      sources: filtered,
      count: filtered.length,
    };
  }

  isQueryRelevant(query) {
    const normalizedQuery = query.toLowerCase();
    for (const keyword of this.projectKeywords) {
      if (normalizedQuery.includes(keyword)) {
        return true;
      }
    }
    return false;
  }

  normalizeMessages(messages) {
    return messages
      .filter((message) => message && typeof message.content === 'string')
      .map((message) => ({
        role: message.role || 'user',
        content: message.content,
      }));
  }

  async generatePlainResponse(messages, options = {}) {
    // Route generation to Travis AI (Google Gemini via local port 8300)
    // By-passing OpenAI entirely to avoid Quota Expired errors.
    
    const systemPromptMessage = options.systemPrompt 
      ? `=== SYSTEM INSTRUCTIONS & RAG CONTEXT ===\n${options.systemPrompt}\n====================================\n\n` 
      : '';
      
    let combinedMessage = systemPromptMessage;
    
    for (const msg of this.normalizeMessages(messages)) {
      if (msg.role === 'user') {
        combinedMessage += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        combinedMessage += `Assistant: ${msg.content}\n\n`;
      }
    }
    
    try {
      const response = await fetch('http://localhost:8300/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: combinedMessage.trim(), 
          persona_id: 'travis',
          include_context: false // We pass history inside the message
        })
      });
      
      const data = await response.json();
      
      return {
        content: data.response || "Xin lỗi, Travis AI không trả về kết quả.",
        usage: { 
          prompt_tokens: 0, 
          completion_tokens: 0, 
          total_tokens: 0 
        },
        ragApplied: false,
        sources: [],
      };
    } catch (e) {
      console.error('[Brain RAG] Error calling Travis AI:', e.message);
      return {
        content: "Hệ thống RAG đang gặp sự cố kết nối tới Travis AI (localhost:8300).",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        ragApplied: false,
        sources: [],
      };
    }
  }

  async generateWithRAG(messages, options = {}) {
    const normalizedMessages = this.normalizeMessages(messages);
    const latestUserMessage = [...normalizedMessages].reverse().find((message) => message.role === 'user');
    const query = latestUserMessage?.content || '';
    const contextResult = query
      ? await this.buildRAGContext(query, {
          limit: options.limit || 5,
          minRelevance: options.minRelevance || 30,
          userId: options.userId,
        })
      : { context: '', sources: [], count: 0 };

    const systemPrompt = [options.systemPrompt || 'Bạn là trợ lý AI thông minh, trả lời bằng tiếng Việt.'];
    if (contextResult.count > 0) {
      systemPrompt.push(`Sử dụng kiến thức nội bộ sau nếu phù hợp:\n\n${contextResult.context}`);
    }

    const response = await this.generatePlainResponse(normalizedMessages, {
      ...options,
      systemPrompt: systemPrompt.join('\n\n'),
    });

    return {
      ...response,
      ragApplied: contextResult.count > 0,
      sources: contextResult.sources,
    };
  }

  async generateWithSmartRAG(messages, options = {}) {
    const normalizedMessages = this.normalizeMessages(messages);
    const latestUserMessage = [...normalizedMessages].reverse().find((message) => message.role === 'user');
    const query = latestUserMessage?.content || '';
    const shouldUseRAG = options.forceRAG || (options.brainEnabled !== false && this.isQueryRelevant(query));

    if (!shouldUseRAG) {
      const response = await this.generatePlainResponse(normalizedMessages, options);
      return {
        ...response,
        ragReason: 'Query not relevant to Brain knowledge',
      };
    }

    const response = await this.generateWithRAG(normalizedMessages, {
      ...options,
      minRelevance: options.minRelevance || 50,
    });

    return {
      ...response,
      ragReason: options.forceRAG ? 'RAG forced by request' : 'Query matched Brain knowledge signals',
    };
  }

  async healthCheck() {
    try {
      if (!this.supabase) {
        return {
          status: 'degraded',
          message: 'Supabase is not configured',
          timestamp: new Date().toISOString(),
        };
      }

      const { error } = await this.supabase.from('brain_domains').select('id').limit(1);
      return {
        status: error ? 'degraded' : 'healthy',
        message: error ? error.message : 'Brain RAG standalone service is healthy',
        openai: !!this.openai,
        supabase: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = {
  StandaloneBrainRAGService,
  brainRAG: new StandaloneBrainRAGService(),
};
