# 🤖 AI Workspace n8n Workflows

## Tổng Quan

Các workflows n8n cho AI Workspace automation:
1. **Daily News Digest** - Bản tin hàng ngày tự động
2. **Weekly Financial Summary** - Báo cáo tài chính hàng tuần

---

## 📰 Daily News Digest Workflow

**File:** `ai-workspace-daily-news-digest.json`

### Mô Tả
Tự động tạo bản tin tóm tắt hàng ngày về AI, công nghệ, startup Việt Nam.

### Schedule
- **Trigger:** Daily at 7:00 AM
- **Frequency:** Mỗi ngày

### Workflow Steps
1. **Schedule Trigger** - Chạy mỗi ngày lúc 7h sáng
2. **Call News Assistant** - Gọi AI News Assistant để tạo bản tin
3. **Save to Supabase** - Lưu vào `news_digests` table
4. **Index for RAG** - Index vào `documents` table cho RAG

### Cấu Hình
- **API Endpoint:** `http://localhost:3001/api/assistants/news`
- **User ID:** Set trong n8n environment variable `USER_ID`

### Import Workflow
```bash
# Qua n8n UI
1. Mở n8n: http://localhost:5678
2. Import workflow từ file: ai-workspace-daily-news-digest.json
3. Set environment variables:
   - USER_ID: your-user-uuid
4. Activate workflow
```

---

## 💰 Weekly Financial Summary Workflow

**File:** `ai-workspace-weekly-financial-summary.json`

### Mô Tả
Tự động tạo báo cáo tài chính hàng tuần, phân tích chi tiêu và gửi email.

### Schedule
- **Trigger:** Weekly on Sunday at 6:00 PM
- **Frequency:** Mỗi Chủ nhật

### Workflow Steps
1. **Schedule Trigger** - Chạy mỗi Chủ nhật lúc 6h chiều
2. **Get Transactions** - Lấy transactions 7 ngày qua từ Supabase
3. **Call Financial Assistant** - Gọi AI Financial Assistant để phân tích
4. **Save Summary** - Lưu vào `financial_summaries` table
5. **Send Email** - Gửi email báo cáo cho user

### Cấu Hình
- **API Endpoint:** `http://localhost:3001/api/assistants/financial`
- **User ID:** Set trong n8n environment variable `USER_ID`
- **User Email:** Set trong n8n environment variable `USER_EMAIL`

### Import Workflow
```bash
# Qua n8n UI
1. Mở n8n: http://localhost:5678
2. Import workflow từ file: ai-workspace-weekly-financial-summary.json
3. Set environment variables:
   - USER_ID: your-user-uuid
   - USER_EMAIL: your-email@example.com
4. Configure email node với SMTP credentials
5. Activate workflow
```

---

## 🔧 Setup Instructions

### 1. Import Workflows vào n8n

**Option A: Qua n8n UI**
1. Mở n8n: `http://localhost:5678`
2. Click "Workflows" → "Import from File"
3. Chọn file JSON từ `n8n/workflows/`
4. Configure nodes và credentials

**Option B: Qua API**
```bash
# Sử dụng script import
cd n8n
python import-workflow.py ai-workspace-daily-news-digest.json
python import-workflow.py ai-workspace-weekly-financial-summary.json
```

### 2. Configure Environment Variables

Trong n8n, set các environment variables:
- `USER_ID` - UUID của user
- `USER_EMAIL` - Email để nhận reports (cho financial summary)

### 3. Configure Credentials

**Supabase:**
- Tạo Supabase credential trong n8n
- URL: `https://your-project.supabase.co`
- Service Key: `your-service-key`

**Email (cho Financial Summary):**
- Configure SMTP credentials
- Hoặc dùng Resend/SendGrid

### 4. Activate Workflows

1. Mở workflow trong n8n
2. Click "Active" toggle để activate
3. Workflow sẽ chạy theo schedule

---

## 🧪 Testing

### Test Daily News Digest
```bash
# Trigger manually
curl -X POST http://localhost:5678/webhook/daily-news-digest \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Test Weekly Financial Summary
```bash
# Trigger manually
curl -X POST http://localhost:5678/webhook/weekly-financial-summary \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Test qua API
```bash
# List workflows
curl http://localhost:3001/api/ai-workspace/n8n/workflows

# Get status
curl http://localhost:3001/api/ai-workspace/n8n/workflows/daily-news-digest/status

# Trigger manually
curl -X POST http://localhost:3001/api/ai-workspace/n8n/workflows/daily-news-digest/trigger \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📊 Monitoring

### Check Workflow Status
```bash
GET /api/ai-workspace/n8n/workflows/:name/status
```

### View Executions
- Mở n8n UI: `http://localhost:5678`
- Click vào workflow → "Executions" tab
- Xem logs và results

---

## 🔄 Workflow Updates

Khi update workflow:
1. Export workflow từ n8n UI
2. Save vào `n8n/workflows/` với tên tương ứng
3. Commit vào git

---

## 🐛 Troubleshooting

### Workflow không chạy
1. Check n8n server đang chạy: `http://localhost:5678`
2. Check workflow đã activate chưa
3. Check schedule trigger đã config đúng chưa

### API call failed
1. Check API server đang chạy: `http://localhost:3001`
2. Check API keys trong `.env.local`
3. Check user ID trong n8n environment variables

### Supabase errors
1. Check Supabase credentials trong n8n
2. Check tables đã được tạo chưa (run migration)
3. Check RLS policies

---

**Version:** 1.0
**Last Updated:** January 2025

