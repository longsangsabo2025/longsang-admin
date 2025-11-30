/**
 * Real-time Streaming Chat with AI
 * WebSocket-based streaming responses from OpenAI
 */

import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';
import { VectorStore } from './vector-store';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface StreamChunk {
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    finishReason?: string;
  };
  error?: string;
}

/**
 * Stream chat completion with real-time chunks
 */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    useRAG?: boolean;
  } = {}
): AsyncGenerator<StreamChunk> {
  const { model = 'gpt-4o', temperature = 0.7, maxTokens = 2000, useRAG = false } = options;

  try {
    yield { type: 'start' };

    // Enhance with RAG if enabled
    let enhancedMessages = messages;
    if (useRAG && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        const context = await VectorStore.semanticSearch(lastMessage.content, {
          limit: 3,
          threshold: 0.75,
        });

        if (context.length > 0) {
          const contextText = context.map((doc, idx) => `[${idx + 1}] ${doc.content}`).join('\n\n');

          enhancedMessages = [
            ...messages.slice(0, -1),
            {
              role: 'system' as const,
              content: `Here is relevant context:\n\n${contextText}`,
            },
            lastMessage,
          ];
        }
      }
    }

    const stream = await openai.chat.completions.create({
      model,
      messages: enhancedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let fullContent = '';
    let tokensUsed = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const finishReason = chunk.choices[0]?.finish_reason;

      if (delta?.content) {
        fullContent += delta.content;
        yield {
          type: 'chunk',
          content: delta.content,
        };
      }

      if (finishReason) {
        tokensUsed = chunk.usage?.total_tokens || 0;
        yield {
          type: 'end',
          metadata: {
            model,
            tokensUsed,
            finishReason,
          },
        };
      }
    }

    logger.info('Chat stream completed', { tokensUsed, contentLength: fullContent.length });
  } catch (error) {
    logger.error('Chat stream error', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Stream error',
    };
  }
}

/**
 * Function calling with streaming
 */
export async function* streamChatWithFunctions(
  messages: ChatMessage[],
  functions: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
  }[],
  options: {
    model?: string;
    temperature?: number;
  } = {}
): AsyncGenerator<
  | StreamChunk
  | { type: 'function_call'; name: string; args: Record<string, unknown>; result: unknown }
> {
  const { model = 'gpt-4o', temperature = 0.7 } = options;

  try {
    yield { type: 'start' };

    const stream = await openai.chat.completions.create({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      tools: functions.map((f) => ({
        type: 'function' as const,
        function: {
          name: f.name,
          description: f.description,
          parameters: f.parameters,
        },
      })),
      stream: true,
    });

    let functionCall: { name: string; arguments: string } | null = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Handle function calls
      if (delta?.tool_calls) {
        const toolCall = delta.tool_calls[0];
        if (toolCall?.function) {
          if (!functionCall) {
            functionCall = {
              name: toolCall.function.name || '',
              arguments: '',
            };
          }
          if (toolCall.function.arguments) {
            functionCall.arguments += toolCall.function.arguments;
          }
        }
      }

      // Handle regular content
      if (delta?.content) {
        yield {
          type: 'chunk',
          content: delta.content,
        };
      }

      // Handle finish
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason === 'tool_calls' && functionCall) {
        const args = JSON.parse(functionCall.arguments);
        const fn = functions.find((f) => f.name === functionCall!.name);

        if (fn) {
          const result = await fn.handler(args);
          yield {
            type: 'function_call',
            name: functionCall.name,
            args,
            result,
          };
        }
      }
    }

    yield { type: 'end' };
  } catch (error) {
    logger.error('Function streaming error', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Stream error',
    };
  }
}

/**
 * Create streaming chat session with memory
 */
export class StreamingChatSession {
  private messages: ChatMessage[] = [];
  private systemPrompt: string;
  private model: string;
  private useRAG: boolean;

  constructor(
    systemPrompt: string = 'You are a helpful AI assistant.',
    options: {
      model?: string;
      useRAG?: boolean;
    } = {}
  ) {
    this.systemPrompt = systemPrompt;
    this.model = options.model || 'gpt-4o';
    this.useRAG = options.useRAG || false;

    this.messages.push({
      role: 'system',
      content: systemPrompt,
      timestamp: new Date().toISOString(),
    });
  }

  async *chat(userMessage: string): AsyncGenerator<StreamChunk> {
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    let assistantResponse = '';

    try {
      // Stream response
      for await (const chunk of streamChatCompletion(this.messages, {
        model: this.model,
        useRAG: this.useRAG,
      })) {
        if (chunk.type === 'chunk' && chunk.content) {
          assistantResponse += chunk.content;
        }
        yield chunk;
      }

      // Add assistant response to history
      if (assistantResponse) {
        this.messages.push({
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Chat session error', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Chat error',
      };
    }
  }

  getHistory(): ChatMessage[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [
      {
        role: 'system',
        content: this.systemPrompt,
        timestamp: new Date().toISOString(),
      },
    ];
  }

  async exportHistory(): Promise<string> {
    return JSON.stringify(this.messages, null, 2);
  }
}

/**
 * WebSocket handler for real-time chat
 */
export class ChatWebSocketHandler {
  private sessions = new Map<string, StreamingChatSession>();

  createSession(sessionId: string, systemPrompt?: string): void {
    this.sessions.set(sessionId, new StreamingChatSession(systemPrompt));
    logger.info('Chat session created', { sessionId });
  }

  async handleMessage(
    sessionId: string,
    message: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    for await (const chunk of session.chat(message)) {
      onChunk(chunk);
    }
  }

  getSession(sessionId: string): StreamingChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
    logger.info('Chat session destroyed', { sessionId });
  }
}

// Export singleton handler
export const chatWebSocket = new ChatWebSocketHandler();

/**
 * React Hook for streaming chat
 */
export function useStreamingChat(systemPrompt?: string, useRAG = false) {
  const sessionRef = { current: new StreamingChatSession(systemPrompt, { useRAG }) };

  return {
    async sendMessage(
      message: string,
      onChunk: (content: string) => void,
      onComplete?: () => void,
      onError?: (error: string) => void
    ) {
      try {
        for await (const chunk of sessionRef.current.chat(message)) {
          if (chunk.type === 'chunk' && chunk.content) {
            onChunk(chunk.content);
          } else if (chunk.type === 'end') {
            onComplete?.();
          } else if (chunk.type === 'error') {
            onError?.(chunk.error || 'Unknown error');
          }
        }
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    },
    getHistory: () => sessionRef.current.getHistory(),
    clearHistory: () => sessionRef.current.clearHistory(),
  };
}
