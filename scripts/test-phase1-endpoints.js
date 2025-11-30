/**
 * 🧪 Phase 1 Endpoints Test Script
 *
 * Tests all Phase 1 API endpoints
 * Run: node scripts/test-phase1-endpoints.js
 */

const fetch = require('node-fetch');

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const results = {
  passed: [],
  failed: [],
};

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    await fn();
    log(`✅ PASSED: ${name}`, 'green');
    results.passed.push(name);
    return true;
  } catch (error) {
    log(`❌ FAILED: ${name}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    results.failed.push({ name, error: error.message });
    return false;
  }
}

async function runTests() {
  log('\n🚀 Starting Phase 1 Endpoint Tests\n', 'blue');
  log('='.repeat(60), 'blue');

  // Test 1: Health Check
  await test('Health Check', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error('Health check failed');
  });

  // Test 2: Context Search
  await test('Context Search', async () => {
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
  await test('Enhanced Context Search', async () => {
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
    if (!data.context) throw new Error('Missing context');
  });

  // Test 4: Copilot Chat
  await test('Copilot Chat', async () => {
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
    log(`   Response: ${data.response.message.substring(0, 100)}...`, 'yellow');
  });

  // Test 5: Generate Suggestions
  await test('Generate Suggestions', async () => {
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
    log(`   Generated ${data.suggestions.length} suggestions`, 'yellow');
  });

  // Test 6: Parse Command
  await test('Parse Command', async () => {
    const res = await fetch(`${API_BASE}/api/copilot/parse-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'Tạo bài post',
        userId: 'test-user-123',
      }),
    });
    const data = await res.json();
    if (!data.hasOwnProperty('success')) throw new Error('Invalid response format');
    // Command parsing may fail gracefully, so we just check response format
    log(`   Parsed: ${data.parsed?.length || 0} tool calls`, 'yellow');
  });

  // Test 7: Cache Stats
  await test('Cache Stats', async () => {
    const res = await fetch(`${API_BASE}/api/context/cache/stats`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Cache stats failed');
    if (!data.stats) throw new Error('Missing stats');
    log(`   Cache size: ${data.stats.size}`, 'yellow');
  });

  // Test 8: Clear Cache
  await test('Clear Cache', async () => {
    const res = await fetch(`${API_BASE}/api/context/cache/clear`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Clear cache failed');
  });

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 TEST SUMMARY\n', 'blue');

  log(`✅ Passed: ${results.passed.length}`, 'green');
  log(`❌ Failed: ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'green');

  if (results.passed.length > 0) {
    log('\n✅ Passed Tests:', 'green');
    results.passed.forEach(name => log(`   - ${name}`, 'green'));
  }

  if (results.failed.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.failed.forEach(({ name, error }) => {
      log(`   - ${name}`, 'red');
      log(`     ${error}`, 'red');
    });
  }

  const successRate = (results.passed.length / (results.passed.length + results.failed.length)) * 100;
  log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`, successRate === 100 ? 'green' : 'yellow');

  if (results.failed.length === 0) {
    log('\n🎉 ALL TESTS PASSED! 🎉', 'green');
    log('\n✅ Phase 1 is fully operational!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review errors above.', 'yellow');
    process.exit(1);
  }
}

// Check if API server is running
fetch(`${API_BASE}/api/health`)
  .then(() => runTests())
  .catch((error) => {
    log('\n❌ Cannot connect to API server', 'red');
    log(`   Error: ${error.message}`, 'red');
    log('\n💡 Make sure API server is running:', 'yellow');
    log('   cd api && node server.js', 'yellow');
    process.exit(1);
  });

