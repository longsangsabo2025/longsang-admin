# 📋 SQL MIGRATIONS HANDOFF - PHASE 3

**Ngày:** 29/11/2025
**Dự án:** Long Sang Forge - AI Second Brain
**Phase:** 3 - Core Logic Distillation
**Người nhận:** GitHub Copilot

---

## 🎯 MỤC ĐÍCH

Bàn giao SQL migrations cho Phase 3 để Copilot apply vào database. Phase 3 thêm Core Logic Distillation System với queue management và enhanced versioning.

---

## 📁 MIGRATIONS CẦN APPLY

### Migration 6: Core Logic Queue
**File:** `supabase/migrations/brain/006_core_logic_queue.sql`

**Mục đích:**
- Tạo queue system cho distillation jobs
- Support priority và retry logic
- Track job status và results

**Tables tạo:**
- `brain_core_logic_queue` - Queue table với RLS

**Functions tạo:**
- `get_next_distillation_job()` - Get next pending job
- `mark_distillation_job_complete()` - Mark job complete
- `mark_distillation_job_failed()` - Mark job failed với retry

**Indexes:**
- Indexes cho performance (status, priority, domain_id, user_id)

**RLS Policies:**
- Users can view own jobs
- Users can insert own jobs
- Users can update own jobs

---

### Migration 7: Core Logic Versioning
**File:** `supabase/migrations/brain/007_core_logic_versioning.sql`

**Mục đích:**
- Enhance versioning system với parent tracking
- Add comparison và rollback capabilities

**Alterations:**
- Add columns to `brain_core_logic`:
  - `parent_version_id` - Reference to parent version
  - `is_active` - Active flag
  - `change_summary` - Summary of changes
  - `change_reason` - Reason for change
  - `approved_by` - Approval tracking
  - `approved_at` - Approval timestamp

**Views tạo:**
- `brain_core_logic_version_history` - Version history view

**Functions tạo:**
- `get_latest_core_logic()` - Get latest active version
- `compare_core_logic_versions()` - Compare two versions
- `rollback_core_logic_version()` - Rollback to previous version

**Indexes:**
- Index on `parent_version_id`
- Index on `is_active` for active versions

---

## 🔧 APPLY INSTRUCTIONS

### Step 1: Verify Current State
```sql
-- Check existing brain_core_logic table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'brain_core_logic';

-- Check if queue table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'brain_core_logic_queue'
);
```

### Step 2: Apply Migration 6
```bash
# Apply via Supabase CLI
supabase db push

# Or apply directly via SQL
psql $DATABASE_URL -f supabase/migrations/brain/006_core_logic_queue.sql
```

**Expected Output:**
- Table `brain_core_logic_queue` created
- 3 functions created
- Indexes created
- RLS policies enabled

### Step 3: Apply Migration 7
```bash
# Apply via Supabase CLI
supabase db push

# Or apply directly via SQL
psql $DATABASE_URL -f supabase/migrations/brain/007_core_logic_versioning.sql
```

**Expected Output:**
- Columns added to `brain_core_logic`
- View `brain_core_logic_version_history` created
- 3 functions created
- Indexes created

### Step 4: Verify Migrations
```sql
-- Check queue table
SELECT COUNT(*) FROM brain_core_logic_queue;

-- Check versioning columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'brain_core_logic'
AND column_name IN ('parent_version_id', 'is_active', 'change_summary');

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%core_logic%' OR routine_name LIKE '%distillation%';
```

---

## ⚠️ IMPORTANT NOTES

1. **Dependencies:**
   - Migration 6 và 7 độc lập với nhau
   - Có thể apply theo thứ tự bất kỳ
   - Không cần data migration

2. **RLS Policies:**
   - Tất cả tables đã có RLS enabled
   - New tables cũng có RLS policies

3. **Functions:**
   - Tất cả functions đều `SECURITY DEFINER`
   - Cần `GRANT EXECUTE` cho authenticated users

4. **Indexes:**
   - Indexes được tạo tự động
   - Không cần manual index creation

---

## 🧪 TESTING CHECKLIST

Sau khi apply migrations, test các functions:

### Test Queue Functions
```sql
-- Test get_next_distillation_job
SELECT * FROM get_next_distillation_job();

-- Test mark_complete
SELECT mark_distillation_job_complete(
  'job-id'::uuid,
  'core-logic-id'::uuid,
  '{"version": 1}'::jsonb
);

-- Test mark_failed
SELECT mark_distillation_job_failed(
  'job-id'::uuid,
  'Test error message'
);
```

### Test Versioning Functions
```sql
-- Test get_latest_core_logic
SELECT * FROM get_latest_core_logic(
  'domain-id'::uuid,
  'user-id'::uuid
);

-- Test compare_versions
SELECT * FROM compare_core_logic_versions(
  'version1-id'::uuid,
  'version2-id'::uuid,
  'user-id'::uuid
);

-- Test rollback
SELECT rollback_core_logic_version(
  'domain-id'::uuid,
  1, -- target version
  'user-id'::uuid,
  'Rollback reason'
);
```

---

## 📊 EXPECTED RESULTS

### After Migration 6
- ✅ `brain_core_logic_queue` table exists
- ✅ 3 functions created
- ✅ RLS policies active
- ✅ Indexes created

### After Migration 7
- ✅ `brain_core_logic` table has new columns
- ✅ View `brain_core_logic_version_history` exists
- ✅ 3 functions created
- ✅ Indexes created

---

## 🔗 RELATED FILES

- `supabase/migrations/brain/006_core_logic_queue.sql`
- `supabase/migrations/brain/007_core_logic_versioning.sql`
- `api/brain/services/core-logic-service.js`
- `api/brain/workers/distillation-worker.js`

---

## ✅ COMPLETION CRITERIA

- [x] Migration 6 applied successfully
- [x] Migration 7 applied successfully
- [x] All functions working
- [x] RLS policies active
- [x] Indexes created
- [x] Test queries pass

---

**Handoff prepared by:** Cursor AI
**Date:** 29/11/2025
**Status:** ✅ Ready for Copilot

