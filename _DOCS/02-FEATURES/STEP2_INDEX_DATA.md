# 📇 STEP 2: Index Initial Data

**Purpose:** Generate embeddings and index all existing projects, workflows, and executions

---

## Prerequisites

- ✅ Step 1 complete (migration run)
- ✅ API server running on port 3001
- ✅ Environment variables set (OPENAI_API_KEY, SUPABASE_URL, etc.)

---

## Start API Server

```bash
# In project root
cd api
node server.js

# Or if using npm scripts
npm run dev:api
```

**Expected Output:**
```
🚀 API Server running on http://localhost:3001
...
📇 Context Indexing API available at http://localhost:3001/api/context/index
```

---

## Index All Entities

### Option A: Full Indexing (Recommended)

This indexes all projects, workflows, and recent executions:

```bash
curl -X POST http://localhost:3001/api/context/index/all \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "offset": 0,
    "executionsLimit": 50
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Full indexing completed. Indexed X entities.",
  "result": {
    "totalIndexed": X,
    "results": {
      "projects": {
        "indexed": Y,
        "errors": 0
      },
      "workflows": {
        "indexed": Z,
        "errors": 0
      },
      "executions": {
        "indexed": W,
        "errors": 0
      }
    }
  }
}
```

### Option B: Index by Type

**Index Only Projects:**
```bash
curl -X POST http://localhost:3001/api/context/index/projects \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "offset": 0
  }'
```

**Index Only Workflows:**
```bash
curl -X POST http://localhost:3001/api/context/index/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "offset": 0
  }'
```

**Index Recent Executions:**
```bash
curl -X POST http://localhost:3001/api/context/index/executions \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 50
  }'
```

---

## Monitor Progress

### Check Indexing Log

Run in Supabase SQL Editor:

```sql
-- View recent indexing operations
SELECT
  entity_type,
  status,
  created_at,
  completed_at,
  error_message
FROM context_indexing_log
ORDER BY created_at DESC
LIMIT 20;
```

### Check Embeddings Count

```sql
-- Count embeddings by type
SELECT
  entity_type,
  COUNT(*) as count
FROM context_embeddings
GROUP BY entity_type
ORDER BY count DESC;
```

### Check Recent Embeddings

```sql
-- View recent embeddings
SELECT
  entity_type,
  entity_name,
  created_at
FROM context_embeddings
ORDER BY created_at DESC
LIMIT 10;
```

---

## Using Node.js Script (Alternative)

Create `scripts/index-all-data.js`:

```javascript
const fetch = require('node-fetch');

async function indexAllData() {
  try {
    console.log('🚀 Starting full indexing...');

    const response = await fetch('http://localhost:3001/api/context/index/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: 100,
        executionsLimit: 50,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Indexing complete!');
      console.log(`Total indexed: ${data.result.totalIndexed}`);
      console.log('Details:', JSON.stringify(data.result, null, 2));
    } else {
      console.error('❌ Indexing failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

indexAllData();
```

Run:
```bash
node scripts/index-all-data.js
```

---

## ⚠️ Troubleshooting

### Error: "API server not running"
**Solution:** Start API server first (`node api/server.js`)

### Error: "OPENAI_API_KEY not set"
**Solution:** Check `.env` file has `OPENAI_API_KEY=sk-...`

### Error: "Relation context_embeddings does not exist"
**Solution:** Step 1 migration not run. Run migration first.

### Error: "Rate limit exceeded" (OpenAI)
**Solution:** Index in smaller batches or add delays between requests.

### Low indexing count
**Solution:** Check if you have data in projects/workflows tables. Empty tables = nothing to index.

---

## ✅ Step 2 Complete When:

- [ ] API server running
- [ ] Full indexing completed successfully
- [ ] Embeddings exist in `context_embeddings` table
- [ ] At least 1 project indexed (if you have projects)
- [ ] No errors in indexing log

**Verify:**
```sql
SELECT COUNT(*) as total_embeddings FROM context_embeddings;
```

Should show > 0 if you have data.

**Ready for Step 3:** Test Endpoints

