/**
 * Run All Tests Script
 *
 * Executes all test files in the project
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';
import { statSync } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function findTestFiles(dir) {
  const testFiles = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        testFiles.push(...await findTestFiles(fullPath));
      } else if (entry.name.endsWith('.test.js') || entry.name.endsWith('.test.ts')) {
        testFiles.push(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist
  }

  return testFiles;
}

async function runIntegrationTests() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('🧪 RUNNING INTEGRATION TESTS', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');

  try {
    const { stdout, stderr } = await execAsync('node tests/integration/test-runner-simple.js', {
      cwd: join(__dirname, '..'),
    });

    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }

    return stdout.includes('Integration tests: PASSING');
  } catch (error) {
    log(`❌ Integration tests failed: ${error.message}`, 'red');
    return false;
  }
}

async function runVitestTests(testType = 'all') {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log(`🧪 RUNNING VITEST TESTS (${testType})`, 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');

  let command;

  switch (testType) {
    case 'integration':
      command = 'npx vitest run tests/integration --reporter=verbose';
      break;
    case 'e2e':
      command = 'npx vitest run tests/e2e --reporter=verbose';
      break;
    case 'performance':
      command = 'npx vitest run tests/performance --reporter=verbose';
      break;
    case 'security':
      command = 'npx vitest run tests/security --reporter=verbose';
      break;
    default:
      command = 'npx vitest run --reporter=verbose';
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: join(__dirname, '..'),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    console.log(stdout);
    if (stderr && !stderr.includes('warnings')) {
      console.error(stderr);
    }

    return stdout.includes('Test Files') && (stdout.includes('passed') || stdout.includes('PASS'));
  } catch (error) {
    log(`⚠️  Vitest tests may need mocking fixes: ${error.message.split('\n')[0]}`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('🚀 COMPREHENSIVE TEST RUNNER', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  const projectRoot = join(__dirname, '..');

  // Find all test files
  log('\n📋 Scanning for test files...', 'blue');
  const integrationTests = await findTestFiles(join(projectRoot, 'tests', 'integration'));
  const e2eTests = await findTestFiles(join(projectRoot, 'tests', 'e2e'));
  const perfTests = await findTestFiles(join(projectRoot, 'tests', 'performance'));
  const securityTests = await findTestFiles(join(projectRoot, 'tests', 'security'));

  const totalTests = integrationTests.length + e2eTests.length + perfTests.length + securityTests.length;

  log(`   Found ${integrationTests.length} integration test files`, 'green');
  log(`   Found ${e2eTests.length} E2E test files`, 'green');
  log(`   Found ${perfTests.length} performance test files`, 'green');
  log(`   Found ${securityTests.length} security test files`, 'green');
  log(`   Total: ${totalTests} test files\n`, 'blue');

  const results = [];

  // Run integration tests (API-based)
  log('\n[1/4] Integration Tests (API-based)', 'cyan');
  results.push({
    name: 'Integration Tests',
    passed: await runIntegrationTests(),
    critical: true,
  });

  // Run Vitest integration tests
  log('\n[2/4] Vitest Integration Tests', 'cyan');
  results.push({
    name: 'Vitest Integration',
    passed: await runVitestTests('integration'),
    critical: false,
  });

  // Run E2E tests
  log('\n[3/4] E2E Tests', 'cyan');
  results.push({
    name: 'E2E Tests',
    passed: await runVitestTests('e2e'),
    critical: true,
  });

  // Run Performance tests
  log('\n[4/4] Performance Tests', 'cyan');
  results.push({
    name: 'Performance Tests',
    passed: await runVitestTests('performance'),
    critical: false,
  });

  // Run Security tests
  log('\n[5/5] Security Tests', 'cyan');
  results.push({
    name: 'Security Tests',
    passed: await runVitestTests('security'),
    critical: true,
  });

  // Summary
  log('\n\n═══════════════════════════════════════════════════════════', 'cyan');
  log('📊 FINAL TEST SUMMARY', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const criticalPassed = results.filter((r) => r.critical && r.passed).length;
  const criticalTotal = results.filter((r) => r.critical).length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    const critical = result.critical ? ' [CRITICAL]' : '';
    log(`${icon} ${result.name}${critical}`);
  });

  log(`\n📊 Overall: ${passed}/${total} test suites passed`, 'blue');
  log(`📊 Critical: ${criticalPassed}/${criticalTotal} critical suites passed`, 'blue');
  log(`📊 Test Files: ${totalTests} files available`, 'blue');

  if (criticalPassed === criticalTotal) {
    log('\n✅ All critical test suites passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some critical test suites failed or need fixes', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Test runner failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

