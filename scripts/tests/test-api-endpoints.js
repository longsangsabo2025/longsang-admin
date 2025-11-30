/**
 * 🧪 Test API Endpoints
 *
 * Tests all AI Command Center API endpoints
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`;

const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: `${API_URL}/api/health`,
    expectedStatus: 200,
  },
  {
    name: 'Get Available Functions',
    method: 'GET',
    url: `${API_URL}/api/ai/command/functions`,
    expectedStatus: 200,
  },
  {
    name: 'Get AI Suggestions',
    method: 'GET',
    url: `${API_URL}/api/ai/suggestions`,
    expectedStatus: 200,
  },
  {
    name: 'Get Intelligent Alerts',
    method: 'GET',
    url: `${API_URL}/api/ai/alerts`,
    expectedStatus: 200,
  },
  {
    name: 'Test Command (Simple)',
    method: 'POST',
    url: `${API_URL}/api/ai/command`,
    body: { command: 'Thống kê hôm nay' },
    expectedStatus: [200, 400], // 400 if OpenAI key missing
  },
];

async function runTests() {
  console.log('🧪 Testing AI Command Center API Endpoints');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}\n`);

  const results = {
    passed: [],
    failed: [],
    skipped: [],
  };

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);

      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const statusOk = Array.isArray(test.expectedStatus)
        ? test.expectedStatus.includes(response.status)
        : response.status === test.expectedStatus;

      if (statusOk) {
        const data = await response.json().catch(() => ({}));
        console.log(`  ✅ ${test.name}: Status ${response.status}`);
        if (data.success !== undefined) {
          console.log(`     Success: ${data.success}`);
        }
        results.passed.push(test.name);
      } else {
        console.log(`  ❌ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`);
        results.failed.push(test.name);
      }
    } catch (error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        console.log(`  ⚠️  ${test.name}: Server not running`);
        results.skipped.push(test.name);
      } else {
        console.log(`  ❌ ${test.name}: ${error.message}`);
        results.failed.push(test.name);
      }
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${results.passed.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   ⚠️  Skipped: ${results.skipped.length}`);

  if (results.skipped.length > 0) {
    console.log('\n⚠️  To test API endpoints, start the server:');
    console.log('   npm run dev:api');
  }

  if (results.failed.length === 0 && results.skipped.length === 0) {
    console.log('\n✨ All API tests passed!');
  }
}

runTests().catch(console.error);
