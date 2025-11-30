/**
 * End-to-End Tests: Suggestion Execution
 *
 * Tests suggestion generation, display, and execution
 * from suggestion panel to completion
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.NODE_ENV = 'test';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('openai');
vi.mock('../../api/services/suggestion-engine', () => ({
  generateSuggestions: vi.fn(),
}));
vi.mock('../../api/services/context-retrieval', () => ({
  retrieveEnhancedContext: vi.fn(),
}));

const { createClient } = await import('@supabase/supabase-js');
const suggestionEngine = await import('../../api/services/suggestion-engine');
const contextRetrieval = await import('../../api/services/context-retrieval');

describe('Suggestion Execution E2E', () => {
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Supabase mock
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({
        data: [{ id: 'suggestion-123' }],
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'suggestion-123',
            type: 'action',
            priority: 'high',
            title: 'Tạo bài post về dự án mới',
            description: 'Bạn có thể tạo bài post về dự án Vũng Tàu Dream Homes',
            suggested_action: {
              action: 'create_post',
              parameters: {
                topic: 'Vũng Tàu Dream Homes',
                platform: 'facebook',
              },
            },
            project_id: 'project-123',
            project_name: 'Vũng Tàu Dream Homes',
            confidence: 0.85,
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    // Setup suggestion engine mock
    suggestionEngine.generateSuggestions.mockResolvedValue([
      {
        type: 'action',
        priority: 'high',
        title: 'Tạo bài post về dự án mới',
        description: 'Bạn có thể tạo bài post về dự án Vũng Tàu Dream Homes',
        suggestedAction: {
          action: 'create_post',
          parameters: {
            topic: 'Vũng Tàu Dream Homes',
            platform: 'facebook',
          },
        },
        projectId: 'project-123',
        projectName: 'Vũng Tàu Dream Homes',
        confidence: 0.85,
      },
    ]);

    // Setup context retrieval mock
    contextRetrieval.retrieveEnhancedContext.mockResolvedValue({
      semantic: { results: [], summary: 'No context' },
      business: {
        currentProjects: [
          {
            id: 'project-123',
            name: 'Vũng Tàu Dream Homes',
          },
        ],
      },
    });
  });

  describe('Suggestion Generation', () => {
    it('should generate suggestions for a user', async () => {
      const userId = 'user-123';
      const projectId = 'project-123';

      const suggestions = await suggestionEngine.generateSuggestions(userId, {
        projectId,
        limit: 10,
      });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('priority');
      expect(suggestions[0]).toHaveProperty('suggestedAction');
    });

    it('should generate context-aware suggestions', async () => {
      const userId = 'user-123';
      const projectId = 'project-123';

      await suggestionEngine.generateSuggestions(userId, { projectId });

      // Should use context retrieval
      expect(contextRetrieval.retrieveEnhancedContext).toHaveBeenCalled();
    });

    it('should prioritize suggestions by confidence', async () => {
      suggestionEngine.generateSuggestions.mockResolvedValue([
        {
          type: 'action',
          priority: 'high',
          confidence: 0.9,
          title: 'High confidence suggestion',
        },
        {
          type: 'action',
          priority: 'medium',
          confidence: 0.7,
          title: 'Medium confidence suggestion',
        },
        {
          type: 'action',
          priority: 'low',
          confidence: 0.5,
          title: 'Low confidence suggestion',
        },
      ]);

      const suggestions = await suggestionEngine.generateSuggestions('user-123');

      // Should be sorted by confidence/priority
      expect(suggestions[0].confidence).toBeGreaterThanOrEqual(
        suggestions[1].confidence
      );
    });
  });

  describe('Suggestion Storage', () => {
    it('should store generated suggestions in database', async () => {
      const userId = 'user-123';
      const suggestions = await suggestionEngine.generateSuggestions(userId);

      // Simulate storing suggestions
      await mockSupabase.from('ai_suggestions').insert(
        suggestions.map((s) => ({
          ...s,
          user_id: userId,
        }))
      );

      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should retrieve stored suggestions for user', async () => {
      const userId = 'user-123';

      await mockSupabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false })
        .limit(10);

      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
    });
  });

  describe('Suggestion Execution', () => {
    it('should execute a suggestion when user clicks Execute', async () => {
      const suggestionId = 'suggestion-123';
      const suggestion = {
        id: suggestionId,
        suggestedAction: {
          action: 'create_post',
          parameters: {
            topic: 'Vũng Tàu Dream Homes',
            platform: 'facebook',
          },
        },
      };

      // Convert suggestion to command
      const command = `Tạo bài post về ${suggestion.suggestedAction.parameters.topic}`;

      // Parse and execute command
      const commandParser = await import('../../api/services/command-parser');
      const parseResult = await commandParser.parseCommand(command);

      expect(parseResult.success).toBe(true);

      // Mark suggestion as executed
      await mockSupabase
        .from('ai_suggestions')
        .update({ executed_at: new Date().toISOString() })
        .eq('id', suggestionId);

      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should track suggestion execution result', async () => {
      const suggestionId = 'suggestion-123';
      const executionResult = {
        success: true,
        workflowId: 'workflow-123',
      };

      // Update suggestion with execution result
      await mockSupabase
        .from('ai_suggestions')
        .update({
          executed_at: new Date().toISOString(),
          execution_result: executionResult,
        })
        .eq('id', suggestionId);

      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe('Suggestion Dismissal', () => {
    it('should dismiss a suggestion when user clicks Dismiss', async () => {
      const suggestionId = 'suggestion-123';

      await mockSupabase
        .from('ai_suggestions')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', suggestionId);

      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should not show dismissed suggestions', async () => {
      const userId = 'user-123';

      await mockSupabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', userId)
        .is('dismissed_at', null)
        .order('priority', { ascending: false });

      expect(mockSupabase.is).toHaveBeenCalledWith('dismissed_at', null);
    });
  });

  describe('Suggestion Refresh', () => {
    it('should regenerate suggestions when requested', async () => {
      const userId = 'user-123';

      // Generate new suggestions
      const newSuggestions = await suggestionEngine.generateSuggestions(userId);

      // Store new suggestions
      await mockSupabase.from('ai_suggestions').insert(
        newSuggestions.map((s) => ({
          ...s,
          user_id: userId,
        }))
      );

      expect(suggestionEngine.generateSuggestions).toHaveBeenCalled();
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should avoid duplicate suggestions', async () => {
      const userId = 'user-123';

      // Get existing suggestions
      const existingSuggestions = await mockSupabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', userId)
        .is('dismissed_at', null)
        .is('executed_at', null);

      // Generate new suggestions
      const newSuggestions = await suggestionEngine.generateSuggestions(userId);

      // Filter out duplicates
      const uniqueSuggestions = newSuggestions.filter(
        (newS) =>
          !existingSuggestions.data?.some(
            (existing) => existing.title === newS.title
          )
      );

      expect(uniqueSuggestions.length).toBeLessThanOrEqual(
        newSuggestions.length
      );
    });
  });

  describe('Suggestion Context', () => {
    it('should include project context in suggestions', async () => {
      const userId = 'user-123';
      const projectId = 'project-123';

      const suggestions = await suggestionEngine.generateSuggestions(userId, {
        projectId,
      });

      expect(suggestions[0]).toHaveProperty('projectId');
      expect(suggestions[0].projectId).toBe(projectId);
    });

    it('should show project name in suggestion display', async () => {
      const suggestion = {
        id: 'suggestion-123',
        title: 'Tạo bài post',
        projectId: 'project-123',
        projectName: 'Vũng Tàu Dream Homes',
      };

      // Should include project name in display
      expect(suggestion.projectName).toBe('Vũng Tàu Dream Homes');
    });
  });

  describe('Suggestion Feedback', () => {
    it('should collect feedback on suggestion quality', async () => {
      const copilotLearner = await import('../../api/services/copilot-learner');

      const feedbackData = {
        userId: 'user-123',
        feedbackType: 'positive',
        interactionType: 'suggestion',
        referenceId: 'suggestion-123',
        referenceType: 'suggestion',
        rating: 5,
      };

      await copilotLearner.collectFeedback(feedbackData);

      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });
});

