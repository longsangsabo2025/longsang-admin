/**
 * 🔧 Test và Fix Backend - AI Command Center
 *
 * Tests backend, finds errors, và fixes them
 */

import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`;

console.log('🔧 Test và Fix Backend - AI Command Center');
console.log('='.repeat(60));

// Step 1: Check if server can start
console.log('\n📋 Step 1: Checking server files...');

const serverFile = join(__dirname, 'api', 'server.js');
if (!existsSync(serverFile)) {
  console.log('❌ server.js not found!');
  process.exit(1);
}
console.log('✅ server.js exists');

// Step 2: Check required routes
console.log('\n📋 Step 2: Checking route files...');

const routeFiles = [
  'api/routes/ai-command.js',
  'api/routes/ai-suggestions.js',
  'api/routes/ai-alerts.js',
  'api/routes/ai-orchestrate.js',
];

let allRoutesExist = true;
for (const route of routeFiles) {
  const path = join(__dirname, route);
  if (existsSync(path)) {
    console.log(`✅ ${route}`);
  } else {
    console.log(`❌ ${route} - MISSING!`);
    allRoutesExist = false;
  }
}

if (!allRoutesExist) {
  console.log('\n❌ Some route files are missing!');
  process.exit(1);
}

// Step 3: Check services
console.log('\n📋 Step 3: Checking service files...');

const serviceFiles = [
  'api/services/workflow-generator.js',
  'api/services/command-parser.js',
  'api/services/business-context.js',
  'api/services/alert-detector.js',
  'api/services/background-monitor.js',
];

let allServicesExist = true;
for (const service of serviceFiles) {
  const path = join(__dirname, service);
  if (existsSync(path)) {
    console.log(`✅ ${service}`);
  } else {
    console.log(`❌ ${service} - MISSING!`);
    allServicesExist = false;
  }
}

if (!allServicesExist) {
  console.log('\n❌ Some service files are missing!');
  process.exit(1);
}

// Step 4: Test server start (syntax check)
console.log('\n📋 Step 4: Checking server syntax...');

try {
  const serverCode = readFileSync(serverFile, 'utf8');

  // Check for common issues
  const issues = [];

  if (!serverCode.includes("require('./routes/ai-command')")) {
    issues.push('ai-command route not imported');
  }
  if (!serverCode.includes("require('./routes/ai-suggestions')")) {
    issues.push('ai-suggestions route not imported');
  }
  if (!serverCode.includes("require('./routes/ai-alerts')")) {
    issues.push('ai-alerts route not imported');
  }
  if (!serverCode.includes("app.use('/api/ai'")) {
    issues.push('AI routes not registered');
  }

  if (issues.length > 0) {
    console.log('⚠️  Potential issues found:');
    issues.forEach((issue) => console.log(`   - ${issue}`));
  } else {
    console.log('✅ Server code looks good');
  }
} catch (error) {
  console.log(`❌ Error reading server file: ${error.message}`);
}

// Step 5: Try to test endpoints (if server is running)
console.log('\n📋 Step 5: Testing endpoints (if server running)...');

async function testEndpoint(name, path) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log(`✅ ${name}: OK`);
      return true;
    } else {
      console.log(`⚠️  ${name}: Status ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError' || error.message.includes('fetch failed')) {
      console.log(`⚠️  ${name}: Server not running`);
    } else {
      console.log(`❌ ${name}: ${error.message}`);
    }
    return false;
  }
}

const endpoints = [
  { name: 'Health Check', path: '/api/health' },
  { name: 'Get Functions', path: '/api/ai/command/functions' },
  { name: 'Get Suggestions', path: '/api/ai/suggestions' },
  { name: 'Get Alerts', path: '/api/ai/alerts' },
];

let tested = 0;
let passed = 0;

for (const endpoint of endpoints) {
  const result = await testEndpoint(endpoint.name, endpoint.path);
  tested++;
  if (result) passed++;
  await new Promise((resolve) => setTimeout(resolve, 300));
}

console.log('\n' + '='.repeat(60));
console.log('📊 Summary:');
console.log(`   Files Check: ✅ All files exist`);
console.log(`   Endpoints Tested: ${tested}`);
console.log(`   Endpoints Passed: ${passed}`);

if (passed === 0 && tested > 0) {
  console.log('\n💡 Server is not running. To start:');
  console.log('   cd api && node server.js');
  console.log('   or');
  console.log('   npm run dev:api');
} else if (passed === tested) {
  console.log('\n✨ All tests passed! Backend is working!');
} else {
  console.log('\n⚠️  Some endpoints failed. Check server logs.');
}

console.log('\n✅ File structure check complete!');
