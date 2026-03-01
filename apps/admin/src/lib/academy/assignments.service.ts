/**
 * Assignment Management Service
 * Handle creation, submission, grading of assignments
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface Assignment {
  id: string;
  course_id: string;
  section_id?: string;
  title: string;
  description?: string;
  instructions?: string;
  due_date: string;
  rubric?: Record<string, any>;
  max_score: number;
  assignment_type: 'homework' | 'project' | 'quiz' | 'exam';
  allow_late_submission: boolean;
  late_penalty_percent: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  submission_content?: string;
  submission_files?: Array<{ name: string; url: string; type: string }>;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  rubric_scores?: Record<string, number>;
  status: 'submitted' | 'graded' | 'returned';
  graded_by?: string;
  graded_at?: string;
}

export class AssignmentService {
  /**
   * Create a new assignment
   */
  static async createAssignment(data: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: assignment, error } = await supabase
        .from('course_assignments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      logger.info('Assignment created', { assignmentId: assignment.id });
      return assignment as Assignment;
    } catch (error) {
      logger.error('Failed to create assignment', error);
      throw error;
    }
  }

  /**
   * Get assignments for a course
   */
  static async getCourseAssignments(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Assignment[];
    } catch (error) {
      logger.error('Failed to fetch assignments', error);
      throw error;
    }
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(assignmentId: string) {
    try {
      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      return data as Assignment;
    } catch (error) {
      logger.error('Failed to fetch assignment', error);
      throw error;
    }
  }

  /**
   * Update assignment
   */
  static async updateAssignment(assignmentId: string, updates: Partial<Assignment>) {
    try {
      const { data, error } = await supabase
        .from('course_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Assignment updated', { assignmentId });
      return data as Assignment;
    } catch (error) {
      logger.error('Failed to update assignment', error);
      throw error;
    }
  }

  /**
   * Delete assignment
   */
  static async deleteAssignment(assignmentId: string) {
    try {
      const { error } = await supabase.from('course_assignments').delete().eq('id', assignmentId);

      if (error) throw error;

      logger.info('Assignment deleted', { assignmentId });
    } catch (error) {
      logger.error('Failed to delete assignment', error);
      throw error;
    }
  }

  /**
   * Submit assignment
   */
  static async submitAssignment(
    assignmentId: string,
    content: string,
    files?: Array<{ name: string; url: string; type: string }>
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assignment_submissions')
        .upsert(
          {
            assignment_id: assignmentId,
            user_id: user.user.id,
            submission_content: content,
            submission_files: files || [],
            submitted_at: new Date().toISOString(),
            status: 'submitted',
          },
          { onConflict: 'assignment_id,user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      logger.info('Assignment submitted', { assignmentId, userId: user.user.id });
      return data as AssignmentSubmission;
    } catch (error) {
      logger.error('Failed to submit assignment', error);
      throw error;
    }
  }

  /**
   * Get user's submission for an assignment
   */
  static async getUserSubmission(assignmentId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      return data as AssignmentSubmission | null;
    } catch (error) {
      logger.error('Failed to fetch submission', error);
      throw error;
    }
  }

  /**
   * Get all submissions for an assignment
   */
  static async getAssignmentSubmissions(assignmentId: string) {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as AssignmentSubmission[];
    } catch (error) {
      logger.error('Failed to fetch submissions', error);
      throw error;
    }
  }

  /**
   * Grade a submission
   */
  static async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    rubricScores?: Record<string, number>
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          grade,
          feedback,
          rubric_scores: rubricScores || {},
          status: 'graded',
          graded_by: user.user.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Submission graded', { submissionId, grade });
      return data as AssignmentSubmission;
    } catch (error) {
      logger.error('Failed to grade submission', error);
      throw error;
    }
  }

  /**
   * Get assignment statistics
   */
  static async getAssignmentStats(assignmentId: string) {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('grade')
        .eq('assignment_id', assignmentId)
        .not('grade', 'is', null);

      if (error) throw error;

      const grades = data.map((d) => d.grade);
      const average = grades.length > 0 ? grades.reduce((a, b) => a + b) / grades.length : 0;
      const highest = grades.length > 0 ? Math.max(...grades) : 0;
      const lowest = grades.length > 0 ? Math.min(...grades) : 0;

      return {
        total_submissions: grades.length,
        average_grade: Math.round(average * 100) / 100,
        highest_grade: highest,
        lowest_grade: lowest,
      };
    } catch (error) {
      logger.error('Failed to get assignment stats', error);
      throw error;
    }
  }

  /**
   * Get upcoming assignments for a student
   */
  static async getUpcomingAssignments(courseId: string, limit = 5) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('course_id', courseId)
        .gt('due_date', now)
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Assignment[];
    } catch (error) {
      logger.error('Failed to fetch upcoming assignments', error);
      throw error;
    }
  }

  /**
   * Get overdue assignments
   */
  static async getOverdueAssignments(courseId: string) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('course_id', courseId)
        .lt('due_date', now)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data as Assignment[];
    } catch (error) {
      logger.error('Failed to fetch overdue assignments', error);
      throw error;
    }
  }
}
