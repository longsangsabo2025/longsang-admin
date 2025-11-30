/**
 * Test command parsing directly
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      },
      required: ['topic', 'platform'],
    },
  },
};

async function test() {
  const command = 'Tạo bài post về dự án Vũng Tàu';

  console.log(`Testing command: "${command}"\n`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bạn là AI assistant chuyên xử lý commands bằng tiếng Việt.

Nhiệm vụ của bạn: Phân tích command của user và LUÔN LUÔN gọi một trong các functions sau:
- create_post: Khi user muốn tạo bài post (ví dụ: "Tạo bài post", "Tạo post", "Đăng bài")

QUAN TRỌNG: Bạn PHẢI luôn gọi một function, không được trả lời text thông thường.`,
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
      tool_choice: 'required',
      temperature: 0.3,
    });

    console.log('Response:');
    console.log(JSON.stringify(response, null, 2));

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls || [];

    console.log('\nTool calls:', toolCalls.length);

    if (toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      console.log('\nFunction:', toolCall.function.name);
      console.log('Arguments:', toolCall.function.arguments);
    } else {
      console.log('\n❌ No tool calls!');
      console.log('Message content:', message.content);
      console.log('Finish reason:', response.choices[0].finish_reason);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

test();

