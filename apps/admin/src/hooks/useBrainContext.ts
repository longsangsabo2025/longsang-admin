/**
 * 🧠 useBrainContext Hook
 *
 * Tự động lấy context từ AI Second Brain cho mỗi message.
 * Giúp AI assistants có thêm kiến thức từ Brain.
 */

import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface BrainContext {
  relevant_knowledge: Array<{
    id: string;
    title: string;
    content: string;
    domain: string;
    similarity: number;
  }>;
  context_summary: string;
  sources: string[];
}

interface UseBrainContextOptions {
  userId?: string;
  domain?: string;
  maxResults?: number;
  minSimilarity?: number;
  enabled?: boolean;
}

export function useBrainContext(options: UseBrainContextOptions = {}) {
  const {
    userId = '89917901-cf15-45c4-a7ad-8c4c9513347e',
    domain,
    maxResults = 3,
    minSimilarity = 0.5,
    enabled = true,
  } = options;

  const [isSearching, setIsSearching] = useState(false);
  const [lastContext, setLastContext] = useState<BrainContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Tìm kiếm knowledge liên quan từ Brain
   */
  const searchBrain = useCallback(
    async (query: string): Promise<BrainContext | null> => {
      if (!enabled || !query.trim()) return null;

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/brain/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            query,
            userId,
            domain,
            limit: maxResults,
            minSimilarity,
          }),
        });

        if (!response.ok) {
          throw new Error(`Brain search failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.data?.length) {
          return null;
        }

        // Build context from results
        const context: BrainContext = {
          relevant_knowledge: data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            domain: item.domain,
            similarity: item.similarity,
          })),
          context_summary: buildContextSummary(data.data),
          sources: data.data.map((item: any) => item.title),
        };

        setLastContext(context);
        return context;
      } catch (err: any) {
        console.error('[useBrainContext] Search error:', err);
        setError(err.message);
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [userId, domain, maxResults, minSimilarity, enabled]
  );

  /**
   * Build system prompt addition từ Brain context
   */
  const buildSystemPromptAddition = useCallback((context: BrainContext): string => {
    if (!context.relevant_knowledge.length) return '';

    const knowledgeText = context.relevant_knowledge
      .map((k, i) => `[${i + 1}] ${k.title}:\n${k.content.slice(0, 500)}...`)
      .join('\n\n');

    return `
---
📚 RELEVANT KNOWLEDGE FROM YOUR SECOND BRAIN:
${knowledgeText}

⚡ Use this knowledge to provide more accurate and personalized responses.
---`;
  }, []);

  /**
   * Enrich message với Brain context
   * Returns enriched system prompt or null nếu không có context
   */
  const enrichWithBrain = useCallback(
    async (
      userMessage: string,
      existingSystemPrompt?: string
    ): Promise<{
      enrichedSystemPrompt: string;
      context: BrainContext | null;
    }> => {
      const context = await searchBrain(userMessage);

      if (!context) {
        return {
          enrichedSystemPrompt: existingSystemPrompt || '',
          context: null,
        };
      }

      const addition = buildSystemPromptAddition(context);

      return {
        enrichedSystemPrompt: `${existingSystemPrompt || ''}\n${addition}`,
        context,
      };
    },
    [searchBrain, buildSystemPromptAddition]
  );

  return {
    searchBrain,
    enrichWithBrain,
    buildSystemPromptAddition,
    isSearching,
    lastContext,
    error,
  };
}

// Helper: Build summary từ knowledge items
function buildContextSummary(items: any[]): string {
  if (!items.length) return '';

  const domains = [...new Set(items.map((i) => i.domain))];
  const titles = items.map((i) => i.title).slice(0, 3);

  return `Found ${items.length} relevant item(s) from ${domains.join(', ')}: ${titles.join(', ')}`;
}

export default useBrainContext;
