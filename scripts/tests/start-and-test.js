/**
 * 🚀 Start Server and Test
 *
 * Starts API server và tests all endpoints
 */

import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`;

console.log('🚀 Starting API Server and Testing...');
console.log('='.repeat(60));

// Start server
const server = spawn('npm', ['run', 'dev:api'], {
  cwd: process.cwd(),
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);

  if (output.includes('API Server running') || output.includes('listening')) {
    serverReady = true;
    console.log('\n✅ Server is ready! Starting tests...\n');
    setTimeout(() => runTests(), 2000);
  }
});

server.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Wait for server to be ready
async function waitForServer(maxWait = 30000) {
  const startTime = Date.now();

  while (!serverReady && Date.now() - startTime < maxWait) {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) {
        serverReady = true;
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return serverReady;
}

async function testEndpoint(name, method, path, body = null) {
  try {
    const url = `${API_URL}${path}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log(`✅ ${name}: OK`);
      return { success: true, data };
    } else {
      console.log(`❌ ${name}: Status ${response.status} - ${data.error || 'Error'}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Backend Endpoints...\n');

  const tests = [
    { name: 'Health Check', method: 'GET', path: '/api/health' },
    { name: 'Get Functions', method: 'GET', path: '/api/ai/command/functions' },
    { name: 'Get Suggestions', method: 'GET', path: '/api/ai/suggestions' },
    { name: 'Get Alerts', method: 'GET', path: '/api/ai/alerts' },
  ];

  const results = [];
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.method, test.path);
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n✨ All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  }

  // Keep server running
  console.log('\n💡 Server is still running. Press Ctrl+C to stop.');
}

// Start
waitForServer().then((ready) => {
  if (ready) {
    runTests();
  } else {
    console.log('⚠️  Server did not start in time');
    process.exit(1);
  }
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping server...');
  server.kill();
  process.exit(0);
});
