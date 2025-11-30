/**
 * Advanced RAG Service
 * Hybrid search với LLM reranking và multi-domain context
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const retrievalService = require('./retrieval-service');
const embeddingService = require('./embedding-service');
const multiDomainRouter = require('./multi-domain-router');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * Hybrid search across domains
 * @param {string} query - Query text
 * @param {Array<string>} domainIds - Domain IDs (optional, auto-select if not provided)
 * @param {string} userId - User ID
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Search results
 */
async function hybridSearch(query, domainIds, userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  if (!embeddingService.isConfigured) {
    throw new Error('Embedding service not configured');
  }

  try {
    // Auto-select domains if not provided
    let selectedDomains = domainIds;
    if (!selectedDomains || selectedDomains.length === 0) {
      const routing = await multiDomainRouter.routeQuery(query, userId, {
        maxDomains: options.maxDomains || 5,
        minScore: options.minScore || 0.3,
      });
      selectedDomains = routing.selectedDomains.map((d) => d.domain_id);
    }

    if (!selectedDomains || selectedDomains.length === 0) {
      return [];
    }

    // Perform vector search in each domain
    const searchPromises = selectedDomains.map(async (domainId) => {
      try {
        const results = await retrievalService.searchByText(
          query,
          embeddingService.generateEmbedding,
          {
            domainIds: [domainId],
            matchCount: options.matchCount || 10,
            matchThreshold: options.matchThreshold || 0.6,
          },
          userId
        );

        return {
          domainId,
          results: results || [],
        };
      } catch (error) {
        console.error(`[Advanced RAG] Search error for domain ${domainId}:`, error);
        return {
          domainId,
          results: [],
        };
      }
    });

    const domainResults = await Promise.all(searchPromises);

    // Combine results
    const allResults = [];
    domainResults.forEach((domainResult) => {
      domainResult.results.forEach((result) => {
        allResults.push({
          ...result,
          domainId: domainResult.domainId,
        });
      });
    });

    // Apply keyword search boost (if enabled)
    if (options.keywordBoost !== false) {
      const keywordResults = await keywordSearch(query, selectedDomains, userId);
      // Merge keyword results with vector results
      keywordResults.forEach((kwResult) => {
        const existing = allResults.find((r) => r.id === kwResult.id);
        if (existing) {
          existing.similarity = Math.max(existing.similarity || 0, kwResult.similarity || 0) + 0.1; // Boost
        } else {
          allResults.push(kwResult);
        }
      });
    }

    // Rerank if enabled
    if (options.rerank !== false && allResults.length > 0) {
      return await rerankResults(allResults, query, options);
    }

    // Sort by similarity
    allResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    // Limit results
    const limit = options.limit || 20;
    return allResults.slice(0, limit);
  } catch (error) {
    console.error('[Advanced RAG] Hybrid search error:', error);
    throw error;
  }
}

/**
 * Keyword search (text matching)
 * @param {string} query - Query text
 * @param {Array<string>} domainIds - Domain IDs
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Keyword search results
 */
async function keywordSearch(query, domainIds, userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('brain_knowledge')
      .select('id, title, content, domain_id, tags, created_at')
      .in('domain_id', domainIds)
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(10);

    if (error) {
      throw new Error(`Keyword search failed: ${error.message}`);
    }

    return (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      domainId: item.domain_id,
      tags: item.tags || [],
      similarity: 0.5, // Default similarity for keyword matches
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('[Advanced RAG] Keyword search error:', error);
    return [];
  }
}

/**
 * Rerank results with LLM
 * @param {Array} results - Initial results
 * @param {string} query - Query text
 * @param {Object} options - Reranking options
 * @returns {Promise<Array>} - Reranked results
 */
async function rerankResults(results, query, options = {}) {
  if (!openai) {
    // Fallback to similarity-based ranking
    results.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return results;
  }

  try {
    // Limit to top N for reranking (to save tokens)
    const topN = options.rerankTopN || 20;
    const candidates = results.slice(0, topN);

    // Build reranking prompt
    const candidatesText = candidates
      .map((r, idx) => `${idx + 1}. ${r.title}\n   ${r.content.substring(0, 300)}`)
      .join('\n\n');

    const prompt = `You are a search result reranker. Rank the following results by relevance to the query.

Query: ${query}

Results:
${candidatesText}

Return a JSON array of indices (1-based) in order of relevance, most relevant first.
Example: [3, 1, 5, 2, 4]`;

    const completion = await openai.chat.completions.create({
      model: options.rerankModel || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const rankedIndices = response.ranked || response.ranking || [];

    // Reorder results based on LLM ranking
    const reranked = [];
    const used = new Set();

    rankedIndices.forEach((idx) => {
      const originalIdx = idx - 1; // Convert to 0-based
      if (originalIdx >= 0 && originalIdx < candidates.length && !used.has(originalIdx)) {
        reranked.push(candidates[originalIdx]);
        used.add(originalIdx);
      }
    });

    // Add any remaining results
    candidates.forEach((result, idx) => {
      if (!used.has(idx)) {
        reranked.push(result);
      }
    });

    // Add remaining results that weren't reranked
    reranked.push(...results.slice(topN));

    return reranked;
  } catch (error) {
    console.error('[Advanced RAG] Rerank error:', error);
    // Fallback to similarity-based ranking
    results.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return results;
  }
}

/**
 * Extract relevant context from results
 * @param {Array} results - Search results
 * @param {string} query - Query text
 * @param {Object} options - Extraction options
 * @returns {Promise<string>} - Extracted context
 */
async function extractContext(results, query, options = {}) {
  if (!results || results.length === 0) {
    return 'No relevant context found.';
  }

  const maxResults = options.maxResults || 5;
  const topResults = results.slice(0, maxResults);

  const context = topResults
    .map((r, idx) => {
      return `[${idx + 1}] ${r.title}\n${r.content.substring(0, 500)}${
        r.content.length > 500 ? '...' : ''
      }`;
    })
    .join('\n\n---\n\n');

  return context;
}

/**
 * Generate response using RAG
 * @param {string} context - Extracted context
 * @param {string} query - Query text
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Generated response
 */
async function generateResponse(context, query, options = {}) {
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  try {
    const prompt = `You are a helpful AI assistant. Answer the user's question based on the provided context.

Context:
${context}

Question: ${query}

Answer:`;

    const completion = await openai.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            "You are a helpful AI assistant that answers questions based on provided context. If the context doesn't contain enough information, say so.",
        },
        { role: 'user', content: prompt },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    });

    return {
      text: completion.choices[0]?.message?.content || 'No response generated',
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('[Advanced RAG] Generate response error:', error);
    throw error;
  }
}

/**
 * Full RAG pipeline
 * @param {string} query - Query text
 * @param {Array<string>} domainIds - Domain IDs (optional)
 * @param {string} userId - User ID
 * @param {Object} options - Pipeline options
 * @returns {Promise<Object>} - Full RAG result
 */
async function ragPipeline(query, domainIds, userId, options = {}) {
  try {
    // Step 1: Hybrid search
    const results = await hybridSearch(query, domainIds, userId, options);

    // Step 2: Extract context
    const context = await extractContext(results, query, options);

    // Step 3: Generate response
    const response = await generateResponse(context, query, options);

    return {
      query,
      response: response.text,
      results: results.slice(0, options.resultLimit || 10),
      context,
      tokensUsed: response.tokensUsed,
      resultCount: results.length,
    };
  } catch (error) {
    console.error('[Advanced RAG] Pipeline error:', error);
    throw error;
  }
}

module.exports = {
  hybridSearch,
  rerankResults,
  extractContext,
  generateResponse,
  ragPipeline,
  keywordSearch,
  isConfigured: !!supabase && !!openai && embeddingService.isConfigured,
};
