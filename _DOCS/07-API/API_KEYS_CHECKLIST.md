# 🔑 API KEYS CHECKLIST - CẦN LẤY

## ✅ REQUIRED (Bắt buộc)

### 1. OpenAI API Key ⭐
```env
OPENAI_API_KEY=sk-...
```
**Status:** ⚠️ **CẦN LẤY NGAY**

**Cần cho:**
- Embeddings (text-embedding-3-small)
- AI Assistants (GPT-4o, GPT-4o-mini)
- LangGraph orchestrator

**Lấy ở đâu:**
1. Vào: https://platform.openai.com/api-keys
2. Login/Sign up
3. Click "Create new secret key"
4. Copy key và paste vào `.env.local`

**Cost:** Pay-as-you-go (~$0.10-0.30 per 1M tokens)

---

### 2. Anthropic API Key (Recommended)
```env
ANTHROPIC_API_KEY=sk-ant-...
```
**Status:** ⚠️ **KHUYẾN NGHỊ LẤY**

**Cần cho:**
- AI Assistants (Claude Sonnet, Haiku)
- LangGraph orchestrator
- Prompt caching (giảm cost)

**Lấy ở đâu:**
1. Vào: https://console.anthropic.com/settings/keys
2. Login/Sign up
3. Click "Create Key"
4. Copy key và paste vào `.env.local`

**Cost:** Pay-as-you-go (~$3-15 per 1M tokens)

**Note:** Có thể dùng chỉ OpenAI hoặc chỉ Anthropic, hoặc cả hai

---

### 3. Supabase Credentials ⭐
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Status:** ✅ **ĐÃ CÓ** (trong `.env.local`)

**Cần cho:**
- Database (PostgreSQL + pgvector)
- Authentication
- RAG system
- Conversation history
- n8n workflows

**Lấy ở đâu:**
1. Vào Supabase Dashboard
2. Chọn project
3. Settings → API
4. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_KEY`

**Note:** `SUPABASE_SERVICE_KEY` là secret, không share!

---

## 🔵 OPTIONAL (Khuyến nghị)

### 4. Tavily API Key
```env
TAVILY_API_KEY=tvly-...
```
**Status:** ⚠️ **KHUYẾN NGHỊ** (cho Research Assistant)

**Cần cho:**
- Research Assistant web search
- Real-time information retrieval
- Latest news/articles

**Lấy ở đâu:**
1. Vào: https://tavily.com/sign-up
2. Sign up (free tier available)
3. Get API key từ dashboard
4. Copy vào `.env.local`

**Cost:** Free tier: 1,000 requests/month

**Note:** Nếu không có, Research Assistant vẫn hoạt động nhưng không có web search

---

### 5. n8n API Key (Optional)
```env
N8N_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key
```
**Status:** ⚠️ **OPTIONAL** (chỉ cần nếu dùng n8n API)

**Cần cho:**
- n8n workflow management via API
- Trigger workflows programmatically

**Lấy ở đâu:**
1. Start n8n: `npx n8n` hoặc `POST /api/n8n/start`
2. Vào: http://localhost:5678
3. Settings → API
4. Generate API key

**Note:**
- `N8N_URL` mặc định là `http://localhost:5678`
- Không cần nếu chỉ dùng webhooks

---

## 🔴 FUTURE (Chưa implement)

### 6. Plaid API Keys
```env
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
```
**Status:** ❌ **CHƯA CẦN** (chưa implement)

**Cần cho:**
- Financial Assistant transaction sync
- Bank account integration

**Lấy ở đâu:** https://dashboard.plaid.com/signup

**Note:** Chỉ cần khi implement Plaid integration (có thể làm sau)

---

### 7. Perplexity API Key
```env
PERPLEXITY_API_KEY=...
```
**Status:** ❌ **CHƯA CẦN** (chưa implement)

**Cần cho:**
- Alternative search engine
- Research Assistant

**Lấy ở đâu:** https://www.perplexity.ai/settings/api

**Note:** Chỉ cần khi implement Perplexity (optional)

---

## 📋 CHECKLIST

### Bước 1: Required Keys
- [ ] **OpenAI API Key** - ⚠️ CẦN LẤY NGAY
- [ ] **Anthropic API Key** - ⚠️ KHUYẾN NGHỊ
- [ ] **Supabase Credentials** - ✅ ĐÃ CÓ (verify lại)

### Bước 2: Optional Keys
- [ ] **Tavily API Key** - ⚠️ KHUYẾN NGHỊ (cho Research)
- [ ] **n8n API Key** - ⚠️ OPTIONAL (chỉ nếu cần API)

### Bước 3: Verify
```bash
# Test API keys
curl http://localhost:3001/api/assistants/status
```

---

## 🎯 PRIORITY

### High Priority (Cần ngay)
1. ✅ **Supabase** - Đã có
2. ⚠️ **OpenAI** - Cần lấy ngay
3. ⚠️ **Anthropic** - Khuyến nghị lấy

### Medium Priority (Khuyến nghị)
4. ⚠️ **Tavily** - Cho Research Assistant tốt hơn

### Low Priority (Optional)
5. ⚠️ **n8n API Key** - Chỉ nếu cần API access

---

## 💡 TIPS

1. **OpenAI vs Anthropic:**
   - Có thể dùng chỉ 1 trong 2
   - Hoặc cả 2 để có fallback
   - Anthropic tốt hơn cho long context

2. **Tavily:**
   - Free tier đủ cho testing
   - Cần upgrade nếu production

3. **Supabase:**
   - Service key là secret!
   - Không commit vào git

4. **Cost Management:**
   - Set usage limits trong OpenAI/Anthropic dashboard
   - Monitor costs thường xuyên
   - Use prompt caching để giảm cost

---

## ✅ SAU KHI LẤY XONG

1. **Add vào `.env.local`:**
   ```env
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   TAVILY_API_KEY=tvly-...
   ```

2. **Verify:**
   ```bash
   curl http://localhost:3001/api/assistants/status
   ```

3. **Test:**
   ```powershell
   .\test-simple.ps1
   ```

---

**Last Updated:** January 2025
**Status:** ⚠️ **CẦN LẤY OPENAI + ANTHROPIC KEYS**

