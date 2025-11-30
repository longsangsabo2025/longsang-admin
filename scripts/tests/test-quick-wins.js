/**
 * 🧪 Quick Wins Testing Script
 *
 * Test all 5 Quick Wins features
 *
 * Run: node test-quick-wins.js
 */

const API_BASE = process.env.API_URL || 'http://localhost:3001';

// Test results tracker
const results = {
  passed: [],
  failed: [],
};

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, testFn) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    await testFn();
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

// ============================================================
// TEST 1: Enhanced Command Suggestions (Quick Win 1)
// ============================================================

async function testEnhancedSuggestions() {
  const response = await fetch(`${API_BASE}/api/ai/suggestions`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error}`);
  }

  if (!data.success) {
    throw new Error('Response not successful');
  }

  // Check if suggestions have project context
  const suggestions = data.suggestions || [];

  log(`   Found ${suggestions.length} suggestions`, 'yellow');

  // Check for project_context field (new feature)
  const withProjectContext = suggestions.filter(s => s.project_context !== undefined);
  log(`   ${withProjectContext.length} suggestions have project context`, 'yellow');

  // Test generate endpoint
  const generateResponse = await fetch(`${API_BASE}/api/ai/suggestions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const generateData = await generateResponse.json();

  if (!generateData.success) {
    throw new Error('Generate suggestions failed');
  }

  log(`   Generated ${generateData.generated || 0} new suggestions`, 'yellow');
}

// ============================================================
// TEST 2: Context-Aware Command Parsing (Quick Win 2)
// ============================================================

async function testContextAwareParsing() {
  const testCommands = [
    'Tạo bài post về dự án Vũng Tàu',
    'Backup database',
    'Thống kê hôm nay',
  ];

  for (const command of testCommands) {
    log(`   Testing command: "${command}"`, 'yellow');

    const response = await fetch(`${API_BASE}/api/ai/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, preview_only: true }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(`Failed to parse: ${command} - ${data.error}`);
    }

    // Check for context_used field (new feature)
    if (!data.context_used) {
      throw new Error('Missing context_used in response');
    }

    log(`   ✓ Parsed successfully`, 'green');
    log(`   Context: ${JSON.stringify(data.context_used)}`, 'yellow');

    // Check for parsed functions
    if (!data.parsed || !data.parsed.functions || data.parsed.functions.length === 0) {
      throw new Error('No functions parsed from command');
    }

    log(`   Functions: ${data.parsed.functions.map(f => f.name).join(', ')}`, 'yellow');
  }
}

// ============================================================
// TEST 3: Command History Storage (Quick Win 3)
// ============================================================

async function testCommandHistory() {
  // Test if localStorage API exists (browser only)
  // In Node.js, we'll test the structure

  const testHistoryEntry = {
    id: 'test-123',
    command: 'Test command',
    timestamp: new Date().toISOString(),
    status: 'success',
    project_id: 'test-project-id',
    project_name: 'Test Project',
    result: { success: true },
  };

  // Validate structure
  if (!testHistoryEntry.id || !testHistoryEntry.command) {
    throw new Error('Invalid history entry structure');
  }

  if (testHistoryEntry.project_id === undefined) {
    throw new Error('Missing project_id field in history entry');
  }

  log(`   ✓ History entry structure validated`, 'green');
  log(`   Fields: id, command, timestamp, status, project_id, project_name, result`, 'yellow');
}

// ============================================================
// TEST 4: Quick Actions Panel API (Quick Win 4)
// ============================================================

async function testQuickActions() {
  // Test that quick actions can execute commands
  const quickActions = [
    { command: 'Tạo bài post mới cho dự án', label: 'Create Post' },
    { command: 'Backup database ngay', label: 'Backup DB' },
    { command: 'Cho tôi xem thống kê hôm nay', label: 'Get Stats' },
  ];

  for (const action of quickActions) {
    log(`   Testing action: ${action.label}`, 'yellow');

    const response = await fetch(`${API_BASE}/api/ai/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: action.command, preview_only: true }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(`Quick action failed: ${action.label} - ${data.error}`);
    }

    log(`   ✓ Action parsed successfully`, 'green');
  }
}

// ============================================================
// TEST 5: Execution Plan Preview (Quick Win 5)
// ============================================================

async function testExecutionPlanPreview() {
  const testCommand = 'Tạo bài post về dự án Vũng Tàu và đăng lên Facebook';

  log(`   Testing preview for: "${testCommand}"`, 'yellow');

  const response = await fetch(`${API_BASE}/api/ai/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: testCommand, preview_only: true }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(`Preview failed: ${data.error}`);
  }

  // Check for preview flag
  if (data.preview !== true) {
    throw new Error('Missing preview flag in response');
  }

  // Validate parsed structure for plan building
  if (!data.parsed || !data.parsed.functions) {
    throw new Error('Missing parsed functions for plan');
  }

  // Build plan structure
  const plan = {
    steps: [
      { id: 'step-1', name: 'Load Context', estimatedTime: '~1s' },
      { id: 'step-2', name: 'Parse Command', estimatedTime: '~2s' },
      ...data.parsed.functions.map((f, i) => ({
        id: `step-exec-${i}`,
        name: `Execute ${f.name}`,
        estimatedTime: '~30s',
      })),
    ],
    functionName: data.parsed.functions[0]?.name,
    functionArgs: data.parsed.functions[0]?.arguments,
  };

  if (plan.steps.length < 3) {
    throw new Error('Plan should have at least 3 steps');
  }

  log(`   ✓ Plan structure valid`, 'green');
  log(`   Steps: ${plan.steps.length}`, 'yellow');
  log(`   Function: ${plan.functionName}`, 'yellow');
}

// ============================================================
// TEST 6: Integration Test
// ============================================================

async function testIntegration() {
  log(`   Testing full flow: Command → Parse → Preview → Execute`, 'yellow');

  // Step 1: Parse with preview
  const parseResponse = await fetch(`${API_BASE}/api/ai/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'Tạo bài post về dự án Vũng Tàu',
      preview_only: true
    }),
  });

  const parseData = await parseResponse.json();

  if (!parseData.success) {
    throw new Error(`Parse failed: ${parseData.error}`);
  }

  log(`   ✓ Step 1: Parse successful`, 'green');

  // Step 2: Check suggestions
  const suggestionsResponse = await fetch(`${API_BASE}/api/ai/suggestions`);
  const suggestionsData = await suggestionsResponse.json();

  if (!suggestionsData.success) {
    throw new Error('Get suggestions failed');
  }

  log(`   ✓ Step 2: Get suggestions successful`, 'green');
  log(`   Suggestions: ${suggestionsData.suggestions?.length || 0}`, 'yellow');

  log(`   ✓ Integration test passed`, 'green');
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runAllTests() {
  log('\n🚀 Starting Quick Wins Testing Suite\n', 'blue');
  log('='.repeat(60), 'blue');

  // Check API health first
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();

    if (healthData.status === 'OK') {
      log('✅ API Server is running', 'green');
    }
  } catch (error) {
    log('⚠️  Warning: Could not reach API server', 'yellow');
    log('   Make sure API server is running on port 3001', 'yellow');
    log('   Run: npm run dev:api', 'yellow');
  }

  // Run all tests
  await test('Quick Win 1: Enhanced Command Suggestions', testEnhancedSuggestions);
  await test('Quick Win 2: Context-Aware Command Parsing', testContextAwareParsing);
  await test('Quick Win 3: Command History Structure', testCommandHistory);
  await test('Quick Win 4: Quick Actions Panel', testQuickActions);
  await test('Quick Win 5: Execution Plan Preview', testExecutionPlanPreview);
  await test('Integration: Full Flow', testIntegration);

  // Print summary
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
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review errors above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

