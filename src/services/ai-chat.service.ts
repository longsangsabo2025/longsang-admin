/**
 * AI Chat Service - API Client
 * Calls backend API instead of using SDK directly (for security)
 */

import type { AgentMemory, AgentTask } from '@/types/solo-hub.types';

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

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Chat with an AI Agent via backend API
 */
export async function chatWithAgent(request: AgentChatRequest): Promise<AgentChatResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/solo-hub/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat API error:', error);
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      model: request.options?.model || 'unknown',
    };
  }
}

/**
 * Chat with OpenAI specifically
 */
export async function chatWithOpenAI(request: AgentChatRequest): Promise<AgentChatResponse> {
  return chatWithAgent({
    ...request,
    options: {
      ...request.options,
      model: request.options?.model || 'gpt-4o-mini',
    },
  });
}

/**
 * Chat with Claude specifically
 */
export async function chatWithClaude(request: AgentChatRequest): Promise<AgentChatResponse> {
  return chatWithAgent({
    ...request,
    options: {
      ...request.options,
      model: 'claude-sonnet-4-20250514',
    },
  });
}

/**
 * Stream chat response (OpenAI only)
 */
export async function* streamChatWithAgent(
  request: AgentChatRequest
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch(`${API_BASE}/api/solo-hub/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('Stream error:', error);
    throw error;
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
};
