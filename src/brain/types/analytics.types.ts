/**
 * TypeScript Types for Analytics
 */

export type AnalyticsEventType =
  | 'query'
  | 'knowledge_access'
  | 'workflow_trigger'
  | 'action_executed'
  | 'domain_created'
  | 'knowledge_created'
  | 'task_created'
  | 'notification_sent';

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: AnalyticsEventType;
  event_data: Record<string, any>;
  timestamp: string;
  session_id?: string | null;
  metadata: Record<string, any>;
}

export interface UserBehaviorAnalytics {
  event_type: string;
  event_count: number;
  avg_per_day: number;
}

export interface SystemPerformanceMetrics {
  avg_query_response_time?: { value: number; unit: string };
  total_queries?: { value: number; unit: string };
  unique_active_users?: { value: number; unit: string };
}

export interface DomainUsageStatistics {
  domain_id: string;
  date: string;
  event_type: string;
  event_count: number;
  unique_users: number;
}

export interface QueryPattern {
  user_id: string;
  date: string;
  query_count: number;
  avg_response_time: number;
  domains_queried: number;
}

export interface DailyUserActivity {
  user_id: string;
  date: string;
  event_type: string;
  event_count: number;
}


