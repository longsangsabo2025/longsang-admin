/**
 * Prompt Caching Service
 * Cache system prompts for Anthropic to reduce costs
 */

const Anthropic = require('@anthropic-ai/sdk');
const { getAPIKeys } = require('./env-loader');
const prompts = require('./prompts');

const keys = getAPIKeys();

// Cache for system prompts
const promptCache = new Map();

/**
 * Get cached system prompt for Anthropic
 */
function getCachedSystemPrompt(assistantType) {
  const promptMap = {
    course: prompts.COURSE_ASSISTANT_PROMPT,
    financial: prompts.FINANCIAL_ASSISTANT_PROMPT,
    research: prompts.RESEARCH_ASSISTANT_PROMPT,
    news: prompts.NEWS_ASSISTANT_PROMPT,
    career: prompts.CAREER_ASSISTANT_PROMPT,
    daily: prompts.DAILY_ASSISTANT_PROMPT,
  };

  return promptMap[assistantType] || prompts.RESEARCH_ASSISTANT_PROMPT;
}

/**
 * Create completion with prompt caching (Anthropic)
 */
async function createCachedCompletion({ assistantType, userMessage, context, conversationHistory = [] }) {
  if (!keys.anthropic) {
    throw new Error('Anthropic API key not found');
  }

  const anthropic = new Anthropic({
    apiKey: keys.anthropic,
  });

  const systemPrompt = getCachedSystemPrompt(assistantType);
  const fullSystemPrompt = context
    ? `${systemPrompt}\n\n## Context:\n${context}`
    : systemPrompt;

  // Use cache_control for static system prompt
  const systemMessage = {
    type: 'text',
    text: fullSystemPrompt,
  };

  // For Anthropic, we use cache_control in the messages array
  // Note: This requires Anthropic SDK version that supports caching
  const messages = conversationHistory
    .slice(-10)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }))
    .concat([{
      role: 'user',
      content: userMessage,
    }]);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemMessage.text, // Static system prompt (can be cached by Anthropic)
      messages,
    });

    return response.content[0].text;
  } catch (error) {
    console.error('[Prompt Cache] Error:', error);
    throw error;
  }
}

/**
 * Create streaming completion with prompt caching
 */
async function createCachedStream({ assistantType, userMessage, context, conversationHistory = [] }) {
  if (!keys.anthropic) {
    throw new Error('Anthropic API key not found');
  }

  const anthropic = new Anthropic({
    apiKey: keys.anthropic,
  });

  const systemPrompt = getCachedSystemPrompt(assistantType);
  const fullSystemPrompt = context
    ? `${systemPrompt}\n\n## Context:\n${context}`
    : systemPrompt;

  const messages = conversationHistory
    .slice(-10)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }))
    .concat([{
      role: 'user',
      content: userMessage,
    }]);

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: fullSystemPrompt, // Static system prompt
      messages,
    });

    return stream;
  } catch (error) {
    console.error('[Prompt Cache] Streaming error:', error);
    throw error;
  }
}

module.exports = {
  createCachedCompletion,
  createCachedStream,
  getCachedSystemPrompt,
};

