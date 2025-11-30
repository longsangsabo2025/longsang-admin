# 📋 STEP 1: Run Database Migration

**Purpose:** Enable pgvector extension and create tables for context embeddings

---

## Option A: Run in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open file: `supabase/migrations/20250127_add_vector_extension.sql`
   - Copy ALL contents

4. **Paste and Run**
   - Paste SQL into SQL Editor
   - Click "Run" or press `Ctrl+Enter`

5. **Verify Success**
   - Should see: "Success. No rows returned"
   - Check tables exist:
     ```sql
     SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name IN ('context_embeddings', 'context_indexing_log');
     ```

---

## Option B: Run via Supabase CLI

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref your-project-ref

# 4. Run migration
supabase migration up
```

---

## Verification Queries

After running migration, verify with these queries:

```sql
-- Check pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('context_embeddings', 'context_indexing_log');

-- Check semantic_search function exists
SELECT proname FROM pg_proc WHERE proname = 'semantic_search';

-- Check HNSW index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'context_embeddings'
AND indexname = 'idx_context_embeddings_vector';
```

**Expected Results:**
- ✅ pgvector extension enabled
- ✅ 2 tables created
- ✅ semantic_search function exists
- ✅ HNSW index created

---

## ⚠️ Troubleshooting

### Error: "Extension vector does not exist"
**Solution:** Your Supabase instance might need pgvector enabled. Contact Supabase support or check project settings.

### Error: "Permission denied"
**Solution:** Make sure you're using service_role key, not anon key.

### Error: "Table already exists"
**Solution:** Migration partially run. Check what exists and manually complete if needed.

---

## ✅ Step 1 Complete When:

- [ ] Migration SQL executed successfully
- [ ] `context_embeddings` table exists
- [ ] `context_indexing_log` table exists
- [ ] `semantic_search()` function exists
- [ ] HNSW index created

**Ready for Step 2:** Index Initial Data

