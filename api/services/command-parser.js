/**
 * 📝 Command Parser Service
 *
 * Parses natural language commands using OpenAI Function Calling
 * Enhanced with business context awareness
 *
 * @author LongSang Admin
 * @version 2.0.0
 */

const OpenAI = require('openai');
const businessContext = require('./business-context');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Parse command to identify function and parameters
 * Enhanced with business context for better accuracy
 *
 * @param {string} command - Natural language command
 * @param {object} availableFunctions - Available functions
 * @param {object} options - Additional options
 * @param {string} options.projectId - Optional project ID for context
 * @param {object} options.userContext - Optional user context
 * @returns {Promise<object>} Parsed command with function calls
 */
async function parseCommand(command, availableFunctions, options = {}) {
  try {
    // Load business context before parsing
    const context = await businessContext.load();

    // Build context-aware system prompt
    let contextInfo = '';

    if (context.currentProjects && context.currentProjects.length > 0) {
      const projectNames = context.currentProjects
        .slice(0, 5)
        .map((p) => `- ${p.name} (${p.slug || p.id})`)
        .join('\n');
      contextInfo += `\n\nCác projects hiện tại:\n${projectNames}`;
    }

    if (options.projectId) {
      const project = context.currentProjects?.find((p) => p.id === options.projectId);
      if (project) {
        contextInfo += `\n\nĐang làm việc với project: ${project.name} (${project.slug || project.id})`;
      }
    }

    if (context.recentWorkflows && context.recentWorkflows.length > 0) {
      const workflowNames = context.recentWorkflows
        .slice(0, 5)
        .map((w) => `- ${w.name || w.id}`)
        .join('\n');
      contextInfo += `\n\nWorkflows gần đây:\n${workflowNames}`;
    }

    // Add recent execution patterns
    if (context.recentExecutions && context.recentExecutions.length > 0) {
      const recentPatterns = context.recentExecutions
        .slice(0, 3)
        .map((e) => {
          if (e.inputData && e.inputData.command) {
            return `- "${e.inputData.command.substring(0, 50)}..."`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');
      if (recentPatterns) {
        contextInfo += `\n\nCommands gần đây:\n${recentPatterns}`;
      }
    }

    // Build enhanced system prompt
    const systemPrompt = `Bạn là AI assistant chuyên xử lý commands bằng tiếng Việt cho hệ thống quản lý dự án và automation.

Nhiệm vụ của bạn:
1. Phân tích command của user và gọi function phù hợp
2. Sử dụng context về projects, workflows để suy luận chính xác hơn
3. Nếu command đề cập đến tên project, hãy tìm project tương ứng trong danh sách
4. Nếu command không rõ ràng, hãy đặt câu hỏi làm rõ

Available functions: ${Object.keys(availableFunctions).join(', ')}
${contextInfo}

Khi parse command:
- Nếu user nói về "project X", hãy tìm project_id tương ứng từ danh sách projects
- Nếu user nói "dự án hiện tại", sử dụng project context được cung cấp
- Nếu command liên quan đến workflow, tham khảo workflows gần đây
- Luôn ưu tiên context để đưa ra kết quả chính xác nhất`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: command,
        },
      ],
      tools: Object.values(availableFunctions).map((func) => ({
        type: 'function',
        function: func,
      })),
      tool_choice: 'auto',
      temperature: 0.7,
    });

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls || [];

    if (toolCalls.length === 0) {
      return {
        success: false,
        error: 'Không thể xác định action từ command',
        suggestion: 'Vui lòng thử lại với command rõ ràng hơn',
        context_used: {
          projects_count: context.currentProjects?.length || 0,
          workflows_count: context.recentWorkflows?.length || 0,
        },
      };
    }

    // Enhance parsed arguments with context if needed
    const enhancedToolCalls = toolCalls.map((tc) => {
      const parsedArgs = JSON.parse(tc.function.arguments || '{}');

      // Auto-inject project_id if command mentions a project name but no project_id provided
      if (!parsedArgs.project_id && context.currentProjects) {
        const projectMatch = context.currentProjects.find((p) => {
          const nameMatch = command.toLowerCase().includes(p.name.toLowerCase());
          const slugMatch = p.slug && command.toLowerCase().includes(p.slug.toLowerCase());
          return nameMatch || slugMatch;
        });

        if (projectMatch) {
          parsedArgs.project_id = projectMatch.id;
          parsedArgs.project_context = projectMatch.name;
        } else if (options.projectId) {
          parsedArgs.project_id = options.projectId;
        }
      }

      return {
        id: tc.id,
        function: tc.function.name,
        arguments: parsedArgs,
      };
    });

    return {
      success: true,
      toolCalls: enhancedToolCalls,
      context_used: {
        projects_count: context.currentProjects?.length || 0,
        workflows_count: context.recentWorkflows?.length || 0,
        executions_count: context.recentExecutions?.length || 0,
      },
    };
  } catch (error) {
    console.error('Error parsing command:', error);
    throw error;
  }
}

module.exports = {
  parseCommand,
};
