/**
 * 🎯 AI Command Center - Type Definitions
 * 
 * Theo tài liệu: docs/ai-command-center/08-DATA-MODELS.md
 * 
 * @author LongSang Admin
 * @version 2.0.0
 */

// ============================================================
// AGENT TYPES
// ============================================================

export type AgentStatus = 'active' | 'inactive' | 'testing' | 'error';

export type AgentType = 
  | 'work_agent' 
  | 'research_agent' 
  | 'content_creator' 
  | 'data_analyst' 
  | 'custom';

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  tools?: string[];
  contextWindow?: number;
  responseFormat?: 'text' | 'json' | 'markdown';
}

export interface AIAgent {
  id: string;
  name: string;
  description?: string;
  status: AgentStatus;
  type: AgentType;
  config: AgentConfig;
  category?: string; // From Supabase: content, marketing, automation, etc.
  
  // Workflow integration
  n8nWorkflowId?: string;
  webhookUrl?: string;
  
  // Metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalCostUsd: number;
  
  // Timestamps
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Create/Update DTOs
export interface CreateAgentDTO {
  name: string;
  description?: string;
  type?: AgentType;
  config?: Partial<AgentConfig>;
  category?: string;
}

export interface UpdateAgentDTO extends Partial<CreateAgentDTO> {
  status?: AgentStatus;
}

// ============================================================
// WORKFLOW TYPES
// ============================================================

export type WorkflowStatus = 'active' | 'inactive' | 'paused' | 'error';

export type TriggerType = 'manual' | 'scheduled' | 'webhook' | 'event' | 'api';

export type StepType = 
  | 'agent_call' 
  | 'tool_call' 
  | 'condition' 
  | 'loop' 
  | 'parallel' 
  | 'webhook' 
  | 'delay';

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  config: Record<string, unknown>;
  isEnabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  config: Record<string, unknown>;
  order: number;
  dependsOn?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  
  // n8n Integration
  n8nWorkflowId?: string;
  n8nWorkflowName?: string;
  webhookUrl?: string;
  
  // Configuration
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  variables: Record<string, unknown>;
  scheduleCron?: string;
  
  // Metrics
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgExecutionTimeMs: number;
  totalCostUsd: number;
  
  // Relations
  agentId?: string;
  agent?: AIAgent;
  
  // Timestamps
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowDTO {
  name: string;
  description?: string;
  status?: WorkflowStatus;
  triggerType?: TriggerType;
  schedule?: string;
  agentId?: string;
  triggers?: WorkflowTrigger[];
  steps?: WorkflowStep[];
  config?: Record<string, unknown>;
}

export interface UpdateWorkflowDTO extends Partial<CreateWorkflowDTO> {
  status?: WorkflowStatus;
}

// ============================================================
// EXECUTION TYPES
// ============================================================

export type ExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface StepLog {
  stepId: string;
  stepName: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  agentId?: string;
  
  // Execution details
  status: ExecutionStatus;
  triggerType: TriggerType;
  
  // Input/Output
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
  errorStack?: string;
  
  // Performance
  executionTimeMs?: number;
  startedAt?: Date;
  completedAt?: Date;
  
  // Steps tracking
  currentStep: number;
  totalSteps: number;
  stepsLog: StepLog[];
  
  // Cost tracking
  tokensUsed: number;
  costUsd: number;
  
  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  
  // n8n reference
  n8nExecutionId?: string;
  
  // Relations (when joined)
  workflow?: Workflow;
  agent?: AIAgent;
}

// ============================================================
// TOOL TYPES
// ============================================================

export type ToolCategory = 
  | 'ai' 
  | 'utility' 
  | 'integration' 
  | 'custom' 
  | 'video' 
  | 'audio' 
  | 'image';

export type ToolStatus = 'available' | 'unavailable' | 'deprecated' | 'beta';

export type PricingModel = 'free' | 'per_call' | 'subscription' | 'usage_based';

export interface ToolConfig {
  endpoint?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  [key: string]: unknown;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

export interface AITool {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  category: ToolCategory;
  
  // Configuration
  config: ToolConfig;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
  
  // Pricing
  isFree: boolean;
  costPerUse: number;
  pricingModel: PricingModel;
  
  // Status
  status: ToolStatus;
  isFeatured: boolean;
  
  // Usage metrics
  totalCalls: number;
  successfulCalls: number;
  avgExecutionTimeMs: number;
  
  // Marketplace
  fromMarketplace: boolean;
  marketplaceId?: string;
  version: string;
  
  // Timestamps
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface TrendChange {
  value: number;
  percent: number;
  direction: 'up' | 'down' | 'stable';
}

export interface AnalyticsOverview {
  executions: {
    total: number;
    success: number;
    failed: number;
    successRate: number;
    change: TrendChange;
  };
  costs: {
    total: number;
    avgPerExecution: number;
    change: TrendChange;
  };
  performance: {
    avgTimeMs: number;
    p95TimeMs: number;
    change: TrendChange;
  };
  agents: {
    total: number;
    active: number;
  };
}

export interface ExecutionTrend {
  date: string;
  total: number;
  success: number;
  failed: number;
}

export interface CostTrend {
  date: string;
  cost: number;
  breakdown?: Record<string, number>;
}

export interface AgentUsageStats {
  agentId: string;
  name: string;
  executions: number;
  percentage: number;
  cost: number;
  color: string;
}

export interface ToolUsageStats {
  toolId: string;
  name: string;
  calls: number;
  successRate: number;
  avgTimeMs: number;
}

/**
 * Analytics Data for dashboard display
 */
export interface AnalyticsData {
  totalExecutions: number;
  successRate: number;
  totalCost: number;
  avgDuration: number;
  executionTrends?: ExecutionTrend[];
  costTrends?: CostTrend[];
  agentUsage?: AgentUsageStats[];
  toolUsage?: ToolUsageStats[];
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// DEFAULT VALUES
// ============================================================

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 4096,
  responseFormat: 'text',
};

export const DEFAULT_TOOL_CONFIG: ToolConfig = {
  timeout: 30000,
  retries: 3,
};

// ============================================================
// CHART COLORS
// ============================================================

export const CHART_COLORS = {
  primary: '#3b82f6',   // Blue
  secondary: '#8b5cf6', // Purple
  success: '#10b981',   // Green
  warning: '#f59e0b',   // Amber
  danger: '#ef4444',    // Red
  neutral: '#6b7280',   // Gray
};

export const PIE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
  '#ec4899',
];
