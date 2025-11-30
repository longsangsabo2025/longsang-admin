/**
 * 🧪 Final Backend Test - AI Command Center
 *
 * Tests all endpoints và reports results
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`;

console.log('🧪 Final Backend Test - AI Command Center');
console.log('='.repeat(60));
console.log(`API URL: ${API_URL}\n`);

const results = { passed: [], failed: [] };

async function test(name, method, path, body = null) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null,
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log(`✅ ${name}: OK`);
      results.passed.push(name);
      return true;
    } else {
      console.log(`❌ ${name}: ${response.status} - ${data.error || 'Error'}`);
      results.failed.push({ name, status: response.status, error: data.error });
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError' || error.message.includes('fetch failed')) {
      console.log(`⚠️  ${name}: Server not running`);
      results.failed.push({ name, error: 'Server not running' });
    } else {
      console.log(`❌ ${name}: ${error.message}`);
      results.failed.push({ name, error: error.message });
    }
    return false;
  }
}

async function main() {
  console.log('Testing endpoints...\n');

  await test('Health Check', 'GET', '/api/health');
  await new Promise((r) => setTimeout(r, 200));

  await test('Get Functions', 'GET', '/api/ai/command/functions');
  await new Promise((r) => setTimeout(r, 200));

  await test('Get Suggestions', 'GET', '/api/ai/suggestions');
  await new Promise((r) => setTimeout(r, 200));

  await test('Get Alerts', 'GET', '/api/ai/alerts');
  await new Promise((r) => setTimeout(r, 200));

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nFailed:');
    results.failed.forEach((f) => {
      console.log(`  - ${f.name}: ${f.error || f.status}`);
    });
  }

  if (results.passed.length === 4) {
    console.log('\n✨ All backend tests passed!');
  } else if (results.failed.some((f) => f.error === 'Server not running')) {
    console.log('\n💡 Start server: npm run dev:api');
  }
}

main().catch(console.error);
