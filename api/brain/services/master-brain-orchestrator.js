/**
 * Master Brain Orchestrator
 * Orchestrates complex queries across multiple domains
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const multiDomainRouter = require('./multi-domain-router');
const retrievalService = require('./retrieval-service');
const embeddingService = require('./embedding-service');
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
 * Orchestrate query across multiple domains
 * @param {string} query - Query text
 * @param {string} userId - User ID
 * @param {Object} options - Orchestration options
 * @returns {Promise<Object>} - Orchestrated response
 */
async function orchestrateQuery(query, userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  try {
    const startTime = Date.now();

    // Step 1: Route query to relevant domains
    console.log(`[Master Brain] Routing query: ${query.substring(0, 50)}...`);
    const routing = await multiDomainRouter.routeQuery(query, userId, options.routing || {});

    if (!routing.selectedDomains || routing.selectedDomains.length === 0) {
      return {
        query,
        response:
          "I couldn't find any relevant domains for your query. Please try rephrasing or add more knowledge to your domains.",
        domains: [],
        context: [],
        confidence: 0.0,
      };
    }

    // Step 2: Gather context from selected domains
    console.log(
      `[Master Brain] Gathering context from ${routing.selectedDomains.length} domains...`
    );
    const context = await gatherContext(
      routing.selectedDomains.map((d) => d.domain_id),
      query,
      userId
    );

    // Step 3: Synthesize response
    console.log(`[Master Brain] Synthesizing response...`);
    const response = await synthesizeResponse(context, query, options);

    const latency = Date.now() - startTime;

    // Step 4: Create or update session if provided
    if (options.sessionId) {
      await updateSession(options.sessionId, query, response, context, userId);
    }

    return {
      query,
      response: response.text,
      domains: routing.selectedDomains,
      context: context.map((c) => ({
        domainId: c.domainId,
        domainName: c.domainName,
        knowledgeCount: c.knowledge?.length || 0,
        coreLogicCount: c.coreLogic ? 1 : 0,
      })),
      confidence: routing.routingConfidence,
      latency,
      tokensUsed: response.tokensUsed || 0,
      routingId: routing.routingId,
    };
  } catch (error) {
    console.error('[Master Brain] Orchestration error:', error);
    throw error;
  }
}

/**
 * Gather context from multiple domains
 * @param {Array<string>} domainIds - Domain IDs
 * @param {string} query - Query text
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Context from each domain
 */
async function gatherContext(domainIds, query, userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const contextPromises = domainIds.map(async (domainId) => {
    try {
      // Get domain info
      const { data: domain } = await supabase
        .from('brain_domains')
        .select('id, name, description')
        .eq('id', domainId)
        .eq('user_id', userId)
        .single();

      if (!domain) {
        return null;
      }

      // Search knowledge in domain
      const knowledgeResults = await retrievalService.searchByText(
        query,
        embeddingService.generateEmbedding,
        {
          domainIds: [domainId],
          matchCount: 5,
          matchThreshold: 0.6,
        },
        userId
      );

      // Get core logic if available
      const { data: coreLogic } = await supabase.rpc('get_latest_core_logic', {
        p_domain_id: domainId,
        p_user_id: userId,
      });

      return {
        domainId: domain.id,
        domainName: domain.name,
        domainDescription: domain.description,
        knowledge: knowledgeResults || [],
        coreLogic: coreLogic && coreLogic.length > 0 ? coreLogic[0] : null,
      };
    } catch (error) {
      console.error(`[Master Brain] Error gathering context for domain ${domainId}:`, error);
      return null;
    }
  });

  const contexts = await Promise.all(contextPromises);
  return contexts.filter((c) => c !== null);
}

/**
 * Synthesize response from context
 * @param {Array} context - Context from domains
 * @param {string} query - Query text
 * @param {Object} options - Synthesis options
 * @returns {Promise<Object>} - Synthesized response
 */
async function synthesizeResponse(context, query, options = {}) {
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  // Build context summary
  const contextSummary = context
    .map((c) => {
      const knowledgeSummary = c.knowledge
        ?.slice(0, 3)
        .map((k) => `- ${k.title}: ${k.content.substring(0, 200)}`)
        .join('\n');

      const coreLogicSummary = c.coreLogic
        ? `\nCore Logic:\n- First Principles: ${
            c.coreLogic.first_principles?.length || 0
          }\n- Mental Models: ${c.coreLogic.mental_models?.length || 0}`
        : '';

      return `Domain: ${c.domainName}\n${
        knowledgeSummary || 'No knowledge found'
      }${coreLogicSummary}`;
    })
    .join('\n\n---\n\n');

  const prompt = `You are a Master Brain orchestrator that synthesizes information from multiple knowledge domains.

Context from ${context.length} domain(s):
${contextSummary}

User Query: ${query}

Synthesize a comprehensive response that:
1. Integrates information from all relevant domains
2. Identifies connections and patterns across domains
3. Provides a unified, coherent answer
4. Highlights any contradictions or complementary insights
5. References which domains contributed to the answer

Response:`;

  const completion = await openai.chat.completions.create({
    model: options.model || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert knowledge synthesizer. You combine information from multiple domains to provide comprehensive, well-integrated answers.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 2000,
  });

  return {
    text: completion.choices[0]?.message?.content || 'No response generated',
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}

/**
 * Manage session
 * @param {string} sessionId - Session ID
 * @param {string} query - Query text
 * @param {Object} response - Response object
 * @param {Array} context - Context array
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function updateSession(sessionId, query, response, context, userId) {
  if (!supabase) {
    return;
  }

  try {
    // Get current session
    const { data: session } = await supabase
      .from('brain_master_session')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!session) {
      return;
    }

    // Update conversation history
    const conversationHistory = session.conversation_history || [];
    conversationHistory.push({
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    });
    conversationHistory.push({
      role: 'assistant',
      content: response.text,
      timestamp: new Date().toISOString(),
    });

    // Update accumulated knowledge
    const accumulatedKnowledge = session.accumulated_knowledge || {};
    context.forEach((c) => {
      if (!accumulatedKnowledge[c.domainId]) {
        accumulatedKnowledge[c.domainId] = {
          domainName: c.domainName,
          knowledgeCount: c.knowledge?.length || 0,
          queries: [],
        };
      }
      accumulatedKnowledge[c.domainId].queries.push({
        query,
        timestamp: new Date().toISOString(),
      });
    });

    // Update session
    await supabase
      .from('brain_master_session')
      .update({
        conversation_history: conversationHistory,
        accumulated_knowledge: accumulatedKnowledge,
        total_queries: (session.total_queries || 0) + 1,
        total_tokens_used: (session.total_tokens_used || 0) + (response.tokensUsed || 0),
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    // Add context to multi-domain context table
    for (const c of context) {
      if (c.knowledge && c.knowledge.length > 0) {
        const contextText = c.knowledge
          .map((k) => `${k.title}: ${k.content.substring(0, 300)}`)
          .join('\n\n');
        const contextEmbedding = await embeddingService.generateEmbedding(contextText);

        await supabase.rpc('add_session_context', {
          p_session_id: sessionId,
          p_domain_id: c.domainId,
          p_context_text: contextText,
          p_context_type: 'query',
          p_context_embedding: contextEmbedding,
          p_user_id: userId,
        });
      }
    }
  } catch (error) {
    console.error('[Master Brain] Session update error:', error);
    // Don't throw - session update is not critical
  }
}

/**
 * Create new session
 * @param {string} sessionName - Session name
 * @param {Array<string>} domainIds - Domain IDs
 * @param {string} userId - User ID
 * @param {Object} options - Session options
 * @returns {Promise<string>} - Session ID
 */
async function createSession(sessionName, domainIds, userId, options = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.rpc('create_master_session', {
      p_session_name: sessionName,
      p_domain_ids: domainIds,
      p_session_type: options.sessionType || 'conversation',
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('[Master Brain] Create session error:', error);
    throw error;
  }
}

/**
 * Get session state
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Session state
 */
async function getSessionState(sessionId, userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from('brain_master_session')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    const { data: context } = await supabase.rpc('get_session_context', {
      p_session_id: sessionId,
      p_user_id: userId,
      p_limit: 50,
    });

    const { data: orchestrationState } = await supabase
      .from('brain_orchestration_state')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    return {
      session,
      context: context || [],
      orchestrationState: orchestrationState || null,
    };
  } catch (error) {
    console.error('[Master Brain] Get session error:', error);
    throw error;
  }
}

module.exports = {
  orchestrateQuery,
  gatherContext,
  synthesizeResponse,
  createSession,
  getSessionState,
  updateSession,
  isConfigured: !!supabase && !!openai && multiDomainRouter.isConfigured,
};
