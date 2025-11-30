# AI Workspace Test Scripts

Các script để test AI Workspace backend và migration.

## 📋 Scripts

### 1. `test-ai-workspace-backend.ps1`
Test đầy đủ tất cả các API routes của AI Workspace.

**Chạy:**
```powershell
.\test-ai-workspace-backend.ps1
```

**Test gì:**
- ✅ Health check
- ✅ Assistants status
- ✅ 6 assistants (course, financial, research, news, career, daily)
- ✅ Conversations CRUD (create, read, update, delete)
- ✅ Documents API
- ✅ Analytics API
- ✅ n8n Workflows API

**Yêu cầu:**
- Backend server đang chạy tại `http://localhost:3001`
- Có thể chỉnh `$baseUrl` trong script nếu port khác

---

### 2. `test-ai-workspace-quick.ps1`
Test nhanh các API chính (nhanh hơn, ít test hơn).

**Chạy:**
```powershell
.\test-ai-workspace-quick.ps1
```

**Test gì:**
- ✅ Health check
- ✅ Assistants status
- ✅ Research assistant (1 assistant đại diện)
- ✅ Conversations list
- ✅ Analytics
- ✅ Documents API

**Yêu cầu:**
- Backend server đang chạy tại `http://localhost:3001`

---

### 3. `test-ai-workspace-migration.ps1`
Test migration database từ frontend.

**Chạy:**
```powershell
.\test-ai-workspace-migration.ps1
```

**Test gì:**
- ✅ Kiểm tra Node.js
- ✅ Kiểm tra migration script
- ✅ Kiểm tra environment variables
- ✅ Chạy migration SQL
- ✅ Verify database tables:
  - `documents`
  - `conversations`
  - `agent_executions`
  - `response_cache`
  - `news_digests` (optional)
  - `financial_summaries` (optional)
- ✅ Verify vector extension và `match_documents` function

**Yêu cầu:**
- Node.js installed
- File `.env.local` hoặc `.env` với:
  - `SUPABASE_URL` hoặc `VITE_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` hoặc `SUPABASE_ANON_KEY`
- Migration files:
  - `supabase/migrations/20250128_ai_workspace_rag.sql`
  - `supabase/migrations/20250128_ai_workspace_n8n_tables.sql` (optional)

---

## 🚀 Quick Start

### Test Backend (nhanh nhất):
```powershell
# Đảm bảo backend đang chạy
cd api
npm start

# Trong terminal khác
cd ..
.\test-ai-workspace-quick.ps1
```

### Test Migration:
```powershell
.\test-ai-workspace-migration.ps1
```

### Test Backend đầy đủ:
```powershell
.\test-ai-workspace-backend.ps1
```

---

## 📝 Notes

- Scripts sử dụng PowerShell 7+
- Test user ID được generate tự động
- Một số test có thể fail nếu database chưa có data (điều này là bình thường)
- Migration script sẽ tạo tables nếu chưa tồn tại

---

## 🔧 Troubleshooting

### Backend không chạy:
```powershell
# Check port
netstat -ano | findstr :3001

# Start backend
cd api
npm start
```

### Migration fails:
- Kiểm tra `.env.local` có đủ credentials
- Kiểm tra Supabase project có enable `pgvector` extension
- Kiểm tra service role key có đủ permissions

### API returns 404:
- Đảm bảo routes đã được register trong `api/server.js`
- Restart backend server

---

## ✅ Expected Results

### Backend Test:
- ✅ Tất cả health checks pass
- ✅ Assistants status returns 6 assistants
- ✅ Mỗi assistant có thể chat và tạo conversation
- ✅ Conversations có thể list, get, update, delete
- ✅ Analytics returns data (có thể empty nếu chưa có usage)
- ✅ Documents API works (có thể empty)

### Migration Test:
- ✅ Migration script runs successfully
- ✅ Tất cả tables được tạo
- ✅ Vector extension enabled
- ✅ `match_documents` function exists

