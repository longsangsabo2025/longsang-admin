/**
 * Quiz Management Service
 * Handle quiz creation, questions, attempts, and grading
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface Quiz {
  id: string;
  course_id: string;
  section_id?: string;
  title: string;
  description?: string;
  quiz_type: 'practice' | 'graded' | 'exam';
  time_limit_minutes?: number;
  passing_score: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  show_correct_answers: boolean;
  allow_review: boolean;
  max_attempts: number;
  shuffle_questions: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  points: number;
  order_index: number;
  explanation?: string;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  enrollment_id?: string;
  answers: Record<string, any>;
  score?: number;
  percentage?: number;
  passed?: boolean;
  time_spent_seconds?: number;
  started_at: string;
  completed_at?: string;
}

export class QuizService {
  /**
   * Create a new quiz
   */
  static async createQuiz(data: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: quiz, error } = await supabase
        .from('course_quizzes')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      logger.info('Quiz created', { quizId: quiz.id });
      return quiz as Quiz;
    } catch (error) {
      logger.error('Failed to create quiz', error);
      throw error;
    }
  }

  /**
   * Get quiz with all questions and options
   */
  static async getQuizWithQuestions(quizId: string) {
    try {
      const { data: quiz, error: quizError } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(
          `
          *,
          options:quiz_question_options(*)
        `
        )
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      return {
        ...quiz,
        questions: questions || [],
      } as Quiz & { questions: (QuizQuestion & { options: QuizOption[] })[] };
    } catch (error) {
      logger.error('Failed to fetch quiz', error);
      throw error;
    }
  }

  /**
   * Add question to quiz
   */
  static async addQuestion(
    quizId: string,
    question: Omit<QuizQuestion, 'id' | 'quiz_id'>,
    options?: Omit<QuizOption, 'id' | 'question_id'>[]
  ) {
    try {
      const { data: newQuestion, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          ...question,
          quiz_id: quizId,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      if (options && options.length > 0) {
        const optionsWithQuestionId = options.map((opt) => ({
          ...opt,
          question_id: newQuestion.id,
        }));

        const { error: optionsError } = await supabase
          .from('quiz_question_options')
          .insert(optionsWithQuestionId);

        if (optionsError) throw optionsError;
      }

      logger.info('Question added to quiz', { quizId, questionId: newQuestion.id });
      return newQuestion as QuizQuestion;
    } catch (error) {
      logger.error('Failed to add question', error);
      throw error;
    }
  }

  /**
   * Start a quiz attempt
   */
  static async startQuizAttempt(quizId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      // Get enrollment
      const { data: quiz } = await supabase
        .from('course_quizzes')
        .select('course_id')
        .eq('id', quizId)
        .single();

      if (!quiz) throw new Error('Quiz not found');

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('course_id', quiz.course_id)
        .single();

      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.user.id,
          enrollment_id: enrollment?.id,
          answers: {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Quiz attempt started', { quizId, userId: user.user.id });
      return attempt as QuizAttempt;
    } catch (error) {
      logger.error('Failed to start quiz attempt', error);
      throw error;
    }
  }

  /**
   * Save quiz answers
   */
  static async saveAnswers(attemptId: string, answers: Record<string, any>) {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .update({ answers })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Quiz answers saved', { attemptId });
      return data as QuizAttempt;
    } catch (error) {
      logger.error('Failed to save answers', error);
      throw error;
    }
  }

  /**
   * Submit and grade quiz
   */
  static async submitQuiz(attemptId: string, timeSpentSeconds: number) {
    try {
      // Get the attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Get quiz with questions
      const quizData = await this.getQuizWithQuestions(attempt.quiz_id);

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      for (const question of quizData.questions) {
        totalPoints += question.points;

        if (
          question.question_type === 'multiple_choice' ||
          question.question_type === 'true_false'
        ) {
          const userAnswer = attempt.answers[question.id];
          const correctOption = question.options?.find((opt) => opt.is_correct);

          if (userAnswer === correctOption?.id) {
            earnedPoints += question.points;
          }
        }
      }

      const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = percentage >= quizData.passing_score;

      // Update attempt
      const { data: updatedAttempt, error: updateError } = await supabase
        .from('quiz_attempts')
        .update({
          score: earnedPoints,
          percentage: Math.round(percentage * 100) / 100,
          passed,
          time_spent_seconds: timeSpentSeconds,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (updateError) throw updateError;

      logger.info('Quiz submitted and graded', {
        attemptId,
        score: earnedPoints,
        percentage,
        passed,
      });

      return updatedAttempt as QuizAttempt;
    } catch (error) {
      logger.error('Failed to submit quiz', error);
      throw error;
    }
  }

  /**
   * Get user's quiz attempts
   */
  static async getUserQuizAttempts(quizId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as QuizAttempt[];
    } catch (error) {
      logger.error('Failed to fetch quiz attempts', error);
      throw error;
    }
  }

  /**
   * Get quiz statistics
   */
  static async getQuizStats(quizId: string) {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('score, percentage, passed, time_spent_seconds')
        .eq('quiz_id', quizId)
        .not('completed_at', 'is', null);

      if (error) throw error;

      const attempts = data || [];
      const scores = attempts.map((a) => a.percentage || 0);
      const passedCount = attempts.filter((a) => a.passed).length;

      const average = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;
      const avgTimeMinutes =
        attempts.length > 0
          ? attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) / attempts.length / 60
          : 0;

      return {
        total_attempts: attempts.length,
        passed_count: passedCount,
        pass_rate: attempts.length > 0 ? (passedCount / attempts.length) * 100 : 0,
        average_score: Math.round(average * 100) / 100,
        highest_score: highest,
        lowest_score: lowest,
        average_time_minutes: Math.round(avgTimeMinutes * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get quiz stats', error);
      throw error;
    }
  }

  /**
   * Get course quizzes
   */
  static async getCourseQuizzes(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Quiz[];
    } catch (error) {
      logger.error('Failed to fetch quizzes', error);
      throw error;
    }
  }

  /**
   * Delete quiz
   */
  static async deleteQuiz(quizId: string) {
    try {
      const { error } = await supabase.from('course_quizzes').delete().eq('id', quizId);

      if (error) throw error;

      logger.info('Quiz deleted', { quizId });
    } catch (error) {
      logger.error('Failed to delete quiz', error);
      throw error;
    }
  }
}
