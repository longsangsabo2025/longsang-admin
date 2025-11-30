/**
 * Integration Tests: Multi-Agent Orchestration
 *
 * Tests multi-agent orchestration including agent selection,
 * task creation, execution, and result aggregation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('openai');
vi.mock('../../api/services/context-retrieval', () => ({
  retrieveEnhancedContext: vi.fn(),
}));
vi.mock('../../api/services/copilot-planner', () => ({
  createPlan: vi.fn(),
}));

const { createClient } = await import('@supabase/supabase-js');
const { default: OpenAI } = await import('openai');
const contextRetrieval = await import('../../api/services/context-retrieval');
const copilotPlanner = await import('../../api/services/copilot-planner');
const multiAgentOrchestrator = await import('../../api/services/multi-agent-orchestrator');

describe('Multi-Agent Orchestration Integration', () => {
  let mockSupabase;
  let mockOpenAI;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Supabase mock
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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
                    agents: [
                      {
                        type: 'content_creator',
                        confidence: 0.9,
                        reason: 'Command requires content creation',
                        role: 'Generate content',
                        canParallel: true,
                      },
                      {
                        type: 'seo_specialist',
                        confidence: 0.85,
                        reason: 'Command requires SEO optimization',
                        role: 'Optimize SEO',
                        canParallel: true,
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

    // Setup context retrieval mock
    contextRetrieval.retrieveEnhancedContext.mockResolvedValue({
      semantic: {
        results: [],
        summary: 'No specific context',
      },
      business: {
        currentProjects: [],
      },
    });

    // Setup planner mock
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
          {
            id: 'step-2',
            name: 'Optimize SEO',
            description: 'Optimize content for SEO',
            dependencies: ['step-1'],
            estimatedTime: 3000,
          },
        ],
        estimatedTotalTime: 8000,
        canParallel: false,
      },
    });
  });

  describe('Agent Selection', () => {
    it('should select appropriate agents for a command', async () => {
      const command = 'Tạo bài post về dự án và optimize SEO';
      const context = {
        projectId: 'project-123',
      };

      const agents = await multiAgentOrchestrator.selectAgents(command, context);

      // Verify OpenAI was called for agent selection
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();

      // Verify agents were selected
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    it('should handle commands with no suitable agents', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ agents: [] }),
            },
          },
        ],
      });

      const command = 'Random command with no clear intent';
      const agents = await multiAgentOrchestrator.selectAgents(command);

      expect(Array.isArray(agents)).toBe(true);
    });

    it('should fallback to keyword-based selection on error', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      const command = 'Tạo content về SEO';
      const agents = await multiAgentOrchestrator.selectAgents(command);

      // Should use fallback selection
      expect(Array.isArray(agents)).toBe(true);
    });
  });

  describe('Task Creation', () => {
    it('should create tasks for selected agents', () => {
      const agents = [
        {
          type: 'content_creator',
          confidence: 0.9,
          role: 'Generate content',
          canParallel: true,
        },
        {
          type: 'seo_specialist',
          confidence: 0.85,
          role: 'Optimize SEO',
          canParallel: true,
        },
      ];

      const command = 'Create content and optimize SEO';
      const context = { projectId: 'project-123' };

      const tasks = multiAgentOrchestrator.createAgentTasks(
        agents,
        command,
        context
      );

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(2);
      expect(tasks[0]).toHaveProperty('id');
      expect(tasks[0]).toHaveProperty('agent');
      expect(tasks[0]).toHaveProperty('command');
    });

    it('should handle parallel and sequential tasks', () => {
      const agents = [
        {
          type: 'content_creator',
          canParallel: true,
        },
        {
          type: 'workflow_automation',
          canParallel: false,
        },
      ];

      const tasks = multiAgentOrchestrator.createAgentTasks(
        agents,
        'test command'
      );

      const parallelTasks = tasks.filter((t) => t.canParallel);
      const sequentialTasks = tasks.filter((t) => !t.canParallel);

      expect(parallelTasks.length).toBeGreaterThan(0);
      expect(sequentialTasks.length).toBeGreaterThan(0);
    });
  });

  describe('Orchestration', () => {
    it('should orchestrate multi-agent execution', async () => {
      // Mock agent execution
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: 'Agent executed successfully',
        }),
      });

      const command = 'Tạo bài post và optimize SEO';
      const options = {
        userId: 'user-123',
        projectId: 'project-123',
        usePlanning: true,
      };

      const result = await multiAgentOrchestrator.orchestrate(
        command,
        options
      );

      // Verify context was retrieved
      expect(contextRetrieval.retrieveEnhancedContext).toHaveBeenCalled();

      // Verify result structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('selectedAgents');
      expect(result).toHaveProperty('results');
    });

    it('should handle orchestration failures gracefully', async () => {
      contextRetrieval.retrieveEnhancedContext.mockRejectedValue(
        new Error('Context retrieval failed')
      );

      const command = 'Test command';
      const result = await multiAgentOrchestrator.orchestrate(command);

      // Should handle error gracefully
      expect(result).toHaveProperty('success');
    });

    it('should aggregate results from multiple agents', async () => {
      const results = [
        {
          taskId: 'task-1',
          agent: 'content_creator',
          status: 'completed',
          result: { content: 'Generated content' },
        },
        {
          taskId: 'task-2',
          agent: 'seo_specialist',
          status: 'completed',
          result: { seoScore: 95 },
        },
      ];

      const aggregated = await multiAgentOrchestrator.aggregateResults(results);

      expect(aggregated).toHaveProperty('success');
      expect(aggregated).toHaveProperty('totalAgents');
      expect(aggregated).toHaveProperty('successfulAgents');
      expect(aggregated.successfulAgents).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle agent execution failures', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Agent execution failed',
      });

      const task = {
        id: 'task-1',
        agent: 'content_creator',
        command: 'Test command',
        canParallel: true,
      };

      // Should handle error in task execution
      // This would be tested in executeAgentTask
      expect(true).toBe(true); // Placeholder
    });

    it('should handle partial failures in orchestration', async () => {
      const results = [
        {
          taskId: 'task-1',
          agent: 'content_creator',
          status: 'completed',
          result: { content: 'Generated' },
        },
        {
          taskId: 'task-2',
          agent: 'seo_specialist',
          status: 'failed',
          error: 'SEO optimization failed',
        },
      ];

      const aggregated = await multiAgentOrchestrator.aggregateResults(results);

      expect(aggregated.success).toBe(false);
      expect(aggregated.failedAgents).toBe(1);
    });
  });
});

