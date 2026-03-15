/**
 * TypeScript Types for Master Brain Features
 */

/**
 * Master Brain Session
 */
export interface MasterBrainSession {
  id: string;
  user_id: string;
  session_name: string;
  session_type: 'conversation' | 'analysis' | 'research';
  initial_domain_ids: string[];
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  accumulated_knowledge: Record<string, any>;
  total_queries: number;
  total_tokens_used: number;
  rating: number | null;
  feedback: string | null;
  is_active: boolean;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Multi-Domain Context
 */
export interface MultiDomainContext {
  id: string;
  sessionId: string;
  contextType: 'query' | 'response' | 'insight' | 'summary' | 'note';
  domainId: string;
  domainName?: string;
  contextText: string;
  relevanceScore: number;
  importanceScore: number;
  relatedContextIds: string[];
  createdAt: string;
}

/**
 * Orchestration Context
 */
export interface OrchestrationContext {
  domainId: string;
  domainName: string;
  domainDescription?: string;
  knowledge: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
  }>;
  coreLogic?: {
    id: string;
    version: number;
    firstPrinciples: any[];
    mentalModels: any[];
    decisionRules: any[];
    antiPatterns: any[];
  } | null;
}

/**
 * Orchestration State
 */
export interface OrchestrationState {
  id: string;
  sessionId: string;
  currentStep: 'initialized' | 'gathering' | 'analyzing' | 'synthesizing' | 'responding';
  stepProgress: number;
  gatheredContext: Record<string, any>;
  analysisResults: Record<string, any>;
  synthesisData: Record<string, any>;
  domainStatus: Record<string, any>;
  errors: any[];
  warnings: any[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Master Brain Query Request
 */
export interface MasterBrainQueryRequest {
  query: string;
  sessionId?: string;
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    routing?: {
      maxDomains?: number;
      minScore?: number;
    };
  };
}

/**
 * Master Brain Query Response
 */
export interface MasterBrainQueryResponse {
  query: string;
  response: string;
  domains: Array<{
    domainId: string;
    domainName: string;
    relevanceScore: number;
    rank: number;
  }>;
  context: Array<{
    domainId: string;
    domainName: string;
    knowledgeCount: number;
    coreLogicCount: number;
  }>;
  confidence: number;
  latency: number;
  tokensUsed: number;
  routingId?: string;
}

/**
 * Session State
 */
export interface SessionState {
  session: MasterBrainSession;
  context: MultiDomainContext[];
  orchestrationState: OrchestrationState | null;
}
