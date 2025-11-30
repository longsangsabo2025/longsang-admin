/**
 * TypeScript Types for Workflows
 */

export interface WorkflowActionStep {
  action_type: string;
  payload_template: Record<string, any>;
}

export type WorkflowTriggerType = 'on_query' | 'on_session_end' | 'schedule_daily' | 'manual';

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, any>;
  actions: WorkflowActionStep[];
  is_active: boolean;
  last_triggered_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInput {
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  triggerConfig?: Record<string, any>;
  actions: WorkflowActionStep[];
  isActive?: boolean;
}
