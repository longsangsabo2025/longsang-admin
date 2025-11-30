# 🤖 Phase 1 Auto-Setup

**Tự động thực hiện tất cả 3 bước setup Phase 1**

---

## 🚀 Quick Start

### Prerequisites

1. **Environment Variables** (trong file `.env`):
   ```bash
   OPENAI_API_KEY=sk-...
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   # Hoặc
   SUPABASE_ANON_KEY=your-anon-key
   ```

2. **API Server đang chạy:**
   ```bash
   cd api && node server.js
   ```

3. **Migration đã chạy** (hoặc script sẽ kiểm tra và báo nếu chưa)

---

## 🎯 Chạy Auto-Setup

### Cách 1: Dùng npm script (Recommended)

```bash
npm run setup:phase1
```

### Cách 2: Chạy trực tiếp

```bash
node scripts/setup-phase1-auto.js
```

---

## 📋 Script sẽ tự động làm:

### ✅ STEP 1: Kiểm tra Migration
- Kiểm tra `context_embeddings` table có tồn tại không
- Kiểm tra `context_indexing_log` table có tồn tại không
- Báo lỗi nếu migration chưa chạy

### ✅ STEP 2: Index Tất Cả Data
- Index tất cả projects
- Index tất cả workflows
- Index recent executions
- Hiển thị kết quả chi tiết

### ✅ STEP 3: Test Tất Cả Endpoints
- Health check
- Context search
- Enhanced search
- Copilot chat
- Generate suggestions
- Cache stats
- Hiển thị test summary

---

## 📊 Output Example

```
🚀 Phase 1 Auto-Setup Script

============================================================

📋 STEP 1: Checking Migration Status
============================================================
✅ Migration tables exist!
ℹ️  ✓ context_embeddings table found
ℹ️  ✓ context_indexing_log table found

============================================================
Checking API Server Status
============================================================
✅ API server is running!

📋 STEP 2: Indexing All Data
============================================================
ℹ️  Starting full indexing pipeline...
✅ Indexing completed!

📊 Results:
   Total indexed: 15
   - Projects: 5 (errors: 0)
   - Workflows: 7 (errors: 0)
   - Executions: 3 (errors: 0)

📋 STEP 3: Testing Endpoints
============================================================
🧪 Testing: Health Check
✅ PASSED: Health Check
...

🎯 FINAL SUMMARY
============================================================
Migration Check: ✅
Data Indexing: ✅
Endpoint Tests: ✅

🎉 Phase 1 Setup Complete! 🎉
```

---

## ⚠️ Lưu Ý

### Migration phải chạy thủ công lần đầu

Script không thể tự động chạy migration vì cần quyền database admin.

**Nếu migration chưa chạy:**
1. Script sẽ báo lỗi
2. Mở Supabase Dashboard → SQL Editor
3. Run file: `supabase/migrations/20250127_add_vector_extension.sql`
4. Chạy lại script: `npm run setup:phase1`

### API Server phải đang chạy

Script cần API server để index và test.

**Nếu API server chưa chạy:**
```bash
# Terminal 1: Start API
cd api && node server.js

# Terminal 2: Run setup
npm run setup:phase1
```

---

## 🔧 Troubleshooting

### Error: "Supabase credentials not found"
**Giải pháp:** Kiểm tra file `.env` có đủ:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (hoặc `SUPABASE_ANON_KEY`)

### Error: "Migration not run yet"
**Giải pháp:** Chạy migration trong Supabase SQL Editor trước.

### Error: "Cannot connect to API server"
**Giải pháp:** Start API server:
```bash
cd api && node server.js
```

### Error: "OPENAI_API_KEY not set"
**Giải pháp:** Thêm vào `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
```

---

## 📚 Các Scripts Liên Quan

- **Auto Setup:** `npm run setup:phase1`
- **Index Only:** `npm run index:all`
- **Test Only:** `npm run test:phase1`

---

## ✅ Checklist

Sau khi chạy script thành công:

- [ ] ✅ Migration checked
- [ ] ✅ Data indexed
- [ ] ✅ All endpoints tested
- [ ] ✅ No errors

**Phase 1 sẵn sàng sử dụng!** 🎉

---

**Last Updated:** 2025-01-27

