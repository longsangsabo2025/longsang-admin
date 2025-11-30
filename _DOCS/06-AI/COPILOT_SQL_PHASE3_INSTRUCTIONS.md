# 🚀 COPILOT SQL INSTRUCTIONS - PHASE 3

**Quick Start Guide for GitHub Copilot**

---

## 📋 TASK

Apply 2 SQL migrations cho Phase 3:
1. `006_core_logic_queue.sql` - Queue system
2. `007_core_logic_versioning.sql` - Enhanced versioning

---

## 🔧 STEPS

### 1. Apply Migration 6
```bash
# Via Supabase CLI
supabase db push

# Or direct SQL
psql $DATABASE_URL -f supabase/migrations/brain/006_core_logic_queue.sql
```

### 2. Apply Migration 7
```bash
# Via Supabase CLI
supabase db push

# Or direct SQL
psql $DATABASE_URL -f supabase/migrations/brain/007_core_logic_versioning.sql
```

### 3. Verify
```sql
-- Check queue table
SELECT COUNT(*) FROM brain_core_logic_queue;

-- Check versioning columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'brain_core_logic'
AND column_name IN ('parent_version_id', 'is_active');
```

---

## ✅ SUCCESS CRITERIA

- [x] Both migrations applied
- [x] No errors
- [x] Functions created
- [x] RLS active

---

**Ready to apply!** 🚀

