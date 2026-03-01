/**
 * Brain API - Phase 6B: Learning, Analytics, Suggestions, Collaboration & Integrations
 * Sections 16-20
 */

import type { ApiResponse } from '@/brain/types/brain.types';
import type {
  FeedbackInput,
  LearningMetric,
  RoutingWeight,
  KnowledgeQualityScore,
  ImprovementSuggestion,
} from '@/brain/types/learning.types';
import type {
  AnalyticsEventType,
  UserBehaviorAnalytics,
  SystemPerformanceMetrics,
  DomainUsageStatistics,
  QueryPattern,
  DailyUserActivity,
} from '@/brain/types/analytics.types';
import type {
  RelatedKnowledge,
  TaskSuggestion,
  UsagePattern,
  Reminder,
  UserNeedPrediction,
  AnticipatedQuery,
  KnowledgeGap,
  DomainGrowthForecast,
} from '@/brain/types/suggestions.types';
import type {
  ShareKnowledgeRequest,
  KnowledgeShare,
  AddCommentRequest,
  Comment,
  CreateTeamRequest,
  TeamWorkspace,
  AddTeamMemberRequest,
} from '@/brain/types/collaboration.types';
import type {
  Integration,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  ExportResult,
} from '@/brain/types/integrations.types';
import { type Constructor, BrainAPIBase, getUserId } from './brain-api-base';

export function withPhase6Methods<T extends Constructor<BrainAPIBase>>(Base: T) {
  return class Phase6Methods extends Base {
    // ============================================
    // Phase 6B - Learning System
    // ============================================

    async submitFeedback(input: FeedbackInput): Promise<void> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/learning/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(input),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to submit feedback' }))).error
        );
    }

    async getLearningMetrics(
      metricType?: string,
      limit: number = 50
    ): Promise<LearningMetric[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const url = new URL(`${this.baseUrl}/brain/learning/metrics`);
      if (metricType) url.searchParams.set('metricType', metricType);
      if (limit) url.searchParams.set('limit', String(limit));
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get learning metrics' }))).error
        );
      const data: ApiResponse<LearningMetric[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get learning metrics');
      return data.data;
    }

    async getRoutingAccuracy(
      timeRangeHours: number = 24
    ): Promise<{ accuracy: number; timeRangeHours: number }> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(
        `${this.baseUrl}/brain/learning/routing-accuracy?timeRangeHours=${timeRangeHours}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get routing accuracy' }))).error
        );
      const data: ApiResponse<{ accuracy: number; timeRangeHours: number }> =
        await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get routing accuracy');
      return data.data;
    }

    async getRoutingWeights(): Promise<RoutingWeight[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/learning/routing-weights`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get routing weights' }))).error
        );
      const data: ApiResponse<RoutingWeight[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get routing weights');
      return data.data;
    }

    async scoreKnowledgeItem(knowledgeId: string): Promise<KnowledgeQualityScore> {
      const response = await fetch(
        `${this.baseUrl}/brain/learning/knowledge/${knowledgeId}/score`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to score knowledge item' }))).error
        );
      const data: ApiResponse<KnowledgeQualityScore> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to score knowledge item');
      return data.data;
    }

    async getImprovementSuggestions(
      knowledgeId: string
    ): Promise<ImprovementSuggestion[]> {
      const response = await fetch(
        `${this.baseUrl}/brain/learning/knowledge/${knowledgeId}/improvements`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get improvement suggestions' })))
            .error
        );
      const data: ApiResponse<ImprovementSuggestion[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get improvement suggestions');
      return data.data;
    }

    // ============================================
    // Phase 6B - Analytics
    // ============================================

    async trackEvent(
      eventType: AnalyticsEventType,
      eventData?: Record<string, any>,
      metadata?: Record<string, any>
    ): Promise<void> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ eventType, eventData, metadata }),
      });
      if (!response.ok) {
        // Silently fail - analytics should not break the main flow
        console.error('Failed to track event');
      }
    }

    async getUserBehaviorAnalytics(
      hours: number = 24
    ): Promise<UserBehaviorAnalytics[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(
        `${this.baseUrl}/brain/analytics/user-behavior?hours=${hours}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get user behavior' }))).error
        );
      const data: ApiResponse<UserBehaviorAnalytics[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get user behavior');
      return data.data;
    }

    async getSystemPerformanceMetrics(
      hours: number = 24
    ): Promise<SystemPerformanceMetrics> {
      const response = await fetch(
        `${this.baseUrl}/brain/analytics/system-performance?hours=${hours}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get system metrics' }))).error
        );
      const data: ApiResponse<SystemPerformanceMetrics> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get system metrics');
      return data.data;
    }

    async getDomainUsageStatistics(
      domainId: string,
      days: number = 7
    ): Promise<DomainUsageStatistics[]> {
      const response = await fetch(
        `${this.baseUrl}/brain/analytics/domain-usage/${domainId}?days=${days}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get domain usage' }))).error
        );
      const data: ApiResponse<DomainUsageStatistics[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get domain usage');
      return data.data;
    }

    async getQueryPatterns(days: number = 7): Promise<QueryPattern[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(
        `${this.baseUrl}/brain/analytics/query-patterns?days=${days}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get query patterns' }))).error
        );
      const data: ApiResponse<QueryPattern[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get query patterns');
      return data.data;
    }

    async getDailyUserActivity(days: number = 7): Promise<DailyUserActivity[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(
        `${this.baseUrl}/brain/analytics/daily-activity?days=${days}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get daily activity' }))).error
        );
      const data: ApiResponse<DailyUserActivity[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get daily activity');
      return data.data;
    }

    // ============================================
    // Phase 6B - Suggestions & Predictions
    // ============================================

    async getRelatedKnowledge(knowledgeId: string): Promise<RelatedKnowledge[]> {
      const response = await fetch(
        `${this.baseUrl}/brain/suggestions/related/${knowledgeId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get related knowledge' }))).error
        );
      const data: ApiResponse<RelatedKnowledge[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get related knowledge');
      return data.data;
    }

    async getTaskSuggestions(
      context?: Record<string, any>
    ): Promise<TaskSuggestion[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const url = new URL(`${this.baseUrl}/brain/suggestions/tasks`);
      if (context) url.searchParams.set('context', JSON.stringify(context));
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get task suggestions' }))).error
        );
      const data: ApiResponse<TaskSuggestion[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get task suggestions');
      return data.data;
    }

    async getPatterns(): Promise<UsagePattern[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/suggestions/patterns`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get patterns' }))).error
        );
      const data: ApiResponse<UsagePattern[]> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to get patterns');
      return data.data;
    }

    async getReminders(): Promise<Reminder[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/suggestions/reminders`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get reminders' }))).error
        );
      const data: ApiResponse<Reminder[]> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to get reminders');
      return data.data;
    }

    async getUserNeedPredictions(): Promise<UserNeedPrediction[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/suggestions/user-needs`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get predictions' }))).error
        );
      const data: ApiResponse<UserNeedPrediction[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get predictions');
      return data.data;
    }

    async getAnticipatedQueries(): Promise<AnticipatedQuery[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/suggestions/queries`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get anticipated queries' })))
            .error
        );
      const data: ApiResponse<AnticipatedQuery[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get anticipated queries');
      return data.data;
    }

    async getKnowledgeGaps(domainId: string): Promise<KnowledgeGap[]> {
      const response = await fetch(
        `${this.baseUrl}/brain/suggestions/knowledge-gaps/${domainId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get knowledge gaps' }))).error
        );
      const data: ApiResponse<KnowledgeGap[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get knowledge gaps');
      return data.data;
    }

    async getDomainGrowthForecast(
      domainId: string
    ): Promise<DomainGrowthForecast> {
      const response = await fetch(
        `${this.baseUrl}/brain/suggestions/domain-growth/${domainId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok)
        throw new Error(
          (
            await response
              .json()
              .catch(() => ({ error: 'Failed to get domain growth forecast' }))
          ).error
        );
      const data: ApiResponse<DomainGrowthForecast> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get domain growth forecast');
      return data.data;
    }

    // ============================================
    // Phase 6B - Collaboration
    // ============================================

    async shareKnowledge(request: ShareKnowledgeRequest): Promise<KnowledgeShare> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/collaboration/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(request),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to share knowledge' }))).error
        );
      const data: ApiResponse<KnowledgeShare> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to share knowledge');
      return data.data;
    }

    async getSharedKnowledge(): Promise<KnowledgeShare[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/collaboration/shared`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get shared knowledge' }))).error
        );
      const data: ApiResponse<KnowledgeShare[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get shared knowledge');
      return data.data;
    }

    async addComment(request: AddCommentRequest): Promise<Comment> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/collaboration/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(request),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to add comment' }))).error
        );
      const data: ApiResponse<Comment> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to add comment');
      return data.data;
    }

    async getComments(knowledgeId: string): Promise<Comment[]> {
      const response = await fetch(
        `${this.baseUrl}/brain/collaboration/comments/${knowledgeId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get comments' }))).error
        );
      const data: ApiResponse<Comment[]> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to get comments');
      return data.data;
    }

    async createTeam(request: CreateTeamRequest): Promise<TeamWorkspace> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/collaboration/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(request),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to create team' }))).error
        );
      const data: ApiResponse<TeamWorkspace> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to create team');
      return data.data;
    }

    async getTeams(): Promise<TeamWorkspace[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/collaboration/teams`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get teams' }))).error
        );
      const data: ApiResponse<TeamWorkspace[]> = await response.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to get teams');
      return data.data;
    }

    async addTeamMember(
      teamId: string,
      request: AddTeamMemberRequest
    ): Promise<any> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(
        `${this.baseUrl}/brain/collaboration/teams/${teamId}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify(request),
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to add team member' }))).error
        );
      const data: ApiResponse<any> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to add team member');
      return data.data;
    }

    // ============================================
    // Phase 6B - Integrations
    // ============================================

    async getIntegrations(): Promise<Integration[]> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/integrations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to get integrations' }))).error
        );
      const data: ApiResponse<Integration[]> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to get integrations');
      return data.data;
    }

    async createIntegration(
      request: CreateIntegrationRequest
    ): Promise<Integration> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(request),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to create integration' }))).error
        );
      const data: ApiResponse<Integration> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to create integration');
      return data.data;
    }

    async updateIntegration(
      id: string,
      request: UpdateIntegrationRequest
    ): Promise<Integration> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/integrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(request),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to update integration' }))).error
        );
      const data: ApiResponse<Integration> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to update integration');
      return data.data;
    }

    async deleteIntegration(id: string): Promise<void> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/integrations/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to delete integration' }))).error
        );
    }

    async testSlackIntegration(): Promise<{ success: boolean }> {
      const userId = getUserId();
      if (!userId) throw new Error('User ID is required. Please authenticate.');
      const response = await fetch(`${this.baseUrl}/brain/integrations/slack/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to test Slack integration' })))
            .error
        );
      const data: ApiResponse<{ success: boolean }> = await response.json();
      if (!data.success || !data.data)
        throw new Error(data.error || 'Failed to test Slack integration');
      return data.data;
    }

    async exportKnowledge(
      knowledgeId: string,
      format: 'markdown' | 'pdf'
    ): Promise<ExportResult> {
      const response = await fetch(
        `${this.baseUrl}/brain/integrations/export/${knowledgeId}/${format}`,
        {
          method: 'GET',
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => ({ error: 'Failed to export knowledge' }))).error
        );
      const content = await response.text();
      const filename =
        response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
        `knowledge.${format}`;
      return { content, filename, format };
    }
  };
}
