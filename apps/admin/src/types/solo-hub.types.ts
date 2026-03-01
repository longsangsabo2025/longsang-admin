/**
 * Solo Founder Hub - TypeScript Types
 * Database types for Supabase tables
 */

// =====================================================
// MORNING BRIEFING
// =====================================================
export interface MorningBriefing {
  id: string;
  user_id: string;
  date: string; // ISO date string

  // Content
  summary: string | null;
  priorities: BriefingPriority[];
  key_metrics: BriefingMetrics;
  pending_emails: BriefingEmail[];
  pending_tasks: BriefingTask[];
  content_queue: BriefingContent[];
  decisions_needed: BriefingDecision[];

  // AI Generated
  ai_insights: string | null;
  motivation_quote: string | null;

  // Status
  is_read: boolean;
  read_at: string | null;

  // Metadata
  generated_by: 'n8n' | 'manual' | 'api';
  created_at: string;
  updated_at: string;
}

export interface BriefingPriority {
  id: string;
  title: string;
  description?: string;
  urgency: 'high' | 'medium' | 'low';
  estimated_time?: string;
  related_agent?: string;
}

export interface BriefingMetrics {
  revenue?: { value: number; change: number; label: string };
  visitors?: { value: number; change: number; label: string };
  conversion?: { value: number; change: number; label: string };
  tasks_completed?: { value: number; change: number; label: string };
  [key: string]: { value: number; change: number; label: string } | undefined;
}

export interface BriefingEmail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  urgency: 'high' | 'medium' | 'low';
  received_at: string;
  requires_action: boolean;
}

export interface BriefingTask {
  id: string;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  due_date?: string;
  estimated_time?: string;
  agent_suggested?: string;
}

export interface BriefingContent {
  id: string;
  title: string;
  type: 'blog' | 'social' | 'email' | 'video';
  status: 'draft' | 'review' | 'scheduled';
  platform?: string;
  scheduled_for?: string;
}

export interface BriefingDecision {
  id: string;
  title: string;
  agent: string;
  urgency: 'immediate' | 'today' | 'this_week';
  impact: 'high' | 'medium' | 'low';
}

// =====================================================
// AI AGENTS
// =====================================================
export type AgentRole = 'dev' | 'content' | 'marketing' | 'sales' | 'admin' | 'advisor';
export type AgentStatus = 'online' | 'offline' | 'busy' | 'error';

export interface AIAgent {
  id: string;
  user_id: string;

  // Info
  name: string;
  role: AgentRole;
  description: string | null;
  avatar_url: string | null;

  // Status
  status: AgentStatus;
  last_active_at: string | null;

  // Configuration
  model: string;
  temperature: number;
  system_prompt: string | null;
  capabilities: string[];

  // Metrics
  tasks_completed: number;
  tasks_pending: number;
  success_rate: number;
  avg_response_time: number;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIAgentWithTasks extends AIAgent {
  recent_tasks?: AgentTask[];
  communications?: AgentCommunication[];
}

// =====================================================
// AGENT TASKS
// =====================================================
export type TaskType = 'content' | 'dev' | 'marketing' | 'sales' | 'admin' | 'research';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface AgentTask {
  id: string;
  user_id: string;
  agent_id: string | null;

  // Info
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: TaskPriority;

  // Status
  status: TaskStatus;
  progress: number;

  // Input/Output
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;

  // Timing
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  task_type: TaskType;
  priority?: TaskPriority;
  agent_id?: string;
  input_data?: Record<string, unknown>;
  due_date?: string;
}

// =====================================================
// AGENT RESPONSES
// =====================================================
export interface AgentResponse {
  id: string;
  task_id: string;
  agent_id: string | null;

  // Response
  agent_type: string;
  response: Record<string, unknown>;
  raw_response: string | null;

  // Status
  status: 'completed' | 'partial' | 'error';

  // Metrics
  tokens_used: number | null;
  response_time_ms: number | null;
  model_used: string | null;

  // Metadata
  created_at: string;
}

// =====================================================
// DECISION QUEUE
// =====================================================
export type DecisionType = 'budget' | 'content' | 'code' | 'outreach' | 'security' | 'strategy';
export type DecisionImpact = 'high' | 'medium' | 'low';
export type DecisionUrgency = 'immediate' | 'today' | 'this_week';
export type DecisionRecommendation = 'approve' | 'reject' | 'review';
export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'deferred';

export interface Decision {
  id: string;
  user_id: string;
  agent_id: string | null;
  task_id: string | null;

  // Info
  title: string;
  description: string | null;
  decision_type: DecisionType;

  // Assessment
  impact: DecisionImpact;
  urgency: DecisionUrgency;

  // AI Recommendation
  recommendation: DecisionRecommendation;
  recommendation_reason: string | null;

  // Details
  details: DecisionDetails;
  attachments: string[];

  // User Action
  status: DecisionStatus;
  user_feedback: string | null;
  decided_at: string | null;

  // Deadline
  deadline: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface DecisionDetails {
  current?: string;
  proposed?: string;
  reason?: string;
  benefit?: string;
  risk?: string;
  cost?: number;
  timeline?: string;
}

export interface DecisionWithAgent extends Decision {
  agent?: AIAgent;
}

// =====================================================
// AGENT MEMORY
// =====================================================
export type MemoryType = 'fact' | 'preference' | 'goal' | 'constraint' | 'context' | 'learning';
export type MemoryImportance = 'critical' | 'high' | 'medium' | 'low';
export type MemorySource = 'manual' | 'auto' | 'agent' | 'imported';

export interface AgentMemory {
  id: string;
  user_id: string;

  // Info
  memory_type: MemoryType;
  category: string;
  title: string;
  content: string;

  // Organization
  tags: string[];
  importance: MemoryImportance;

  // Source
  source: MemorySource;
  source_agent_id: string | null;

  // Usage
  used_count: number;
  last_used_at: string | null;

  // Related
  linked_items: string[];

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryInput {
  memory_type: MemoryType;
  category: string;
  title: string;
  content: string;
  tags?: string[];
  importance?: MemoryImportance;
  source?: MemorySource;
  linked_items?: string[];
}

// =====================================================
// AGENT COMMUNICATIONS
// =====================================================
export type CommunicationType = 'info' | 'request' | 'response' | 'alert' | 'handoff';

export interface AgentCommunication {
  id: string;
  user_id: string;

  // Parties
  from_agent_id: string | null;
  to_agent_id: string | null;
  to_user: boolean;

  // Message
  message_type: CommunicationType;
  subject: string | null;
  content: string;

  // Related
  related_task_id: string | null;

  // Status
  is_read: boolean;
  read_at: string | null;

  // Metadata
  created_at: string;
}

export interface CommunicationWithAgents extends AgentCommunication {
  from_agent?: AIAgent;
  to_agent?: AIAgent;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// =====================================================
// VIEW TYPES
// =====================================================
export interface PendingDecisionsSummary {
  user_id: string;
  total_pending: number;
  immediate_count: number;
  today_count: number;
  high_impact_count: number;
}

export interface AgentPerformanceSummary {
  agent_id: string;
  user_id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  avg_completion_seconds: number | null;
}
