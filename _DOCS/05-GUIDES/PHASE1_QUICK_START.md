# 🚀 Phase 1 Quick Start Guide

**Date:** 2025-01-27
**Purpose:** Get Phase 1 features up and running quickly

---

## ⚡ Quick Setup

### 1. Run Database Migration

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20250127_add_vector_extension.sql

-- Or via CLI:
supabase migration up
```

**This will:**
- Enable pgvector extension
- Create `context_embeddings` table
- Create `context_indexing_log` table
- Add semantic search function
- Create HNSW index for fast search

### 2. Verify Environment Variables

Make sure these are set in `.env`:

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
# OR
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start API Server

```bash
cd api
node server.js
```

You should see:
```
🚀 API Server running on http://localhost:3001
...
```

---

## 🧪 Test Endpoints

### Test 1: Index a Project

```bash
curl -X POST http://localhost:3001/api/context/index/all \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Full indexing completed. Indexed X entities.",
  "result": {
    "totalIndexed": X,
    "results": {
      "projects": {...},
      "workflows": {...},
      "executions": {...}
    }
  }
}
```

### Test 2: Semantic Search

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
        "similarity": 0.95,
        "relevanceScore": 0.92
      }
    ],
    "summary": "...",
    "totalResults": 1
  }
}
```

### Test 3: Copilot Chat

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

### Test 4: Generate Suggestions

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
      "reason": "Tạo bài post mới cho dự án Vũng Tàu",
      "suggested_action": {
        "action": "create_post",
        "parameters": {...}
      }
    }
  ],
  "count": 5
}
```

---

## 📋 Common Operations

### Index All Entities

```bash
# Index everything
curl -X POST http://localhost:3001/api/context/index/all

# Index only projects
curl -X POST http://localhost:3001/api/context/index/projects

# Index only workflows
curl -X POST http://localhost:3001/api/context/index/workflows

# Index recent executions
curl -X POST http://localhost:3001/api/context/index/executions
```

### Search Context

```bash
# Basic search
curl -X POST http://localhost:3001/api/context/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your search query"}'

# Enhanced search (with business context)
curl -X POST http://localhost:3001/api/context/search/enhanced \
  -H "Content-Type: application/json" \
  -d '{"query": "your search query"}'

# Filter by project
curl -X POST http://localhost:3001/api/context/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "your query",
    "projectId": "project-uuid-here"
  }'
```

### Cache Management

```bash
# View cache stats
curl http://localhost:3001/api/context/cache/stats

# Clear cache
curl -X POST http://localhost:3001/api/context/cache/clear
```

---

## 🐛 Troubleshooting

### Error: "Extension vector does not exist"

**Solution:** Run the migration in Supabase SQL Editor first.

### Error: "Cannot read property 'embedding' of undefined"

**Solution:** Check that OpenAI API key is set correctly.

### Error: "Relation context_embeddings does not exist"

**Solution:** Migration not run. Run `20250127_add_vector_extension.sql`.

### Low similarity scores (all < 0.5)

**Possible causes:**
1. Not enough data indexed
2. Query doesn't match indexed content
3. Embeddings not generated correctly

**Solution:**
- Index more data
- Try different query terms
- Check embedding generation logs

---

## 📊 Monitoring

### Check Indexing Status

```bash
# Check logs in Supabase
SELECT * FROM context_indexing_log
ORDER BY created_at DESC
LIMIT 10;
```

### Check Embeddings Count

```bash
SELECT
  entity_type,
  COUNT(*) as count
FROM context_embeddings
GROUP BY entity_type;
```

### Check Recent Indexing

```bash
SELECT * FROM context_indexing_log
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 20;
```

---

## ✅ Verification Checklist

- [ ] Migration run successfully
- [ ] Environment variables set
- [ ] API server starts without errors
- [ ] Can index at least one project
- [ ] Semantic search returns results
- [ ] Copilot chat responds
- [ ] Suggestions are generated

---

## 🚀 Next Steps

Once Phase 1 is verified working:

1. **Index existing data** - Run full indexing pipeline
2. **Test search quality** - Try various queries
3. **Integrate frontend** - Connect UI components
4. **Move to Phase 2** - Agent System implementation

---

**Quick Reference:**
- Full docs: `PHASE1_IMPLEMENTATION.md`
- Status: `_DOCS/PHASE1_STATUS.md`
- Strategy: `_DOCS/AI_PLATFORM_FOUNDER_STRATEGY.md`

