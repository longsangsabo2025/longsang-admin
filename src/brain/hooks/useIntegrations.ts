import { brainAPI } from '@/brain/lib/services/brain-api';
import type {
  Integration,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  ExportResult,
} from '@/brain/types/integrations.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY_INTEGRATIONS = ['brain', 'integrations'];

/**
 * Hook to get integrations
 */
export function useIntegrations(enabled: boolean = true) {
  return useQuery<Integration[]>({
    queryKey: [...QUERY_KEY_INTEGRATIONS],
    queryFn: () => brainAPI.getIntegrations(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create or update integration
 */
export function useCreateIntegration() {
  const queryClient = useQueryClient();
  return useMutation<Integration, Error, CreateIntegrationRequest>({
    mutationFn: (request) => brainAPI.createIntegration(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_INTEGRATIONS] });
      toast.success('Integration configured successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to configure integration: ${error.message}`);
    },
  });
}

/**
 * Hook to update integration
 */
export function useUpdateIntegration() {
  const queryClient = useQueryClient();
  return useMutation<Integration, Error, { id: string; request: UpdateIntegrationRequest }>({
    mutationFn: ({ id, request }) => brainAPI.updateIntegration(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_INTEGRATIONS] });
      toast.success('Integration updated successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error.message}`);
    },
  });
}

/**
 * Hook to delete integration
 */
export function useDeleteIntegration() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => brainAPI.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_INTEGRATIONS] });
      toast.success('Integration deleted successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to delete integration: ${error.message}`);
    },
  });
}

/**
 * Hook to test Slack integration
 */
export function useTestSlackIntegration() {
  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: () => brainAPI.testSlackIntegration(),
    onSuccess: () => {
      toast.success('Slack integration test successful!');
    },
    onError: (error) => {
      toast.error(`Slack integration test failed: ${error.message}`);
    },
  });
}

/**
 * Hook to export knowledge
 */
export function useExportKnowledge() {
  return useMutation<ExportResult, Error, { knowledgeId: string; format: 'markdown' | 'pdf' }>({
    mutationFn: ({ knowledgeId, format }) => brainAPI.exportKnowledge(knowledgeId, format),
    onSuccess: (result) => {
      // Download file
      const blob = new Blob([result.content], {
        type: format === 'pdf' ? 'application/pdf' : 'text/markdown',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to export: ${error.message}`);
    },
  });
}

