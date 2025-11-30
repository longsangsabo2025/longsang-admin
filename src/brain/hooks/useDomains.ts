/**
 * useDomains Hook
 * Manages domain CRUD operations with React Query
 */

import { brainAPI } from '@/brain/lib/services/brain-api';
import type { CreateDomainInput, UpdateDomainInput } from '@/brain/types/brain.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY = ['brain', 'domains'];

/**
 * Hook to fetch all domains
 */
export function useDomains() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => brainAPI.getDomains(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single domain by ID
 */
export function useDomain(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => {
      if (!id) throw new Error('Domain ID is required');
      return brainAPI.getDomain(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new domain
 */
export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDomainInput) => brainAPI.createDomain(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Domain created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create domain');
    },
  });
}

/**
 * Hook to update a domain
 */
export function useUpdateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDomainInput }) =>
      brainAPI.updateDomain(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] });
      toast.success('Domain updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update domain');
    },
  });
}

/**
 * Hook to delete a domain
 */
export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brainAPI.deleteDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Domain deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete domain');
    },
  });
}
