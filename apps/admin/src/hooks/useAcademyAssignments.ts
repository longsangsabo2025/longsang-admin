/**
 * Assignment Management Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssignmentService } from '@/lib/academy/assignments.service';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/utils/logger';

export function useAssignments(courseId: string) {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => AssignmentService.getCourseAssignments(courseId),
    enabled: !!courseId,
  });
}

export function useAssignment(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => AssignmentService.getAssignmentById(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: AssignmentService.createAssignment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', data.course_id] });
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });
    },
    onError: (error) => {
      logger.error('Failed to create assignment', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive',
      });
    },
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      assignmentId,
      content,
      files,
    }: {
      assignmentId: string;
      content: string;
      files?: Array<{ name: string; url: string; type: string }>;
    }) => AssignmentService.submitAssignment(assignmentId, content, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({
        title: 'Success',
        description: 'Assignment submitted successfully',
      });
    },
    onError: (error) => {
      logger.error('Failed to submit assignment', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    },
  });
}

export function useUserSubmission(assignmentId: string, userId: string) {
  return useQuery({
    queryKey: ['submission', assignmentId, userId],
    queryFn: () => AssignmentService.getUserSubmission(assignmentId, userId),
    enabled: !!assignmentId && !!userId,
  });
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => AssignmentService.getAssignmentSubmissions(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      submissionId,
      grade,
      feedback,
      rubricScores,
    }: {
      submissionId: string;
      grade: number;
      feedback: string;
      rubricScores?: Record<string, number>;
    }) => AssignmentService.gradeSubmission(submissionId, grade, feedback, rubricScores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({
        title: 'Success',
        description: 'Submission graded successfully',
      });
    },
    onError: (error) => {
      logger.error('Failed to grade submission', error);
      toast({
        title: 'Error',
        description: 'Failed to grade submission',
        variant: 'destructive',
      });
    },
  });
}

export function useAssignmentStats(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment-stats', assignmentId],
    queryFn: () => AssignmentService.getAssignmentStats(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useUpcomingAssignments(courseId: string) {
  return useQuery({
    queryKey: ['upcoming-assignments', courseId],
    queryFn: () => AssignmentService.getUpcomingAssignments(courseId),
    enabled: !!courseId,
  });
}
