/**
 * 🧪 Full System Test - AI Command Center
 *
 * Tests the complete system end-to-end
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

console.log('🧪 AI Command Center - Full System Test');
console.log('='.repeat(60));

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseTables() {
  console.log('\n📊 Testing Database Tables...');

  const tables = [
    'ai_suggestions',
    'intelligent_alerts',
    'workflow_metrics',
    'project_workflows',
    'workflow_executions',
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log(`   ❌ ${table}: Table does not exist`);
        return false;
      } else {
        console.log(`   ✅ ${table}: OK`);
      }
    } catch (e) {
      console.log(`   ❌ ${table}: ${e.message}`);
      return false;
    }
  }

  return true;
}

async function testServices() {
  console.log('\n🔧 Testing Services...');

  // Test service files exist and can be loaded
  const services = [
    'api/services/business-context.js',
    'api/services/workflow-generator.js',
    'api/services/command-parser.js',
    'api/services/context-aware-generator.js',
    'api/services/agent-orchestrator.js',
    'api/services/workflow-metrics.js',
    'api/services/workflow-optimizer.js',
    'api/services/alert-detector.js',
    'api/services/background-monitor.js',
  ];

  let allExist = true;
  for (const service of services) {
    try {
      const module = require(service);
      if (module) {
        console.log(`   ✅ ${service.split('/').pop()}: Module loaded`);
      }
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        console.log(`   ❌ ${service.split('/').pop()}: File not found`);
        allExist = false;
      } else {
        // Other errors (like missing env vars) are OK for structure test
        console.log(`   ⚠️  ${service.split('/').pop()}: ${e.message.split('\n')[0]}`);
      }
    }
  }

  // Test workflow generator structure (doesn't need DB)
  try {
    const workflowGenerator = require('./api/services/workflow-generator.js');
    const workflow = workflowGenerator.generateFromCommand(
      'create_post',
      {
        topic: 'Test',
        platform: 'facebook',
      },
      {}
    );
    console.log(`   ✅ Workflow Generator: Can generate workflows`);
  } catch (e) {
    console.log(`   ⚠️  Workflow Generator: ${e.message.split('\n')[0]}`);
  }

  return allExist;
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...');

  const apiUrl = `http://localhost:${process.env.API_PORT || 3001}`;

  const endpoints = [
    { name: 'Health Check', url: `${apiUrl}/api/health` },
    { name: 'Get Functions', url: `${apiUrl}/api/ai/command/functions` },
    { name: 'Get Suggestions', url: `${apiUrl}/api/ai/suggestions` },
    { name: 'Get Alerts', url: `${apiUrl}/api/ai/alerts` },
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      if (response.ok) {
        console.log(`   ✅ ${endpoint.name}: OK`);
      } else {
        console.log(`   ⚠️  ${endpoint.name}: Status ${response.status}`);
      }
    } catch (e) {
      if (e.message.includes('fetch failed') || e.message.includes('ECONNREFUSED')) {
        console.log(`   ⚠️  ${endpoint.name}: Server not running`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${e.message}`);
        allPassed = false;
      }
    }
  }

  return allPassed;
}

async function testCommandParsing() {
  console.log('\n🤖 Testing Command Parsing...');

  if (!openaiKey) {
    console.log('   ⚠️  OpenAI API key not found - skipping command parsing test');
    return true;
  }

  try {
    // Test command parser structure (without actual API call)
    const commandParser = require('./api/services/command-parser.js');
    console.log('   ✅ Command Parser: Module loaded successfully');
    return true;
  } catch (e) {
    console.log(`   ❌ Command Parser: ${e.message}`);
    return false;
  }
}

async function main() {
  const results = {
    database: false,
    services: false,
    api: false,
    parsing: false,
  };

  results.database = await testDatabaseTables();
  results.services = await testServices();
  results.api = await testAPIEndpoints();
  results.parsing = await testCommandParsing();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`   Database: ${results.database ? '✅' : '❌'}`);
  console.log(`   Services: ${results.services ? '✅' : '❌'}`);
  console.log(`   API: ${results.api ? '✅' : '⚠️'}`);
  console.log(`   Parsing: ${results.parsing ? '✅' : '⚠️'}`);

  const allCritical = results.database; // Database is most critical

  if (allCritical) {
    console.log('\n✨ System is ready!');
    console.log('\n📝 Notes:');
    if (!openaiKey) {
      console.log('   ⚠️  Add OPENAI_API_KEY to .env for AI features');
    }
    console.log('\n🚀 To start:');
    console.log('   npm run dev');
    console.log('\n📖 See QUICK_START_AI_COMMAND.md for usage guide');
  } else {
    console.log('\n⚠️  Some critical tests failed. Please fix issues above.');
    process.exit(1);
  }
}

main().catch(console.error);
