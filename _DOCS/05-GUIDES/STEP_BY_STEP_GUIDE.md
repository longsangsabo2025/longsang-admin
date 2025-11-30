# 📋 Step-by-Step Guide: Phase 1 Setup

**Complete guide to get Phase 1 up and running**

---

## 🎯 Overview

This guide walks you through 3 steps:
1. **Run Database Migration** - Set up vector database
2. **Index Initial Data** - Generate embeddings for existing data
3. **Test Endpoints** - Verify everything works

---

## 📋 STEP 1: Run Database Migration

### Goal
Enable pgvector extension and create tables for context embeddings.

### Instructions

**Option A: Supabase Dashboard (Recommended)**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** → **New query**
4. Open file: `supabase/migrations/20250127_add_vector_extension.sql`
5. Copy ALL contents and paste into SQL Editor
6. Click **Run** (or `Ctrl+Enter`)

**Verify:**
```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('context_embeddings', 'context_indexing_log');
```

Should return 2 rows.

### ✅ Step 1 Complete When:
- [ ] Migration executed successfully
- [ ] `context_embeddings` table exists
- [ ] `context_indexing_log` table exists

**📖 Detailed Guide:** See `STEP1_RUN_MIGRATION.md`

---

## 📇 STEP 2: Index Initial Data

### Goal
Generate embeddings and index all existing projects, workflows, and executions.

### Prerequisites
- ✅ Step 1 complete
- ✅ API server running

### Instructions

**1. Start API Server:**
```bash
cd api
node server.js
```

Should see:
```
🚀 API Server running on http://localhost:3001
📇 Context Indexing API available at http://localhost:3001/api/context/index
```

**2. Index All Data:**
```bash
# Option A: Using curl
curl -X POST http://localhost:3001/api/context/index/all \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "executionsLimit": 50}'

# Option B: Using script
node scripts/index-all-data.js
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Full indexing completed. Indexed X entities.",
  "result": {
    "totalIndexed": X,
    "results": {
      "projects": {"indexed": Y, "errors": 0},
      "workflows": {"indexed": Z, "errors": 0},
      "executions": {"indexed": W, "errors": 0}
    }
  }
}
```

**3. Verify in Database:**
```sql
-- Check embeddings count
SELECT entity_type, COUNT(*)
FROM context_embeddings
GROUP BY entity_type;
```

Should show counts > 0 if you have data.

### ✅ Step 2 Complete When:
- [ ] API server running
- [ ] Indexing completed successfully
- [ ] Embeddings exist in database (if you have data)

**📖 Detailed Guide:** See `STEP2_INDEX_DATA.md`

---

## 🧪 STEP 3: Test Endpoints

### Goal
Verify all Phase 1 endpoints work correctly.

### Instructions

**Option A: Automated Tests (Recommended)**

```bash
node scripts/test-phase1-endpoints.js
```

**Option B: Manual Testing**

**1. Health Check:**
```bash
curl http://localhost:3001/api/health
```

**2. Context Search:**
```bash
curl -X POST http://localhost:3001/api/context/search \
  -H "Content-Type: application/json" \
  -d '{"query": "dự án Vũng Tàu", "maxResults": 5}'
```

**3. Copilot Chat:**
```bash
curl -X POST http://localhost:3001/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Xin chào", "userId": "test-user"}'
```

**4. Generate Suggestions:**
```bash
curl -X POST http://localhost:3001/api/copilot/suggestions \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "limit": 5}'
```

### ✅ Step 3 Complete When:
- [ ] Health check returns OK
- [ ] Context search works
- [ ] Copilot chat responds
- [ ] Suggestions are generated
- [ ] All tests pass (if using script)

**📖 Detailed Guide:** See `STEP3_TEST_ENDPOINTS.md`

---

## 🎉 Completion Checklist

- [ ] ✅ Step 1: Migration run
- [ ] ✅ Step 2: Data indexed
- [ ] ✅ Step 3: Endpoints tested

**When all checked:** Phase 1 is fully operational! 🚀

---

## 🐛 Troubleshooting

### Step 1 Issues

**Error: "Extension vector does not exist"**
- Contact Supabase support or check if pgvector is available for your plan

**Error: "Table already exists"**
- Migration partially run. Check what exists and complete manually if needed.

### Step 2 Issues

**Error: "API server not running"**
- Start server: `cd api && node server.js`

**Error: "OPENAI_API_KEY not set"**
- Check `.env` file has valid OpenAI API key

**Error: "No entities indexed"**
- Check if you have data in projects/workflows tables

### Step 3 Issues

**Error: "ECONNREFUSED"**
- API server not running. Start it first.

**Error: "Cannot read property 'embedding'"**
- Check OpenAI API key is valid
- Check embeddings were generated in Step 2

---

## 📊 Quick Verification

After completing all steps, verify:

```bash
# 1. Check API health
curl http://localhost:3001/api/health

# 2. Check embeddings count in Supabase SQL Editor
SELECT COUNT(*) FROM context_embeddings;

# 3. Test semantic search
curl -X POST http://localhost:3001/api/context/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'

# 4. Test copilot
curl -X POST http://localhost:3001/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test"}'
```

All should return success responses.

---

## 🚀 Next Steps

Once all 3 steps complete:

1. **Monitor Performance**
   - Check indexing logs
   - Monitor cache stats
   - Watch for errors

2. **Optimize**
   - Tune similarity thresholds
   - Adjust cache TTL
   - Fine-tune relevance scoring

3. **Integrate Frontend**
   - Connect UI components
   - Add Copilot sidebar
   - Integrate suggestions

4. **Proceed to Phase 2**
   - Agent System implementation
   - Task planning
   - Workflow integration

---

## 📚 Reference Documents

- **Step 1 Details:** `STEP1_RUN_MIGRATION.md`
- **Step 2 Details:** `STEP2_INDEX_DATA.md`
- **Step 3 Details:** `STEP3_TEST_ENDPOINTS.md`
- **Phase 1 Overview:** `PHASE1_IMPLEMENTATION.md`
- **Quick Start:** `PHASE1_QUICK_START.md`

---

**Ready to start? Begin with Step 1!** 🎯

