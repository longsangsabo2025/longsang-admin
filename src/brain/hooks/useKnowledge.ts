/**
 * useKnowledge Hook
 * Manages knowledge ingestion and search with React Query
 */

import { brainAPI } from '@/brain/lib/services/brain-api';
import type {
  IngestKnowledgeInput,
  KnowledgeSearchOptions,
  Knowledge,
} from '@/brain/types/brain.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY = ['brain', 'knowledge'];

interface ListKnowledgeOptions {
  domainId?: string;
  contentType?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface ListKnowledgeResponse {
  data: Knowledge[];
  count: number;
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Hook to list all knowledge with filtering and pagination
 */
export function useAllKnowledge(options: ListKnowledgeOptions = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'list', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.domainId) params.append('domainId', options.domainId);
      if (options.contentType) params.append('contentType', options.contentType);
      if (options.tag) params.append('tag', options.tag);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/brain/knowledge?${params}`,
        {
          headers: {
            'x-user-id': localStorage.getItem('userId') || '',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch knowledge');
      }

      return response.json() as Promise<{ success: boolean } & ListKnowledgeResponse>;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to search knowledge
 */
export function useSearchKnowledge(
  query: string | null,
  options: KnowledgeSearchOptions = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'search', query, options],
    queryFn: () => {
      if (!query) throw new Error('Query is required');
      return brainAPI.searchKnowledge(query, options);
    },
    enabled: enabled && !!query && query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get knowledge by ID
 */
export function useKnowledge(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => {
      if (!id) throw new Error('Knowledge ID is required');
      return brainAPI.getKnowledge(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to ingest knowledge
 */
export function useIngestKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: IngestKnowledgeInput) => brainAPI.ingestKnowledge(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Knowledge added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add knowledge');
    },
  });
}

/**
 * Hook to update knowledge
 */
export function useUpdateKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string;
      content?: string;
      tags?: string[];
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/brain/knowledge/${input.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('userId') || '',
          },
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update knowledge');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Knowledge updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update knowledge');
    },
  });
}

/**
 * Hook to delete knowledge
 */
export function useDeleteKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/brain/knowledge/${id}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': localStorage.getItem('userId') || '',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete knowledge');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Knowledge deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete knowledge');
    },
  });
}
