# 🤖 AI WORKSPACE n8n SETUP GUIDE

## Tổng Quan

Đã setup n8n workflows cho AI Workspace automation:
- ✅ Daily News Digest - Bản tin hàng ngày tự động
- ✅ Weekly Financial Summary - Báo cáo tài chính hàng tuần

---

## 📦 Đã Tạo

### 1. n8n Workflows

1. **Daily News Digest** (`ai-workspace-daily-news-digest.json`)
   - Schedule: Daily at 7:00 AM
   - Gọi News Assistant → Lưu vào DB → Index cho RAG

2. **Weekly Financial Summary** (`ai-workspace-weekly-financial-summary.json`)
   - Schedule: Sunday at 6:00 PM
   - Lấy transactions → Gọi Financial Assistant → Lưu → Gửi email

### 2. API Routes

- `GET /api/ai-workspace/n8n/workflows` - List workflows
- `GET /api/ai-workspace/n8n/workflows/:name/status` - Check status
- `POST /api/ai-workspace/n8n/workflows/:name/trigger` - Trigger manually

### 3. Services

- `api/services/ai-workspace/n8n-service.js` - n8n integration service

### 4. Database Tables

- `news_digests` - Lưu daily news digests
- `financial_summaries` - Lưu weekly financial summaries

---

## 🚀 SETUP STEPS

### Bước 1: Chạy Migration

```bash
# Chạy migration cho n8n tables
supabase db push

# Hoặc chạy SQL trực tiếp
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250128_ai_workspace_n8n_tables.sql
```

### Bước 2: Start n8n Server

```bash
# Option A: Qua API
curl -X POST http://localhost:3001/api/n8n/start

# Option B: Manual
cd n8n
npx n8n
```

n8n sẽ chạy tại: `http://localhost:5678`

### Bước 3: Import Workflows

**Option A: Qua Python Script (Khuyến nghị)**

```bash
cd n8n
python import-ai-workspace-workflows.py
```

**Option B: Qua n8n UI**

1. Mở n8n: `http://localhost:5678`
2. Click "Workflows" → "Import from File"
3. Chọn file:
   - `n8n/workflows/ai-workspace-daily-news-digest.json`
   - `n8n/workflows/ai-workspace-weekly-financial-summary.json`
4. Click "Import"

**Option C: Qua n8n API**

```bash
# Set N8N_API_KEY nếu có
export N8N_API_KEY=your-api-key

# Import workflow
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -d @n8n/workflows/ai-workspace-daily-news-digest.json
```

### Bước 4: Configure Workflows

#### 4.1 Environment Variables

Trong n8n UI, set environment variables:
- `USER_ID` - UUID của user (lấy từ Supabase auth.users)
- `USER_EMAIL` - Email để nhận financial reports

**Cách set:**
1. Mở n8n UI
2. Settings → Environment Variables
3. Add:
   - `USER_ID` = `your-user-uuid`
   - `USER_EMAIL` = `your-email@example.com`

#### 4.2 Supabase Credentials

1. Mở workflow trong n8n
2. Click vào Supabase node
3. Add credential:
   - **Name:** Supabase account
   - **Host:** `https://your-project.supabase.co`
   - **Service Role Key:** `your-service-key`

#### 4.3 Email Credentials (Financial Summary)

1. Mở "Weekly Financial Summary" workflow
2. Click vào "Send Email" node
3. Configure SMTP:
   - **Host:** smtp.resend.com (nếu dùng Resend)
   - **Port:** 587
   - **User:** resend
   - **Password:** `your-resend-api-key`

Hoặc dùng SendGrid, Gmail SMTP, etc.

### Bước 5: Activate Workflows

1. Mở workflow trong n8n UI
2. Click toggle "Active" ở góc trên bên phải
3. Workflow sẽ chạy theo schedule

---

## 🧪 TESTING

### Test Workflow Status

```bash
# List workflows
curl http://localhost:3001/api/ai-workspace/n8n/workflows

# Check status
curl http://localhost:3001/api/ai-workspace/n8n/workflows/daily-news-digest/status
```

### Test Manual Trigger

```bash
# Trigger Daily News Digest
curl -X POST http://localhost:3001/api/ai-workspace/n8n/workflows/daily-news-digest/trigger \
  -H "Content-Type: application/json" \
  -d '{}'

# Trigger Weekly Financial Summary
curl -X POST http://localhost:3001/api/ai-workspace/n8n/workflows/weekly-financial-summary/trigger \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test qua n8n Webhook

```bash
# Direct webhook (nếu đã setup)
curl -X POST http://localhost:5678/webhook/daily-news-digest \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📊 MONITORING

### View Workflow Executions

1. Mở n8n UI: `http://localhost:5678`
2. Click vào workflow
3. Tab "Executions" → Xem logs và results

### Check Database

```sql
-- Check news digests
SELECT * FROM news_digests
ORDER BY created_at DESC
LIMIT 10;

-- Check financial summaries
SELECT * FROM financial_summaries
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔧 CONFIGURATION

### Environment Variables

```env
# n8n
N8N_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key  # Optional, nếu có

# User (set trong n8n environment variables)
USER_ID=user-uuid
USER_EMAIL=your-email@example.com
```

### Workflow Schedules

**Daily News Digest:**
- Schedule: `0 7 * * *` (7:00 AM daily)
- Có thể thay đổi trong n8n UI

**Weekly Financial Summary:**
- Schedule: `0 18 * * 0` (6:00 PM Sunday)
- Có thể thay đổi trong n8n UI

---

## 🐛 TROUBLESHOOTING

### Workflow không chạy

1. **Check n8n đang chạy:**
   ```bash
   curl http://localhost:5678/healthz
   ```

2. **Check workflow đã activate:**
   - Mở n8n UI → Workflows → Check "Active" toggle

3. **Check schedule trigger:**
   - Mở workflow → Check Schedule Trigger node config

### API call failed

1. **Check API server:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Check API keys:**
   ```bash
   curl http://localhost:3001/api/assistants/status
   ```

3. **Check logs:**
   - n8n UI → Workflow → Executions → View logs

### Supabase errors

1. **Check credentials:**
   - n8n UI → Credentials → Supabase

2. **Check tables:**
   ```sql
   SELECT * FROM news_digests LIMIT 1;
   SELECT * FROM financial_summaries LIMIT 1;
   ```

3. **Check RLS policies:**
   - Tables phải có RLS enabled
   - User phải có quyền access

---

## 📋 WORKFLOW DETAILS

### Daily News Digest Flow

```
Schedule Trigger (7 AM daily)
    ↓
Call News Assistant API
    ↓
Save to news_digests table
    ↓
Index to documents table (for RAG)
```

### Weekly Financial Summary Flow

```
Schedule Trigger (Sunday 6 PM)
    ↓
Get Transactions (last 7 days)
    ↓
Call Financial Assistant API
    ↓
Save to financial_summaries table
    ↓
Send Email Report
```

---

## 🎉 HOÀN THÀNH!

Sau khi setup xong:
- ✅ Daily News Digest sẽ chạy mỗi ngày lúc 7h sáng
- ✅ Weekly Financial Summary sẽ chạy mỗi Chủ nhật lúc 6h chiều
- ✅ Results được lưu vào database và index cho RAG
- ✅ Có thể trigger manually qua API

---

**Version:** 1.0
**Last Updated:** January 2025
**Status:** ✅ Ready to Use

