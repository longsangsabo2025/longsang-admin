# 🚀 COPILOT SQL INSTRUCTIONS - PHASE 4

**Ngày:** 29/11/2025
**Phase:** Phase 4 - Multi-Domain Orchestration & Master Brain

---

## 📋 NHIỆM VỤ

Apply 3 SQL migration files cho Phase 4:

1. `supabase/migrations/brain/008_knowledge_graph.sql`
2. `supabase/migrations/brain/009_query_routing.sql`
3. `supabase/migrations/brain/010_master_brain_state.sql`

---

## ⚡ QUICK START

```bash
# Apply migrations theo thứ tự
psql -U postgres -d your_database -f supabase/migrations/brain/008_knowledge_graph.sql
psql -U postgres -d your_database -f supabase/migrations/brain/009_query_routing.sql
psql -U postgres -d your_database -f supabase/migrations/brain/010_master_brain_state.sql
```

Hoặc nếu dùng Supabase CLI:
```bash
supabase db push
```

---

## ✅ VERIFICATION

Sau khi apply, chạy:

```sql
-- Check tables
SELECT COUNT(*) FROM brain_knowledge_graph_nodes;
SELECT COUNT(*) FROM brain_query_routing;
SELECT COUNT(*) FROM brain_master_session;

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN (
  'find_graph_paths',
  'select_relevant_domains',
  'create_master_session'
);
```

---

## ⚠️ LƯU Ý

- Apply theo đúng thứ tự: 008 → 009 → 010
- Cần `pgvector` extension (đã có từ Phase 1)
- RLS policies sẽ tự động enable

---

**Status:** Ready to apply ✅

