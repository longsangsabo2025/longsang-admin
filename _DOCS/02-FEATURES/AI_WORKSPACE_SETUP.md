# 🚀 AI WORKSPACE SETUP GUIDE

## Tổng Quan

AI Workspace đã được tích hợp vào LongSang Admin với 6 trợ lý AI chuyên biệt:

1. **📚 Course Assistant** - Phát triển khóa học, curriculum, bài giảng
2. **💰 Financial Assistant** - Tài chính cá nhân, ngân sách, phân tích chi tiêu
3. **🔍 Research Assistant** - Nghiên cứu, tìm kiếm thông tin, tổng hợp
4. **📰 News Assistant** - Tin tức, xu hướng, cập nhật ngành
5. **🎯 Career Assistant** - Phát triển sự nghiệp, skills, networking
6. **📅 Daily Planner** - Lập kế hoạch ngày, task management, calendar

## Setup Steps

### 1. Cài Đặt Dependencies

```bash
# Backend dependencies
cd api
npm install @anthropic-ai/sdk@^0.34.0 @supabase/supabase-js@^2.75.0

# Frontend dependencies (đã có sẵn)
# - cmdk (command palette)
# - @supabase/supabase-js
```

### 2. Chạy Database Migrations

```bash
# Chạy migration cho RAG system
supabase db push

# Hoặc chạy trực tiếp file migration
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250128_ai_workspace_rag.sql
```

Migration sẽ tạo:
- `documents` table với pgvector cho RAG
- `conversations` table cho lịch sử chat
- `agent_executions` table cho tracking
- `response_cache` table cho caching
- RLS policies và functions

### 3. Cấu Hình Environment Variables

Thêm vào `.env`:

```env
# AI Providers (cần ít nhất 1 trong 2)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (đã có sẵn)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
```

### 4. Khởi Động Server

```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend
npm run dev:api

# Hoặc chạy cả 2
npm run dev
```

### 5. Truy Cập AI Workspace

1. Đăng nhập vào admin panel
2. Vào menu **🤖 AI & Automation** → **🚀 AI Workspace**
3. Hoặc truy cập trực tiếp: `http://localhost:8080/admin/ai-workspace`

## Sử Dụng

### Chat với Assistant

1. Chọn assistant từ thanh trên cùng
2. Gõ câu hỏi vào ô input
3. Nhấn Enter hoặc click nút Send
4. Response sẽ được stream real-time

### Command Palette

- Nhấn `Cmd+K` (Mac) hoặc `Ctrl+K` (Windows/Linux)
- Gõ tên assistant hoặc lệnh
- Chọn để mở assistant tương ứng

### Ví Dụ Commands

**Course Assistant:**
- "Tạo curriculum cho khóa học React trong 10 bài"
- "Viết outline bài giảng về TypeScript"
- "Tạo quiz 10 câu về JavaScript"

**Financial Assistant:**
- "Phân tích chi tiêu tháng này"
- "Lập ngân sách cho tháng tới"
- "So sánh chi tiêu tháng này với tháng trước"

**Research Assistant:**
- "Nghiên cứu về AI trends 2025"
- "Tìm hiểu về Next.js 15 features"
- "Tổng hợp thông tin về Supabase"

**News Assistant:**
- "Tin tức công nghệ hôm nay"
- "Xu hướng AI mới nhất"
- "Cập nhật về startup Việt Nam"

**Career Assistant:**
- "Lộ trình phát triển sự nghiệp Full-stack Developer"
- "Skills cần thiết cho Senior Developer"
- "Cách optimize LinkedIn profile"

**Daily Planner:**
- "Lập kế hoạch ngày hôm nay"
- "Sắp xếp tasks theo priority"
- "Đề xuất time blocking cho hôm nay"

## Kiến Trúc

### Backend

```
api/
├── routes/
│   └── ai-assistants.js          # API routes cho assistants
├── services/
│   └── ai-workspace/
│       ├── embedding-service.js   # Embedding generation
│       ├── context-retrieval.js   # RAG context retrieval
│       ├── assistants.js          # 6 AI assistants implementation
│       └── prompts.js             # System prompts
```

### Frontend

```
src/
├── components/
│   └── ai-workspace/
│       ├── CopilotChat.tsx              # Main chat interface
│       └── AIWorkspaceCommandPalette.tsx # Command palette
├── hooks/
│   └── useAssistant.ts                  # Hook cho assistant chat
└── pages/
    └── AIWorkspace.tsx                  # Main page
```

### Database

- `documents` - RAG documents với embeddings
- `conversations` - Chat history
- `agent_executions` - Execution tracking
- `response_cache` - Response caching

## RAG (Retrieval Augmented Generation)

Hệ thống RAG tự động:
1. Lưu trữ documents với embeddings
2. Tìm kiếm semantic khi user query
3. Đưa context vào prompt cho AI
4. Trả lời chính xác và cá nhân hóa hơn

### Index Documents

Để index documents vào RAG:

```javascript
const embeddingService = require('./api/services/ai-workspace/embedding-service');

await embeddingService.storeDocument({
  content: 'Your document content here...',
  sourceType: 'note', // 'note', 'file', 'chat', 'workflow', 'project'
  sourceId: 'optional-source-id',
  metadata: { title: 'Document Title' },
  userId: 'user-uuid',
});
```

## Model Selection

Hệ thống tự động chọn model dựa trên complexity:

- **Simple queries** → GPT-4o-mini (nhanh, rẻ)
- **Medium queries** → Claude Haiku (cân bằng)
- **Complex queries** → Claude Sonnet (mạnh, chất lượng cao)

## Cost Optimization

- **Prompt caching** cho system prompts (Anthropic)
- **Response caching** cho queries tương tự
- **Model selection** dựa trên complexity
- **Streaming** để giảm latency

## Troubleshooting

### Lỗi: "OPENAI_API_KEY missing" hoặc "ANTHROPIC_API_KEY missing"

→ Thêm API key vào `.env` file

### Lỗi: "match_documents function not found"

→ Chạy migration: `supabase db push`

### Lỗi: "pgvector extension not enabled"

→ Migration sẽ tự động enable, nếu không:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Response chậm

→ Kiểm tra:
- API keys có hợp lệ không
- Network connection
- Model selection (đổi sang GPT-4o-mini cho nhanh hơn)

## Next Steps

1. **Index existing data** vào RAG system
2. **Customize prompts** trong `api/services/ai-workspace/prompts.js`
3. **Add more assistants** nếu cần
4. **Integrate với n8n** cho automation workflows
5. **Add Tavily search** cho Research Assistant (real-time web search)

## Support

Nếu có vấn đề, kiểm tra:
- Console logs trong browser
- Server logs trong terminal
- Supabase logs trong dashboard

---

**Version:** 1.0.0
**Last Updated:** January 2025
**Author:** LongSang AI Workspace Team

