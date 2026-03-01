/**
 * TypeScript Types for Tasks
 */

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskSource = 'manual' | 'workflow' | 'master_brain_suggestion';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  related_domain_id?: string | null;
  related_session_id?: string | null;
  source: TaskSource;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  relatedDomainId?: string;
  relatedSessionId?: string;
  source?: TaskSource;
  metadata?: Record<string, any>;
}
