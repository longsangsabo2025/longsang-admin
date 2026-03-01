/**
 * AI SEO Auto - Frontend Client
 *
 * This module provides a frontend-safe client for AI SEO automation.
 * All API calls go through the backend to avoid exposing OpenAI API key.
 */

import type { KeywordAnalysis } from './keyword-generator';
import type { SEOPlan } from './plan-generator';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AnalysisResult {
  domain: string;
  keywords: KeywordAnalysis;
  plan: SEOPlan;
  pages: string[];
  timestamp: string;
}

export interface ExecutionResult {
  domainId: string;
  keywordsAdded: number;
  pagesQueued: number;
  autoIndexing: boolean;
  message: string;
}

/**
 * Analyze domain and generate keywords + SEO plan
 */
export async function analyzeDomain(
  domain: string,
  options?: {
    language?: 'vi' | 'en';
    country?: string;
  }
): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/api/seo/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain,
      language: options?.language || 'en',
      country: options?.country,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze domain');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Execute SEO automation for domain
 */
export async function executeSEOAutomation(
  domain: string,
  keywords: KeywordAnalysis,
  plan: SEOPlan,
  options?: {
    autoIndex?: boolean;
  }
): Promise<ExecutionResult> {
  const response = await fetch(`${API_BASE}/api/seo/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain,
      keywords,
      plan,
      autoIndex: options?.autoIndex ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to execute SEO automation');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get quick SEO wins
 */
export async function getQuickWins(domain: string) {
  const response = await fetch(`${API_BASE}/api/seo/quick-wins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get quick wins');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Generate content outline for keyword
 */
export async function generateContentOutline(keyword: string, wordCount?: number) {
  const response = await fetch(`${API_BASE}/api/seo/content-outline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, wordCount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate content outline');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Analyze competitors
 */
export async function analyzeCompetitors(domain: string, competitors: string[]) {
  const response = await fetch(`${API_BASE}/api/seo/competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, competitors }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze competitors');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Crawl domain
 */
export async function crawlDomain(domain: string) {
  const response = await fetch(`${API_BASE}/api/seo/crawl/${encodeURIComponent(domain)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to crawl domain');
  }

  const result = await response.json();
  return result.data;
}
