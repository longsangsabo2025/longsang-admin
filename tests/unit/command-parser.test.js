/**
 * Unit Tests: Command Parser Service
 *
 * Tests for parsing natural language commands using OpenAI Function Calling
 */

import OpenAI from 'openai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

describe('Command Parser', () => {
  let commandParser;
  let mockOpenAI;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockOpenAI = new OpenAI();
    // Import after mock
    commandParser = await import('../../api/services/command-parser.js');
  });

  it('should parse "Tạo bài post" command correctly', async () => {
    const mockResponse = {
      choices: [{
        message: {
          tool_calls: [{
            id: 'call_123',
            function: {
              name: 'create_post',
              arguments: JSON.stringify({
                topic: 'dự án Vũng Tàu',
                platform: 'facebook',
                tone: 'professional'
              })
            }
          }]
        }
      }]
    };

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

    const availableFunctions = {
      create_post: {
        name: 'create_post',
        description: 'Tạo bài post'
      }
    };

    const result = await commandParser.parseCommand(
      'Tạo bài post về dự án Vũng Tàu',
      availableFunctions
    );

    expect(result.success).toBe(true);
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].function).toBe('create_post');
    expect(result.toolCalls[0].arguments.topic).toBe('dự án Vũng Tàu');
  });

  it('should handle commands without tool calls', async () => {
    const mockResponse = {
      choices: [{
        message: {
          tool_calls: []
        }
      }]
    };

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

    const result = await commandParser.parseCommand(
      'Xin chào',
      {}
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Không thể xác định action');
  });

  it('should handle multiple tool calls', async () => {
    const mockResponse = {
      choices: [{
        message: {
          tool_calls: [
            {
              id: 'call_1',
              function: {
                name: 'create_post',
                arguments: JSON.stringify({ topic: 'test' })
              }
            },
            {
              id: 'call_2',
              function: {
                name: 'schedule_post',
                arguments: JSON.stringify({ post_id: '123' })
              }
            }
          ]
        }
      }]
    };

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

    const result = await commandParser.parseCommand(
      'Tạo bài post và lên lịch',
      {}
    );

    expect(result.success).toBe(true);
    expect(result.toolCalls).toHaveLength(2);
  });
});

