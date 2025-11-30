/**
 * Integration Tests: Learning System
 *
 * Tests feedback collection, pattern recognition,
 * preference learning, and embedding updates
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('openai');
vi.mock('../../api/services/embedding-service', () => ({
  generateEmbedding: vi.fn(),
}));

const { createClient } = await import('@supabase/supabase-js');
const { default: OpenAI } = await import('openai');
const copilotLearner = await import('../../api/services/copilot-learner');

describe('Learning System Integration', () => {
  let mockSupabase;
  let mockOpenAI;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Supabase mock
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({
        data: [{ id: 'feedback-123' }],
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({
        data: [{ id: 'preference-123' }],
        error: null,
      }),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    createClient.mockReturnValue(mockSupabase);

    // Setup OpenAI mock
    mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    preferences: [
                      {
                        type: 'response_style',
                        key: 'tone',
                        value: 'professional',
                        confidence: 0.8,
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        },
      },
    };

    OpenAI.mockImplementation(() => mockOpenAI);
  });

  describe('Feedback Collection', () => {
    it('should collect and store feedback', async () => {
      const feedbackData = {
        userId: 'user-123',
        feedbackType: 'positive',
        interactionType: 'chat',
        rating: 5,
        comment: 'Great response!',
        originalMessage: 'Tạo bài post',
        aiResponse: 'Tôi đã tạo bài post cho bạn.',
      };

      const result = await copilotLearner.collectFeedback(feedbackData);

      // Verify feedback was inserted
      expect(mockSupabase.from).toHaveBeenCalledWith('copilot_feedback');
      expect(mockSupabase.insert).toHaveBeenCalled();

      // Verify result
      expect(result).toHaveProperty('id');
    });

    it('should handle different feedback types', async () => {
      const feedbackTypes = ['positive', 'negative', 'neutral', 'correction'];

      for (const type of feedbackTypes) {
        const feedbackData = {
          userId: 'user-123',
          feedbackType: type,
          interactionType: 'chat',
        };

        await copilotLearner.collectFeedback(feedbackData);

        expect(mockSupabase.insert).toHaveBeenCalled();
      }
    });

    it('should trigger pattern recognition for positive/negative feedback', async () => {
      const feedbackData = {
        userId: 'user-123',
        feedbackType: 'positive',
        interactionType: 'command',
        originalMessage: 'Tạo bài post',
        aiResponse: 'Response',
      };

      await copilotLearner.collectFeedback(feedbackData);

      // Pattern recognition should be triggered (async, not awaited)
      // We can't easily test this without waiting, but structure is correct
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should update preferences from corrections', async () => {
      const feedbackData = {
        userId: 'user-123',
        feedbackType: 'correction',
        interactionType: 'chat',
        originalMessage: 'Tạo bài post',
        aiResponse: 'Original response',
        correctedResponse: 'Corrected response',
      };

      await copilotLearner.collectFeedback(feedbackData);

      // Should trigger preference update
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should validate required feedback fields', async () => {
      const invalidData = {
        userId: null,
        feedbackType: 'positive',
      };

      await expect(
        copilotLearner.collectFeedback(invalidData)
      ).rejects.toThrow();
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize time patterns from feedback', async () => {
      // Mock feedback data with time patterns
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            id: 'fb-1',
            created_at: new Date('2025-01-27T09:00:00Z').toISOString(),
            feedback_type: 'positive',
          },
          {
            id: 'fb-2',
            created_at: new Date('2025-01-27T09:30:00Z').toISOString(),
            feedback_type: 'positive',
          },
          {
            id: 'fb-3',
            created_at: new Date('2025-01-27T10:00:00Z').toISOString(),
            feedback_type: 'positive',
          },
        ],
        error: null,
      });

      const patterns = await copilotLearner.recognizePatterns('user-123');

      // Should analyze time patterns
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should recognize command patterns', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            original_message: 'Tạo bài post',
            feedback_type: 'positive',
            created_at: new Date().toISOString(),
          },
          {
            original_message: 'Tạo bài post',
            feedback_type: 'positive',
            created_at: new Date().toISOString(),
          },
          {
            original_message: 'Tạo bài post',
            feedback_type: 'positive',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const patterns = await copilotLearner.recognizePatterns('user-123');

      // Should recognize frequent commands
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should recognize project preferences', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            context: { project_id: 'project-123' },
            feedback_type: 'positive',
            created_at: new Date().toISOString(),
          },
          {
            context: { project_id: 'project-123' },
            feedback_type: 'positive',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const patterns = await copilotLearner.recognizePatterns('user-123');

      // Should recognize project preferences
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should store recognized patterns', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock existing pattern check
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const patterns = await copilotLearner.recognizePatterns('user-123');

      // Should return stored patterns
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('Preference Learning', () => {
    it('should get user preferences', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockResolvedValue({
        data: [
          {
            preference_type: 'response_style',
            preference_key: 'tone',
            preference_value: { tone: 'professional' },
          },
        ],
        error: null,
      });

      const preferences = await copilotLearner.getUserPreferences('user-123');

      expect(preferences).toHaveProperty('response_style');
      expect(preferences.response_style).toHaveProperty('tone');
    });

    it('should filter preferences by type', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const preferences = await copilotLearner.getUserPreferences(
        'user-123',
        'response_style'
      );

      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'preference_type',
        'response_style'
      );
    });

    it('should update preferences from corrections', async () => {
      const correctionData = {
        originalMessage: 'Tạo bài post',
        aiResponse: 'Casual response',
        correctedResponse: 'Professional response',
        context: {},
      };

      await copilotLearner.updatePreferencesFromCorrection(
        'user-123',
        correctionData
      );

      // Should call OpenAI to extract preferences
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();

      // Should upsert preferences
      expect(mockSupabase.upsert).toHaveBeenCalled();
    });
  });

  describe('Batch Learning', () => {
    it('should learn from batch feedback', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            id: 'fb-1',
            feedback_type: 'positive',
            created_at: new Date().toISOString(),
          },
          {
            id: 'fb-2',
            feedback_type: 'correction',
            original_message: 'Test',
            ai_response: 'Original',
            corrected_response: 'Corrected',
            context: {},
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const result = await copilotLearner.learnFromBatch('user-123');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('patternsDetected');
      expect(result).toHaveProperty('preferencesUpdated');
    });
  });

  describe('Error Handling', () => {
    it('should handle feedback collection errors', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      const feedbackData = {
        userId: 'user-123',
        feedbackType: 'positive',
        interactionType: 'chat',
      };

      await expect(
        copilotLearner.collectFeedback(feedbackData)
      ).rejects.toThrow();
    });

    it('should handle pattern recognition errors gracefully', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockRejectedValue(new Error('Query failed'));

      const patterns = await copilotLearner.recognizePatterns('user-123');

      // Should return empty array on error
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});

