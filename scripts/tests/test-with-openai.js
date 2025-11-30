/**
 * 🧪 Test AI Command Center với OpenAI Key
 *
 * Tests command parsing với OpenAI API
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

console.log('🧪 Testing AI Command Center với OpenAI');
console.log('='.repeat(60));

if (!openaiKey) {
  console.error('❌ OPENAI_API_KEY not found in .env');
  process.exit(1);
}

console.log(`✅ OpenAI Key: ${openaiKey.substring(0, 20)}...`);

// Test OpenAI connection
const openai = new OpenAI({
  apiKey: openaiKey,
});

async function testOpenAIConnection() {
  console.log('\n🤖 Testing OpenAI Connection...');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello" in Vietnamese',
        },
      ],
      max_tokens: 10,
    });

    console.log('   ✅ OpenAI API: Connected successfully');
    console.log(`   Response: ${response.choices[0].message.content}`);
    return true;
  } catch (error) {
    console.error('   ❌ OpenAI API Error:', error.message);
    return false;
  }
}

async function testCommandParsing() {
  console.log('\n📝 Testing Command Parsing...');

  const availableFunctions = [
    {
      type: 'function',
      function: {
        name: 'create_post',
        description: 'Tạo bài post cho social media',
        parameters: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Chủ đề bài post',
            },
            platform: {
              type: 'string',
              enum: ['facebook', 'twitter', 'linkedin'],
              description: 'Platform để đăng bài',
            },
            tone: {
              type: 'string',
              enum: ['professional', 'casual', 'friendly'],
              description: 'Tone của bài post',
            },
          },
          required: ['topic', 'platform'],
        },
      },
    },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Bạn là AI assistant giúp parse commands tiếng Việt thành function calls.',
        },
        {
          role: 'user',
          content: 'Tạo bài post về dự án Vũng Tàu trên Facebook với tone professional',
        },
      ],
      tools: availableFunctions,
      tool_choice: 'auto',
      max_tokens: 500,
    });

    if (
      response.choices[0].message.tool_calls &&
      response.choices[0].message.tool_calls.length > 0
    ) {
      const toolCall = response.choices[0].message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      console.log('   ✅ Command Parsed Successfully');
      console.log(`   Function: ${toolCall.function.name}`);
      console.log(`   Arguments:`, args);
      return true;
    } else {
      console.log('   ⚠️  No tool calls returned');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Command Parsing Error:', error.message);
    return false;
  }
}

async function testDatabase() {
  console.log('\n📊 Testing Database Connection...');

  if (!supabaseUrl || !supabaseKey) {
    console.log('   ⚠️  Supabase credentials not found');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase.from('ai_suggestions').select('id').limit(1);
    if (error && error.code === '42P01') {
      console.log('   ❌ ai_suggestions table does not exist');
      return false;
    }
    console.log('   ✅ Database: Connected');
    return true;
  } catch (e) {
    console.log(`   ❌ Database Error: ${e.message}`);
    return false;
  }
}

async function main() {
  const results = {
    openai: false,
    parsing: false,
    database: false,
  };

  results.openai = await testOpenAIConnection();
  results.parsing = await testCommandParsing();
  results.database = await testDatabase();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`   OpenAI Connection: ${results.openai ? '✅' : '❌'}`);
  console.log(`   Command Parsing: ${results.parsing ? '✅' : '❌'}`);
  console.log(`   Database: ${results.database ? '✅' : '⚠️'}`);

  if (results.openai && results.parsing) {
    console.log('\n✨ AI Command Center is fully functional!');
    console.log('🚀 Start the app: npm run dev');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  }
}

main().catch(console.error);
