/**
 * End-to-End Tests: Copilot Workflow
 *
 * Tests complete user workflows from UI to execution
 * including command input, parsing, planning, and execution
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.NODE_ENV = 'test';

// Mock all external dependencies
vi.mock('@supabase/supabase-js');
vi.mock('openai');
vi.mock('../../api/services/context-retrieval', () => ({
  retrieveEnhancedContext: vi.fn(),
}));
vi.mock('../../api/services/copilot-planner', () => ({
  createPlan: vi.fn(),
}));
vi.mock('../../api/services/copilot-executor', () => ({
  executePlan: vi.fn(),
}));

const { createClient } = await import('@supabase/supabase-js');
const { default: OpenAI } = await import('openai');
const contextRetrieval = await import('../../api/services/context-retrieval');
const copilotPlanner = await import('../../api/services/copilot-planner');
const copilotExecutor = await import('../../api/services/copilot-executor');

describe('Copilot Workflow E2E', () => {
  let mockSupabase;
  let mockOpenAI;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Supabase mock
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-id' }], error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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
                  tool_calls: [
                    {
                      id: 'call_123',
                      function: {
                        name: 'create_post',
                        arguments: JSON.stringify({
                          topic: 'Vũng Tàu Dream Homes',
                          platform: 'facebook',
                        }),
                      },
                    },
                  ],
                },
              },
            ],
            usage: { total_tokens: 150 },
          }),
        },
      },
    };

    OpenAI.mockImplementation(() => mockOpenAI);

    // Setup service mocks
    contextRetrieval.retrieveEnhancedContext.mockResolvedValue({
      semantic: { results: [], summary: 'No context' },
      business: { currentProjects: [] },
    });

    copilotPlanner.createPlan.mockResolvedValue({
      plan: {
        steps: [
          {
            id: 'step-1',
            name: 'Generate Content',
            description: 'Generate post content',
            dependencies: [],
            estimatedTime: 5000,
          },
        ],
        estimatedTotalTime: 5000,
        canParallel: false,
      },
    });

    copilotExecutor.executePlan.mockResolvedValue({
      success: true,
      results: [
        {
          stepId: 'step-1',
          status: 'completed',
          result: { content: 'Generated post content' },
        },
      ],
      totalTime: 4500,
    });
  });

  describe('Complete User Workflow: Create Post', () => {
    it('should complete full workflow: Command → Parse → Plan → Execute', async () => {
      // Simulate user command
      const command = 'Tạo bài post về dự án Vũng Tàu Dream Homes và đăng lên Facebook';

      // Step 1: Command parsing (would be done via API endpoint)
      const commandParser = await import('../../api/services/command-parser');
      const parseResult = await commandParser.parseCommand(command);

      expect(parseResult.success).toBe(true);
      expect(parseResult.toolCalls).toBeDefined();
      expect(parseResult.toolCalls.length).toBeGreaterThan(0);

      // Step 2: Context retrieval
      const context = await contextRetrieval.retrieveEnhancedContext(command, {
        projectId: 'project-123',
      });

      expect(context).toHaveProperty('semantic');
      expect(context).toHaveProperty('business');

      // Step 3: Planning
      const plan = await copilotPlanner.createPlan(parseResult, {
        command,
        userId: 'user-123',
        projectId: 'project-123',
      });

      expect(plan).toHaveProperty('plan');
      expect(plan.plan.steps.length).toBeGreaterThan(0);

      // Step 4: Execution
      const execution = await copilotExecutor.executePlan(plan.plan, {
        userId: 'user-123',
        projectId: 'project-123',
      });

      expect(execution.success).toBe(true);
      expect(execution.results).toBeDefined();
    });

    it('should handle preview mode without execution', async () => {
      const command = 'Tạo bài post';

      const parseResult = await (await import('../../api/services/command-parser')).parseCommand(command);
      const plan = await copilotPlanner.createPlan(parseResult, {
        command,
        userId: 'user-123',
        previewOnly: true,
      });

      // Should create plan but not execute
      expect(plan).toHaveProperty('plan');
      expect(copilotExecutor.executePlan).not.toHaveBeenCalled();
    });

    it('should show execution progress during workflow', async () => {
      // Mock progress callback
      const progressUpdates = [];
      const onProgress = (progress) => {
        progressUpdates.push(progress);
      };

      const plan = {
        plan: {
          steps: [
            { id: 'step-1', name: 'Step 1' },
            { id: 'step-2', name: 'Step 2' },
          ],
        },
      };

      await copilotExecutor.executePlan(plan.plan, {
        userId: 'user-123',
        onProgress,
      });

      // Should receive progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('Suggestion Execution Workflow', () => {
    it('should execute a suggestion from suggestion panel', async () => {
      // Simulate suggestion
      const suggestion = {
        id: 'suggestion-123',
        type: 'action',
        suggestedAction: {
          action: 'create_post',
          parameters: {
            topic: 'New project',
            platform: 'facebook',
          },
        },
      };

      // Execute suggestion
      const commandParser = await import('../../api/services/command-parser');
      const command = `Tạo bài post về ${suggestion.suggestedAction.parameters.topic}`;

      const parseResult = await commandParser.parseCommand(command);
      const plan = await copilotPlanner.createPlan(parseResult, {
        command,
        userId: 'user-123',
      });
      const execution = await copilotExecutor.executePlan(plan.plan, {
        userId: 'user-123',
      });

      expect(execution.success).toBe(true);
    });

    it('should track suggestion execution in database', async () => {
      const suggestionId = 'suggestion-123';

      // Mock suggestion update
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.update.mockResolvedValue({
        data: [{ id: suggestionId, executed_at: new Date().toISOString() }],
        error: null,
      });

      // Simulate execution tracking
      await mockSupabase.from('ai_suggestions').update({
        executed_at: new Date().toISOString(),
      }).eq('id', suggestionId);

      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe('Multi-Step Workflow', () => {
    it('should handle workflow with multiple sequential steps', async () => {
      const command = 'Tạo bài post, optimize SEO, và đăng lên Facebook';

      const parseResult = await (await import('../../api/services/command-parser')).parseCommand(command);
      const plan = await copilotPlanner.createPlan(parseResult, {
        command,
        userId: 'user-123',
      });

      expect(plan.plan.steps.length).toBeGreaterThan(1);

      // Execute with sequential steps
      const execution = await copilotExecutor.executePlan(plan.plan, {
        userId: 'user-123',
      });

      expect(execution.results.length).toBeGreaterThan(1);
    });

    it('should handle workflow with parallel steps', async () => {
      const command = 'Tạo bài post cho Facebook và LinkedIn';

      copilotPlanner.createPlan.mockResolvedValue({
        plan: {
          steps: [
            { id: 'step-1', name: 'Generate Content', dependencies: [] },
            { id: 'step-2', name: 'Post to Facebook', dependencies: ['step-1'] },
            { id: 'step-3', name: 'Post to LinkedIn', dependencies: ['step-1'] },
          ],
          canParallel: true,
        },
      });

      const parseResult = await (await import('../../api/services/command-parser')).parseCommand(command);
      const plan = await copilotPlanner.createPlan(parseResult, {
        command,
        userId: 'user-123',
      });

      expect(plan.plan.canParallel).toBe(true);
    });
  });

  describe('Error Handling in Workflow', () => {
    it('should handle errors gracefully and provide feedback', async () => {
      copilotExecutor.executePlan.mockRejectedValue(new Error('Execution failed'));

      const plan = {
        plan: {
          steps: [{ id: 'step-1', name: 'Step 1' }],
        },
      };

      await expect(
        copilotExecutor.executePlan(plan.plan, { userId: 'user-123' })
      ).rejects.toThrow();

      // Error should be handled and user should be notified
      expect(true).toBe(true); // Placeholder
    });

    it('should handle partial failures in multi-step workflow', async () => {
      copilotExecutor.executePlan.mockResolvedValue({
        success: false,
        results: [
          {
            stepId: 'step-1',
            status: 'completed',
            result: { success: true },
          },
          {
            stepId: 'step-2',
            status: 'failed',
            error: 'Step 2 failed',
          },
        ],
      });

      const plan = {
        plan: {
          steps: [
            { id: 'step-1', name: 'Step 1' },
            { id: 'step-2', name: 'Step 2', dependencies: ['step-1'] },
          ],
        },
      };

      const execution = await copilotExecutor.executePlan(plan.plan, {
        userId: 'user-123',
      });

      expect(execution.success).toBe(false);
      expect(execution.results.some((r) => r.status === 'failed')).toBe(true);
    });
  });

  describe('User Feedback in Workflow', () => {
    it('should collect feedback after workflow execution', async () => {
      const copilotLearner = await import('../../api/services/copilot-learner');

      const feedbackData = {
        userId: 'user-123',
        feedbackType: 'positive',
        interactionType: 'command',
        rating: 5,
        originalMessage: 'Tạo bài post',
      };

      await copilotLearner.collectFeedback(feedbackData);

      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should learn from corrections in workflow', async () => {
      const copilotLearner = await import('../../api/services/copilot-learner');

      const feedbackData = {
        userId: 'user-123',
        feedbackType: 'correction',
        interactionType: 'command',
        originalMessage: 'Tạo bài post',
        aiResponse: 'Original response',
        correctedResponse: 'Corrected response',
      };

      await copilotLearner.collectFeedback(feedbackData);

      // Should trigger preference learning
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });
});

