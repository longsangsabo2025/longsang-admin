/**
 * Solo Hub AI Chat API
 * Backend proxy for OpenAI/Anthropic - secure API keys on server
 */

const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk').default;
const aiActionExecutor = require('../services/ai-action-executor');
const multiAgentOrchestrator = require('../services/multi-agent-orchestrator');
const copilotPlanner = require('../services/copilot-planner');
const copilotExecutor = require('../services/copilot-executor');

// Agent System Prompts
const AGENT_SYSTEM_PROMPTS = {
  dev: `You are Dev Agent - an expert software developer and code assistant for a solo founder.
Your responsibilities:
- Review code and suggest improvements
- Debug issues and find root causes
- Create PRs, write tests, and documentation
- Analyze architecture and suggest optimizations
- Help with deployment and DevOps tasks

Communication style: Technical but clear, provide code examples when relevant.
Always format code using markdown code blocks with language specifier.
When reviewing code, be constructive and explain the "why" behind suggestions.`,

  content: `You are Content Agent - a skilled content writer and copywriter for a solo founder.
Your responsibilities:
- Write blog posts, social media content, and emails
- Create compelling headlines and CTAs
- Optimize content for SEO
- Edit and improve existing content
- Develop content strategies and calendars

Communication style: Creative, engaging, and brand-aware.
Always consider the target audience and business goals.
Provide multiple options when asked for headlines or CTAs.`,

  marketing: `You are Marketing Agent - a growth marketing expert for a solo founder.
Your responsibilities:
- Plan and optimize advertising campaigns
- Analyze marketing metrics and ROI
- Suggest A/B tests and experiments
- Develop customer acquisition strategies
- Track competitor activities

Communication style: Data-driven with actionable insights.
Always tie recommendations to expected outcomes and metrics.
Present options with pros/cons when making budget decisions.`,

  sales: `You are Sales Agent - a sales automation specialist for a solo founder.
Your responsibilities:
- Draft outreach emails and follow-up sequences
- Qualify leads and prioritize prospects
- Suggest personalization strategies
- Track sales pipeline and conversion rates
- Recommend optimal timing for outreach

Communication style: Professional, persuasive, and customer-centric.
Always focus on value proposition and solving customer problems.
Provide templates and examples that can be customized.`,

  admin: `You are Admin Agent - an operations and productivity assistant for a solo founder.
Your responsibilities:
- Manage schedules and calendar
- Organize emails and prioritize communications
- Handle routine administrative tasks
- Track deadlines and send reminders
- Maintain documentation and records

Communication style: Efficient, organized, and proactive.
Present information in clear, actionable formats.
Anticipate needs and suggest process improvements.`,

  advisor: `You are Advisor Agent - a strategic business advisor for a solo founder.
Your responsibilities:
- Provide strategic guidance and market analysis
- Help with decision-making frameworks
- Analyze risks and opportunities
- Suggest growth strategies
- Offer perspective on business challenges

Communication style: Thoughtful, analytical, and supportive.
Present balanced viewpoints and ask clarifying questions.
Help the founder think through decisions systematically.`,
};

// Initialize clients lazily
let openaiClient = null;
let anthropicClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * POST /api/solo-hub/chat
 * Chat with an AI Agent
 */
router.post('/chat', async (req, res) => {
  try {
    const { agentRole, message, context, options } = req.body;

    if (!agentRole || !message) {
      return res.status(400).json({
        success: false,
        error: 'agentRole and message are required',
      });
    }

    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentRole] || AGENT_SYSTEM_PROMPTS.advisor;
    
    // Build full system prompt with context
    let fullSystemPrompt = systemPrompt;
    
    if (context?.memories?.length) {
      const memoryContext = context.memories.map(m => 
        `[${m.memory_type?.toUpperCase() || 'INFO'}] ${m.title}: ${m.content}`
      ).join('\n');
      fullSystemPrompt += `\n\n--- SHARED CONTEXT ---\n${memoryContext}\n--- END CONTEXT ---\n`;
    }
    
    if (context?.currentTask) {
      const task = context.currentTask;
      fullSystemPrompt += `\n\n--- CURRENT TASK ---
Title: ${task.title}
Type: ${task.task_type}
Priority: ${task.priority}
Description: ${task.description || 'No description'}
Status: ${task.status}
--- END TASK ---\n`;
    }

    // Use Claude for dev/advisor, OpenAI for others
    // Note: Claude model name may need updating
    const useClaudeFor = ['dev', 'advisor'];
    const preferClaude = useClaudeFor.includes(agentRole) && options?.model?.includes('claude');
    
    // Default to OpenAI for reliability
    const model = options?.model || 'openai';

    let result;

    if (preferClaude) {
      // Use Anthropic Claude
      const client = getAnthropicClient();
      
      const messages = [
        ...(context?.previousMessages || [])
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role,
            content: m.content,
          })),
        { role: 'user', content: message },
      ];

      const response = await client.messages.create({
        model: options?.model || 'claude-sonnet-4-20250514',
        system: fullSystemPrompt,
        messages,
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature ?? 0.7,
      });

      const content = response.content[0];
      const messageText = content.type === 'text' ? content.text : '';

      result = {
        success: true,
        message: messageText,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: 'claude-sonnet-4-20250514',
      };
    } else {
      // Use OpenAI
      const client = getOpenAIClient();
      
      const messages = [
        { role: 'system', content: fullSystemPrompt },
        ...(context?.previousMessages || []).map(m => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await client.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens || 2000,
      });

      const choice = response.choices[0];

      result = {
        success: true,
        message: choice.message.content || '',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        model: 'gpt-4o-mini',
      };
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Solo Hub Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      message: '',
    });
  }
});

/**
 * POST /api/solo-hub/chat/stream
 * Stream chat response (OpenAI only)
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const { agentRole, message, context, options } = req.body;

    if (!agentRole || !message) {
      return res.status(400).json({
        success: false,
        error: 'agentRole and message are required',
      });
    }

    const client = getOpenAIClient();
    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentRole] || AGENT_SYSTEM_PROMPTS.advisor;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context?.previousMessages || []).map(m => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const stream = await client.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('❌ Solo Hub Stream Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /api/solo-hub/agents
 * Get available agents with system prompts
 */
router.get('/agents', (req, res) => {
  const agents = Object.entries(AGENT_SYSTEM_PROMPTS).map(([role, prompt]) => ({
    role,
    name: role.charAt(0).toUpperCase() + role.slice(1) + ' Agent',
    description: prompt.split('\n')[0].replace('You are ', '').replace(' - ', ': '),
  }));
  
  res.json({ agents });
});

/**
 * POST /api/solo-hub/chat-with-actions
 * Chat with AI and execute actions if detected
 */
router.post('/chat-with-actions', async (req, res) => {
  try {
    const { agentRole, message, context, options } = req.body;

    if (!agentRole || !message) {
      return res.status(400).json({
        success: false,
        error: 'agentRole and message are required',
      });
    }

    // Step 1: Detect if message contains actionable intent
    const actionResult = await aiActionExecutor.processWithActions(message, agentRole);

    // Step 2: If action was executed, return result with AI summary
    if (actionResult.type === 'action_executed') {
      // Generate AI response about what was done
      const client = getOpenAIClient();
      const summaryResponse = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là AI assistant của SABO. Tóm tắt kết quả thực thi action cho user.
Trả lời bằng tiếng Việt, ngắn gọn, có emoji phù hợp.`,
          },
          {
            role: 'user',
            content: `Action: ${actionResult.action}
Params: ${JSON.stringify(actionResult.params)}
Result: ${JSON.stringify(actionResult.result)}

Hãy tóm tắt kết quả này cho user.`,
          },
        ],
        max_tokens: 500,
      });

      return res.json({
        success: true,
        type: 'action_executed',
        action: actionResult.action,
        message: summaryResponse.choices[0].message.content,
        actionResult: actionResult.result,
      });
    }

    // Step 3: If clarification needed
    if (actionResult.type === 'clarification') {
      return res.json({
        success: true,
        type: 'clarification_needed',
        message: actionResult.message,
        detectedAction: actionResult.detectedAction,
      });
    }

    // Step 4: Normal chat (no action detected)
    // Forward to regular chat endpoint logic
    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentRole] || AGENT_SYSTEM_PROMPTS.advisor;
    
    // Add available actions to context for marketing agent
    let fullSystemPrompt = systemPrompt;
    if (agentRole === 'marketing' || agentRole === 'content') {
      const actions = aiActionExecutor.getAvailableActionsDescription();
      fullSystemPrompt += `\n\n--- AVAILABLE ACTIONS ---
Bạn có thể thực hiện các actions sau khi user yêu cầu:
${actions.map(a => `- ${a.name}: ${a.description}`).join('\n')}

Khi user yêu cầu thực hiện một action, hãy xác nhận và hỏi thêm thông tin nếu cần.
--- END ACTIONS ---`;
    }

    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: fullSystemPrompt },
        ...(context?.previousMessages || []).map(m => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2000,
    });

    res.json({
      success: true,
      type: 'chat',
      message: response.choices[0].message.content,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
      model: 'gpt-4o-mini',
    });
  } catch (error) {
    console.error('❌ Chat with actions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /api/solo-hub/available-actions
 * List all available actions AI can execute
 */
router.get('/available-actions', (req, res) => {
  const actions = aiActionExecutor.getAvailableActionsDescription();
  res.json({ actions });
});

/**
 * POST /api/solo-hub/execute-action
 * Manually execute a specific action
 */
router.post('/execute-action', async (req, res) => {
  try {
    const { action, params } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'action is required',
      });
    }

    const result = await aiActionExecutor.executeAction(action, params || {});
    res.json(result);
  } catch (error) {
    console.error('❌ Execute action error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * POST /api/solo-hub/chat-smart
 * Smart chat using multi-agent orchestrator with intelligent content generation
 * This is the ADVANCED endpoint that uses the full multi-layer architecture
 */
router.post('/chat-smart', async (req, res) => {
  try {
    const { message, agentRole, conversationHistory = [], projectId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required',
      });
    }

    console.log(`[Smart Chat] Processing: "${message.substring(0, 50)}..."`);

    // Use multi-agent orchestrator for intelligent processing
    const result = await multiAgentOrchestrator.orchestrate(message, {
      projectId,
      usePlanning: true,
      onProgress: (progress) => {
        console.log(`[Smart Chat] Progress: ${progress.progress?.percentage || 0}%`);
      },
    });

    if (!result.success) {
      // Fallback to simple chat if orchestration fails
      console.log('[Smart Chat] Orchestration failed, falling back to simple chat');
      return res.json({
        success: true,
        type: 'chat',
        message: result.error || 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
        model: 'fallback',
      });
    }

    // Format response based on orchestration result
    const formattedMessage = formatOrchestrationResult(result);

    res.json({
      success: true,
      type: 'orchestrated',
      message: formattedMessage,
      orchestration: {
        agents: result.selectedAgents,
        plan: result.plan,
        results: result.results,
      },
      model: 'multi-agent-orchestrator',
    });
  } catch (error) {
    console.error('❌ Smart chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  }
});

/**
 * Format orchestration result into readable message
 */
function formatOrchestrationResult(result) {
  let message = '';

  // Add summary
  if (result.summary) {
    message += `✅ **Đã hoàn thành** với ${result.metadata?.totalAgents || 0} agents\n\n`;
  }

  // Add agent results
  if (result.results?.agentResults) {
    result.results.agentResults.forEach((agentResult, i) => {
      if (agentResult.result?.success) {
        message += `**${i + 1}. ${agentResult.agent}:**\n`;
        message += `${agentResult.result.content || agentResult.result.message || JSON.stringify(agentResult.result)}\n\n`;
      }
    });
  }

  // Add synthesized result if available
  if (result.results?.synthesized) {
    message += `\n---\n**Tổng hợp:**\n${result.results.synthesized}\n`;
  }

  return message || 'Đã xử lý xong yêu cầu của bạn.';
}

module.exports = router;
