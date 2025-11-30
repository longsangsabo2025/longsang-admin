# 🗄️ AI Workspace SQL Migrations - Complete Guide

> ⚠️ **QUY ĐỊNH QUAN TRỌNG: KHÔNG THÊM RLS**
> 
> App chỉ có 1 user duy nhất sử dụng, nên **KHÔNG CẦN Row Level Security**.
> Khi tạo SQL migrations mới, **KHÔNG THÊM** các lệnh sau:
> - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
> - `CREATE POLICY ...`
> 
> Điều này giúp đơn giản hóa code và tăng performance.

Tài liệu này tổng hợp **TẤT CẢ** các file SQL migration cần chạy để setup AI Workspace từ đầu đến cuối.

## 📋 Tổng Quan

AI Workspace cần các migration sau (theo thứ tự):

1. **Vector Extension** - Enable pgvector extension cho vector search
2. **RAG System** - Tables cho RAG (documents, conversations, agent_executions, response_cache)
3. **n8n Integration** - Tables cho n8n workflows (news_digests, financial_summaries)

---

## 🚀 Migration 1: Vector Extension

**File:** `supabase/migrations/20250127_add_vector_extension.sql`

**Mục đích:** Enable pgvector extension để hỗ trợ vector similarity search

**Thứ tự:** Chạy ĐẦU TIÊN (nếu chưa có)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

**Lưu ý:**
- Nếu extension đã được enable thì không cần chạy lại
- Có thể kiểm tra bằng: `SELECT * FROM pg_extension WHERE extname = 'vector';`

---

## 🚀 Migration 2: AI Workspace RAG System

**File:** `supabase/migrations/20250128_ai_workspace_rag.sql`

**Mục đích:** Tạo tất cả tables và functions cho RAG system

**Thứ tự:** Chạy SAU Migration 1

<details>
<summary>📄 Click để xem full SQL (178 dòng)</summary>

```sql
-- AI Workspace RAG System Migration
-- Tạo bảng documents cho RAG với pgvector
-- Tạo bảng conversations và agent_executions

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table for RAG
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}',
  source_type TEXT NOT NULL, -- 'note', 'file', 'chat', 'workflow', 'project'
  source_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Index for fast similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index for filtering
CREATE INDEX IF NOT EXISTS documents_user_source_idx ON documents(user_id, source_type);
CREATE INDEX IF NOT EXISTS documents_source_type_idx ON documents(source_type);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_type TEXT NOT NULL, -- 'course', 'financial', 'research', 'news', 'career', 'daily'
  title TEXT,
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_user_idx ON conversations(user_id, assistant_type);
CREATE INDEX IF NOT EXISTS conversations_created_idx ON conversations(created_at DESC);

-- Agent executions tracking
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  agent_type TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model_used TEXT,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  duration_ms INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_executions_user_idx ON agent_executions(user_id, agent_type);
CREATE INDEX IF NOT EXISTS agent_executions_status_idx ON agent_executions(status, created_at DESC);

-- Response cache table
CREATE TABLE IF NOT EXISTS response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  assistant_type TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS response_cache_hash_idx ON response_cache(query_hash);
CREATE INDEX IF NOT EXISTS response_cache_type_idx ON response_cache(assistant_type, created_at DESC);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_cache ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can read own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

-- Agent executions policies
CREATE POLICY "Users can view own executions"
  ON agent_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own executions"
  ON agent_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Response cache policies (public read, authenticated write)
CREATE POLICY "Anyone can read cache"
  ON response_cache FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cache"
  ON response_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Function: match_documents for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL,
  filter_source_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  source_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    1 - (d.embedding <=> query_embedding) AS similarity,
    d.metadata,
    d.source_type
  FROM documents d
  WHERE
    d.embedding IS NOT NULL
    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)
    AND (filter_source_types IS NULL OR d.source_type = ANY(filter_source_types))
    AND (1 - (d.embedding <=> query_embedding)) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

</details>

**Tables được tạo:**
- ✅ `documents` - Lưu documents với embeddings cho RAG
- ✅ `conversations` - Lưu conversation history
- ✅ `agent_executions` - Track AI agent usage và costs
- ✅ `response_cache` - Cache responses để tối ưu cost

**Functions được tạo:**
- ✅ `match_documents()` - Vector similarity search function
- ✅ `update_updated_at_column()` - Auto-update timestamp trigger

**Indexes:**
- ✅ HNSW index cho vector search (fast)
- ✅ Indexes cho filtering theo user, source_type

---

## 🚀 Migration 3: n8n Integration Tables

**File:** `supabase/migrations/20250128_ai_workspace_n8n_tables.sql`

**Mục đích:** Tạo tables cho n8n workflow results (news digests, financial summaries)

**Thứ tự:** Chạy SAU Migration 2 (optional - chỉ cần nếu dùng n8n)

<details>
<summary>📄 Click để xem full SQL (37 dòng)</summary>

```sql
-- AI Workspace n8n Integration Tables
-- Tables for storing n8n workflow results

-- News digests table
CREATE TABLE IF NOT EXISTS news_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS news_digests_user_idx ON news_digests(user_id, created_at DESC);

-- Financial summaries table
CREATE TABLE IF NOT EXISTS financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS financial_summaries_user_idx ON financial_summaries(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE news_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own news digests"
  ON news_digests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own financial summaries"
  ON financial_summaries FOR ALL
  USING (auth.uid() = user_id);
```

</details>

**Tables được tạo:**
- ✅ `news_digests` - Lưu daily news digests từ n8n
- ✅ `financial_summaries` - Lưu weekly financial summaries từ n8n

---

## 📝 Hướng Dẫn Chạy Migration

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)

1. **Vào Supabase Dashboard**
   - Truy cập: https://supabase.com/dashboard
   - Chọn project của bạn

2. **Mở SQL Editor**
   - Click vào "SQL Editor" ở sidebar
   - Click "New query"

3. **Chạy từng migration theo thứ tự:**
   - **Bước 1:** Copy và paste Migration 1 (Vector Extension)
   - Click "Run" hoặc `Ctrl+Enter`
   - Đợi kết quả: ✅ Success

   - **Bước 2:** Copy và paste Migration 2 (RAG System)
   - Click "Run"
   - Đợi kết quả: ✅ Success

   - **Bước 3 (Optional):** Copy và paste Migration 3 (n8n Tables)
   - Click "Run"
   - Đợi kết quả: ✅ Success

### Cách 2: Qua Supabase CLI

```bash
# Install Supabase CLI (nếu chưa có)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Cách 3: Qua psql (PostgreSQL client)

```bash
# Connect to Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
\i supabase/migrations/20250127_add_vector_extension.sql
\i supabase/migrations/20250128_ai_workspace_rag.sql
\i supabase/migrations/20250128_ai_workspace_n8n_tables.sql
```

---

## ✅ Verification - Kiểm Tra Sau Khi Chạy

Sau khi chạy migrations, verify bằng các queries sau:

### 1. Kiểm tra Vector Extension
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Should return 1 row
```

### 2. Kiểm tra Tables
```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'documents',
    'conversations',
    'agent_executions',
    'response_cache',
    'news_digests',
    'financial_summaries'
  );
-- Should return 6 rows (or 4 if không chạy n8n migration)
```

### 3. Kiểm tra Functions
```sql
-- Check match_documents function
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_documents';
-- Should return 1 row
```

### 4. Kiểm tra Indexes
```sql
-- Check vector index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'documents'
  AND indexname = 'documents_embedding_idx';
-- Should return 1 row with HNSW index
```

### 5. Test match_documents Function
```sql
-- Test với dummy embedding (all zeros)
SELECT * FROM match_documents(
  query_embedding := (SELECT array_agg(0.0)::vector(1536) FROM generate_series(1, 1536)),
  match_threshold := 0.5,
  match_count := 5
);
-- Should return empty result (no documents yet) but no error
```

---

## 🔧 Troubleshooting

### Lỗi: "extension vector does not exist"
**Giải pháp:**
- Kiểm tra Supabase project có enable pgvector extension không
- Vào Database > Extensions trong Supabase Dashboard
- Enable "vector" extension nếu chưa có

### Lỗi: "relation already exists"
**Giải pháp:**
- Tables đã tồn tại, không cần chạy lại
- Có thể dùng `DROP TABLE IF EXISTS` nếu muốn reset (⚠️ sẽ mất data)

### Lỗi: "permission denied"
**Giải pháp:**
- Đảm bảo đang dùng service role key hoặc có quyền admin
- Kiểm tra RLS policies nếu cần

### Lỗi: "HNSW index creation failed"
**Giải pháp:**
- Kiểm tra pgvector extension đã được enable
- Một số Supabase projects có thể cần enable extension qua Dashboard trước

---

## 📊 Summary - Tóm Tắt

### Tables Created:
1. ✅ `documents` - RAG documents với embeddings
2. ✅ `conversations` - Conversation history
3. ✅ `agent_executions` - AI usage tracking
4. ✅ `response_cache` - Response caching
5. ✅ `news_digests` - n8n news digests (optional)
6. ✅ `financial_summaries` - n8n financial summaries (optional)

### Functions Created:
1. ✅ `match_documents()` - Vector similarity search
2. ✅ `update_updated_at_column()` - Auto timestamp update

### Extensions Required:
1. ✅ `vector` - pgvector extension

### Total SQL Lines:
- Migration 1: ~3 lines
- Migration 2: ~178 lines
- Migration 3: ~37 lines
- **Total: ~218 lines**

---

## 🎯 Quick Start Checklist

- [ ] Chạy Migration 1: Vector Extension
- [ ] Chạy Migration 2: RAG System
- [ ] (Optional) Chạy Migration 3: n8n Tables
- [ ] Verify tables exist
- [ ] Verify functions exist
- [ ] Test match_documents function
- [ ] Restart backend server
- [ ] Test APIs với test scripts

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0

