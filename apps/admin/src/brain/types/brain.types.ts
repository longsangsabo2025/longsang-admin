/**
 * TypeScript Types for AI Second Brain Module
 */

/**
 * Domain - Represents a knowledge category/area
 */
export interface Domain {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color (e.g., '#3B82F6')
  icon?: string; // Icon name/identifier
  createdAt: string;
  updatedAt: string;
}

/**
 * Knowledge - Represents a knowledge chunk with embedding
 */
export interface Knowledge {
  id: string;
  domainId: string;
  title: string;
  content: string;
  contentType: 'document' | 'note' | 'conversation' | 'external' | 'code';
  sourceUrl?: string;
  sourceFile?: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Knowledge Search Result - Includes similarity score
 */
export interface KnowledgeSearchResult extends Knowledge {
  similarity: number; // 0-1, higher = more similar
}

/**
 * Input for ingesting knowledge
 */
export interface IngestKnowledgeInput {
  domainId: string;
  title: string;
  content: string;
  contentType?: Knowledge['contentType'];
  tags?: string[];
  sourceUrl?: string;
  sourceFile?: string;
  metadata?: Record<string, any>;
}

/**
 * Input for creating a domain
 */
export interface CreateDomainInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Input for updating a domain
 */
export interface UpdateDomainInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Search options for knowledge search
 */
export interface KnowledgeSearchOptions {
  domainId?: string;
  domainIds?: string[];
  matchThreshold?: number; // 0-1, default 0.7
  matchCount?: number; // default 10
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

/**
 * Knowledge Search API Response
 */
export interface KnowledgeSearchResponse {
  success: boolean;
  data: KnowledgeSearchResult[];
  count: number;
  query: string;
  options: KnowledgeSearchOptions;
}

/**
 * Domain List API Response
 */
export interface DomainListResponse {
  success: boolean;
  data: Domain[];
  count: number;
}
