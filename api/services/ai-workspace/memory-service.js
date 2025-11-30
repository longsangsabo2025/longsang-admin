/**
 * 🧠 Memory Service - Server Side
 * 
 * Handles:
 * - AI-powered summarization
 * - Token counting
 * - Memory persistence to Supabase
 */

const Anthropic = require('@anthropic-ai/sdk');
const { getAPIKeys } = require('./env-loader');

const keys = getAPIKeys();
const anthropic = keys.anthropic ? new Anthropic({ apiKey: keys.anthropic }) : null;

// Token estimation (server-side)
const TokenCounter = {
  AVG_CHARS_PER_TOKEN: 4,
  
  estimate(text) {
    if (!text) return 0;
    
    let tokens = Math.ceil(text.length / this.AVG_CHARS_PER_TOKEN);
    
    // Adjust for Vietnamese
    const vietnameseChars = (text.match(/[\u0080-\uFFFF]/g) || []).length;
    tokens += Math.ceil(vietnameseChars * 0.5);
    
    return tokens;
  },
  
  estimateMessages(messages) {
    return messages.reduce((sum, msg) => {
      return sum + this.estimate(msg.content) + 4; // 4 tokens overhead per message
    }, 0);
  }
};

/**
 * Summarize conversation history using Claude
 */
async function summarizeConversation(messages, options = {}) {
  if (!anthropic) {
    throw new Error('Anthropic API not configured');
  }
  
  const { maxTokens = 500, language = 'vi' } = options;
  
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
  
  const systemPrompt = language === 'vi' 
    ? `Bạn là trợ lý tóm tắt cuộc trò chuyện. Hãy tóm tắt cuộc trò chuyện thành 2-3 đoạn ngắn gọn, giữ lại:
1. Các chủ đề chính đã thảo luận
2. Các quyết định hoặc kết luận quan trọng
3. Thông tin cá nhân hóa về user (nếu có)
4. Context quan trọng cho cuộc trò chuyện tiếp theo

Chỉ trả về phần tóm tắt, không cần giải thích.`
    : `You are a conversation summarizer. Summarize the conversation into 2-3 concise paragraphs, keeping:
1. Main topics discussed
2. Important decisions or conclusions
3. Personalized information about the user (if any)
4. Important context for future conversations

Only return the summary, no explanations.`;
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast & cheap for summarization
      max_tokens: maxTokens,
      temperature: 0.3, // Low temperature for consistency
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Cuộc trò chuyện cần tóm tắt:\n\n${conversationText}`,
        },
      ],
    });
    
    return {
      summary: response.content[0].text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (error) {
    console.error('[MemoryService] Summarization error:', error);
    throw error;
  }
}

/**
 * Generate conversation title from first message
 */
async function generateTitle(message, options = {}) {
  if (!anthropic) {
    // Fallback: Use first 50 chars
    return message.slice(0, 50) + (message.length > 50 ? '...' : '');
  }
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 50,
      temperature: 0.5,
      system: 'Generate a short, descriptive title (max 50 chars) for this conversation. Reply with only the title.',
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });
    
    return response.content[0].text.trim();
  } catch (error) {
    console.error('[MemoryService] Title generation error:', error);
    return message.slice(0, 50) + (message.length > 50 ? '...' : '');
  }
}

/**
 * Build optimized context for API call
 */
function buildOptimizedContext(session, systemPrompt, maxTokens = 128000) {
  const BUFFER = 4096; // Reserve for response
  const systemTokens = TokenCounter.estimate(systemPrompt);
  const summaryTokens = session.summary ? TokenCounter.estimate(session.summary) : 0;
  const availableForHistory = maxTokens - systemTokens - summaryTokens - BUFFER;
  
  // Get messages that fit within budget
  const messages = [];
  let currentTokens = 0;
  
  // Process from newest to oldest
  for (let i = session.messages.length - 1; i >= 0; i--) {
    const msg = session.messages[i];
    const msgTokens = TokenCounter.estimate(msg.content) + 4;
    
    if (currentTokens + msgTokens > availableForHistory) {
      break;
    }
    
    messages.unshift(msg);
    currentTokens += msgTokens;
  }
  
  // Build final messages array
  const apiMessages = [];
  
  // Add summary as context
  if (session.summary) {
    apiMessages.push({
      role: 'user',
      content: `[Context từ cuộc trò chuyện trước]\n${session.summary}\n\n[Tiếp tục cuộc trò chuyện]`,
    });
  }
  
  // Add conversation messages
  for (const msg of messages) {
    apiMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  }
  
  return {
    systemPrompt,
    messages: apiMessages,
    tokenStats: {
      system: systemTokens,
      summary: summaryTokens,
      history: currentTokens,
      total: systemTokens + summaryTokens + currentTokens,
      available: maxTokens - systemTokens - summaryTokens - currentTokens - BUFFER,
    },
  };
}

/**
 * Check if summarization is needed
 */
function needsSummarization(session, threshold = 30) {
  return session.messages.length > threshold;
}

/**
 * Get messages to summarize (old ones)
 */
function getMessagesToSummarize(session, keepRecent = 20) {
  if (session.messages.length <= keepRecent) {
    return [];
  }
  return session.messages.slice(0, -keepRecent);
}

module.exports = {
  TokenCounter,
  summarizeConversation,
  generateTitle,
  buildOptimizedContext,
  needsSummarization,
  getMessagesToSummarize,
};
