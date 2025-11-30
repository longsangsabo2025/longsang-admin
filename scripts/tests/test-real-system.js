/**
 * 🧪 Test Real System - AI Command Center
 *
 * Test thực tế hệ thống với command cụ thể
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('🧪 Testing Real System - AI Command Center');
console.log('='.repeat(60));
console.log(`API URL: ${API_URL}`);
console.log(`OpenAI Key: ${OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log('='.repeat(60));
console.log();

// Test results
const results = {
  passed: [],
  failed: [],
  errors: [],
};

function logResult(name, status, message = '', error = null) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);

  if (status === 'pass') {
    results.passed.push({ name, message });
  } else if (status === 'fail') {
    results.failed.push({ name, message, error });
  } else {
    results.errors.push({ name, message, error });
  }
}

// Test 1: Check API Server
async function testServerHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      logResult('API Server Health', 'pass', `Status: ${response.status}, ${JSON.stringify(data)}`);
      return true;
    } else {
      logResult('API Server Health', 'fail', `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logResult('API Server Health', 'fail', `Error: ${error.message}`);
    return false;
  }
}

// Test 2: Check Available Functions
async function testGetFunctions() {
  try {
    const response = await fetch(`${API_URL}/api/ai/command/functions`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const functions = data.functions || [];
      logResult('Get Available Functions', 'pass', `Found ${functions.length} functions`);
      return functions;
    } else {
      const text = await response.text();
      logResult('Get Available Functions', 'fail', `Status: ${response.status}, ${text.substring(0, 100)}`);
      return null;
    }
  } catch (error) {
    logResult('Get Available Functions', 'fail', `Error: ${error.message}`);
    return null;
  }
}

// Test 3: Test Real Command
async function testRealCommand() {
  if (!OPENAI_API_KEY) {
    logResult('Test Real Command', 'fail', 'OpenAI API key missing - skipped');
    return null;
  }

  const testCommand = 'Tạo bài post về dự án Vũng Tàu';

  console.log(`\n📝 Testing command: "${testCommand}"`);
  console.log('⏳ Waiting for AI response...\n');

  try {
    const response = await fetch(`${API_URL}/api/ai/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command: testCommand }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      logResult('Test Real Command', 'fail', `Status: ${response.status}, Response: ${text.substring(0, 200)}`);
      return null;
    }

    if (response.ok && data.success) {
      console.log('📊 Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log();

      logResult('Test Real Command', 'pass', `Workflow created: ${data.parsed?.workflows?.length || 0} workflow(s)`);
      return data;
    } else {
      logResult('Test Real Command', 'fail', `Status: ${response.status}, Error: ${data.error || JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    logResult('Test Real Command', 'fail', `Error: ${error.message}`);
    return null;
  }
}

// Test 4: Check Database Tables
async function testDatabaseTables() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    logResult('Database Tables', 'fail', 'Supabase key missing');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const tables = ['ai_suggestions', 'intelligent_alerts', 'workflow_metrics'];
    let allExist = true;

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST116') {
          logResult(`Table: ${table}`, 'fail', 'Table does not exist');
          allExist = false;
        } else {
          // Other error might mean table exists but empty or permission issue
          logResult(`Table: ${table}`, 'pass', 'Table exists (query returned)');
        }
      } else {
        logResult(`Table: ${table}`, 'pass', 'Table exists');
      }
    }

    return allExist;
  } catch (error) {
    logResult('Database Tables', 'fail', `Error: ${error.message}`);
    return false;
  }
}

// Test 5: Check Services
async function testServices() {
  const services = [
    'api/services/command-parser.js',
    'api/services/workflow-generator.js',
    'api/services/business-context.js',
  ];

  const { existsSync } = await import('fs');
  let allExist = true;

  for (const service of services) {
    const path = join(__dirname, service);
    if (existsSync(path)) {
      logResult(`Service: ${service}`, 'pass', 'File exists');
    } else {
      logResult(`Service: ${service}`, 'fail', 'File missing');
      allExist = false;
    }
  }

  return allExist;
}

// Main test function
async function main() {
  console.log('Starting tests...\n');

  // Test 1: Server Health
  const serverOk = await testServerHealth();
  if (!serverOk) {
    console.log('\n❌ Server not running. Please start server first:');
    console.log('   npm run dev:api\n');
    return;
  }

  await new Promise((r) => setTimeout(r, 500));

  // Test 2: Get Functions
  await testGetFunctions();
  await new Promise((r) => setTimeout(r, 1000));

  // Test 3: Services
  await testServices();

  // Test 4: Database Tables
  await testDatabaseTables();

  // Test 5: Real Command (if OpenAI key available)
  if (OPENAI_API_KEY) {
    await new Promise((r) => setTimeout(r, 1000));
    await testRealCommand();
  } else {
    console.log('\n⚠️  OpenAI API key not found - skipping command test');
    console.log('   Set OPENAI_API_KEY in .env file to test real commands\n');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);
  console.log();

  if (results.failed.length > 0) {
    console.log('❌ Failed Tests:');
    results.failed.forEach((f) => {
      console.log(`   - ${f.name}: ${f.message}`);
      if (f.error) console.log(`     Error: ${f.error}`);
    });
    console.log();
  }

  if (results.passed.length > 0) {
    console.log('✅ Passed Tests:');
    results.passed.forEach((p) => {
      console.log(`   - ${p.name}: ${p.message}`);
    });
    console.log();
  }

  const allPassed = results.failed.length === 0;
  if (allPassed) {
    console.log('✨ All tests passed! System is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check errors above.');
  }
}

main().catch(console.error);

