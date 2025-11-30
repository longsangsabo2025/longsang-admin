# Phase 1 Testing Guide - Step by Step

## 🎯 Mục Tiêu
Test end-to-end workflow: Image Generation → Creative Creation → Campaign Strategy

---

## 📋 Prerequisites Checklist

Trước khi test, đảm bảo:

- [ ] **MCP Server đang chạy** (port 3002 + 3003)
- [ ] **API Server đang chạy** (port 3001)
- [ ] **Dependencies đã install**
- [ ] **Environment variables đã config**

---

## 🚀 Step-by-Step Testing

### Step 1: Install Dependencies

```bash
# Terminal 1: Install Python dependencies
cd mcp-server
pip install -r requirements.txt

# Terminal 2: Install Node.js dependencies (nếu chưa có)
cd api
npm install
```

**Check:**
```bash
# Verify Python packages
pip list | grep -E "fastapi|uvicorn|google-genai"

# Verify Node packages
cd api && npm list form-data
```

---

### Step 2: Configure Environment

Tạo/update `.env` file trong `longsang-admin/`:

```env
# MCP Server
MCP_PORT=3002

# MCP Server HTTP API (for direct access)
MCP_SERVER_URL=http://localhost:3003

# Facebook Ads (optional for now - chỉ cần cho creative creation)
FACEBOOK_ACCESS_TOKEN=your_token_here
FACEBOOK_AD_ACCOUNT_ID=your_account_id_here

# Google Service Account (for Imagen)
GOOGLE_SERVICE_ACCOUNT_JSON={"project_id":"...","private_key":"...","client_email":"..."}

# Brain API (optional - for strategy generation)
BRAIN_API_URL=http://localhost:3001/api/brain
TEST_BRAIN_DOMAIN_ID=your_domain_uuid_here  # Optional
```

**Check:**
```bash
# Verify .env exists
cat .env | grep -E "MCP_SERVER_URL|GOOGLE_SERVICE_ACCOUNT"
```

---

### Step 3: Start MCP Server

```bash
cd mcp-server
python server.py
```

**Expected Output:**
```
✅ Gemini AI client initialized (NEW google-genai SDK)
✅ HTTP API server started on port 3003
Starting MCP Server on port 3002
```

**Check:**
- Port 3002: MCP protocol
- Port 3003: HTTP REST API

**Test:**
```bash
# Test HTTP endpoint
curl http://localhost:3003/docs
```

---

### Step 4: Start API Server

```bash
cd api
npm run dev
```

**Expected Output:**
```
🚀 API Server running on http://localhost:3001
📊 Ad Campaigns API available at http://localhost:3001/api/ad-campaigns
```

**Check:**
```bash
# Test health endpoint
curl http://localhost:3001/api/health
```

---

### Step 5: Run Test Script

```bash
cd api
node scripts/test-phase1-ad-campaigns.js
```

**Expected Flow:**
```
[STEP 1.1] Checking API server...
✅ API server is running

[STEP 1.2] Checking MCP Server HTTP API...
✅ MCP Server HTTP API is running

[STEP 2] Fetching available ad styles...
✅ Found 5 ad styles

[STEP 3] Generating ad image...
✅ Image generated: /path/to/image.png

[STEP 4] Generating campaign strategy...
✅ Strategy generated

[STEP 5] Generating creative variants...
✅ Generated 3 creative variants

✅ ALL TESTS PASSED
```

---

### Step 6: Manual API Testing

#### Test 6.1: Get Ad Styles
```bash
curl http://localhost:3001/api/ad-campaigns/styles
```

**Expected Response:**
```json
{
  "success": true,
  "styles": {
    "product": {...},
    "lifestyle": {...},
    ...
  },
  "count": 5
}
```

#### Test 6.2: Generate Image
```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful cup of coffee on a wooden table",
    "aspect_ratio": "16:9",
    "ad_style": "lifestyle"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "image_path": "mcp-server/generated_images/imagen_20250101_120000.png",
  "full_prompt": "...",
  "aspect_ratio": "16:9",
  "ad_style": "lifestyle",
  "model": "imagen-3.0-generate-001",
  "provider": "vertex_ai"
}
```

#### Test 6.3: Generate Strategy
```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-strategy \
  -H "Content-Type: application/json" \
  -d '{
    "product_info": {
      "name": "Premium Coffee",
      "description": "Artisan roasted coffee beans",
      "category": "Food & Beverage"
    },
    "target_audience": {
      "age": "25-45",
      "interests": ["coffee", "lifestyle"]
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "strategy": {
    "source": "basic_template",
    "recommendations": {
      "ad_styles": ["product", "lifestyle"],
      "messaging": [...],
      "formats": ["single_image"],
      ...
    }
  }
}
```

#### Test 6.4: Generate Creative Variants
```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-creatives \
  -H "Content-Type: application/json" \
  -d '{
    "product_info": {
      "name": "Premium Coffee",
      "description": "Artisan roasted coffee beans"
    },
    "num_variants": 3
  }'
```

---

### Step 7: Test with Facebook (Optional)

**Prerequisites:**
- Facebook Access Token
- Facebook Ad Account ID
- Facebook Page ID

```bash
curl -X POST http://localhost:3001/api/ad-campaigns/create-creative \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test AI Creative",
    "page_id": "your_facebook_page_id",
    "message": "Discover our premium coffee",
    "link": "https://example.com",
    "product_info": {
      "name": "Premium Coffee",
      "description": "Artisan roasted coffee beans"
    },
    "ad_style": "product",
    "generate_image": true
  }'
```

---

## 🔍 Troubleshooting

### Issue: MCP Server không start
```bash
# Check port
netstat -ano | findstr :3002
netstat -ano | findstr :3003

# Check Python
python --version

# Check dependencies
pip list | grep fastapi
```

### Issue: Image generation fails
```bash
# Check Google credentials
echo $GOOGLE_SERVICE_ACCOUNT_JSON | jq .project_id

# Test MCP endpoint directly
curl -X POST http://localhost:3003/mcp/google/generate_image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "aspect_ratio": "1:1"}'
```

### Issue: API server errors
```bash
# Check logs
tail -f api/server.log

# Check environment
node -e "console.log(process.env.MCP_SERVER_URL)"
```

---

## ✅ Success Criteria

Phase 1 được coi là thành công khi:

- [x] MCP Server start thành công (port 3002 + 3003)
- [x] API Server start thành công (port 3001)
- [x] Image generation hoạt động (có image file được tạo)
- [x] Strategy generation hoạt động (có strategy response)
- [x] Creative variants generation hoạt động (có multiple variants)
- [ ] Facebook creative creation hoạt động (nếu có credentials)

---

## 📝 Test Results Template

Sau khi test, ghi lại kết quả:

```
Date: ___________
Tester: ___________

✅ Passed:
- [ ] Step 1: Dependencies installed
- [ ] Step 2: Environment configured
- [ ] Step 3: MCP Server running
- [ ] Step 4: API Server running
- [ ] Step 5: Test script passed
- [ ] Step 6: Manual API tests passed
- [ ] Step 7: Facebook integration (optional)

❌ Failed:
- [ ] Issue: ___________
- [ ] Issue: ___________

Notes:
___________
```

---

*Ready for testing: 2025-2026*

