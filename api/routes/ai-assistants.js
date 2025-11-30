/**
 * AI Assistants API Routes
 * 6 specialized assistants: Course, Financial, Research, News, Career, Daily
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const assistants = require('../services/ai-workspace/assistants');
const { getAPIKeys, validateKeys } = require('../services/ai-workspace/env-loader');

// Load API keys from .env.local
const keys = getAPIKeys();

const supabase = createClient(
  keys.supabaseUrl,
  keys.supabaseServiceKey || keys.supabaseAnonKey
);

const ASSISTANT_TYPES = ['course', 'financial', 'research', 'news', 'career', 'daily'];

/**
 * GET /api/assistants/status
 * Check API keys status
 */
router.get('/status', (req, res) => {
  const validation = validateKeys();
  res.json({
    success: validation.valid,
    ...validation,
    message: validation.valid
      ? 'All required API keys are configured'
      : 'Some API keys are missing. Please check .env.local',
  });
});

/**
 * GET /api/assistants/all-conversations
 * Get ALL conversations for user (across all assistant types)
 */
router.get('/all-conversations', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      conversations: data || [],
    });
  } catch (error) {
    console.error('[AI Assistants] Error getting all conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/assistants/conversation/:id
 * Get single conversation by ID (any assistant type)
 */
router.get('/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    console.error('[AI Assistants] Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/assistants/:type
 * Chat with a specific assistant
 */
router.post('/:type', async (req, res) => {
  try {
    // Validate API keys first
    const validation = validateKeys();
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'API keys not configured',
        details: validation.errors,
        message: 'Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local',
      });
    }

    const { type } = req.params;
    const { 
      message, 
      userId, 
      conversationId, 
      stream = false, 
      // Model & Prompt Config from frontend
      model,
      modelProvider,
      temperature,
      maxTokens,
      topP,
      presencePenalty,
      frequencyPenalty,
      systemPrompt,
      responseFormat,
      // Legacy settings object
      settings = {} 
    } = req.body;
    
    // Build unified settings object
    const unifiedSettings = {
      ...settings,
      model: model || settings.model,
      modelProvider: modelProvider || settings.modelProvider,
      temperature: temperature ?? settings.temperature,
      maxTokens: maxTokens || settings.maxTokens,
      topP: topP ?? settings.topP,
      presencePenalty: presencePenalty ?? settings.presencePenalty,
      frequencyPenalty: frequencyPenalty ?? settings.frequencyPenalty,
      systemPrompt: systemPrompt || settings.systemPrompt,
      responseFormat: responseFormat || settings.responseFormat,
      streaming: stream,
    };

    if (!ASSISTANT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid assistant type. Must be one of: ${ASSISTANT_TYPES.join(', ')}`,
      });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
    }

    const actualUserId = userId || req.user?.id || req.headers['x-user-id'];
    if (!actualUserId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Get conversation history if conversationId provided
    let conversationHistory = [];
    if (conversationId) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('user_id', actualUserId)
        .single();

      if (conversation) {
        conversationHistory = conversation.messages || [];
      }
    }

    // Get assistant handler
    const assistantMap = {
      course: assistants.courseAssistant,
      financial: assistants.financialAssistant,
      research: assistants.researchAssistant,
      news: assistants.newsAssistant,
      career: assistants.careerAssistant,
      daily: assistants.dailyAssistant,
    };

    const assistantHandler = assistantMap[type];

    // Pass settings to assistant handler if provided
    const handlerOptions = {
      query: message,
      userId: actualUserId,
      conversationHistory: [],
      stream,
      settings: unifiedSettings, // Pass unified settings to handler
    };

    // Handle streaming
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const startTime = Date.now();

      try {
        const responseStream = await assistantHandler({
          ...handlerOptions,
          conversationHistory,
        });

        let fullResponse = '';

        // Handle OpenAI stream
        if (responseStream[Symbol.asyncIterator]) {
          for await (const chunk of responseStream) {
            if (chunk.choices?.[0]?.delta?.content) {
              const delta = chunk.choices[0].delta.content;
              fullResponse += delta;
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          }
        } else {
          // Handle Anthropic stream
          for await (const event of responseStream) {
            if (event.type === 'content_block_delta' && event.delta?.text) {
              const delta = event.delta.text;
              fullResponse += delta;
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          }
        }

        // Save conversation FIRST to get conversationId
        let savedConversationId = conversationId;
        try {
          const savedConv = await saveConversation({
            userId: actualUserId,
            assistantType: type,
            conversationId,
            message,
            response: fullResponse,
          });
          if (savedConv?.id) {
            savedConversationId = savedConv.id;
          }
        } catch (err) {
          console.warn('[AI Assistants] Error saving conversation:', err);
        }

        // Send conversationId to frontend BEFORE [DONE]
        if (savedConversationId) {
          res.write(`data: ${JSON.stringify({ conversationId: savedConversationId })}\n\n`);
        }

        res.write(`data: [DONE]\n\n`);
        res.end();

        const responseTime = Date.now() - startTime;

        // Estimate tokens and cost
        const estimatedTokens = Math.ceil(fullResponse.length / 4);
        const costPerToken = 0.00001;
        const estimatedCost = (estimatedTokens / 1000) * costPerToken;

        // Log execution for analytics
        try {
          await supabase.from('agent_executions').insert({
            user_id: actualUserId,
            assistant_type: type,
            tokens_used: estimatedTokens,
            cost_estimate: estimatedCost,
            response_time_ms: responseTime,
          });
        } catch (err) {
          console.warn('[AI Assistants] Error logging execution:', err);
        }
      } catch (error) {
        console.error(`[Assistant ${type}] Streaming error:`, error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const startTime = Date.now();
      const response = await assistantHandler({
        ...handlerOptions,
        conversationHistory,
      });
      const responseTime = Date.now() - startTime;

      const responseText = typeof response === 'string' ? response : response.content || response.text || '';

      // Estimate tokens and cost
      const estimatedTokens = Math.ceil(responseText.length / 4);
      const costPerToken = 0.00001;
      const estimatedCost = (estimatedTokens / 1000) * costPerToken;

      // Log execution for analytics
      try {
        await supabase.from('agent_executions').insert({
          user_id: actualUserId,
          assistant_type: type,
          tokens_used: estimatedTokens,
          cost_estimate: estimatedCost,
          response_time_ms: responseTime,
        });
      } catch (err) {
        console.warn('[AI Assistants] Error logging execution:', err);
      }

      // Save conversation (non-blocking)
      let savedConversationId = conversationId;
      try {
        const savedConversation = await saveConversation({
          userId: actualUserId,
          assistantType: type,
          conversationId,
          message,
          response: responseText,
        });
        if (savedConversation) {
          savedConversationId = savedConversation.id;
        }
      } catch (err) {
        console.warn('[AI Assistants] Error saving conversation:', err);
      }

      res.json({
        success: true,
        response: responseText,
        conversationId: savedConversationId,
      });
    }
  } catch (error) {
    console.error('[AI Assistants] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/assistants/:type/conversations
 * Get conversation history for an assistant
 */
router.get('/:type/conversations', async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!ASSISTANT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid assistant type. Must be one of: ${ASSISTANT_TYPES.join(', ')}`,
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('assistant_type', type)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      conversations: data || [],
    });
  } catch (error) {
    console.error('[AI Assistants] Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/assistants/:type/conversations/:id
 * Get single conversation by ID
 */
router.get('/:type/conversations/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!ASSISTANT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid assistant type. Must be one of: ${ASSISTANT_TYPES.join(', ')}`,
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('assistant_type', type)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    console.error('[AI Assistants] Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * DELETE /api/assistants/:type/conversations/:id
 * Delete a conversation
 */
router.delete('/:type/conversations/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!ASSISTANT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid assistant type. Must be one of: ${ASSISTANT_TYPES.join(', ')}`,
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('assistant_type', type);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('[AI Assistants] Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/assistants/:type/conversations/:id
 * Update a conversation (rename)
 */
router.patch('/:type/conversations/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { title } = req.body;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!ASSISTANT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid assistant type. Must be one of: ${ASSISTANT_TYPES.join(', ')}`,
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    const { data, error } = await supabase
      .from('conversations')
      .update({
        title: title.substring(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('assistant_type', type)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    console.error('[AI Assistants] Error updating conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * Helper: Save conversation
 */
async function saveConversation({ userId, assistantType, conversationId, message, response }) {
  try {
    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (data) {
        conversation = data;
      }
    }

    const messages = conversation?.messages || [];
    messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );

    if (conversation) {
      // Update existing conversation
      const { data, error } = await supabase
        .from('conversations')
        .update({
          messages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          assistant_type: assistantType,
          title: message.substring(0, 100),
          messages,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('[AI Assistants] Error saving conversation:', error);
    // Don't throw - conversation saving is not critical
    return null;
  }
}

module.exports = router;

