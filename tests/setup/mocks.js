/**
 * Shared Mock Utilities
 *
 * Common mocking patterns for all tests
 */

import { vi } from 'vitest';

// Mock Supabase
export const mockCreateClient = vi.fn();
export const createSupabaseMocks = () => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  containedBy: vi.fn().mockReturnThis(),
  rangeGt: vi.fn().mockReturnThis(),
  rangeLt: vi.fn().mockReturnThis(),
  rangeGte: vi.fn().mockReturnThis(),
  rangeLte: vi.fn().mockReturnThis(),
  rangeAdjacent: vi.fn().mockReturnThis(),
  overlaps: vi.fn().mockReturnThis(),
  textSearch: vi.fn().mockReturnThis(),
  match: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  abortSignal: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  csv: vi.fn().mockResolvedValue(''),
  geojson: vi.fn().mockResolvedValue({}),
  explain: vi.fn().mockResolvedValue({}),
  rollback: vi.fn().mockReturnThis(),
  returns: vi.fn().mockReturnThis(),
  then: vi.fn().mockResolvedValue({ data: [], error: null }),
});

// Mock OpenAI
export const mockOpenAIClass = vi.fn();
export const createOpenAIMocks = () => ({
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test response',
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
        model: 'gpt-4',
      }),
    },
  },
  embeddings: {
    create: vi.fn().mockResolvedValue({
      data: [
        {
          embedding: Array(1536).fill(0.1),
          index: 0,
        },
      ],
      usage: {
        prompt_tokens: 1,
        total_tokens: 1,
      },
    }),
  },
});

// Setup global mocks
export function setupGlobalMocks() {
  // Mock environment variables
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.NODE_ENV = 'test';

  // Reset all mocks
  vi.clearAllMocks();
}

// Cleanup mocks
export function cleanupMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
}

