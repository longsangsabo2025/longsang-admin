/**
 * TypeScript Types for Suggestions and Predictions
 */

export interface RelatedKnowledge {
  id: string;
  title: string;
  content: string;
  domain_id: string;
  tags?: string[];
}

export interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: 'master_brain_suggestion' | 'workflow' | 'manual';
}

export interface UsagePattern {
  type: 'domain_focus' | 'time_pattern' | 'query_pattern';
  message: string;
  data: Record<string, any>;
}

export interface Reminder {
  type: 'task_reminder' | 'notification_reminder' | 'knowledge_reminder';
  message: string;
  data: Record<string, any>;
}

export interface UserNeedPrediction {
  type: 'likely_query' | 'time_based' | 'domain_based';
  message: string;
  confidence: number;
  data?: Record<string, any>;
}

export interface AnticipatedQuery {
  query: string;
  domainId?: string;
  confidence: number;
}

export interface KnowledgeGap {
  type: 'tag_coverage' | 'outdated_knowledge' | 'missing_topic';
  message: string;
  tags?: string[];
  count?: number;
}

export interface DomainGrowthForecast {
  forecast: 'growth' | 'insufficient_data';
  message?: string;
  currentMonth?: number;
  previousMonth?: number;
  growthRate?: string;
  projectedNextMonth?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}
