/**
 * AI Assistants API Routes - Vercel AI SDK Compatible
 * Compatible with Vercel AI SDK useChat hook
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
 * POST /api/assistants/:type/chat
 * Vercel AI SDK compatible endpoint
 */
router.post('/:type/chat', async (req, res) => {
  try {
    // Validate API keys first
    const validation = validateKeys();
    if (!validation.valid) {
      return res.status(400).json({
        error: 'API keys not configured',
        details: validation.errors,
      });
    }

    const { type } = req.params;
    const { messages, userId, conversationId } = req.body;

    if (!ASSISTANT_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid assistant type. Must be one of: ${ASSISTANT_TYPES.join(', ')}`,
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required',
      });
    }

    const actualUserId = userId || req.user?.id || req.headers['x-user-id'];
    if (!actualUserId) {
      return res.status(401).json({
        error: 'User ID is required',
      });
    }

    // Get last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return res.status(400).json({
        error: 'Last message must be from user',
      });
    }

    // Get conversation history
    let conversationHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

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

    // Set up streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const responseStream = await assistantHandler({
        query: lastMessage.content,
        userId: actualUserId,
        conversationHistory,
        stream: true,
      });

      let fullResponse = '';

      // Handle OpenAI stream
      if (responseStream[Symbol.asyncIterator]) {
        for await (const chunk of responseStream) {
          if (chunk.choices?.[0]?.delta?.content) {
            const delta = chunk.choices[0].delta.content;
            fullResponse += delta;
            // Vercel AI SDK format
            res.write(`0:${JSON.stringify({ content: delta })}\n`);
          }
        }
      } else {
        // Handle Anthropic stream
        for await (const event of responseStream) {
          if (event.type === 'content_block_delta' && event.delta?.text) {
            const delta = event.delta.text;
            fullResponse += delta;
            // Vercel AI SDK format
            res.write(`0:${JSON.stringify({ content: delta })}\n`);
          }
        }
      }

      // Save conversation
      await saveConversation({
        userId: actualUserId,
        assistantType: type,
        conversationId,
        message: lastMessage.content,
        response: fullResponse,
      });

      res.write(`d:${JSON.stringify({ finishReason: 'stop' })}\n`);
      res.end();
    } catch (error) {
      console.error(`[Assistant ${type}] Streaming error:`, error);
      res.write(`e:${JSON.stringify({ error: error.message })}\n`);
      res.end();
    }
  } catch (error) {
    console.error('[AI Assistants] Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * Helper: Save conversation
 */
async function saveConversation({ userId, assistantType, conversationId, message, response }) {
  try {
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
    return null;
  }
}

module.exports = router;

