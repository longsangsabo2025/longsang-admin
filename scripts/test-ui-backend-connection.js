import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:3001/api/brain';
const TEST_USER_ID = '6490f4e9-ed96-4121-9c70-bb4ad1feb71d';

async function testAPI(name, url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
        ...options.headers 
      },
      ...options
    });
    
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    if (res.ok) {
      console.log(`✅ ${name} - Status: ${res.status}`);
      if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
          console.log(`   📊 Returned ${data.length} items`);
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`   📊 Returned ${data.data.length} items`);
        } else {
          console.log(`   📊 Response:`, JSON.stringify(data).substring(0, 100));
        }
      }
      return { success: true, data };
    } else {
      console.log(`❌ ${name} - Status: ${res.status}`);
      console.log(`   Error: ${JSON.stringify(data).substring(0, 200)}`);
      return { success: false, error: data };
    }
  } catch (err) {
    console.log(`❌ ${name} - Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🧪 UI/UX ↔ BACKEND ↔ DATABASE CONNECTION TEST');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  // ==========================================
  // 1. DOMAINS API
  // ==========================================
  console.log('📁 1. DOMAINS API');
  console.log('-'.repeat(40));

  // GET domains
  let result = await testAPI('GET /domains', `${API_BASE}/domains?userId=${TEST_USER_ID}`);
  if (result.success) passed++; else failed++;

  // POST create domain
  result = await testAPI('POST /domains', `${API_BASE}/domains`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Domain ' + Date.now(),
      description: 'Created by UI test',
      userId: TEST_USER_ID
    })
  });
  if (result.success) passed++; else failed++;
  const testDomainId = result.data?.id || result.data?.data?.id;

  // ==========================================
  // 2. KNOWLEDGE API
  // ==========================================
  console.log('\n📚 2. KNOWLEDGE API');
  console.log('-'.repeat(40));

  // GET knowledge search
  result = await testAPI('GET /knowledge/search', `${API_BASE}/knowledge/search?q=test&userId=${TEST_USER_ID}`);
  if (result.success) passed++; else failed++;

  // POST knowledge ingest (if domain exists)
  if (testDomainId) {
    result = await testAPI('POST /knowledge/ingest', `${API_BASE}/knowledge/ingest`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Knowledge ' + Date.now(),
        content: 'This is test content for knowledge item',
        domainId: testDomainId,
        userId: TEST_USER_ID
      })
    });
    if (result.success) passed++; else failed++;
  }

  // ==========================================
  // 3. DOMAIN STATS API
  // ==========================================
  console.log('\n🧠 3. DOMAIN STATS API');
  console.log('-'.repeat(40));

  if (testDomainId) {
    result = await testAPI('GET /domains/:id/stats', `${API_BASE}/domains/${testDomainId}/stats?userId=${TEST_USER_ID}`);
    if (result.success) passed++; else failed++;
  } else {
    console.log('⚠️ Skipping domain stats (no domain created)');
  }

  // ==========================================
  // 4. CORE LOGIC API
  // ==========================================
  console.log('\n⚙️ 4. CORE LOGIC API');
  console.log('-'.repeat(40));

  if (testDomainId) {
    result = await testAPI('GET /domains/:id/core-logic', `${API_BASE}/domains/${testDomainId}/core-logic?userId=${TEST_USER_ID}`);
    // 404 "Core logic not found" is expected for new domains without core logic
    if (result.success || (result.error && result.error.error === 'Core logic not found')) {
      console.log('   ℹ️  Note: New domains have no core logic yet (expected)');
      passed++;
    } else {
      failed++;
    }
  } else {
    console.log('⚠️ Skipping core logic (no domain created)');
  }

  // ==========================================
  // 5. ACTIONS API (Phase 5)
  // ==========================================
  console.log('\n🎬 5. ACTIONS API (Phase 5)');
  console.log('-'.repeat(40));

  result = await testAPI('GET /actions', `${API_BASE}/actions?userId=${TEST_USER_ID}`);
  if (result.success) passed++; else failed++;

  result = await testAPI('POST /actions', `${API_BASE}/actions`, {
    method: 'POST',
    body: JSON.stringify({
      actionType: 'test_action',
      payload: { test: true, timestamp: Date.now() },
      userId: TEST_USER_ID
    })
  });
  if (result.success) passed++; else failed++;

  // ==========================================
  // 6. WORKFLOWS API (Phase 5)
  // ==========================================
  console.log('\n🔄 6. WORKFLOWS API (Phase 5)');
  console.log('-'.repeat(40));

  result = await testAPI('GET /workflows', `${API_BASE}/workflows?userId=${TEST_USER_ID}`);
  if (result.success) passed++; else failed++;

  result = await testAPI('POST /workflows', `${API_BASE}/workflows`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Workflow ' + Date.now(),
      description: 'Test workflow from UI test',
      triggerType: 'manual',
      actions: [{ type: 'notify', config: {} }],
      userId: TEST_USER_ID
    })
  });
  if (result.success) passed++; else failed++;

  // ==========================================
  // 7. TASKS API (Phase 5)
  // ==========================================
  console.log('\n📋 7. TASKS API (Phase 5)');
  console.log('-'.repeat(40));

  result = await testAPI('GET /tasks', `${API_BASE}/tasks?userId=${TEST_USER_ID}`);
  if (result.success) passed++; else failed++;

  result = await testAPI('POST /tasks', `${API_BASE}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Task ' + Date.now(),
      description: 'Test task from UI test',
      priority: 'medium',
      status: 'pending',
      userId: TEST_USER_ID
    })
  });
  if (result.success) passed++; else failed++;

  // ==========================================
  // 8. NOTIFICATIONS API (Phase 5)
  // ==========================================
  console.log('\n🔔 8. NOTIFICATIONS API (Phase 5)');
  console.log('-'.repeat(40));

  result = await testAPI('GET /notifications', `${API_BASE}/notifications?userId=${TEST_USER_ID}`);
  if (result.success) passed++; else failed++;

  result = await testAPI('POST /notifications', `${API_BASE}/notifications`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'info',
      message: 'Test notification from UI test ' + Date.now(),
      userId: TEST_USER_ID
    })
  });
  if (result.success) passed++; else failed++;

  // ==========================================
  // 9. MULTI-DOMAIN QUERY API
  // ==========================================
  console.log('\n🔍 9. MULTI-DOMAIN QUERY API');
  console.log('-'.repeat(40));

  result = await testAPI('POST /query', `${API_BASE}/query`, {
    method: 'POST',
    body: JSON.stringify({
      query: 'test query',
      userId: TEST_USER_ID
    })
  });
  if (result.success) passed++; else failed++;

  // ==========================================
  // 10. MASTER BRAIN API
  // ==========================================
  console.log('\n📊 10. MASTER BRAIN API');
  console.log('-'.repeat(40));

  result = await testAPI('GET /master/sessions', `${API_BASE}/master/sessions?userId=${TEST_USER_ID}`);
  if (result.success) passed++; else failed++;

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 API TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 ALL API ENDPOINTS WORKING! UI ↔ Backend ↔ Database connected!');
  } else {
    console.log('\n⚠️ Some API endpoints failed. Check the errors above.');
  }
}

main().catch(console.error);
