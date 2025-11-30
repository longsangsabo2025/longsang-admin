# 🧪 STEP 3: Test Endpoints

**Purpose:** Verify all Phase 1 endpoints work correctly

---

## Prerequisites

- ✅ Step 1 complete (migration run)
- ✅ Step 2 complete (data indexed)
- ✅ API server running

---

## Test Scripts

### Test 1: Health Check

```bash
curl http://localhost:3001/api/health
```

**Expected:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-27T..."
}
```

---

### Test 2: Context Search (Basic)

```bash
curl -X POST http://localhost:3001/api/context/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "dự án Vũng Tàu",
    "similarityThreshold": 0.7,
    "maxResults": 5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "context": {
    "query": "dự án Vũng Tàu",
    "results": [
      {
        "entity_type": "project",
        "entity_id": "...",
        "entity_name": "Vũng Tàu Dream Homes",
        "similarity": 0.92,
        "relevanceScore": 0.89,
        "project_id": "..."
      }
    ],
    "summary": "Found 1 relevant results: ...",
    "totalResults": 1
  }
}
```

**✅ Success Criteria:**
- Returns `success: true`
- Has `results` array (even if empty)
- Has `summary` field

---

### Test 3: Enhanced Context Search

```bash
curl -X POST http://localhost:3001/api/context/search/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "workflow automation",
    "maxResults": 3
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "context": {
    "semantic": {
      "results": [...],
      "summary": "..."
    },
    "business": {
      "currentProjects": [...],
      "recentWorkflows": [...],
      "domain": "longsang"
    },
    "combined": {
      "projects": [...],
      "workflows": [...]
    }
  }
}
```

**✅ Success Criteria:**
- Returns `success: true`
- Has `semantic` section
- Has `business` section
- Has `combined` section

---

### Test 4: Copilot Chat

```bash
curl -X POST http://localhost:3001/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Xin chào, bạn có thể giúp tôi gì?",
    "userId": "test-user-123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": {
    "message": "Xin chào! Tôi là AI Copilot của LongSang Admin...",
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 50,
      "total_tokens": 200
    },
    "contextUsed": {
      "semanticResults": 3,
      "businessProjects": 5
    }
  }
}
```

**✅ Success Criteria:**
- Returns `success: true`
- Has `message` field (non-empty)
- Has `usage` statistics

---

### Test 5: Generate Suggestions

```bash
curl -X POST http://localhost:3001/api/copilot/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "limit": 5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "id": "suggestion-...",
      "type": "action",
      "priority": "high",
      "reason": "...",
      "suggested_action": {
        "action": "create_post",
        "parameters": {}
      },
      "estimated_impact": "..."
    }
  ],
  "count": 5
}
```

**✅ Success Criteria:**
- Returns `success: true`
- Has `suggestions` array
- Each suggestion has required fields

---

### Test 6: Parse Command

```bash
curl -X POST http://localhost:3001/api/copilot/parse-command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Tạo bài post về dự án Vũng Tàu",
    "userId": "test-user-123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "parsed": [
    {
      "id": "...",
      "function": "create_post",
      "arguments": {
        "topic": "dự án Vũng Tàu",
        "project_id": "..."
      }
    }
  ],
  "contextUsed": {
    "project_id": "...",
    "project_name": "..."
  }
}
```

**✅ Success Criteria:**
- Returns `success: true`
- Has `parsed` array
- Has `contextUsed` field

---

### Test 7: Cache Stats

```bash
curl http://localhost:3001/api/context/cache/stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "size": 5,
    "entries": ["...", "..."]
  }
}
```

**✅ Success Criteria:**
- Returns `success: true`
- Has `stats` object

---

### Test 8: Clear Cache

```bash
curl -X POST http://localhost:3001/api/context/cache/clear
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

---

## Automated Test Script

Create `scripts/test-phase1-endpoints.js`:

```javascript
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';
const tests = [];

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    console.log(`✅ PASSED: ${name}`);
    tests.push({ name, passed: true });
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    tests.push({ name, passed: false, error: error.message });
  }
}

async function runTests() {
  console.log('🚀 Starting Phase 1 Endpoint Tests\n');

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
    if (!data.success) throw new Error(data.error);
    if (!data.context) throw new Error('Missing context');
  });

  // Test 3: Copilot Chat
  await test('Copilot Chat', async () => {
    const res = await fetch(`${API_BASE}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        userId: 'test-user',
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    if (!data.response?.message) throw new Error('Missing response message');
  });

  // Test 4: Suggestions
  await test('Generate Suggestions', async () => {
    const res = await fetch(`${API_BASE}/api/copilot/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        limit: 3,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    if (!Array.isArray(data.suggestions)) throw new Error('Suggestions not an array');
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
  }

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
  }
}

runTests().catch(console.error);
```

Run:
```bash
node scripts/test-phase1-endpoints.js
```

---

## ✅ Step 3 Complete When:

- [ ] Health check returns OK
- [ ] Context search returns results
- [ ] Enhanced search works
- [ ] Copilot chat responds
- [ ] Suggestions are generated
- [ ] Command parsing works
- [ ] Cache endpoints work

**All endpoints functional = Phase 1 fully operational!** 🎉

---

## 🎯 Next Steps

Once all tests pass:

1. **Integrate with Frontend** - Connect UI components
2. **Monitor Performance** - Check indexing logs, cache stats
3. **Optimize** - Tune similarity thresholds, cache TTL
4. **Proceed to Phase 2** - Agent System implementation

---

## 📝 Test Results Template

```
Date: 2025-01-27
Tester: [Your Name]

✅ Health Check: PASSED
✅ Context Search: PASSED
✅ Enhanced Search: PASSED
✅ Copilot Chat: PASSED
✅ Suggestions: PASSED
✅ Parse Command: PASSED
✅ Cache Stats: PASSED
✅ Clear Cache: PASSED

Overall: ✅ ALL TESTS PASSED

Notes: [Any observations or issues]
```

---

**Ready to proceed to Phase 2 once all tests pass!** 🚀

