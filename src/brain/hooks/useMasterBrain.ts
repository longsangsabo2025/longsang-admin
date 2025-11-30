/**
 * useMasterBrain Hook
 * Manages Master Brain orchestrator operations
 */

import { brainAPI } from "@/brain/lib/services/brain-api";
import type {
  MasterBrainQueryRequest,
  MasterBrainQueryResponse,
  MasterBrainSession,
  SessionState,
} from "@/brain/types/master-brain.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to query Master Brain
 */
export function useMasterBrainQuery() {
  return useMutation<
    MasterBrainQueryResponse,
    Error,
    { query: string; sessionId?: string; options?: MasterBrainQueryRequest["options"] }
  >({
    mutationFn: ({ query, sessionId, options }) => brainAPI.masterBrainQuery(query, sessionId, options),
    onError: (error) => {
      toast.error(`Master Brain query failed: ${error.message}`);
    },
  });
}

/**
 * Hook to create Master Brain session
 */
export function useCreateMasterSession() {
  const queryClient = useQueryClient();

  return useMutation<
    string,
    Error,
    { sessionName: string; domainIds: string[]; options?: any }
  >({
    mutationFn: ({ sessionName, domainIds, options }) =>
      brainAPI.createMasterSession(sessionName, domainIds, options),
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "master-sessions"] });
      toast.success("Master Brain session created");
    },
    onError: (error) => {
      toast.error(`Failed to create session: ${error.message}`);
    },
  });
}

/**
 * Hook to get Master Brain session state
 */
export function useMasterBrainSession(sessionId: string | null) {
  return useQuery<SessionState>({
    queryKey: ["brain", "master-session", sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error("Session ID is required");
      return brainAPI.getMasterSessionState(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to get all active sessions
 */
export function useMasterBrainSessions() {
  return useQuery<MasterBrainSession[]>({
    queryKey: ["brain", "master-sessions"],
    queryFn: () => brainAPI.getMasterBrainSessions(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to end Master Brain session
 */
export function useEndMasterSession() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { sessionId: string; rating?: number; feedback?: string }
  >({
    mutationFn: ({ sessionId, rating, feedback }) => brainAPI.endMasterSession(sessionId, rating, feedback),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "master-session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["brain", "master-sessions"] });
      toast.success("Session ended");
    },
    onError: (error) => {
      toast.error(`Failed to end session: ${error.message}`);
    },
  });
}

