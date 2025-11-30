# 🔑 AI WORKSPACE - Tự Động Load API Keys từ .env.local

## Tổng Quan

AI Workspace đã được cập nhật để **tự động load và sử dụng các API keys từ `.env.local`** mà không cần cấu hình thủ công.

## Tính Năng Mới

### 1. Tự Động Load Environment Variables

Hệ thống sẽ tự động:
- ✅ Load từ `.env.local` (ưu tiên)
- ✅ Load từ `.env` (fallback)
- ✅ Support cả `VITE_*` và non-prefixed keys
- ✅ Validate keys trước khi sử dụng

### 2. Env Loader Service

File: `api/services/ai-workspace/env-loader.js`

```javascript
const { getAPIKeys, validateKeys } = require('./env-loader');

// Get all API keys
const keys = getAPIKeys();

// Validate required keys
const validation = validateKeys();
if (!validation.valid) {
  console.error('Missing keys:', validation.errors);
}
```

### 3. Supported Environment Variables

Hệ thống tự động tìm các keys sau (theo thứ tự ưu tiên):

| Key | Priority 1 | Priority 2 | Required |
|-----|------------|------------|----------|
| OpenAI | `OPENAI_API_KEY` | `VITE_OPENAI_API_KEY` | ✅ (1 trong 2) |
| Anthropic | `ANTHROPIC_API_KEY` | `VITE_ANTHROPIC_API_KEY` | ✅ (1 trong 2) |
| Supabase URL | `SUPABASE_URL` | `VITE_SUPABASE_URL` | ✅ |
| Supabase Key | `SUPABASE_SERVICE_KEY` | `SUPABASE_ANON_KEY` | ✅ |
| Tavily | `TAVILY_API_KEY` | `VITE_TAVILY_API_KEY` | ❌ Optional |
| Perplexity | `PERPLEXITY_API_KEY` | `VITE_PERPLEXITY_API_KEY` | ❌ Optional |

### 4. Auto Fallback

Hệ thống tự động:
- ✅ Fallback giữa OpenAI và Anthropic nếu một provider không có
- ✅ Chọn model phù hợp dựa trên keys có sẵn
- ✅ Báo lỗi rõ ràng nếu thiếu keys bắt buộc

## API Endpoints

### Check Status

```bash
GET /api/assistants/status
```

Response:
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "keys": {
    "openai": "sk-...",
    "anthropic": "sk-ant-...",
    "supabaseUrl": "https://...",
    ...
  },
  "message": "All required API keys are configured"
}
```

### Chat với Assistant

```bash
POST /api/assistants/:type
```

Nếu keys chưa được config, sẽ trả về:
```json
{
  "success": false,
  "error": "API keys not configured",
  "details": [
    "OPENAI_API_KEY or ANTHROPIC_API_KEY is required"
  ],
  "message": "Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local"
}
```

## Cách Sử Dụng

### 1. Đảm Bảo .env.local Có Keys

File `.env.local` nên có ít nhất:

```env
# AI Provider (cần ít nhất 1)
OPENAI_API_KEY=sk-...
# HOẶC
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (bắt buộc)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 2. Khởi Động Server

```bash
npm run dev
```

Hệ thống sẽ tự động:
- Load keys từ `.env.local`
- Validate keys
- Khởi tạo clients (OpenAI/Anthropic, Supabase)

### 3. Check Status

Truy cập: `http://localhost:3001/api/assistants/status`

Hoặc trong code:
```javascript
const { validateKeys } = require('./api/services/ai-workspace/env-loader');
const status = validateKeys();
console.log('Keys valid:', status.valid);
```

## Code Examples

### Sử dụng trong Service

```javascript
const { getAPIKeys } = require('./env-loader');

const keys = getAPIKeys();

if (keys.openai) {
  // Use OpenAI
} else if (keys.anthropic) {
  // Use Anthropic
}
```

### Validate trước khi sử dụng

```javascript
const { validateKeys } = require('./env-loader');

const validation = validateKeys();
if (!validation.valid) {
  throw new Error(`Missing keys: ${validation.errors.join(', ')}`);
}
```

## Troubleshooting

### Lỗi: "API keys not configured"

**Nguyên nhân:** Không tìm thấy keys trong `.env.local`

**Giải pháp:**
1. Kiểm tra file `.env.local` có tồn tại không
2. Đảm bảo có ít nhất `OPENAI_API_KEY` hoặc `ANTHROPIC_API_KEY`
3. Đảm bảo có `SUPABASE_URL` và `SUPABASE_ANON_KEY`

### Lỗi: "No AI provider available"

**Nguyên nhân:** Cả OpenAI và Anthropic đều không có key

**Giải pháp:**
- Thêm `OPENAI_API_KEY` hoặc `ANTHROPIC_API_KEY` vào `.env.local`

### Keys không được load

**Nguyên nhân:** File `.env.local` không được đọc

**Giải pháp:**
1. Kiểm tra file có đúng tên `.env.local` không
2. Kiểm tra file có trong root directory không
3. Restart server sau khi thêm keys

## Best Practices

1. **Luôn dùng `.env.local`** cho local development
2. **Không commit `.env.local`** vào git (đã có trong .gitignore)
3. **Check status** trước khi deploy
4. **Có cả OpenAI và Anthropic** để fallback tốt hơn

## Migration từ Manual Config

Nếu bạn đã config keys thủ công trong code, không cần làm gì cả! Hệ thống sẽ tự động:
- ✅ Load từ `.env.local` trước
- ✅ Fallback về `process.env` nếu không có
- ✅ Tương thích ngược với code cũ

---

**Version:** 1.1.0
**Last Updated:** January 2025
**Feature:** Auto-load API keys from .env.local

