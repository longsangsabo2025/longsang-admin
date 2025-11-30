/**
 * AI Chat Service
 * Direct integration with OpenAI/Anthropic for AI Agent communication
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { AIAgent, AgentTask, AgentMemory } from '@/types/solo-hub.types';

// Types for AI Chat
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentChatRequest {
  agentRole: string;
  message: string;
  context?: {
    memories?: AgentMemory[];
    currentTask?: AgentTask;
    previousMessages?: ChatMessage[];
  };
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

export interface AgentChatResponse {
  success: boolean;
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  error?: string;
}

// Agent System Prompts
const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
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

// Initialize clients
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // For client-side usage
    });
  }
  return openaiClient;
}

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }
    anthropicClient = new Anthropic({ 
      apiKey,
    });
  }
  return anthropicClient;
}

// Build context from memories
function buildMemoryContext(memories?: AgentMemory[]): string {
  if (!memories || memories.length === 0) return '';
  
  const memorySections = memories.map(m => 
    `[${m.memory_type.toUpperCase()}] ${m.title}: ${m.content}`
  ).join('\n');
  
  return `\n\n--- SHARED CONTEXT ---\n${memorySections}\n--- END CONTEXT ---\n`;
}

// Build task context
function buildTaskContext(task?: AgentTask): string {
  if (!task) return '';
  
  return `\n\n--- CURRENT TASK ---
Title: ${task.title}
Type: ${task.task_type}
Priority: ${task.priority}
Description: ${task.description || 'No description'}
Status: ${task.status}
--- END TASK ---\n`;
}

/**
 * Chat with an AI Agent using OpenAI
 */
export async function chatWithOpenAI(request: AgentChatRequest): Promise<AgentChatResponse> {
  try {
    const client = getOpenAIClient();
    const systemPrompt = AGENT_SYSTEM_PROMPTS[request.agentRole] || AGENT_SYSTEM_PROMPTS.advisor;
    
    // Build full system prompt with context
    const fullSystemPrompt = systemPrompt + 
      buildMemoryContext(request.context?.memories) +
      buildTaskContext(request.context?.currentTask);
    
    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: fullSystemPrompt },
      ...(request.context?.previousMessages || []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: request.message },
    ];
    
    const model = request.options?.model || 'gpt-4o-mini';
    const temperature = request.options?.temperature ?? 0.7;
    const maxTokens = request.options?.maxTokens || 2000;
    
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
    
    const choice = response.choices[0];
    
    return {
      success: true,
      message: choice.message.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
      model,
    };
  } catch (error) {
    console.error('OpenAI chat error:', error);
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      model: request.options?.model || 'gpt-4o-mini',
    };
  }
}

/**
 * Chat with an AI Agent using Anthropic Claude
 */
export async function chatWithClaude(request: AgentChatRequest): Promise<AgentChatResponse> {
  try {
    const client = getAnthropicClient();
    const systemPrompt = AGENT_SYSTEM_PROMPTS[request.agentRole] || AGENT_SYSTEM_PROMPTS.advisor;
    
    // Build full system prompt with context
    const fullSystemPrompt = systemPrompt + 
      buildMemoryContext(request.context?.memories) +
      buildTaskContext(request.context?.currentTask);
    
    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = [
      ...(request.context?.previousMessages || [])
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      { role: 'user', content: request.message },
    ];
    
    const model = request.options?.model || 'claude-3-5-sonnet-20241022';
    const temperature = request.options?.temperature ?? 0.7;
    const maxTokens = request.options?.maxTokens || 2000;
    
    const response = await client.messages.create({
      model,
      system: fullSystemPrompt,
      messages,
      max_tokens: maxTokens,
      temperature,
    });
    
    const content = response.content[0];
    const messageText = content.type === 'text' ? content.text : '';
    
    return {
      success: true,
      message: messageText,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model,
    };
  } catch (error) {
    console.error('Claude chat error:', error);
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      model: request.options?.model || 'claude-3-5-sonnet-20241022',
    };
  }
}

/**
 * Smart chat - automatically selects best model for agent type
 */
export async function chatWithAgent(request: AgentChatRequest): Promise<AgentChatResponse> {
  // Model selection based on agent role and task complexity
  const useClaudeFor = ['dev', 'advisor']; // Use Claude for complex reasoning tasks
  
  if (useClaudeFor.includes(request.agentRole)) {
    // Try Claude first, fallback to OpenAI
    try {
      return await chatWithClaude(request);
    } catch {
      console.log('Falling back to OpenAI');
      return await chatWithOpenAI(request);
    }
  }
  
  // Use OpenAI for other agents (faster, cheaper)
  return await chatWithOpenAI(request);
}

/**
 * Stream chat response (OpenAI only)
 */
export async function* streamChatWithAgent(
  request: AgentChatRequest
): AsyncGenerator<string, void, unknown> {
  const client = getOpenAIClient();
  const systemPrompt = AGENT_SYSTEM_PROMPTS[request.agentRole] || AGENT_SYSTEM_PROMPTS.advisor;
  
  const fullSystemPrompt = systemPrompt + 
    buildMemoryContext(request.context?.memories) +
    buildTaskContext(request.context?.currentTask);
  
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: fullSystemPrompt },
    ...(request.context?.previousMessages || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: request.message },
  ];
  
  const stream = await client.chat.completions.create({
    model: request.options?.model || 'gpt-4o-mini',
    messages,
    temperature: request.options?.temperature ?? 0.7,
    max_tokens: request.options?.maxTokens || 2000,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Quick action functions for specific agent tasks
 */
export const agentActions = {
  // Dev Agent actions
  reviewCode: (code: string, language: string) => 
    chatWithAgent({
      agentRole: 'dev',
      message: `Review this ${language} code and suggest improvements:\n\`\`\`${language}\n${code}\n\`\`\``,
    }),
  
  debugError: (error: string, context: string) =>
    chatWithAgent({
      agentRole: 'dev',
      message: `Debug this error:\nError: ${error}\nContext: ${context}`,
    }),
  
  // Content Agent actions
  writeBlogOutline: (topic: string, keywords: string[]) =>
    chatWithAgent({
      agentRole: 'content',
      message: `Create a blog outline for: "${topic}"\nTarget keywords: ${keywords.join(', ')}`,
    }),
  
  writeEmailCopy: (purpose: string, tone: string) =>
    chatWithAgent({
      agentRole: 'content',
      message: `Write an email for: ${purpose}\nTone: ${tone}`,
    }),
  
  // Marketing Agent actions
  analyzeMetrics: (metrics: Record<string, number>) =>
    chatWithAgent({
      agentRole: 'marketing',
      message: `Analyze these marketing metrics and provide insights:\n${JSON.stringify(metrics, null, 2)}`,
    }),
  
  suggestCampaign: (product: string, budget: number, goal: string) =>
    chatWithAgent({
      agentRole: 'marketing',
      message: `Suggest a marketing campaign:\nProduct: ${product}\nBudget: $${budget}\nGoal: ${goal}`,
    }),
  
  // Sales Agent actions
  writeOutreach: (prospect: { name: string; company: string; role: string }, valueProposition: string) =>
    chatWithAgent({
      agentRole: 'sales',
      message: `Write a cold outreach email:\nProspect: ${prospect.name}, ${prospect.role} at ${prospect.company}\nValue proposition: ${valueProposition}`,
    }),
  
  // Advisor Agent actions
  analyzeDecision: (decision: string, options: string[], factors: string[]) =>
    chatWithAgent({
      agentRole: 'advisor',
      message: `Help me decide: ${decision}\nOptions: ${options.join(', ')}\nKey factors: ${factors.join(', ')}`,
    }),
};

export default {
  chatWithOpenAI,
  chatWithClaude,
  chatWithAgent,
  streamChatWithAgent,
  agentActions,
  AGENT_SYSTEM_PROMPTS,
};
