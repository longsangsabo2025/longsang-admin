/**
 * Integration Tests: Copilot Flow
 *
 * Tests complete Copilot chat flow including context retrieval,
 * chat completion, and response handling
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockCreateClient,
  mockOpenAIClass,
  createSupabaseMocks,
  createOpenAIMocks,
  setupGlobalMocks,
  cleanupMocks,
} from '../setup/mocks.js';

// Setup global mocks
setupGlobalMocks();

// Mock dependencies BEFORE imports
const mockRetrieveEnhancedContext = vi.fn();
const mockLoad = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

vi.mock('openai', () => ({
  default: mockOpenAIClass,
}));

vi.mock('../../api/services/context-retrieval', () => ({
  retrieveEnhancedContext: mockRetrieveEnhancedContext,
}));

vi.mock('../../api/services/business-context', () => ({
  load: mockLoad,
}));

// Import after mocks (using dynamic import for ES modules)
const copilotCore = await import('../../api/services/copilot-core.js');

describe('Copilot Flow Integration', () => {
  let mockSupabase;
  let mockOpenAI;

  beforeEach(() => {
    cleanupMocks();

    // Setup Supabase mock
    mockSupabase = createSupabaseMocks();
    mockCreateClient.mockReturnValue(mockSupabase);

    // Setup OpenAI mock
    mockOpenAI = createOpenAIMocks();
    mockOpenAIClass.mockImplementation(() => mockOpenAI);

    // Setup context retrieval mock
    mockRetrieveEnhancedContext.mockResolvedValue({
      semantic: {
        results: [
          {
            entityType: 'project',
            entityId: 'project-123',
            content: 'Vũng Tàu Dream Homes project',
            similarity: 0.85,
          },
        ],
        summary: 'Found 1 relevant project',
      },
      business: {
        currentProjects: [
          {
            id: 'project-123',
            name: 'Vũng Tàu Dream Homes',
          },
        ],
      },
    });

    // Setup business context mock
    mockLoad.mockResolvedValue({
      domain: 'longsang',
      currentProjects: [],
    });
  });

  describe('Chat Flow', () => {
    it('should complete chat flow with context retrieval', async () => {
      const message = 'Tạo bài post về dự án Vũng Tàu Dream Homes';
      const options = {
        userId: 'user-123',
        projectId: 'project-123',
        useContext: true,
      };

      const result = await copilotCore.chat(message, options);

      // Verify context was retrieved
      expect(mockRetrieveEnhancedContext).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          projectId: 'project-123',
          maxResults: 5,
        })
      );

      // Verify OpenAI was called
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();

      // Verify response structure
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('model');
      expect(result.metadata).toHaveProperty('tokens');
    });

    it('should handle chat without context', async () => {
      const message = 'Xin chào';
      const options = {
        userId: 'user-123',
        useContext: false,
      };

      const result = await copilotCore.chat(message, options);

      // Verify context was not retrieved
      expect(mockRetrieveEnhancedContext).not.toHaveBeenCalled();

      // Verify OpenAI was called
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();

      // Verify response structure
      expect(result).toHaveProperty('response');
    });

    it('should handle context retrieval failure gracefully', async () => {
      mockRetrieveEnhancedContext.mockRejectedValue(
        new Error('Context retrieval failed')
      );

      const message = 'Tạo bài post';
      const options = {
        userId: 'user-123',
        useContext: true,
      };

      // Should not throw, should continue without context
      const result = await copilotCore.chat(message, options);

      expect(result).toHaveProperty('response');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should include conversation history in chat', async () => {
      const message = 'Còn gì nữa không?';
      const options = {
        userId: 'user-123',
        conversationHistory: [
          {
            role: 'user',
            content: 'Tạo bài post',
          },
          {
            role: 'assistant',
            content: 'Tôi đã tạo bài post cho bạn.',
          },
        ],
      };

      await copilotCore.chat(message, options);

      // Verify OpenAI was called with conversation history
      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages.length).toBeGreaterThan(2); // System + history + current
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API error')
      );

      const message = 'Test message';

      await expect(copilotCore.chat(message)).rejects.toThrow();
    });

    it('should handle invalid input gracefully', async () => {
      const result = await copilotCore.chat('', { userId: 'user-123' });

      // Should return error response
      expect(result).toHaveProperty('error');
    });
  });

  describe('Context Integration', () => {
    it('should use retrieved context in chat completion', async () => {
      const message = 'Tạo bài post về dự án này';
      const options = {
        userId: 'user-123',
        projectId: 'project-123',
        useContext: true,
      };

      await copilotCore.chat(message, options);

      // Verify context was included in OpenAI call
      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const systemMessage = callArgs.messages.find((m) => m.role === 'system');

      expect(systemMessage).toBeDefined();
      expect(systemMessage.content).toContain('context');
    });

    it('should retrieve relevant context based on query', async () => {
      const message = 'Thống kê workflow executions';
      const options = {
        userId: 'user-123',
        useContext: true,
      };

      await copilotCore.chat(message, options);

      expect(mockRetrieveEnhancedContext).toHaveBeenCalledWith(
        message,
        expect.any(Object)
      );
    });
  });
});

