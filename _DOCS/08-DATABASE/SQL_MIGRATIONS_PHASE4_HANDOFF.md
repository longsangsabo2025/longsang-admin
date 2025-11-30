# 📋 SQL MIGRATIONS HANDOFF - PHASE 4

**Ngày:** 29/11/2025
**Phase:** Phase 4 - Multi-Domain Orchestration & Master Brain
**Người nhận:** Database Admin / Copilot

---

## 🎯 MỤC ĐÍCH

Apply 3 database migration files để tạo:
1. Knowledge Graph system (nodes, edges, traversal functions)
2. Query Routing system (routing decisions, learning, performance)
3. Master Brain State system (sessions, context, orchestration)

---

## 📁 FILES CẦN APPLY

### 1. `supabase/migrations/brain/008_knowledge_graph.sql`
**Mục đích:** Tạo knowledge graph tables và functions

**Tables:**
- `brain_knowledge_graph_nodes` - Nodes trong graph
- `brain_knowledge_graph_edges` - Edges (relationships)

**Functions:**
- `find_graph_paths()` - Tìm paths giữa 2 nodes
- `get_related_concepts()` - Lấy related concepts
- `traverse_graph()` - Traverse graph từ một node
- `build_graph_from_knowledge()` - Build graph từ knowledge

**Indexes:**
- Vector indexes cho embeddings
- GIN indexes cho text search
- Composite indexes cho common queries

**RLS:**
- User isolation policies

---

### 2. `supabase/migrations/brain/009_query_routing.sql`
**Mục đích:** Tạo query routing metadata tables

**Tables:**
- `brain_query_routing` - Routing decisions và performance
- `brain_domain_relevance_history` - Historical relevance scores
- `brain_routing_performance` - Aggregated performance metrics

**Functions:**
- `score_domain_relevance()` - Score domain relevance cho query
- `select_relevant_domains()` - Select relevant domains
- `update_routing_performance()` - Update performance metrics

**Indexes:**
- Vector indexes cho query embeddings
- Indexes cho performance queries
- Composite indexes

**RLS:**
- User isolation policies

---

### 3. `supabase/migrations/brain/010_master_brain_state.sql`
**Mục đích:** Tạo Master Brain state management tables

**Tables:**
- `brain_master_session` - Master Brain sessions
- `brain_multi_domain_context` - Context từ multiple domains
- `brain_orchestration_state` - Orchestration state

**Functions:**
- `create_master_session()` - Tạo session mới
- `add_session_context()` - Thêm context vào session
- `update_orchestration_state()` - Update orchestration state
- `get_session_context()` - Lấy session context
- `end_master_session()` - Kết thúc session

**Indexes:**
- Indexes cho session queries
- Vector indexes cho context embeddings
- Composite indexes

**RLS:**
- User isolation policies

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Thứ tự apply:** Phải apply theo thứ tự 008 → 009 → 010
2. **Dependencies:**
   - Cần `pgvector` extension (đã có từ Phase 1)
   - Cần `uuid_generate_v4()` function (thường có sẵn)
3. **Permissions:**
   - Functions được tạo với `SECURITY DEFINER`
   - RLS policies được enable cho tất cả tables
4. **Performance:**
   - Vector indexes có thể mất thời gian để build
   - GIN indexes cũng cần thời gian cho large datasets

---

## ✅ VERIFICATION STEPS

Sau khi apply migrations, verify:

1. **Tables created:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'brain_%'
   ORDER BY table_name;
   ```

2. **Functions created:**
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%graph%'
   OR routine_name LIKE '%routing%'
   OR routine_name LIKE '%master%'
   ORDER BY routine_name;
   ```

3. **Indexes created:**
   ```sql
   SELECT indexname
   FROM pg_indexes
   WHERE schemaname = 'public'
   AND indexname LIKE 'idx_brain_%'
   ORDER BY indexname;
   ```

4. **RLS enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename LIKE 'brain_%'
   ORDER BY tablename;
   ```

---

## 🧪 TEST QUERIES

### Test Knowledge Graph:
```sql
-- Test build graph function
SELECT build_graph_from_knowledge('domain-id-here', 'user-id-here');
```

### Test Query Routing:
```sql
-- Test select relevant domains
SELECT * FROM select_relevant_domains(
  'test query',
  'embedding-vector-here'::vector(1536),
  'user-id-here',
  3,
  0.3
);
```

### Test Master Brain:
```sql
-- Test create session
SELECT create_master_session(
  'Test Session',
  ARRAY['domain-id-1', 'domain-id-2'],
  'conversation',
  'user-id-here'
);
```

---

## 📞 SUPPORT

Nếu có issues khi apply migrations:
1. Check error messages carefully
2. Verify dependencies (pgvector, uuid functions)
3. Check permissions
4. Review RLS policies

---

**Handoff Date:** 29/11/2025
**Status:** Ready for Application

