/**
 * useAssistant Hook - Vercel AI SDK Version
 * Upgrade to use Vercel AI SDK useChat hook
 */

import { useChat } from 'ai/react';
import { useCallback } from 'react';

export type AssistantType = 'course' | 'financial' | 'research' | 'news' | 'career' | 'daily';

interface UseAssistantVercelOptions {
  assistantType: AssistantType;
  userId?: string;
  conversationId?: string;
  onError?: (error: Error) => void;
}

export function useAssistantVercel(options: UseAssistantVercelOptions) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, stop, reload } = useChat({
    api: `/api/assistants/${options.assistantType}/chat`,
    headers: {
      ...(options.userId && { 'x-user-id': options.userId }),
    },
    body: {
      userId: options.userId,
      conversationId: options.conversationId,
    },
    onError: (err) => {
      options.onError?.(err);
    },
  });

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      await handleSubmit(e);
    },
    [handleSubmit]
  );

  const clear = useCallback(() => {
    // Vercel AI SDK doesn't have clear, so we reload
    reload();
  }, [reload]);

  return {
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    })),
    input,
    handleInputChange,
    submit,
    isLoading,
    isThinking: isLoading,
    error,
    stop,
    reload,
    clear,
  };
}

