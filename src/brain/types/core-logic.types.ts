/**
 * TypeScript Types for Core Logic Features
 */

/**
 * First Principle
 */
export interface FirstPrinciple {
  title: string;
  description: string;
  examples?: string[];
}

/**
 * Mental Model
 */
export interface MentalModel {
  name: string;
  description: string;
  application?: string;
}

/**
 * Decision Rule
 */
export interface DecisionRule {
  condition: string;
  action: string;
  rationale?: string;
}

/**
 * Anti-pattern
 */
export interface AntiPattern {
  name: string;
  description: string;
  alternative?: string;
}

/**
 * Cross-domain Link
 */
export interface CrossDomainLink {
  domain: string;
  concept: string;
  relationship: string;
}

/**
 * Core Logic
 */
export interface CoreLogic {
  id: string;
  domainId: string;
  version: number;
  parentVersionId?: string | null;
  firstPrinciples: FirstPrinciple[];
  mentalModels: MentalModel[];
  decisionRules: DecisionRule[];
  antiPatterns: AntiPattern[];
  crossDomainLinks: CrossDomainLink[];
  changelog: Array<{
    version: number;
    type: string;
    timestamp: string;
    summary?: string;
    changes?: Record<string, any>;
  }>;
  lastDistilledAt: string;
  isActive: boolean;
  changeSummary?: string;
  changeReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Core Logic Version
 */
export interface CoreLogicVersion {
  id: string;
  domainId: string;
  version: number;
  isActive: boolean;
  changeSummary?: string;
  lastDistilledAt: string;
  createdAt: string;
}

/**
 * Core Logic Comparison
 */
export interface CoreLogicComparison {
  version1: {
    id: string;
    version: number;
    createdAt: string;
    changeSummary?: string;
  };
  version2: {
    id: string;
    version: number;
    createdAt: string;
    changeSummary?: string;
  };
  differences: {
    firstPrinciples: {
      added: FirstPrinciple[];
      removed: FirstPrinciple[];
    };
    mentalModels: {
      added: MentalModel[];
      removed: MentalModel[];
    };
    decisionRules: {
      added: DecisionRule[];
      removed: DecisionRule[];
    };
    antiPatterns: {
      added: AntiPattern[];
      removed: AntiPattern[];
    };
  };
}

/**
 * Distillation Job
 */
export interface DistillationJob {
  id: string;
  domainId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  triggeredBy: string;
  triggeredAt: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  config: Record<string, any>;
  resultCoreLogicId?: string;
  resultSummary?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Distillation Options
 */
export interface DistillationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  includeExamples?: boolean;
}

/**
 * Knowledge Pattern
 */
export interface KnowledgePattern {
  name: string;
  description: string;
  frequency: 'high' | 'medium' | 'low';
  examples?: string[];
}

/**
 * Key Concept
 */
export interface KeyConcept {
  term: string;
  definition: string;
  importance: 'high' | 'medium' | 'low';
  relatedTerms?: string[];
}

/**
 * Knowledge Relationship
 */
export interface KnowledgeRelationship {
  concept1: string;
  concept2: string;
  type: string;
  strength: 'strong' | 'medium' | 'weak';
}

/**
 * Knowledge Topic
 */
export interface KnowledgeTopic {
  name: string;
  description: string;
  knowledgeCount: number;
  keyConcepts?: string[];
}

/**
 * Knowledge Analysis Result
 */
export interface KnowledgeAnalysisResult {
  patterns: KnowledgePattern[];
  concepts: KeyConcept[];
  relationships: KnowledgeRelationship[];
  topics: KnowledgeTopic[];
  summary: string;
  knowledgeItemsAnalyzed: number;
  tokensUsed?: number;
}
