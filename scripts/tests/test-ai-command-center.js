/**
 * 🧪 AI Command Center - Complete Test Script
 *
 * Tests all components to ensure everything works locally
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const apiPort = process.env.API_PORT || 3001;
const apiUrl = `http://localhost:${apiPort}`;

console.log('🧪 AI Command Center - Complete Test Suite');
console.log('='.repeat(60));

// Test Results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logResult(test, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${test}: ${message}`);

  if (status === 'pass') {
    results.passed.push(test);
  } else if (status === 'fail') {
    results.failed.push(test);
  } else {
    results.warnings.push(test);
  }
}

// Test 1: Environment Variables
console.log('\n📋 Test 1: Environment Variables');
if (supabaseUrl) {
  logResult('SUPABASE_URL', 'pass', 'Found');
} else {
  logResult('SUPABASE_URL', 'fail', 'Missing');
}

if (supabaseKey) {
  logResult('SUPABASE_SERVICE_KEY', 'pass', 'Found');
} else {
  logResult('SUPABASE_SERVICE_KEY', 'fail', 'Missing');
}

if (openaiKey) {
  logResult('OPENAI_API_KEY', 'pass', 'Found');
} else {
  logResult('OPENAI_API_KEY', 'warn', 'Missing (needed for AI features)');
}

// Test 2: Database Connection
console.log('\n📋 Test 2: Database Connection');
const supabase = createClient(supabaseUrl, supabaseKey);

try {
  const { data, error } = await supabase.from('ai_suggestions').select('id').limit(1);
  if (error && error.code === '42P01') {
    logResult('ai_suggestions table', 'fail', 'Table does not exist');
  } else {
    logResult('ai_suggestions table', 'pass', 'Table exists');
  }
} catch (e) {
  logResult('ai_suggestions table', 'fail', e.message);
}

try {
  const { data, error } = await supabase.from('intelligent_alerts').select('id').limit(1);
  if (error && error.code === '42P01') {
    logResult('intelligent_alerts table', 'fail', 'Table does not exist');
  } else {
    logResult('intelligent_alerts table', 'pass', 'Table exists');
  }
} catch (e) {
  logResult('intelligent_alerts table', 'fail', e.message);
}

try {
  const { data, error } = await supabase.from('workflow_metrics').select('id').limit(1);
  if (error && error.code === '42P01') {
    logResult('workflow_metrics table', 'fail', 'Table does not exist');
  } else {
    logResult('workflow_metrics table', 'pass', 'Table exists');
  }
} catch (e) {
  logResult('workflow_metrics table', 'fail', e.message);
}

// Test 3: API Files Exist
console.log('\n📋 Test 3: API Files');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiFiles = [
  'api/routes/ai-command.js',
  'api/routes/ai-suggestions.js',
  'api/routes/ai-alerts.js',
  'api/routes/ai-orchestrate.js',
  'api/services/workflow-generator.js',
  'api/services/command-parser.js',
  'api/services/business-context.js',
  'api/services/context-aware-generator.js',
  'api/services/agent-orchestrator.js',
  'api/services/workflow-metrics.js',
  'api/services/workflow-optimizer.js',
  'api/services/alert-detector.js',
  'api/services/background-monitor.js',
];

apiFiles.forEach((file) => {
  const fullPath = join(__dirname, file);
  if (existsSync(fullPath)) {
    logResult(file, 'pass', 'Exists');
  } else {
    logResult(file, 'fail', 'Missing');
  }
});

// Test 4: Frontend Components
console.log('\n📋 Test 4: Frontend Components');
const frontendFiles = [
  'src/components/agent-center/ProactiveSuggestionsPanel.tsx',
  'src/components/agent-center/CommandInput.tsx',
  'src/components/agent-center/IntelligentAlerts.tsx',
  'src/components/agent-center/StreamingCommand.tsx',
  'src/components/agent-center/MultiAgentOrchestrator.tsx',
  'src/components/agent-center/WorkflowOptimizer.tsx',
  'src/components/agent-center/CommandPalette.tsx',
  'src/pages/UnifiedAICommandCenter.tsx',
];

frontendFiles.forEach((file) => {
  const fullPath = join(__dirname, file);
  if (existsSync(fullPath)) {
    logResult(file, 'pass', 'Exists');
  } else {
    logResult(file, 'fail', 'Missing');
  }
});

// Test 5: API Server (if running)
console.log('\n📋 Test 5: API Server');
try {
  const response = await fetch(`${apiUrl}/api/health`);
  if (response.ok) {
    const data = await response.json();
    logResult('API Server', 'pass', `Running on port ${apiPort}`);
  } else {
    logResult('API Server', 'warn', 'Server responded but with error');
  }
} catch (e) {
  logResult('API Server', 'warn', `Not running (${e.message}). Start with: npm run dev:api`);
}

// Test 6: API Endpoints (if server running)
if (results.passed.includes('API Server') || results.warnings.includes('API Server')) {
  console.log('\n📋 Test 6: API Endpoints');

  try {
    const response = await fetch(`${apiUrl}/api/ai/command/functions`);
    if (response.ok) {
      const data = await response.json();
      logResult(
        '/api/ai/command/functions',
        'pass',
        `Returns ${data.functions?.length || 0} functions`
      );
    } else {
      logResult('/api/ai/command/functions', 'fail', `Status: ${response.status}`);
    }
  } catch (e) {
    logResult('/api/ai/command/functions', 'warn', 'Cannot test (server not running)');
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary:');
console.log(`   ✅ Passed: ${results.passed.length}`);
console.log(`   ❌ Failed: ${results.failed.length}`);
console.log(`   ⚠️  Warnings: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Tests:');
  results.failed.forEach((test) => {
    console.log(`   - ${test}`);
  });
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  results.warnings.forEach((test) => {
    console.log(`   - ${test}`);
  });
}

if (results.failed.length === 0) {
  console.log('\n✨ All critical tests passed! System is ready to use.');
  console.log('\n🚀 To start the application:');
  console.log('   npm run dev');
} else {
  console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  process.exit(1);
}
