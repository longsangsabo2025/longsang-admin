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
const copilotLearner = require('../services/copilot-learner');

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
 * Smart chat using FULL MULTI-LAYER ARCHITECTURE:
 * Layer 1: Copilot Planner - Break down complex tasks into steps
 * Layer 2: Multi-Agent Orchestrator - Route to specialized agents
 * Layer 3: Copilot Executor - Execute plan with parallel processing
 * Layer 4: Learning & Feedback - Improve over time
 */
router.post('/chat-smart', async (req, res) => {
  try {
    const { message, agentRole, conversationHistory = [], projectId, userId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required',
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 [SMART CHAT] Full Multi-Layer Processing`);
    console.log(`📝 Message: "${message.substring(0, 80)}..."`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    const layers = {
      planning: null,
      orchestration: null,
      execution: null,
      learning: null,
    };

    // ═══════════════════════════════════════════════════════════
    // LAYER 1: COPILOT PLANNER - Analyze and create execution plan
    // ═══════════════════════════════════════════════════════════
    console.log('📋 [Layer 1] COPILOT PLANNER - Creating execution plan...');
    
    let plan = null;
    try {
      plan = await copilotPlanner.createPlan(message, {
        projectId,
        context: { conversationHistory },
        maxSteps: 10,
      });
      
      layers.planning = {
        success: true,
        planId: plan.metadata?.planId,
        totalSteps: plan.totalSteps,
        estimatedTime: plan.metadata?.estimatedTime,
        complexity: plan.metadata?.complexity,
      };
      
      console.log(`   ✅ Plan created: ${plan.totalSteps} steps, complexity: ${plan.metadata?.complexity}`);
      console.log(`   📝 Steps: ${plan.steps?.map(s => s.name).join(' → ')}`);
    } catch (planError) {
      console.log(`   ⚠️ Planner skipped: ${planError.message}`);
      layers.planning = { success: false, error: planError.message };
    }

    // ═══════════════════════════════════════════════════════════
    // LAYER 2: MULTI-AGENT ORCHESTRATOR - Route to specialized agents
    // ═══════════════════════════════════════════════════════════
    console.log('\n🤖 [Layer 2] MULTI-AGENT ORCHESTRATOR - Routing to agents...');
    
    const orchestrationResult = await multiAgentOrchestrator.orchestrate(message, {
      projectId,
      usePlanning: !!plan,
      plan,
      onProgress: (progress) => {
        console.log(`   ⏳ Progress: ${progress.progress?.percentage || 0}%`);
      },
    });
    
    layers.orchestration = {
      success: orchestrationResult.success,
      selectedAgents: orchestrationResult.selectedAgents || [],
      agentCount: orchestrationResult.metadata?.totalAgents || 0,
    };
    
    console.log(`   ✅ Routed to ${layers.orchestration.agentCount} agents: ${layers.orchestration.selectedAgents?.join(', ')}`);

    // ═══════════════════════════════════════════════════════════
    // LAYER 3: COPILOT EXECUTOR - Execute with parallel processing
    // ═══════════════════════════════════════════════════════════
    console.log('\n⚡ [Layer 3] COPILOT EXECUTOR - Executing plan...');
    
    let executionResult = null;
    if (plan && plan.steps?.length > 0) {
      try {
        executionResult = await copilotExecutor.executePlan(plan, {
          userId,
          projectId,
          maxRetries: 2,
          onProgress: (progress) => {
            console.log(`   ⏳ Step ${progress.progress?.current}/${progress.progress?.total}: ${progress.step?.name}`);
          },
        });
        
        layers.execution = {
          success: executionResult.success,
          status: executionResult.execution?.status,
          completedSteps: executionResult.summary?.completedSteps,
          successfulSteps: executionResult.summary?.successfulSteps,
          duration: executionResult.summary?.duration,
        };
        
        console.log(`   ✅ Execution complete: ${layers.execution.successfulSteps}/${layers.execution.completedSteps} steps succeeded`);
      } catch (execError) {
        console.log(`   ⚠️ Executor error: ${execError.message}`);
        layers.execution = { success: false, error: execError.message };
      }
    } else {
      console.log('   ⏭️ No plan to execute, using orchestration result directly');
      layers.execution = { success: true, skipped: true, reason: 'Direct orchestration' };
    }

    // ═══════════════════════════════════════════════════════════
    // LAYER 4: LEARNING & FEEDBACK
    // ═══════════════════════════════════════════════════════════
    console.log('\n📚 [Layer 4] LEARNING - Recording for improvement...');
    
    try {
      // Record interaction for learning
      const feedbackData = {
        userId: userId || 'anonymous',
        feedbackType: 'interaction',
        interactionType: 'chat_smart',
        originalMessage: message,
        aiResponse: orchestrationResult?.results?.synthesized || '',
        context: {
          projectId,
          agentsUsed: orchestrationResult?.selectedAgents || [],
          planSteps: plan?.steps?.length || 0,
          executionSuccess: executionResult?.success,
          totalTime,
        },
      };
      
      await copilotLearner.collectFeedback(feedbackData);
      
      // Recognize patterns from this session
      if (userId) {
        await copilotLearner.recognizePatterns(userId, {
          message,
          action: orchestrationResult?.selectedAgents?.[0],
          success: orchestrationResult?.success,
        });
      }
      
      layers.learning = { 
        success: true, 
        recorded: true, 
        feedbackType: 'interaction',
      };
      console.log('   ✅ Interaction recorded for learning');
    } catch (learnError) {
      console.log(`   ⚠️ Learning skipped: ${learnError.message}`);
      layers.learning = { success: false, error: learnError.message };
    }

    // ═══════════════════════════════════════════════════════════
    // FORMAT FINAL RESPONSE
    // ═══════════════════════════════════════════════════════════
    const totalTime = Date.now() - startTime;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ [COMPLETE] Total time: ${totalTime}ms`);
    console.log(`${'='.repeat(60)}\n`);

    const formattedMessage = formatMultiLayerResult({
      orchestration: orchestrationResult,
      execution: executionResult,
      plan,
      layers,
    });

    res.json({
      success: true,
      type: 'multi-layer',
      message: formattedMessage,
      layers,
      orchestration: {
        agents: orchestrationResult.selectedAgents,
        plan: plan ? {
          id: plan.metadata?.planId,
          steps: plan.steps?.length,
          complexity: plan.metadata?.complexity,
        } : null,
        results: orchestrationResult.results,
      },
      execution: executionResult ? {
        status: executionResult.execution?.status,
        summary: executionResult.summary,
      } : null,
      metadata: {
        totalTime,
        model: 'multi-layer-architecture',
        layersUsed: Object.entries(layers)
          .filter(([_, v]) => v?.success)
          .map(([k]) => k),
      },
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
 * Format orchestration result into readable message (simple version)
 */
function formatOrchestrationResult(result) {
  let message = '';

  if (result.summary) {
    message += `✅ **Đã hoàn thành** với ${result.metadata?.totalAgents || 0} agents\n\n`;
  }

  if (result.results?.agentResults) {
    result.results.agentResults.forEach((agentResult, i) => {
      if (agentResult.result?.success) {
        message += `**${i + 1}. ${agentResult.agent}:**\n`;
        message += `${agentResult.result.content || agentResult.result.message || JSON.stringify(agentResult.result)}\n\n`;
      }
    });
  }

  if (result.results?.synthesized) {
    message += `\n---\n**Tổng hợp:**\n${result.results.synthesized}\n`;
  }

  return message || 'Đã xử lý xong yêu cầu của bạn.';
}

/**
 * Format multi-layer result into readable message
 */
function formatMultiLayerResult({ orchestration, execution, plan, layers }) {
  let message = '';
  
  // Header with layers summary
  const activeLayers = Object.entries(layers)
    .filter(([_, v]) => v?.success)
    .map(([k]) => k);
  
  message += `🏗️ **Multi-Layer Processing** (${activeLayers.length}/4 layers)\n`;
  message += `${activeLayers.map(l => `✅ ${l}`).join(' → ')}\n\n`;

  // Plan summary
  if (plan && layers.planning?.success) {
    message += `📋 **Plan:** ${plan.totalSteps} steps (${plan.metadata?.complexity || 'unknown'} complexity)\n`;
    if (plan.steps?.length > 0) {
      message += `   ${plan.steps.slice(0, 3).map(s => s.name).join(' → ')}`;
      if (plan.steps.length > 3) message += ` ... (+${plan.steps.length - 3} more)`;
      message += '\n\n';
    }
  }

  // Agent results
  if (orchestration?.results?.agentResults) {
    message += `🤖 **Agent Results:**\n`;
    orchestration.results.agentResults.forEach((agentResult, i) => {
      const status = agentResult.result?.success ? '✅' : '❌';
      const agentName = agentResult.agent || `Agent ${i + 1}`;
      message += `${status} **${agentName}:**\n`;
      
      const content = agentResult.result?.content || 
                      agentResult.result?.message || 
                      agentResult.result?.result?.message ||
                      (typeof agentResult.result === 'string' ? agentResult.result : null);
      
      if (content) {
        message += `   ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}\n`;
      }
      message += '\n';
    });
  }

  // Execution summary
  if (execution && layers.execution?.success && !layers.execution?.skipped) {
    message += `⚡ **Execution:** ${execution.summary?.successfulSteps}/${execution.summary?.completedSteps} steps completed`;
    if (execution.summary?.duration) {
      message += ` (${execution.summary.duration}ms)`;
    }
    message += '\n\n';
  }

  // Synthesized result
  if (orchestration?.results?.synthesized) {
    message += `\n---\n📝 **Summary:**\n${orchestration.results.synthesized}\n`;
  }

  // Final message if nothing else
  if (!message.includes('Agent Results') && !message.includes('Summary')) {
    message += '\n✅ Đã xử lý xong yêu cầu của bạn.';
  }

  return message;
}

module.exports = router;
