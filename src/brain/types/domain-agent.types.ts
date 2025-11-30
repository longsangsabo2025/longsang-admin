/**
 * TypeScript Types for Domain Agent Features
 */

/**
 * Domain Agent Configuration
 */
export interface DomainAgentConfig {
  enabled: boolean;
  system_prompt?: string | null;
  temperature?: number;
  max_tokens?: number;
  model?: string;
  auto_tagging?: {
    enabled: boolean;
    rules?: Array<{
      pattern: string;
      tags: string[];
    }>;
  };
  suggestions?: {
    enabled: boolean;
    max_suggestions?: number;
  };
}

/**
 * Domain Query Request
 */
export interface DomainQueryRequest {
  question: string;
  domainId: string;
}

/**
 * Domain Query Response
 */
export interface DomainQueryResponse {
  response: string;
  domainId: string;
  domainName: string;
  relevantKnowledge: Array<{
    id: string;
    title: string;
    similarity: number;
  }>;
  tokensUsed: number;
}

/**
 * Domain Statistics
 */
export interface DomainStats {
  totalKnowledge: number;
  thisWeek: number;
  thisMonth: number;
  lastActivity: string | null;
  lastKnowledgeAdded: string | null;
  lastQuery: string | null;
  totalQueries: number;
  avgSimilarity: number;
  avgContentLength: number;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
  uniqueTags: number;
  computedAt: string;
}

/**
 * Domain Analytics
 */
export interface DomainAnalytics {
  domainId: string;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  knowledgeGrowth: Array<{
    date: string;
    count: number;
  }>;
  queryTrends: Array<{
    date: string;
    count: number;
  }>;
  tagDistribution: Array<{
    tag: string;
    count: number;
  }>;
  summary: {
    totalKnowledge: number;
    totalQueries: number;
    avgQueriesPerDay: number;
    mostActiveDay: {
      date: string;
      count: number;
    } | null;
  };
}

/**
 * Domain Trends
 */
export interface DomainTrends {
  domainId: string;
  growth: {
    rate: number;
    direction: "up" | "down" | "stable";
    current: number;
    previous: number;
  };
  activity: {
    level: "very_active" | "active" | "moderate" | "low" | "none";
    trend: string;
  };
  insights: string[];
}

/**
 * Domain Summary
 */
export interface DomainSummary {
  domainId: string;
  domainName: string;
  summary: {
    overview: string;
    keyThemes: string[];
    recentActivity: string;
    insights: string[];
  };
  statistics: DomainStats | Record<string, never>;
  generatedAt: string;
}

/**
 * Domain Suggestion
 */
export interface DomainSuggestion {
  id: string;
  title: string;
  preview: string;
  tags: string[];
  reason: string;
}

/**
 * Bulk Operation Result
 */
export interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors?: Array<{
    index?: number;
    id?: string;
    title?: string;
    error: string;
  }>;
}

/**
 * Bulk Ingest Input
 */
export interface BulkIngestInput {
  knowledge: Array<{
    domainId: string;
    title: string;
    content: string;
    contentType?: "document" | "note" | "conversation" | "external" | "code";
    tags?: string[];
    metadata?: Record<string, any>;
  }>;
}

/**
 * Bulk Update Input
 */
export interface BulkUpdateInput {
  updates: Array<{
    id: string;
    title?: string;
    content?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }>;
}

/**
 * Domain Export Data
 */
export interface DomainExportData {
  domain: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    agent_config?: DomainAgentConfig;
    created_at: string;
    updated_at: string;
  };
  knowledge: Array<{
    id: string;
    title: string;
    content: string;
    content_type: string;
    tags: string[];
    metadata: Record<string, any>;
    source_url?: string;
    source_file?: string;
    created_at: string;
    updated_at: string;
  }>;
  statistics: DomainStats | null;
  exported_at: string;
  version: string;
}

