/**
 * 🤖 AI Command Center API
 *
 * Receives natural language commands, processes with OpenAI Function Calling,
 * and generates/executes workflows
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Import services
const workflowGenerator = require('../services/workflow-generator');
const commandParser = require('../services/command-parser');
const businessContext = require('../services/business-context');

// Available functions for OpenAI Function Calling
const AVAILABLE_FUNCTIONS = {
  create_post: {
    name: 'create_post',
    description: 'Tạo bài post cho social media (Facebook, LinkedIn, Twitter)',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Chủ đề bài post',
        },
        platform: {
          type: 'string',
          enum: ['facebook', 'linkedin', 'twitter', 'all'],
          description: 'Nền tảng social media',
        },
        tone: {
          type: 'string',
          enum: ['professional', 'casual', 'friendly', 'formal'],
          description: 'Giọng điệu bài post',
        },
        include_image: {
          type: 'boolean',
          description: 'Có tạo hình ảnh kèm theo không',
        },
        schedule: {
          type: 'string',
          description: 'Thời gian đăng (ISO format hoặc "now")',
        },
      },
      required: ['topic', 'platform'],
    },
  },
  backup_database: {
    name: 'backup_database',
    description: 'Backup database lên Google Drive',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          enum: ['google_drive', 'local'],
          description: 'Nơi lưu backup',
        },
        include_data: {
          type: 'boolean',
          description: 'Có backup data hay chỉ schema',
        },
      },
      required: ['destination'],
    },
  },
  generate_seo: {
    name: 'generate_seo',
    description: 'Tạo bài SEO cho từ khóa',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Từ khóa SEO',
        },
        word_count: {
          type: 'number',
          description: 'Số từ (mặc định 1000)',
        },
        count: {
          type: 'number',
          description: 'Số lượng bài (mặc định 1)',
        },
        tone: {
          type: 'string',
          enum: ['professional', 'casual', 'friendly'],
          description: 'Giọng điệu',
        },
      },
      required: ['keyword'],
    },
  },
  get_stats: {
    name: 'get_stats',
    description: 'Lấy thống kê và metrics',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['today', 'week', 'month', 'all'],
          description: 'Khoảng thời gian',
        },
        category: {
          type: 'string',
          enum: ['workflows', 'agents', 'executions', 'costs', 'all'],
          description: 'Loại thống kê',
        },
      },
      required: ['type'],
    },
  },
  create_workflow: {
    name: 'create_workflow',
    description: 'Tạo workflow mới từ mô tả',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Tên workflow',
        },
        description: {
          type: 'string',
          description: 'Mô tả workflow',
        },
        trigger: {
          type: 'string',
          enum: ['manual', 'scheduled', 'webhook', 'event'],
          description: 'Loại trigger',
        },
        steps: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Các bước trong workflow',
        },
      },
      required: ['name', 'description'],
    },
  },
  schedule_post: {
    name: 'schedule_post',
    description: 'Lên lịch đăng bài post',
    parameters: {
      type: 'object',
      properties: {
        post_id: {
          type: 'string',
          description: 'ID bài post đã tạo',
        },
        schedule_time: {
          type: 'string',
          description: 'Thời gian đăng (ISO format)',
        },
        platforms: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['facebook', 'linkedin', 'twitter'],
          },
          description: 'Danh sách nền tảng',
        },
      },
      required: ['post_id', 'schedule_time'],
    },
  },
};

/**
 * POST /api/ai/command
 * Process natural language command and generate workflow
 */
router.post('/command', async (req, res) => {
  try {
    const { command, context, preview_only } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Command is required and must be a string',
      });
    }

    console.log(`📥 Received command: ${command}${preview_only ? ' (preview only)' : ''}`);

    // Step 1: Load business context if not provided
    const businessContextData = context || (await businessContext.load());

    // Step 2: Parse command using enhanced context-aware parser
    const projectId = req.body.project_id || context?.currentProjects?.[0]?.id;

    const parseResult = await commandParser.parseCommand(command, AVAILABLE_FUNCTIONS, {
      projectId: projectId,
      userContext: {
        userId: req.user?.id || req.headers['x-user-id'],
      },
    });

    // Check if parsing was successful
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error || 'Failed to parse command',
        suggestion: parseResult.suggestion,
        context_used: parseResult.context_used,
      });
    }

    const toolCalls = parseResult.toolCalls || [];

    // Debug: Log if no tool calls (shouldn't happen with new parser)
    if (toolCalls.length === 0) {
      console.log('⚠️  No tool calls returned. Parse result:', JSON.stringify(parseResult, null, 2));

      return res.status(400).json({
        success: false,
        error: parseResult.error || 'Không thể xác định action từ command',
        suggestion: parseResult.suggestion || 'Vui lòng thử lại với command rõ ràng hơn',
        context_used: parseResult.context_used,
      });
    }

    // If preview_only mode, return parsed result without executing
    const previewOnly = req.body.preview_only === true;
    if (previewOnly) {
      return res.json({
        success: true,
        command,
        parsed: {
          functions: toolCalls.map((tc) => ({
            name: tc.function,
            arguments: tc.arguments,
          })),
        },
        preview: true,
        context_used: parseResult.context_used,
        message: 'Execution plan preview',
      });
    }

    // Step 3: Process tool calls (execute workflows)
    const results = [];
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function;
      const functionArgs = toolCall.arguments; // Already parsed by enhanced parser

      console.log(`🔧 Executing function: ${functionName}`, functionArgs);

      // Step 4: Generate workflow từ parsed command
      let workflowDef;
      try {
        workflowDef = await workflowGenerator.generateFromCommand(
          functionName,
          functionArgs,
          businessContextData
        );
        console.log(`✅ Workflow generated: ${workflowDef.name}`);
      } catch (error) {
        console.error(`❌ Error generating workflow:`, error);
        console.error(error.stack);
        throw error;
      }

      results.push({
        function: functionName,
        arguments: functionArgs,
        workflow: workflowDef,
      });
    }

    // Step 5: Return response
    res.json({
      success: true,
      command,
      parsed: {
        functions: results.map((r) => ({
          name: r.function,
          arguments: r.arguments,
        })),
        workflows: results.map((r) => r.workflow),
      },
      message: `Đã tạo ${results.length} workflow(s) từ command của bạn`,
      context_used: parseResult.context_used,
    });
  } catch (error) {
    console.error('❌ Error processing command:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * POST /api/ai/command/stream
 * Stream command execution progress với SSE
 */
router.post('/command/stream', async (req, res) => {
  try {
    const { command, context } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Command is required',
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    const sendEvent = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    try {
      // Step 1: Thinking
      sendEvent('thinking', {
        content: 'Đang phân tích command của bạn...',
      });

      // Load context
      const businessContextData = context || (await businessContext.load());
      sendEvent('thinking', {
        content: 'Đang tải business context...',
      });

      // Step 2: Parse command với streaming
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là AI assistant chuyên xử lý commands bằng tiếng Việt.`,
          },
          {
            role: 'user',
            content: command,
          },
        ],
        tools: Object.values(AVAILABLE_FUNCTIONS).map((func) => ({
          type: 'function',
          function: func,
        })),
        tool_choice: 'auto',
        stream: true,
      });

      let fullResponse = '';
      let toolCalls = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          fullResponse += delta.content;
          sendEvent('thinking', { content: delta.content });
        }

        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index;
            if (!toolCalls[index]) {
              toolCalls[index] = {
                id: toolCall.id,
                type: 'function',
                function: {
                  name: '',
                  arguments: '',
                },
              };
            }

            if (toolCall.function?.name) {
              toolCalls[index].function.name = toolCall.function.name;
              sendEvent('action', {
                action: toolCall.function.name,
                message: `Đang thực hiện: ${toolCall.function.name}`,
              });
            }

            if (toolCall.function?.arguments) {
              toolCalls[index].function.arguments += toolCall.function.arguments;
            }
          }
        }
      }

      // Step 3: Process tool calls
      for (const toolCall of toolCalls) {
        if (!toolCall.function.name) continue;

        sendEvent('action', {
          action: toolCall.function.name,
          message: `Đang tạo workflow cho: ${toolCall.function.name}`,
        });

        const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

        const workflowDef = await workflowGenerator.generateFromCommand(
          toolCall.function.name,
          functionArgs,
          businessContextData
        );

        sendEvent('result', {
          function: toolCall.function.name,
          workflow: workflowDef,
          message: `Đã tạo workflow: ${workflowDef.name}`,
        });
      }

      sendEvent('complete', {
        message: 'Hoàn thành!',
        workflows: toolCalls.length,
      });
    } catch (error) {
      sendEvent('error', {
        message: error.message,
      });
    } finally {
      res.end();
    }
  } catch (error) {
    console.error('❌ Error in streaming:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
});

/**
 * GET /api/ai/command/functions
 * Get list of available functions
 */
router.get('/command/functions', (req, res) => {
  res.json({
    success: true,
    functions: Object.values(AVAILABLE_FUNCTIONS).map((func) => ({
      name: func.name,
      description: func.description,
      parameters: func.parameters,
    })),
  });
});

module.exports = router;
