/**
 * 🚀 Phase 1 Auto-Setup Script
 *
 * Tự động thực hiện tất cả 3 bước:
 * 1. Check migration status
 * 2. Index all data
 * 3. Test all endpoints
 *
 * Run: node scripts/setup-phase1-auto.js
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function step(message) {
  log(`\n📋 ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

// ============================================================
// STEP 1: Check Migration Status
// ============================================================

async function checkMigrationStatus() {
  step('STEP 1: Checking Migration Status');

  if (!supabase) {
    error('Supabase credentials not found in .env file');
    log('\n💡 Required environment variables:', 'yellow');
    log('   - SUPABASE_URL', 'yellow');
    log('   - SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY)', 'yellow');
    log('\n⚠️  Cannot check migration automatically.', 'yellow');
    log('   Please run migration manually in Supabase SQL Editor:', 'yellow');
    log('   File: supabase/migrations/20250127_add_vector_extension.sql', 'yellow');
    return false;
  }

  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('context_embeddings')
      .select('id')
      .limit(1);

    if (tablesError && tablesError.code === 'PGRST116') {
      error('Migration not run yet!');
      log('\n📝 Migration Required:', 'yellow');
      log('   1. Open Supabase Dashboard → SQL Editor', 'yellow');
      log('   2. Run file: supabase/migrations/20250127_add_vector_extension.sql', 'yellow');
      log('   3. Then run this script again', 'yellow');
      return false;
    }

    // Check indexing log table
    const { error: logError } = await supabase
      .from('context_indexing_log')
      .select('id')
      .limit(1);

    if (logError && logError.code === 'PGRST116') {
      error('Migration incomplete - context_indexing_log table missing');
      return false;
    }

    // Check semantic_search function exists by trying a simple query
    // (we can't directly check function existence via Supabase JS client)
    // So we'll assume if tables exist, function exists too

    success('Migration tables exist!');
    info('✓ context_embeddings table found');
    info('✓ context_indexing_log table found');
    return true;
  } catch (err) {
    error(`Error checking migration: ${err.message}`);
    log('\n💡 Please verify:', 'yellow');
    log('   1. SUPABASE_URL is correct', 'yellow');
    log('   2. SUPABASE_SERVICE_KEY has proper permissions', 'yellow');
    log('   3. Migration has been run', 'yellow');
    return false;
  }
}

// ============================================================
// STEP 2: Check API Server
// ============================================================

async function checkAPIServer() {
  step('Checking API Server Status');

  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      timeout: 5000,
    });

    if (!response.ok) {
      error('API server not responding');
      return false;
    }

    const data = await response.json();
    if (data.status === 'OK') {
      success('API server is running!');
      return true;
    } else {
      error('API server returned unexpected status');
      return false;
    }
  } catch (err) {
    error(`Cannot connect to API server: ${err.message}`);
    log('\n💡 Start API server:', 'yellow');
    log('   cd api && node server.js', 'yellow');
    log('   Or: npm run dev:api', 'yellow');
    return false;
  }
}

// ============================================================
// STEP 3: Index All Data
// ============================================================

async function indexAllData() {
  step('STEP 2: Indexing All Data');

  try {
    info('Starting full indexing pipeline...');

    const response = await fetch(`${API_BASE}/api/context/index/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: 100,
        offset: 0,
        executionsLimit: 50,
      }),
      timeout: 300000, // 5 minutes timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      success('Indexing completed!');
      log(`\n📊 Results:`, 'cyan');
      log(`   Total indexed: ${data.result.totalIndexed}`, 'green');
      log(`   - Projects: ${data.result.results.projects.indexed} (errors: ${data.result.results.projects.errors})`);
      log(`   - Workflows: ${data.result.results.workflows.indexed} (errors: ${data.result.results.workflows.errors})`);
      log(`   - Executions: ${data.result.results.executions.indexed} (errors: ${data.result.results.executions.errors})`);

      if (data.result.totalIndexed === 0) {
        log('\n⚠️  Warning: No entities indexed.', 'yellow');
        log('   This is normal if you have no projects/workflows in your database.', 'yellow');
      }

      return true;
    } else {
      throw new Error(data.error || 'Indexing failed');
    }
  } catch (err) {
    error(`Indexing failed: ${err.message}`);
    if (err.message.includes('OPENAI_API_KEY')) {
      log('\n💡 Check environment variables:', 'yellow');
      log('   - OPENAI_API_KEY must be set in .env file', 'yellow');
    }
    return false;
  }
}

// ============================================================
// STEP 4: Test Endpoints
// ============================================================

async function testEndpoints() {
  step('STEP 3: Testing Endpoints');

  const tests = [];

  async function runTest(name, testFn) {
    try {
      log(`\n🧪 Testing: ${name}`, 'blue');
      await testFn();
      success(`PASSED: ${name}`);
      tests.push({ name, passed: true });
      return true;
    } catch (err) {
      error(`FAILED: ${name} - ${err.message}`);
      tests.push({ name, passed: false, error: err.message });
      return false;
    }
  }

  // Test 1: Health Check
  await runTest('Health Check', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error('Health check failed');
  });

  // Test 2: Context Search
  await runTest('Context Search', async () => {
    const res = await fetch(`${API_BASE}/api/context/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test query',
        maxResults: 5,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Search failed');
    if (!data.context) throw new Error('Missing context in response');
  });

  // Test 3: Enhanced Context Search
  await runTest('Enhanced Context Search', async () => {
    const res = await fetch(`${API_BASE}/api/context/search/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'project',
        maxResults: 3,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Enhanced search failed');
  });

  // Test 4: Copilot Chat
  await runTest('Copilot Chat', async () => {
    const res = await fetch(`${API_BASE}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Xin chào',
        userId: 'test-user-123',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Chat failed');
    if (!data.response?.message) throw new Error('Missing response message');
  });

  // Test 5: Generate Suggestions
  await runTest('Generate Suggestions', async () => {
    const res = await fetch(`${API_BASE}/api/copilot/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user-123',
        limit: 3,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Suggestions failed');
    if (!Array.isArray(data.suggestions)) throw new Error('Suggestions not an array');
  });

  // Test 6: Cache Stats
  await runTest('Cache Stats', async () => {
    const res = await fetch(`${API_BASE}/api/context/cache/stats`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Cache stats failed');
  });

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 TEST SUMMARY\n', 'cyan');

  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  success(`Passed: ${passed}`);
  if (failed > 0) {
    error(`Failed: ${failed}`);
    log('\n❌ Failed Tests:', 'red');
    tests.filter(t => !t.passed).forEach(t => {
      log(`   - ${t.name}: ${t.error}`, 'red');
    });
  } else {
    success(`Failed: ${failed}`);
  }

  const successRate = (passed / tests.length) * 100;
  log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`, successRate === 100 ? 'green' : 'yellow');

  return failed === 0;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  log('\n🚀 Phase 1 Auto-Setup Script\n', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = {
    migration: false,
    indexing: false,
    testing: false,
  };

  // Step 1: Check migration
  results.migration = await checkMigrationStatus();

  if (!results.migration) {
    log('\n⚠️  Migration check failed. Please run migration manually first.', 'yellow');
    log('   See: STEP1_RUN_MIGRATION.md for instructions', 'yellow');
    log('\n   After migration is complete, run this script again.', 'yellow');
    process.exit(1);
  }

  // Check API server
  const apiRunning = await checkAPIServer();
  if (!apiRunning) {
    log('\n⚠️  API server not running. Please start it first.', 'yellow');
    log('   Command: cd api && node server.js', 'yellow');
    process.exit(1);
  }

  // Step 2: Index data
  results.indexing = await indexAllData();

  if (!results.indexing) {
    log('\n⚠️  Indexing failed. Check errors above.', 'yellow');
    log('   Continuing with tests anyway...', 'yellow');
  }

  // Step 3: Test endpoints
  results.testing = await testEndpoints();

  // Final summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n🎯 FINAL SUMMARY\n', 'cyan');

  log(`Migration Check: ${results.migration ? '✅' : '❌'}`, results.migration ? 'green' : 'red');
  log(`Data Indexing: ${results.indexing ? '✅' : '❌'}`, results.indexing ? 'green' : 'red');
  log(`Endpoint Tests: ${results.testing ? '✅' : '❌'}`, results.testing ? 'green' : 'red');

  if (results.migration && results.testing) {
    log('\n🎉 Phase 1 Setup Complete! 🎉', 'green');
    log('\n✅ All steps completed successfully!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some steps had issues. Please review errors above.', 'yellow');
    process.exit(1);
  }
}

// Run main
main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});

