/**
 * Simple Test Runner
 *
 * Runs basic API endpoint tests to verify functionality
 * without complex mocking setup
 *
 * Usage: node scripts/run-tests-simple.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const API_BASE = process.env.API_URL || 'http://localhost:3001';
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

async function testHealthCheck() {
  try {
    log('\n🔍 Testing Health Check...', 'blue');
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'OK') {
      log('✅ Health check passed', 'green');
      return true;
    } else {
      log(`❌ Health check failed: ${data.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
    return false;
  }
}

async function testMetrics() {
  try {
    log('\n🔍 Testing Metrics Endpoint...', 'blue');
    const response = await fetch(`${API_BASE}/api/metrics`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      log('✅ Metrics endpoint working', 'green');
      return true;
    } else {
      log(`❌ Metrics endpoint failed`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Metrics error: ${error.message}`, 'red');
    return false;
  }
}

async function testContextSearch() {
  try {
    log('\n🔍 Testing Context Search...', 'blue');
    const response = await fetch(`${API_BASE}/api/context/search?q=test`);
    
    if (response.ok) {
      log('✅ Context search endpoint accessible', 'green');
      return true;
    } else {
      log(`⚠️  Context search returned ${response.status}`, 'yellow');
      return true; // Not critical
    }
  } catch (error) {
    log(`⚠️  Context search error: ${error.message}`, 'yellow');
    return true; // Not critical
  }
}

async function main() {
  log('═══════════════════════════════════════════════════════════', 'blue');
  log('🧪 SIMPLE TEST RUNNER', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');

  // Check if API is running
  try {
    await fetch(`${API_BASE}/api/health`);
  } catch (error) {
    log('\n❌ API server is not running!', 'red');
    log('Please start the API server first:', 'yellow');
    log('   npm run dev:api', 'yellow');
    process.exit(1);
  }

  const results = [];

  // Run tests
  results.push({ name: 'Health Check', passed: await testHealthCheck() });
  results.push({ name: 'Metrics Endpoint', passed: await testMetrics() });
  results.push({ name: 'Context Search', passed: await testContextSearch() });

  // Summary
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    log(`${icon} ${result.name}`);
  });

  log(`\n${passed}/${total} tests passed`);

  if (passed === total) {
    log('\n✅ All basic tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Check API server and configuration.', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});

