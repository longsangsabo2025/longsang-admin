import { brainAPI } from '@/brain/lib/services/brain-api';
import type {
  KnowledgeShare,
  Comment,
  TeamWorkspace,
  ShareKnowledgeRequest,
  AddCommentRequest,
  CreateTeamRequest,
  AddTeamMemberRequest,
} from '@/brain/types/collaboration.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY_COLLABORATION = ['brain', 'collaboration'];

/**
 * Hook to share knowledge
 */
export function useShareKnowledge() {
  const queryClient = useQueryClient();
  return useMutation<KnowledgeShare, Error, ShareKnowledgeRequest>({
    mutationFn: (request) => brainAPI.shareKnowledge(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_COLLABORATION, 'shared'] });
      toast.success('Knowledge shared successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to share knowledge: ${error.message}`);
    },
  });
}

/**
 * Hook to get shared knowledge
 */
export function useSharedKnowledge(enabled: boolean = true) {
  return useQuery<KnowledgeShare[]>({
    queryKey: [...QUERY_KEY_COLLABORATION, 'shared'],
    queryFn: () => brainAPI.getSharedKnowledge(),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to add comment
 */
export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation<Comment, Error, AddCommentRequest>({
    mutationFn: (request) => brainAPI.addComment(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_COLLABORATION, 'comments', variables.knowledgeId] });
      toast.success('Comment added successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

/**
 * Hook to get comments
 */
export function useComments(knowledgeId: string | null, enabled: boolean = true) {
  return useQuery<Comment[]>({
    queryKey: [...QUERY_KEY_COLLABORATION, 'comments', knowledgeId],
    queryFn: () => {
      if (!knowledgeId) throw new Error('Knowledge ID is required');
      return brainAPI.getComments(knowledgeId);
    },
    enabled: enabled && !!knowledgeId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create team workspace
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation<TeamWorkspace, Error, CreateTeamRequest>({
    mutationFn: (request) => brainAPI.createTeam(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_COLLABORATION, 'teams'] });
      toast.success('Team workspace created successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to create team: ${error.message}`);
    },
  });
}

/**
 * Hook to get teams
 */
export function useTeamWorkspaces(enabled: boolean = true) {
  return useQuery<TeamWorkspace[]>({
    queryKey: [...QUERY_KEY_COLLABORATION, 'teams'],
    queryFn: () => brainAPI.getTeams(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to add team member
 */
export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { teamId: string; request: AddTeamMemberRequest }>({
    mutationFn: ({ teamId, request }) => brainAPI.addTeamMember(teamId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_COLLABORATION, 'teams'] });
      toast.success('Team member added successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to add team member: ${error.message}`);
    },
  });
}

