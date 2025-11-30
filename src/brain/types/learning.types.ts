/**
 * TypeScript Types for Learning System
 */

export type FeedbackType = 'thumbs_up' | 'thumbs_down' | 'rating';

export interface UserFeedback {
  id: string;
  user_id: string;
  query_id?: string | null;
  feedback_type: FeedbackType;
  rating?: number | null;
  comment?: string | null;
  context: Record<string, any>;
  created_at: string;
}

export interface FeedbackInput {
  queryId?: string;
  feedbackType: FeedbackType;
  rating?: number;
  comment?: string;
  context?: Record<string, any>;
}

export interface LearningMetric {
  id: string;
  user_id: string;
  metric_type: string;
  metric_value: number;
  context: Record<string, any>;
  created_at: string;
}

export interface RoutingWeight {
  domain_id: string;
  weight: number;
  success_count: number;
  failure_count: number;
  last_updated: string;
}

export interface KnowledgeQualityScore {
  knowledge_id: string;
  quality_score: number;
  score_components: {
    recency: number;
    usage: number;
    feedback: number;
  };
  last_calculated_at: string;
}

export interface ImprovementSuggestion {
  type: 'recency' | 'usage' | 'feedback';
  message: string;
}
