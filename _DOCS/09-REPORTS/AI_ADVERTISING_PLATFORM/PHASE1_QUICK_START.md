# 🚀 Phase 1 Quick Start - Step by Step

## ✅ Checklist - Làm Theo Thứ Tự

### 📦 STEP 1: Install Dependencies

#### 1.1 Python Dependencies (MCP Server)
```bash
cd mcp-server
pip install -r requirements.txt
```

**Verify:**
```bash
pip list | grep -E "fastapi|uvicorn|google-genai"
```

---

### 📝 STEP 2: Configure Environment

#### 2.1 Check .env file
```bash
cd ..
# Check if .env exists
cat .env | grep MCP_SERVER_URL
```

#### 2.2 Add/Update .env
Thêm vào `.env` trong `longsang-admin/`:

```env
# MCP Server
MCP_PORT=3002
MCP_SERVER_URL=http://localhost:3003

# Google (for Imagen)
GOOGLE_SERVICE_ACCOUNT_JSON={"project_id":"...","private_key":"...","client_email":"..."}

# Facebook (optional - chỉ cần khi test creative creation)
FACEBOOK_ACCESS_TOKEN=your_token
FACEBOOK_AD_ACCOUNT_ID=your_account_id

# Brain (optional - chỉ cần khi test với Brain)
BRAIN_API_URL=http://localhost:3001/api/brain
```

**Verify:**
```bash
# Check variables are set
node -e "require('dotenv').config(); console.log(process.env.MCP_SERVER_URL)"
```

---

### 🖥️ STEP 3: Start MCP Server

#### 3.1 Start Server
```bash
cd mcp-server
python server.py
```

**Expected Output:**
```
✅ Gemini AI client initialized
✅ HTTP API server started on port 3003
Starting MCP Server on port 3002
```

#### 3.2 Verify MCP Server
**Terminal mới:**
```bash
# Test HTTP endpoint
curl http://localhost:3003/docs

# Hoặc test image generation
curl -X POST http://localhost:3003/mcp/google/generate_image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test image", "aspect_ratio": "1:1"}'
```

**✅ Success nếu:** Có response (có thể là error về credentials, nhưng server đang chạy)

---

### 🖥️ STEP 4: Start API Server

#### 4.1 Start Server
**Terminal mới:**
```bash
cd api
npm run dev
```

**Expected Output:**
```
🚀 API Server running on http://localhost:3001
📊 Ad Campaigns API available at http://localhost:3001/api/ad-campaigns
```

#### 4.2 Verify API Server
**Terminal mới:**
```bash
curl http://localhost:3001/api/health
```

**✅ Success nếu:** `{"status":"OK","timestamp":"..."}`

---

### 🧪 STEP 5: Run Test Script

#### 5.1 Run Tests
```bash
cd api
node scripts/test-phase1-ad-campaigns.js
```

#### 5.2 Expected Results
```
✅ API server is running
✅ MCP Server HTTP API is running
✅ Found 5 ad styles
✅ Image generated: /path/to/image.png
✅ Strategy generated
✅ Generated 3 creative variants
✅ ALL TESTS PASSED
```

**✅ Success nếu:** Tất cả tests pass

---

### 🧪 STEP 6: Manual API Tests

#### 6.1 Test Ad Styles
```bash
curl http://localhost:3001/api/ad-campaigns/styles
```

**✅ Success nếu:** Có JSON response với 5 styles

#### 6.2 Test Image Generation
```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful cup of coffee",
    "aspect_ratio": "16:9",
    "ad_style": "product"
  }'
```

**✅ Success nếu:**
- `"success": true`
- Có `image_path` trong response
- File image được tạo trong `mcp-server/generated_images/`

#### 6.3 Test Strategy Generation
```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-strategy \
  -H "Content-Type: application/json" \
  -d '{
    "product_info": {
      "name": "Premium Coffee",
      "description": "Artisan roasted coffee beans",
      "category": "Food & Beverage"
    }
  }'
```

**✅ Success nếu:**
- `"success": true`
- Có `strategy` object với recommendations

#### 6.4 Test Creative Variants
```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-creatives \
  -H "Content-Type: application/json" \
  -d '{
    "product_info": {
      "name": "Premium Coffee",
      "description": "Artisan roasted coffee beans"
    },
    "num_variants": 2
  }'
```

**✅ Success nếu:**
- `"success": true`
- Có `variants` array với 2 items
- Mỗi variant có `image_path`

---

## 🎯 Success Criteria

Phase 1 thành công khi:

- [x] **MCP Server** chạy trên port 3002 + 3003
- [x] **API Server** chạy trên port 3001
- [x] **Image generation** tạo được image file
- [x] **Strategy generation** trả về strategy object
- [x] **Creative variants** tạo được multiple variants
- [ ] **Facebook creative** (optional - cần credentials)

---

## ❌ Common Issues & Fixes

### Issue 1: MCP Server không start
**Error:** `Port already in use` hoặc `Module not found`

**Fix:**
```bash
# Check port
netstat -ano | findstr :3002
netstat -ano | findstr :3003

# Kill process nếu cần
taskkill /PID <pid> /F

# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### Issue 2: Image generation fails
**Error:** `Google services not available` hoặc `Vertex AI failed`

**Fix:**
```bash
# Check credentials
echo $GOOGLE_SERVICE_ACCOUNT_JSON

# Test với Gemini fallback (không cần Service Account)
# Update .env: GEMINI_API_KEY=your_key
```

### Issue 3: API Server không connect được MCP Server
**Error:** `ECONNREFUSED` hoặc `Connection refused`

**Fix:**
```bash
# Check MCP Server đang chạy
curl http://localhost:3003/docs

# Check MCP_SERVER_URL trong .env
cat .env | grep MCP_SERVER_URL

# Restart cả 2 servers
```

---

## 📊 Test Results

Sau khi hoàn thành, ghi lại:

```
✅ Completed Steps:
- [ ] Step 1: Dependencies installed
- [ ] Step 2: Environment configured
- [ ] Step 3: MCP Server running
- [ ] Step 4: API Server running
- [ ] Step 5: Test script passed
- [ ] Step 6: Manual tests passed

📝 Notes:
___________
___________
```

---

## 🎉 Next: Phase 2

Sau khi Phase 1 hoạt động, có thể tiếp tục:
- Video generation (OpenV/Waver)
- A/B testing framework
- Google Ads integration

---

*Ready to test: 2025-2026*

