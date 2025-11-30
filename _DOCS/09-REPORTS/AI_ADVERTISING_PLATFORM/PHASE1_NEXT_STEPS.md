# 🎯 Phase 1 - Next Steps (Step by Step)

## ✅ Implementation Complete!

Tất cả code đã được implement. Bây giờ làm theo các bước sau:

---

## 📋 STEP-BY-STEP EXECUTION

### 🔧 STEP 1: Install Dependencies

#### Terminal 1: Python Dependencies
```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\mcp-server
pip install -r requirements.txt
```

**Verify:**
```bash
pip list | findstr "fastapi uvicorn google-genai"
```

**Expected:** Thấy fastapi, uvicorn, google-genai trong list

---

### 📝 STEP 2: Check Environment Variables

#### Check .env file
```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
cat .env | findstr "MCP_SERVER_URL GOOGLE_SERVICE_ACCOUNT"
```

#### Add if missing:
```env
MCP_SERVER_URL=http://localhost:3003
GOOGLE_SERVICE_ACCOUNT_JSON={"project_id":"...","private_key":"...","client_email":"..."}
```

**Note:** Nếu chưa có Google Service Account, có thể test với Gemini API key:
```env
GEMINI_API_KEY=your_gemini_key
```

---

### 🖥️ STEP 3: Start MCP Server

#### Terminal 1:
```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\mcp-server
python server.py
```

**✅ Success khi thấy:**
```
✅ Gemini AI client initialized
✅ HTTP API server started on port 3003
Starting MCP Server on port 3002
```

**⚠️ Nếu có lỗi:**
- Check port 3002, 3003 có bị chiếm không
- Check Google credentials
- Check Python dependencies

---

### 🖥️ STEP 4: Start API Server

#### Terminal 2:
```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\api
npm install  # Nếu chưa install axios, form-data
npm run dev
```

**✅ Success khi thấy:**
```
🚀 API Server running on http://localhost:3001
📊 Ad Campaigns API available at http://localhost:3001/api/ad-campaigns
```

---

### 🧪 STEP 5: Run Test Script

#### Terminal 3:
```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\api
node scripts/test-phase1-ad-campaigns.js
```

**✅ Success khi thấy:**
```
✅ ALL TESTS PASSED
```

**❌ Nếu fail:**
- Check cả 2 servers đang chạy
- Check environment variables
- Check logs trong Terminal 1 & 2

---

### 🧪 STEP 6: Manual Test - Get Ad Styles

```bash
curl http://localhost:3001/api/ad-campaigns/styles
```

**Expected:** JSON với 5 styles (product, lifestyle, testimonial, social, minimalist)

---

### 🧪 STEP 7: Manual Test - Generate Image

```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-image ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\": \"A beautiful cup of coffee\", \"aspect_ratio\": \"16:9\", \"ad_style\": \"product\"}"
```

**Expected:**
- `"success": true`
- Có `image_path` trong response
- File được tạo trong `mcp-server/generated_images/`

**Check file:**
```bash
dir mcp-server\generated_images
```

---

### 🧪 STEP 8: Manual Test - Generate Strategy

```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-strategy ^
  -H "Content-Type: application/json" ^
  -d "{\"product_info\": {\"name\": \"Coffee\", \"description\": \"Premium coffee\"}}"
```

**Expected:**
- `"success": true`
- Có `strategy` object với recommendations

---

## ✅ Verification Checklist

Sau khi hoàn thành các steps trên:

- [ ] MCP Server chạy (port 3002 + 3003)
- [ ] API Server chạy (port 3001)
- [ ] Test script pass tất cả tests
- [ ] Manual API calls thành công
- [ ] Image files được tạo
- [ ] Strategy generation hoạt động

---

## 🎉 Success!

Nếu tất cả steps trên pass → **Phase 1 hoàn thành!**

Có thể tiếp tục với:
- Test Facebook creative creation (cần credentials)
- Test với Brain domain (cần domain_id)
- Proceed to Phase 2 (video generation)

---

## 📞 Support

Nếu gặp vấn đề:
1. Check logs trong Terminal 1 & 2
2. Verify environment variables
3. Check ports không bị conflict
4. Review `PHASE1_TESTING_GUIDE.md` cho troubleshooting

---

*Ready to execute: 2025-2026*

