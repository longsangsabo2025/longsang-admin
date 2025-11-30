/**
 * TypeScript Types for Actions
 */

export interface Action {
  id: string;
  user_id: string;
  session_id?: string | null;
  action_type: string; // e.g., 'create_task', 'send_notification', 'add_note'
  payload: Record<string, any>; // Data specific to the action type
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  result?: Record<string, any> | null;
  error_log?: string | null;
  executed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionInput {
  actionType: string;
  payload?: Record<string, any>;
  sessionId?: string;
}
