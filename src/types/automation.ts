// ================================================
// AUTOMATION SYSTEM TYPES
// ================================================

export type AgentStatus = 'active' | 'paused' | 'error';
export type AgentType = 'content_writer' | 'lead_nurture' | 'social_media' | 'analytics';
export type AgentCategory = 'website' | 'ecommerce' | 'crm' | 'marketing' | 'operations' | 'other';
export type TriggerType = 'database' | 'schedule' | 'webhook' | 'manual';
export type WorkflowStatus = 'active' | 'paused' | 'completed' | 'error';
export type LogStatus = 'success' | 'error' | 'warning' | 'info';
export type ContentStatus = 'pending' | 'processing' | 'published' | 'failed' | 'scheduled';
export type ContentType = 'blog_post' | 'email' | 'social_post' | 'report';

// ================================================
// AI Agent
// ================================================
export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  category?: AgentCategory;
  status: AgentStatus;
  description?: string;
  config: AgentConfig;
  last_run?: string;
  last_error?: string;
  total_runs: number;
  successful_runs: number;
  created_at: string;
  updated_at: string;
}

export interface AgentConfig {
  ai_model?: string;
  auto_publish?: boolean;
  require_approval?: boolean;
  tone?: string;
  max_length?: number;
  generate_seo?: boolean;
  prompt_template?: string;
  follow_up_delay_hours?: number;
  max_follow_ups?: number;
  email_provider?: string;
  personalization_level?: string;
  platforms?: string[];
  post_variants?: number;
  include_hashtags?: boolean;
  auto_schedule?: boolean;
  optimal_timing?: boolean;
  report_frequency?: string;
  metrics_to_track?: string[];
  alert_thresholds?: Record<string, number>;
  [key: string]: any;
}

// ================================================
// Automation Trigger
// ================================================
export interface AutomationTrigger {
  id: string;
  agent_id: string;
  trigger_type: TriggerType;
  trigger_config: TriggerConfig;
  enabled: boolean;
  last_triggered?: string;
  created_at: string;
  updated_at: string;
}

export interface TriggerConfig {
  table?: string;
  event?: string;
  conditions?: Record<string, any>;
  cron?: string;
  timezone?: string;
  description?: string;
  webhook_url?: string;
  [key: string]: any;
}

// ================================================
// Workflow
// ================================================
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  agent_id: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  last_execution?: string;
  total_executions: number;
  successful_executions: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  step: number;
  name: string;
  action: string;
  description?: string;
  config?: Record<string, any>;
}

// ================================================
// Activity Log
// ================================================
export interface ActivityLog {
  id: string;
  agent_id?: string;
  workflow_id?: string;
  action: string;
  details: Record<string, any>;
  status: LogStatus;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
}

// ================================================
// Content Queue
// ================================================
export interface ContentQueue {
  id: string;
  agent_id?: string;
  content_type: ContentType;
  title?: string;
  content: ContentData;
  metadata: Record<string, any>;
  status: ContentStatus;
  priority: number;
  scheduled_for?: string;
  published_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentData {
  topic?: string;
  outline?: string[];
  body?: string;
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string[];
  tags?: string[];
  images?: string[];
  estimated_length?: number;
  
  // Advanced SEO Fields
  canonical_url?: string;
  og_image?: string;
  twitter_image?: string;
  schema_type?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'Event' | 'Product';
  featured_snippet_target?: boolean;
  
  // Content Clustering
  topic_cluster?: string;
  pillar_page_id?: string;
  related_content_ids?: string[];
  
  // SEO Performance
  target_keywords?: string[];
  search_intent?: 'informational' | 'navigational' | 'commercial' | 'transactional';
  content_score?: number;
  readability_score?: number;
  
  // Technical SEO
  structured_data?: Record<string, any>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  
  [key: string]: any;
}

// ================================================
// Dashboard Stats
// ================================================
export interface DashboardStats {
  activeAgents: number;
  actionsToday: number;
  successRate: number;
  queueSize: number;
}

// ================================================
// Agent Performance
// ================================================
export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  avg_duration_ms: number;
  last_run?: string;
}

// ================================================
// Real-time Event
// ================================================
export interface RealtimeEvent {
  type: 'agent_status_change' | 'new_activity' | 'content_published' | 'error';
  data: any;
  timestamp: string;
}
