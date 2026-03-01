/**
 * Quiz Management Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuizService } from '@/lib/academy/quizzes.service';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/utils/logger';

export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => QuizService.getQuizWithQuestions(quizId),
    enabled: !!quizId,
  });
}

export function useCourseQuizzes(courseId: string) {
  return useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => QuizService.getCourseQuizzes(courseId),
    enabled: !!courseId,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: QuizService.createQuiz,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', data.course_id] });
      toast({
        title: 'Success',
        description: 'Quiz created successfully',
      });
    },
    onError: (error) => {
      logger.error('Failed to create quiz', error);
      toast({
        title: 'Error',
        description: 'Failed to create quiz',
        variant: 'destructive',
      });
    },
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: QuizService.startQuizAttempt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
    onError: (error) => {
      logger.error('Failed to start quiz', error);
      toast({
        title: 'Error',
        description: 'Failed to start quiz',
        variant: 'destructive',
      });
    },
  });
}

export function useSaveQuizAnswers() {
  return useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: string; answers: Record<string, any> }) =>
      QuizService.saveAnswers(attemptId, answers),
    onError: (error) => {
      logger.error('Failed to save answers', error);
    },
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      attemptId,
      timeSpentSeconds,
    }: {
      attemptId: string;
      timeSpentSeconds: number;
    }) => QuizService.submitQuiz(attemptId, timeSpentSeconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      toast({
        title: 'Success',
        description: 'Quiz submitted successfully',
      });
    },
    onError: (error) => {
      logger.error('Failed to submit quiz', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz',
        variant: 'destructive',
      });
    },
  });
}

export function useUserQuizAttempts(quizId: string, userId: string) {
  return useQuery({
    queryKey: ['quiz-attempts', quizId, userId],
    queryFn: () => QuizService.getUserQuizAttempts(quizId, userId),
    enabled: !!quizId && !!userId,
  });
}

export function useQuizStats(quizId: string) {
  return useQuery({
    queryKey: ['quiz-stats', quizId],
    queryFn: () => QuizService.getQuizStats(quizId),
    enabled: !!quizId,
  });
}
