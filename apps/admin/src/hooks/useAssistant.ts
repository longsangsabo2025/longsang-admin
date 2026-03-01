/**
 * useAssistant Hook
 * Hook để tương tác với AI Assistants - ChatGPT-style streaming
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type AssistantType = 'course' | 'financial' | 'research' | 'news' | 'career' | 'daily';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  responseTime: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  usage?: TokenUsage;
}

interface UseAssistantOptions {
  assistantType: AssistantType;
  userId?: string;
  conversationId?: string;
  settings?: any;
  enableStreaming?: boolean; // New: enable streaming mode
  onError?: (error: Error) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function useAssistant(options: UseAssistantOptions) {
  const { enableStreaming = true } = options; // Default to streaming
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(
    options.conversationId
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevConversationIdRef = useRef<string | undefined>(options.conversationId);

  // Sync conversationId from props - only when it actually changes
  useEffect(() => {
    if (options.conversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = options.conversationId;
      setCurrentConversationId(options.conversationId);
    }
  }, [options.conversationId]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const submit = useCallback(
    async (e?: React.FormEvent, message?: string) => {
      e?.preventDefault();
      const messageToSend = message || input.trim();
      if (!messageToSend || isLoading) return;

      setIsLoading(true);
      setIsThinking(true);
      setError(null);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageToSend,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Create assistant message placeholder
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: enableStreaming,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        if (enableStreaming) {
          // STREAMING MODE - ChatGPT style
          const response = await fetch(`/api/assistants/${options.assistantType}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(options.userId && { 'x-user-id': options.userId }),
            },
            body: JSON.stringify({
              message: messageToSend,
              userId: options.userId,
              conversationId: currentConversationId,
              stream: true, // Enable streaming
              settings: options.settings,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          setIsThinking(false);

          // Read streaming response
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    // Stream complete
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
                      )
                    );
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      fullContent += parsed.content;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
                        )
                      );
                    }
                    if (parsed.usage) {
                      // Update message with token usage
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId ? { ...msg, usage: parsed.usage } : msg
                        )
                      );
                    }
                    if (parsed.conversationId) {
                      console.log('[useAssistant] Received conversationId:', parsed.conversationId);
                      if (parsed.conversationId !== currentConversationId) {
                        setCurrentConversationId(parsed.conversationId);
                        // Always call callback to refresh sidebar
                        options.onConversationCreated?.(parsed.conversationId);
                      }
                    }
                    if (parsed.error) {
                      throw new Error(parsed.error);
                    }
                  } catch (parseError) {
                    // Only log if it's not a [DONE] marker
                    if (data !== '[DONE]') {
                      console.warn('[useAssistant] Parse error for data:', data, parseError);
                    }
                  }
                }
              }
            }
          }
        } else {
          // NON-STREAMING MODE - Original behavior
          const response = await fetch(`/api/assistants/${options.assistantType}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(options.userId && { 'x-user-id': options.userId }),
            },
            body: JSON.stringify({
              message: messageToSend,
              userId: options.userId,
              conversationId: currentConversationId,
              stream: false,
              settings: options.settings,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          setIsThinking(false);

          const data = await response.json();

          if (data.success && data.response) {
            if (data.conversationId && data.conversationId !== currentConversationId) {
              setCurrentConversationId(data.conversationId);
              options.onConversationCreated?.(data.conversationId);
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: data.response, isStreaming: false }
                  : msg
              )
            );
          } else if (data.error) {
            throw new Error(data.error);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        } else {
          setError(error);
          options.onError?.(error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `❌ Lỗi: ${error.message || 'Không thể kết nối với AI'}`,
                    isStreaming: false,
                  }
                : msg
            )
          );
        }
      } finally {
        setIsLoading(false);
        setIsThinking(false);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, options, currentConversationId, enableStreaming]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsThinking(false);
    }
  }, []);

  const reload = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMessage) {
        setMessages((prev) => prev.filter((m) => m.id !== lastUserMessage.id));
        submit(undefined, lastUserMessage.content);
      }
    }
  }, [messages, submit]);

  const clear = useCallback(() => {
    setMessages([]);
    setInput('');
    setError(null);
  }, []);

  /**
   * Load conversation from API
   */
  const loadConversation = useCallback(
    async (convId: string) => {
      if (!convId || !options.userId) return;

      try {
        // Use the generic conversation endpoint that works for any assistant type
        const response = await fetch(`/api/assistants/conversation/${convId}`, {
          headers: {
            'x-user-id': options.userId,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const conversation = data.conversation;

        if (conversation?.messages) {
          // Convert conversation messages to Message format
          const loadedMessages: Message[] = conversation.messages.map(
            (msg: any, index: number) => ({
              id: `${convId}-${index}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(conversation.created_at),
            })
          );

          setMessages(loadedMessages);
          setCurrentConversationId(convId);
          setError(null);
        }
      } catch (err: any) {
        setError(err);
        options.onError?.(err);
      }
    },
    [options.userId, options.onError]
  );

  // Load conversation when conversationId changes - use ref to prevent infinite loop
  const loadedConversationRef = useRef<string | undefined>();

  useEffect(() => {
    const convId = options.conversationId;

    // Only load if conversationId changed and not already loaded
    if (convId && convId !== loadedConversationRef.current) {
      loadedConversationRef.current = convId;
      loadConversation(convId);
    } else if (!convId && loadedConversationRef.current) {
      // Clear messages when no conversation selected
      loadedConversationRef.current = undefined;
      setMessages([]);
      setCurrentConversationId(undefined);
    }
  }, [options.conversationId]); // Remove loadConversation from deps

  return {
    messages,
    input,
    handleInputChange,
    submit,
    isLoading,
    isThinking,
    error,
    stop,
    reload,
    clear,
    loadConversation,
    conversationId: currentConversationId,
  };
}
