/**
 * 🚀 useStreamingChat Hook - Elon Musk Edition
 *
 * Real-time streaming chat like ChatGPT
 * Uses Server-Sent Events (SSE) for live updates
 *
 * Features:
 * - Real-time streaming responses
 * - Auto-reconnect on failure
 * - Typing indicator
 * - Message queue management
 */

import { useState, useCallback, useRef } from 'react';
import { AssistantType } from './useAssistant';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface UseStreamingChatOptions {
  assistantType: AssistantType;
  userId: string;
  onError?: (error: string) => void;
  onComplete?: (response: string) => void;
}

export interface UseStreamingChatReturn {
  messages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  streamingContent: string;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
  retryLast: () => void;
}

export function useStreamingChat(options: UseStreamingChatOptions): UseStreamingChatReturn {
  const { assistantType, userId, onError, onComplete } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string>('');

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Send message with streaming response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      lastMessageRef.current = content;

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add placeholder for assistant response
      const assistantMessageId = generateId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setIsLoading(true);
      setIsStreaming(true);
      setStreamingContent('');

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`/api/assistants/${assistantType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            message: content.trim(),
            userId,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let fullContent = '';
        setIsLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                // Streaming complete
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent, isStreaming: false }
                      : msg
                  )
                );
                setIsStreaming(false);
                setStreamingContent('');
                onComplete?.(fullContent);
                return;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);

                  // Update message in real-time
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
                    )
                  );
                }
              } catch (parseError) {
                // Ignore parse errors for incomplete chunks
                console.debug('[Streaming] Parse error:', parseError);
              }
            }
          }
        }

        // Finalize message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullContent, isStreaming: false }
              : msg
          )
        );
        setIsStreaming(false);
        onComplete?.(fullContent);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('[Streaming] Aborted by user');
          return;
        }

        const errorMessage = err.message || 'Failed to get response';
        setError(errorMessage);
        onError?.(errorMessage);

        // Update assistant message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: `❌ Error: ${errorMessage}`, isStreaming: false }
              : msg
          )
        );

        console.error('[Streaming] Error:', err);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [assistantType, userId, isStreaming, onError, onComplete]
  );

  /**
   * Stop current streaming
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingContent('');
  }, []);

  /**
   * Retry last message
   */
  const retryLast = useCallback(() => {
    if (lastMessageRef.current) {
      // Remove last assistant message
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    streamingContent,
    sendMessage,
    stopStreaming,
    clearMessages,
    retryLast,
  };
}

export default useStreamingChat;
