/**
 * AI Assistants Implementation
 * 6 specialized assistants: Course, Financial, Research, News, Career, Daily
 * Enhanced with Knowledge Base for personalization
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const contextRetrievalService = require('./context-retrieval');
const knowledgeService = require('./knowledge-service');
const prompts = require('./prompts');
const { getAPIKeys } = require('./env-loader');
const { tavilySearch } = require('./tools/tavily');

// Load API keys from .env.local
const keys = getAPIKeys();

const openai = keys.openai ? new OpenAI({
  apiKey: keys.openai,
}) : null;

const anthropic = keys.anthropic ? new Anthropic({
  apiKey: keys.anthropic,
}) : null;

/**
 * Select model based on task complexity
 */
function selectModel(complexity = 'medium') {
  const { getAPIKeys, getPreferredProvider } = require('./env-loader');
  const keys = getAPIKeys();
  const preferred = getPreferredProvider();

  const models = {
    simple: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 2000 },
    medium: { provider: 'anthropic', model: 'claude-3-5-haiku-20241022', maxTokens: 2000 },
    complex: { provider: 'anthropic', model: 'claude-sonnet-4-20250514', maxTokens: 2000 },
  };

  const selected = models[complexity] || models.medium;

  // Fallback to available provider
  if (selected.provider === 'openai' && !keys.openai && keys.anthropic) {
    return { ...selected, provider: 'anthropic', model: 'claude-3-5-haiku-20241022' };
  }
  if (selected.provider === 'anthropic' && !keys.anthropic && keys.openai) {
    return { ...selected, provider: 'openai', model: 'gpt-4o-mini' };
  }

  return selected;
}

/**
 * Estimate query complexity
 */
function estimateComplexity(query) {
  const wordCount = query.split(/\s+/).length;
  const hasAnalysis = /phân tích|analyze|so sánh|compare/i.test(query);
  const hasCreation = /tạo|create|viết|write|design/i.test(query);
  const hasResearch = /nghiên cứu|research|tìm hiểu/i.test(query);

  if (wordCount < 10 && !hasAnalysis && !hasCreation && !hasResearch) {
    return 'simple';
  }
  if (hasResearch || (hasAnalysis && hasCreation)) {
    return 'complex';
  }
  return 'medium';
}

/**
 * Base assistant handler
 */
async function handleAssistant({
  assistantType,
  query,
  userId,
  conversationHistory = [],
  stream = false,
  settings = {},
}) {
  try {
    // 🧠 NEW: Get personalized context from Knowledge Base
    let personalContext = null;
    try {
      personalContext = await knowledgeService.buildAIContext(userId, {
        includeProfile: true,
        includeProjects: true,
        includeGoals: true,
        includeKnowledge: true,
        query: query, // Search for relevant knowledge
        maxKnowledgeItems: 5,
      });
      console.log('[Assistants] Loaded personal context for:', userId);
    } catch (contextError) {
      console.warn('[Assistants] Could not load personal context:', contextError.message);
    }

    // Get context from RAG (existing document retrieval)
    const context = await contextRetrievalService.retrieve({
      query,
      userId,
      assistantType,
      maxDocs: 5,
    });

    // Get system prompt
    const systemPromptMap = {
      course: prompts.COURSE_ASSISTANT_PROMPT,
      financial: prompts.FINANCIAL_ASSISTANT_PROMPT,
      research: prompts.RESEARCH_ASSISTANT_PROMPT,
      news: prompts.NEWS_ASSISTANT_PROMPT,
      career: prompts.CAREER_ASSISTANT_PROMPT,
      daily: prompts.DAILY_ASSISTANT_PROMPT,
    };

    const systemPrompt = systemPromptMap[assistantType] || prompts.RESEARCH_ASSISTANT_PROMPT;

    // Build context string
    const contextString = contextRetrievalService.formatContextForPrompt(context);

    // 🧠 Build personal context string from Knowledge Base
    let personalContextString = '';
    if (personalContext && personalContext.summary) {
      personalContextString = `\n\n## 🧠 Personal Knowledge Base:\n${personalContext.summary}`;
    }

    // Additional context based on assistant type
    let additionalContext = '';

    // Research Assistant - Add Tavily search results
    if (assistantType === 'research' && (query.includes('latest') || query.includes('recent') || query.includes('mới nhất') || query.includes('tìm kiếm'))) {
      const webResults = await tavilySearch(query);
      if (webResults) {
        additionalContext += `\n\n## Web Search Results (Tavily):\n${JSON.stringify(webResults, null, 2)}`;
      }
    }

    // Daily Planner - Add calendar events
    if (assistantType === 'daily') {
      try {
        const { getCalendarEvents } = require('./tools/google-calendar');
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const events = await getCalendarEvents({
          userId,
          startDate: today,
          endDate: nextWeek,
        });
        if (events.length > 0) {
          additionalContext += `\n\n## Calendar Events (Next 7 days):\n${JSON.stringify(events, null, 2)}`;
        }
      } catch (error) {
        console.warn('[Daily Planner] Error getting calendar:', error);
      }
    }

    // Full system prompt with context
    const fullSystemPrompt = `${systemPrompt}

## Context từ dữ liệu cá nhân của user:
${contextString}${personalContextString}${additionalContext}

## Lưu ý:
- Sử dụng context trên để đưa ra câu trả lời chính xác và cá nhân hóa
- Nếu context không đủ, hãy nói rõ và đề xuất cách bổ sung thông tin
- Luôn trả lời bằng tiếng Việt (trừ khi user dùng tiếng Anh)`;

    // Select model (use settings if provided, otherwise auto-select)
    let modelConfig;
    if (settings.model && settings.model !== 'auto') {
      // Use user-selected model from frontend
      const modelMap = {
        // OpenAI Models
        'gpt-4o': { provider: 'openai', model: 'gpt-4o', maxTokens: settings.maxTokens || 4096 },
        'gpt-4-turbo': { provider: 'openai', model: 'gpt-4-turbo', maxTokens: settings.maxTokens || 4096 },
        'gpt-4': { provider: 'openai', model: 'gpt-4', maxTokens: settings.maxTokens || 4096 },
        'gpt-3.5-turbo': { provider: 'openai', model: 'gpt-3.5-turbo', maxTokens: settings.maxTokens || 4096 },
        'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini', maxTokens: settings.maxTokens || 4096 },
        
        // Anthropic Models
        'claude-3-5-sonnet-20241022': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', maxTokens: settings.maxTokens || 8192 },
        'claude-3-opus-20240229': { provider: 'anthropic', model: 'claude-3-opus-20240229', maxTokens: settings.maxTokens || 4096 },
        'claude-3-haiku-20240307': { provider: 'anthropic', model: 'claude-3-haiku-20240307', maxTokens: settings.maxTokens || 4096 },
        'claude-sonnet-4-20250514': { provider: 'anthropic', model: 'claude-sonnet-4-20250514', maxTokens: settings.maxTokens || 8192 },
        
        // Google Models (via OpenAI compatible API - requires separate setup)
        'gemini-1.5-pro': { provider: 'google', model: 'gemini-1.5-pro', maxTokens: settings.maxTokens || 8192 },
        'gemini-1.5-flash': { provider: 'google', model: 'gemini-1.5-flash', maxTokens: settings.maxTokens || 8192 },
        
        // Legacy aliases
        'claude-sonnet-4': { provider: 'anthropic', model: 'claude-sonnet-4-20250514', maxTokens: settings.maxTokens || 8192 },
        'claude-haiku': { provider: 'anthropic', model: 'claude-3-haiku-20240307', maxTokens: settings.maxTokens || 4096 },
      };
      modelConfig = modelMap[settings.model] || selectModel(estimateComplexity(query));
      
      // Override provider if specified in settings
      if (settings.modelProvider) {
        modelConfig.provider = settings.modelProvider;
      }
    } else {
      const complexity = estimateComplexity(query);
      modelConfig = selectModel(complexity);
      if (settings.maxTokens) {
        modelConfig.maxTokens = settings.maxTokens;
      }
    }

    // Override provider if specified
    if (settings.provider && settings.provider !== 'auto') {
      modelConfig.provider = settings.provider;
    }
    
    // Apply additional generation parameters from settings
    const temperature = settings.temperature ?? 0.7;
    const topP = settings.topP ?? 1;
    const presencePenalty = settings.presencePenalty ?? 0;
    const frequencyPenalty = settings.frequencyPenalty ?? 0;
    
    // Custom system prompt override
    const finalSystemPrompt = settings.systemPrompt 
      ? `${settings.systemPrompt}\n\n## Context từ dữ liệu cá nhân của user:\n${contextString}${additionalContext}`
      : fullSystemPrompt;

    // Build messages
    const messages = [
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: 'user', content: query },
    ];

    if (stream) {
      // Streaming response
      if (modelConfig.provider === 'openai' && openai) {
        const stream = await openai.chat.completions.create({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: finalSystemPrompt },
            ...messages,
          ],
          max_tokens: modelConfig.maxTokens,
          temperature,
          top_p: topP,
          presence_penalty: presencePenalty,
          frequency_penalty: frequencyPenalty,
          stream: settings.streaming !== false,
        });
        return stream;
      } else if (modelConfig.provider === 'anthropic' && anthropic) {
        // Anthropic streaming
        const stream = await anthropic.messages.stream({
          model: modelConfig.model,
          max_tokens: modelConfig.maxTokens,
          temperature,
          top_p: topP,
          system: finalSystemPrompt,
          messages: messages.map((msg) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          })),
        });
        return stream;
      }
    } else {
      // Non-streaming response
      if (modelConfig.provider === 'openai' && openai) {
        const response = await openai.chat.completions.create({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: finalSystemPrompt },
            ...messages,
          ],
          max_tokens: modelConfig.maxTokens,
          temperature,
          top_p: topP,
          presence_penalty: presencePenalty,
          frequency_penalty: frequencyPenalty,
        });
        return response.choices[0].message.content;
      } else if (modelConfig.provider === 'anthropic' && anthropic) {
        const response = await anthropic.messages.create({
          model: modelConfig.model,
          max_tokens: modelConfig.maxTokens,
          temperature,
          top_p: topP,
          system: finalSystemPrompt,
          messages: messages.map((msg) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          })),
        });
        return response.content[0].text;
      } else {
        throw new Error(`No AI provider available. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local`);
      }
    }
  } catch (error) {
    console.error(`[Assistant ${assistantType}] Error:`, error);
    throw error;
  }
}

/**
 * Course Development Assistant
 */
async function courseAssistant({ query, userId, conversationHistory, stream, settings }) {
  return handleAssistant({
    assistantType: 'course',
    query,
    userId,
    conversationHistory,
    stream,
    settings,
  });
}

/**
 * Financial Assistant
 */
async function financialAssistant({ query, userId, conversationHistory, stream, settings }) {
  return handleAssistant({
    assistantType: 'financial',
    query,
    userId,
    conversationHistory,
    stream,
    settings,
  });
}

/**
 * Research Assistant
 */
async function researchAssistant({ query, userId, conversationHistory, stream, settings }) {
  return handleAssistant({
    assistantType: 'research',
    query,
    userId,
    conversationHistory,
    stream,
    settings,
  });
}

/**
 * News Curator Assistant
 */
async function newsAssistant({ query, userId, conversationHistory, stream, settings }) {
  return handleAssistant({
    assistantType: 'news',
    query,
    userId,
    conversationHistory,
    stream,
    settings,
  });
}

/**
 * Career Development Assistant
 */
async function careerAssistant({ query, userId, conversationHistory, stream, settings }) {
  return handleAssistant({
    assistantType: 'career',
    query,
    userId,
    conversationHistory,
    stream,
    settings,
  });
}

/**
 * Daily Planning Assistant
 */
async function dailyAssistant({ query, userId, conversationHistory, stream, settings }) {
  return handleAssistant({
    assistantType: 'daily',
    query,
    userId,
    conversationHistory,
    stream,
    settings,
  });
}

module.exports = {
  courseAssistant,
  financialAssistant,
  researchAssistant,
  newsAssistant,
  careerAssistant,
  dailyAssistant,
  handleAssistant,
};

