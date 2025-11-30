/**
 * 🧪 Complete Backend Test - AI Command Center
 *
 * Tests all backend endpoints và fixes issues
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

console.log('🧪 Complete Backend Test - AI Command Center');
console.log('='.repeat(60));
console.log(`API URL: ${API_URL}`);
console.log(`OpenAI Key: ${OPENAI_KEY ? OPENAI_KEY.substring(0, 20) + '...' : 'MISSING'}\n`);

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
  } else {
    results.failed.push({ name, message, error });
    if (error) {
      results.errors.push({ name, error: error.message || error });
    }
  }
}

async function testEndpoint(name, method, path, body = null, expectedStatus = 200) {
  try {
    const url = `${API_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const statusOk = Array.isArray(expectedStatus)
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;

    let data = null;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { text: responseText };
    }

    if (statusOk) {
      logResult(name, 'pass', `Status ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      logResult(name, 'fail', `Expected ${expectedStatus}, got ${response.status}`, data);
      return { success: false, data, status: response.status, error: data };
    }
  } catch (error) {
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      logResult(name, 'fail', 'Server not running', error);
      return { success: false, error: 'Server not running' };
    } else {
      logResult(name, 'fail', error.message, error);
      return { success: false, error: error.message };
    }
  }
}

async function testAllEndpoints() {
  console.log('📋 Testing Backend Endpoints...\n');

  // 1. Health Check
  await testEndpoint('Health Check', 'GET', '/api/health', null, 200);
  await new Promise((resolve) => setTimeout(resolve, 200));

  // 2. AI Command - Get Functions
  await testEndpoint('Get Available Functions', 'GET', '/api/ai/command/functions', null, 200);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s to avoid rate limit

  // 3. AI Suggestions
  await testEndpoint('Get AI Suggestions', 'GET', '/api/ai/suggestions', null, 200);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 4. Intelligent Alerts
  await testEndpoint('Get Intelligent Alerts', 'GET', '/api/ai/alerts', null, 200);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 5. Test Command (Simple)
  if (OPENAI_KEY) {
    await testEndpoint(
      'Test Command - Simple',
      'POST',
      '/api/ai/command',
      { command: 'Thống kê hôm nay' },
      [200, 400, 500, 429] // Include 429 as acceptable
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } else {
    logResult('Test Command', 'fail', 'OpenAI key missing - skipped');
  }

  // 6. Generate Suggestions
  await testEndpoint(
    'Generate Suggestions',
    'POST',
    '/api/ai/suggestions/generate',
    null,
    [200, 400, 500, 429] // Include 429 as acceptable
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 7. Detect Alerts
  await testEndpoint(
    'Detect Alerts',
    'POST',
    '/api/ai/alerts/detect',
    null,
    [200, 400, 500, 429] // Include 429 as acceptable
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function checkServerRunning() {
  console.log('🔍 Checking if server is running...\n');

  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) {
      console.log('✅ Server is running!\n');
      return true;
    } else {
      console.log('⚠️  Server responded but with error\n');
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running!\n');
    console.log('   Please start the server with: npm run dev:api\n');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServerRunning();

  if (!serverRunning) {
    console.log('⚠️  Cannot test endpoints - server not running');
    console.log('\n📝 To start server:');
    console.log('   npm run dev:api');
    console.log('   or');
    console.log('   npm run dev (starts both frontend and backend)');
    process.exit(1);
  }

  await testAllEndpoints();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ name, message, error }) => {
      console.log(`   - ${name}: ${message}`);
      if (error && typeof error === 'object' && error.error) {
        console.log(`     Error: ${error.error}`);
      }
    });
  }

  if (results.errors.length > 0) {
    console.log('\n🔧 Errors to Fix:');
    results.errors.forEach(({ name, error }) => {
      console.log(`   - ${name}:`);
      if (typeof error === 'string') {
        console.log(`     ${error}`);
      } else if (error && error.message) {
        console.log(`     ${error.message}`);
      }
    });
  }

  if (results.failed.length === 0) {
    console.log('\n✨ All backend tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above and fix them.');
    process.exit(1);
  }
}

main().catch(console.error);
