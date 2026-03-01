/**
 * useBrainRAG Hook
 * Hook để chat với AI có Brain RAG context
 */

import { useState, useCallback } from 'react';

interface BrainSource {
  title: string;
  domain: string;
  relevance: number;
}

interface UseBrainRAGOptions {
  enabled?: boolean;
  model?: string;
  systemPrompt?: string;
  onSourcesReceived?: (sources: BrainSource[]) => void;
}

interface BrainRAGResponse {
  content: string;
  ragApplied: boolean;
  ragReason: string;
  sources: BrainSource[];
}

export function useBrainRAG(options: UseBrainRAGOptions = {}) {
  const {
    enabled = true,
    model = 'gpt-4o-mini',
    systemPrompt = 'Bạn là trợ lý AI thông minh, trả lời bằng tiếng Việt.',
    onSourcesReceived,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSources, setLastSources] = useState<BrainSource[]>([]);
  const [lastRagApplied, setLastRagApplied] = useState(false);
  const [lastRagReason, setLastRagReason] = useState('');

  /**
   * Check if a query would trigger Brain RAG
   */
  const checkRelevance = useCallback(async (query: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/brain/rag/check-relevance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.isRelevant;
    } catch {
      return false;
    }
  }, []);

  /**
   * Send message with Smart Brain RAG
   */
  const sendWithBrain = useCallback(
    async (
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    ): Promise<BrainRAGResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/brain/rag/smart-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            model,
            systemPrompt,
            brainEnabled: enabled,
            minRelevance: 50,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get response');
        }

        const data = await response.json();

        // Update state
        setLastSources(data.sources || []);
        setLastRagApplied(data.ragApplied || false);
        setLastRagReason(data.ragReason || '');

        // Callback for sources
        if (data.sources?.length > 0) {
          onSourcesReceived?.(data.sources);
        }

        return {
          content: data.response,
          ragApplied: data.ragApplied,
          ragReason: data.ragReason,
          sources: data.sources || [],
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, model, systemPrompt, onSourcesReceived]
  );

  /**
   * Search Brain knowledge directly
   */
  const searchBrain = useCallback(async (query: string, limit = 5): Promise<BrainSource[]> => {
    try {
      const response = await fetch('/api/brain/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.results || [];
    } catch {
      return [];
    }
  }, []);

  return {
    sendWithBrain,
    searchBrain,
    checkRelevance,
    isLoading,
    error,
    lastSources,
    lastRagApplied,
    lastRagReason,
  };
}

export default useBrainRAG;
