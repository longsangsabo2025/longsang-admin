/**
 * 🪝 useCopilot Hook
 *
 * Custom hook for Copilot functionality
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

interface Suggestion {
  id: string;
  type: 'action' | 'reminder' | 'insight';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggested_action?: {
    action: string;
    parameters?: any;
  };
  estimated_impact?: string;
  project_id?: string | null;
  project_name?: string | null;
  score?: number;
  created_at?: string;
}

interface UseCopilotOptions {
  projectId?: string | null;
  autoLoadSuggestions?: boolean;
}

export function useCopilot(options: UseCopilotOptions = {}) {
  const { projectId, autoLoadSuggestions = true } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_BASE}/api/copilot/suggestions`);
      if (projectId) {
        url.searchParams.set('projectId', projectId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user', // TODO: Get from auth
          limit: 10,
          projectId,
        }),
      });

      const data = await response.json();
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Streaming response
    setStreaming(true);
    try {
      const response = await fetch(`${API_BASE}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: 'current-user', // TODO: Get from auth
          projectId,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setStreaming(false);
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.streaming = false;
                  }
                  return newMessages;
                });
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content += parsed.content;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Non-streaming fallback
      if (!reader) {
        const data = await response.json();
        if (data.success && data.response?.message) {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = data.response.message;
              lastMessage.streaming = false;
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }, [projectId]);

  // Execute suggestion
  const executeSuggestion = useCallback(async (suggestionId: string) => {
    try {
      const suggestion = suggestions.find((s) => s.id === suggestionId);
      if (!suggestion || !suggestion.suggested_action) return;

      // Execute the suggested action
      if (suggestion.suggested_action.action === 'create_post') {
        // Example: Create post workflow
        await sendMessage(`Tạo bài post: ${suggestion.reason}`);
      } else {
        await sendMessage(`Thực hiện: ${suggestion.reason}`);
      }

      // Remove from suggestions
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    } catch (error) {
      console.error('Error executing suggestion:', error);
    }
  }, [suggestions, sendMessage]);

  // Dismiss suggestion
  const dismissSuggestion = useCallback(async (suggestionId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/ai/suggestions/${suggestionId}/dismiss`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      }
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  }, []);

  // Auto-load suggestions on mount
  useEffect(() => {
    if (autoLoadSuggestions) {
      loadSuggestions();
    }
  }, [autoLoadSuggestions, loadSuggestions]);

  return {
    messages,
    suggestions,
    loading,
    streaming,
    sendMessage,
    loadSuggestions,
    executeSuggestion,
    dismissSuggestion,
  };
}

