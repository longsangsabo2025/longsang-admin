/**
 * 🤖 Copilot Core Service
 *
 * Core service for AI Copilot functionality
 * Handles chat, suggestions, and learning
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const contextRetrieval = require('./context-retrieval');
const businessContext = require('./business-context');
const commandParser = require('./command-parser');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = 'gpt-4o-mini';
const STREAMING_ENABLED = true;

/**
 * Generate chat completion with context
 * @param {string} message - User message
 * @param {object} options - Chat options
 * @returns {Promise<object>} Chat response
 */
async function chat(message, options = {}) {
  try {
    const {
      userId = null,
      projectId = null,
      conversationHistory = [],
      useContext = true,
      stream = false,
    } = options;

    // Retrieve relevant context if enabled
    let contextData = null;
    if (useContext) {
      try {
        contextData = await contextRetrieval.retrieveEnhancedContext(message, {
          projectId,
          maxResults: 5,
        });
      } catch (error) {
        console.warn('Failed to retrieve context, continuing without it:', error.message);
      }
    }

    // Load business context
    const businessContextData = await businessContext.load();

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(contextData, businessContextData, projectId);

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: 'user', content: message },
    ];

    // Generate response
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: messages,
      temperature: 0.7,
      stream: stream,
    });

    if (stream) {
      return response; // Return stream directly
    }

    return {
      message: response.choices[0].message.content,
      usage: response.usage,
      contextUsed: contextData ? {
        semanticResults: contextData.semantic?.totalResults || 0,
        businessProjects: contextData.business?.currentProjects?.length || 0,
      } : null,
    };
  } catch (error) {
    console.error('Error in copilot chat:', error);
    throw error;
  }
}

/**
 * Build system prompt with context
 */
function buildSystemPrompt(contextData, businessContextData, projectId) {
  let prompt = `Bạn là AI Copilot cho hệ thống LongSang Admin, một nền tảng quản lý dự án và marketing automation.

Nhiệm vụ của bạn:
- Trả lời câu hỏi về dự án, workflows, và hệ thống
- Đề xuất các hành động phù hợp
- Giúp người dùng sử dụng hệ thống hiệu quả hơn
- Sử dụng ngôn ngữ tiếng Việt thân thiện, chuyên nghiệp

`;

  // Add business context
  if (businessContextData) {
    prompt += `Thông tin hệ thống hiện tại:
- Domain: ${businessContextData.domain || 'longsang'}
- Các dự án gần đây: ${(businessContextData.currentProjects || []).map(p => p.name).join(', ') || 'Chưa có'}
`;

    if (projectId && businessContextData.currentProjects) {
      const currentProject = businessContextData.currentProjects.find(p => p.id === projectId);
      if (currentProject) {
        prompt += `- Dự án đang làm việc: ${currentProject.name}\n`;
      }
    }
  }

  // Add semantic context
  if (contextData?.semantic?.results?.length > 0) {
    prompt += `\nThông tin liên quan từ hệ thống:\n`;
    contextData.semantic.results.slice(0, 3).forEach((result, index) => {
      prompt += `${index + 1}. ${result.entity_type}: ${result.entity_name}${result.entity_description ? ` - ${result.entity_description.substring(0, 100)}` : ''}\n`;
    });
  }

  prompt += `\nHãy trả lời một cách hữu ích và chính xác, sử dụng thông tin từ context khi có thể.`;

  return prompt;
}

/**
 * Generate proactive suggestions
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<Array>} Suggestions
 */
async function generateSuggestions(userId, options = {}) {
  try {
    const {
      limit = 5,
      projectId = null,
      includeContext = true,
    } = options;

    // Load user context
    const businessContextData = await businessContext.load();
    
    // Build context for suggestion generation
    let contextSummary = '';
    if (includeContext) {
      contextSummary = `User có ${businessContextData.currentProjects?.length || 0} dự án đang hoạt động.
Các dự án: ${(businessContextData.currentProjects || []).map(p => p.name).join(', ') || 'Chưa có'}`;
    }

    const systemPrompt = `Bạn là AI assistant chuyên tạo suggestions cho người dùng hệ thống LongSang Admin.

Dựa vào context, tạo ${limit} suggestions hữu ích, cụ thể và có thể thực hiện ngay.

Context: ${contextSummary}

Mỗi suggestion phải có:
- type: 'action' | 'reminder' | 'insight'
- priority: 'high' | 'medium' | 'low'
- reason: Lý do tại sao suggestion này hữu ích
- suggested_action: Object với action và parameters
- estimated_impact: Tác động ước tính

Trả về JSON array của suggestions.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Tạo suggestions dựa vào context hiện tại.' },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);
    const suggestions = Array.isArray(content.suggestions) ? content.suggestions : [];

    // Enhance suggestions with project context
    const enhancedSuggestions = suggestions.slice(0, limit).map((suggestion, index) => {
      // Attach project context if relevant
      if (projectId && businessContextData.currentProjects) {
        const project = businessContextData.currentProjects.find(p => p.id === projectId);
        if (project) {
          suggestion.project_id = project.id;
          suggestion.project_name = project.name;
        }
      }

      return {
        id: `suggestion-${Date.now()}-${index}`,
        ...suggestion,
        created_at: new Date().toISOString(),
      };
    });

    return enhancedSuggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
}

/**
 * Process user feedback for learning
 * @param {string} feedbackType - Type of feedback
 * @param {object} feedbackData - Feedback data
 * @returns {Promise<boolean>} Success status
 */
async function processFeedback(feedbackType, feedbackData) {
  try {
    const {
      userId,
      message,
      response,
      rating, // 1-5 stars
      comment,
      context,
    } = feedbackData;

    // Log feedback (can be stored in database for learning)
    console.log('Feedback received:', {
      type: feedbackType,
      userId,
      rating,
      comment,
      timestamp: new Date().toISOString(),
    });

    // For now, just log. Can implement learning system later
    // TODO: Store feedback in database for future model fine-tuning

    return true;
  } catch (error) {
    console.error('Error processing feedback:', error);
    throw error;
  }
}

/**
 * Parse user command with context-aware parsing
 * @param {string} command - User command
 * @param {object} options - Options
 * @returns {Promise<object>} Parsed command result
 */
async function parseCommand(command, options = {}) {
  try {
    const { userId, projectId } = options;

    // Use enhanced command parser
    const AVAILABLE_FUNCTIONS = require('../routes/ai-command').AVAILABLE_FUNCTIONS || [];
    
    const parseResult = await commandParser.parseCommand(
      command,
      AVAILABLE_FUNCTIONS,
      {
        projectId,
        userContext: { userId },
      }
    );

    return {
      success: parseResult.success,
      toolCalls: parseResult.toolCalls || [],
      contextUsed: parseResult.context_used || {},
      error: parseResult.error,
      suggestion: parseResult.suggestion,
    };
  } catch (error) {
    console.error('Error parsing command:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  chat,
  generateSuggestions,
  processFeedback,
  parseCommand,
  DEFAULT_MODEL,
};


