# 🚀 AI Command Center - Quick Start Guide

## Bắt Đầu Sử Dụng Ngay

### 1. Kiểm Tra Môi Trường

```bash
# Chạy test script
node test-ai-command-center.js
```

Đảm bảo:

- ✅ Supabase URL và Key đã có
- ✅ Database tables đã được tạo
- ✅ Tất cả files đã tồn tại

### 2. Cấu Hình Environment Variables

Thêm vào `.env`:

```env
# Supabase (đã có)
SUPABASE_URL=https://diexsbzqwsbpilsymnfb.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI (cần cho AI features)
OPENAI_API_KEY=sk-your-key

# n8n (optional)
N8N_URL=http://localhost:5678
N8N_API_KEY=your-n8n-key

# API
API_PORT=3001
```

### 3. Khởi Động Ứng Dụng

```bash
# Development mode (cả frontend và backend)
npm run dev

# Hoặc chạy riêng:
# Backend
npm run dev:api

# Frontend (terminal khác)
npm run dev:frontend
```

### 4. Truy Cập AI Command Center

Mở browser: `http://localhost:8080/admin/ai-command-center`

Hoặc từ menu Admin → AI Command Center

## 🎯 Các Tính Năng Chính

### 1. Natural Language Commands

Gõ lệnh bằng tiếng Việt:

- "Tạo bài post về dự án Vũng Tàu"
- "Backup database lên Google Drive"
- "Tạo 5 bài SEO cho từ khóa bất động sản"
- "Thống kê workflows hôm nay"

### 2. Proactive Suggestions

AI tự động đề xuất:

- Backup cần chạy
- Workflows cần tối ưu
- Opportunities phát hiện

### 3. Intelligent Alerts

AI tự động phát hiện:

- Anomalies trong workflows
- Performance issues
- Opportunities

### 4. Command Palette

Nhấn `Cmd+K` (Mac) hoặc `Ctrl+K` (Windows) để mở command palette

### 5. Multi-Agent Orchestration

AI tự động điều phối nhiều agents để hoàn thành task phức tạp

## 🧪 Test Các Tính Năng

### Test API Endpoints

```bash
# Test khi server đang chạy
node test-api-endpoints.js
```

### Test Command

1. Mở AI Command Center
2. Gõ: "Tạo bài post về test"
3. Xem kết quả workflow được tạo

### Test Suggestions

1. Đợi background monitor chạy (mỗi 5 phút)
2. Hoặc trigger manual: `POST /api/ai/suggestions/generate`

### Test Alerts

1. Tạo một số workflow executions với errors
2. Đợi alert detector phát hiện
3. Xem alerts trong UI

## 🔧 Troubleshooting

### API Server không chạy

```bash
cd api && node server.js
```

### Database tables không tồn tại

```bash
node run-ai-command-migrations.js
```

### OpenAI API errors

- Kiểm tra API key trong `.env`
- Kiểm tra quota/balance

### Frontend không load

- Kiểm tra `npm run dev:frontend`
- Check browser console
- Verify API URL trong `.env`

## 📝 Lưu Ý

1. **OpenAI API Key**: Cần để sử dụng AI features. Nếu không có, một số tính
   năng sẽ không hoạt động.

2. **Background Monitor**: Tự động chạy mỗi 5 phút để detect alerts và generate
   suggestions.

3. **Database**: Tất cả data được lưu trong Supabase. Đảm bảo connection ổn
   định.

4. **n8n**: Optional. Cần nếu muốn execute workflows thực tế.

## ✨ Sẵn Sàng Sử Dụng!

Hệ thống đã được test và sẵn sàng. Chỉ cần:

1. Đảm bảo `.env` có đủ keys
2. Chạy `npm run dev`
3. Mở browser và bắt đầu sử dụng!

---

**Happy Coding! 🚀**
