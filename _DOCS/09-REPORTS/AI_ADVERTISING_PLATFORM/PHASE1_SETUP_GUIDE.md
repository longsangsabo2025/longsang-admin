# Phase 1 Setup Guide - AI Advertising Integration

## ✅ Implementation Complete

Phase 1 đã được implement với các components sau:

### 1. Enhanced Google Imagen (`mcp-server/google_integration.py`)
- ✅ Added `AD_STYLE_PRESETS` với 5 styles: product, lifestyle, testimonial, social, minimalist
- ✅ Updated `generate_image()` method với `ad_style` parameter
- ✅ Enhanced prompts với style-specific keywords

### 2. Ad Creative Service (`api/services/ad-creative-service.js`)
- ✅ `generateAdImage()` - Generate images via MCP Server
- ✅ `generateCreativeVariants()` - Multiple variants cho A/B testing
- ✅ `createAICreative()` - Create Facebook creative với AI image
- ✅ `createCampaignWithAICreatives()` - Complete campaign creation

### 3. Campaign Strategy Service (`api/services/campaign-strategy-service.js`)
- ✅ `generateStrategy()` - Main entry point
- ✅ `generateStrategyWithBrain()` - Uses Brain domain agent
- ✅ `generateBasicStrategy()` - Fallback strategy
- ✅ Parses Brain response thành structured recommendations

### 4. API Routes (`api/routes/ad-campaigns.js`)
- ✅ `POST /api/ad-campaigns/generate-strategy`
- ✅ `POST /api/ad-campaigns/generate-image`
- ✅ `POST /api/ad-campaigns/generate-creatives`
- ✅ `POST /api/ad-campaigns/create-creative`
- ✅ `POST /api/ad-campaigns/create-campaign`
- ✅ `GET /api/ad-campaigns/styles`

### 5. MCP Server HTTP Endpoint (`mcp-server/server.py`)
- ✅ Added FastAPI HTTP endpoint trên port 3003
- ✅ `/mcp/google/generate_image` endpoint
- ✅ Bypasses MCP protocol cho direct API access

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

#### Python (MCP Server):
```bash
cd mcp-server
pip install -r requirements.txt
```

**New dependencies added:**
- `fastapi>=0.104.0`
- `uvicorn>=0.24.0`

#### Node.js (API Server):
```bash
cd api
npm install
```

**New dependencies added:**
- `form-data` (already in package.json)

### Step 2: Environment Variables

Add to `.env`:

```env
# MCP Server
MCP_PORT=3002
MCP_SERVER_URL=http://localhost:3003  # HTTP API port (MCP_PORT + 1)

# Facebook Ads
FACEBOOK_ACCESS_TOKEN=your_facebook_token
FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id

# Google Service Account (for Imagen)
GOOGLE_SERVICE_ACCOUNT_JSON={"project_id":"...","private_key":"...","client_email":"..."}

# Brain API (optional - for strategy generation)
BRAIN_API_URL=http://localhost:3001/api/brain
```

### Step 3: Start Services

#### Start MCP Server:
```bash
cd mcp-server
python server.py
```

**Expected output:**
```
✅ HTTP API server started on port 3003
Starting MCP Server on port 3002
```

#### Start API Server:
```bash
cd api
npm run dev
```

**Expected output:**
```
🚀 API Server running on http://localhost:3001
📊 Ad Campaigns API available at http://localhost:3001/api/ad-campaigns
```

---

## 🧪 Testing

### Test 1: Generate Ad Image
```bash
curl -X POST http://localhost:3001/api/ad-campaigns/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful smartphone on a clean white background",
    "aspect_ratio": "16:9",
    "ad_style": "product"
  }'
```

### Test 2: Generate Campaign Strategy
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

### Test 3: Create Complete Campaign
```bash
curl -X POST http://localhost:3001/api/ad-campaigns/create-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "Coffee Launch Campaign",
    "objective": "CONVERSIONS",
    "budget": 1000,
    "page_id": "your_facebook_page_id",
    "product_info": {
      "name": "Premium Coffee",
      "description": "Artisan roasted coffee beans"
    },
    "message": "Discover our premium coffee",
    "link": "https://example.com/coffee",
    "num_creatives": 3
  }'
```

---

## 📋 API Endpoints Reference

### Generate Strategy
**POST** `/api/ad-campaigns/generate-strategy`

**Request:**
```json
{
  "product_info": {
    "name": "Product Name",
    "description": "Product description",
    "category": "Category"
  },
  "domain_id": "uuid", // Optional - uses Brain if provided
  "target_audience": {
    "age": "25-45",
    "interests": ["interest1", "interest2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "strategy": {
    "source": "brain_domain_agent",
    "confidence": 0.8,
    "recommendations": {
      "ad_styles": ["product", "lifestyle"],
      "messaging": ["Message 1", "Message 2"],
      "formats": ["single_image"],
      "budget_allocation": {...},
      "ab_testing": ["creative_variations"]
    }
  }
}
```

### Generate Image
**POST** `/api/ad-campaigns/generate-image`

**Request:**
```json
{
  "prompt": "Image description",
  "aspect_ratio": "16:9",
  "ad_style": "product",
  "style": null
}
```

**Response:**
```json
{
  "success": true,
  "image_path": "/path/to/image.png",
  "full_prompt": "Enhanced prompt...",
  "aspect_ratio": "16:9",
  "ad_style": "product",
  "model": "imagen-3.0-generate-001",
  "provider": "vertex_ai"
}
```

### Generate Creatives
**POST** `/api/ad-campaigns/generate-creatives`

**Request:**
```json
{
  "product_info": {
    "name": "Product Name",
    "description": "Product description"
  },
  "num_variants": 3
}
```

### Create Campaign
**POST** `/api/ad-campaigns/create-campaign`

**Request:**
```json
{
  "campaign_name": "Campaign Name",
  "objective": "CONVERSIONS",
  "budget": 1000,
  "page_id": "facebook_page_id",
  "product_info": {
    "name": "Product Name",
    "description": "Product description"
  },
  "message": "Ad message",
  "link": "https://example.com",
  "num_creatives": 3,
  "domain_id": "uuid" // Optional
}
```

---

## 🔧 Troubleshooting

### Issue: MCP Server không start
**Solution:**
- Check port 3002 và 3003 có available không
- Check `GOOGLE_SERVICE_ACCOUNT_JSON` có valid không
- Check dependencies: `pip install -r requirements.txt`

### Issue: Image generation fails
**Solution:**
- Check Google Service Account credentials
- Check Vertex AI billing enabled
- Check `GEMINI_API_KEY` nếu dùng Gemini fallback

### Issue: Facebook creative creation fails
**Solution:**
- Check `FACEBOOK_ACCESS_TOKEN` valid
- Check `FACEBOOK_AD_ACCOUNT_ID` correct
- Check image upload permissions

### Issue: Brain strategy generation fails
**Solution:**
- Brain integration is optional
- System sẽ fallback to basic strategy
- Check `BRAIN_API_URL` nếu muốn dùng Brain

---

## 📝 Next Steps

Sau khi Phase 1 hoạt động, có thể tiếp tục với:

1. **Phase 2**: Video generation (OpenV/Waver)
2. **Phase 2**: A/B testing framework (scipy.stats)
3. **Phase 3**: Google Ads integration
4. **Phase 3**: Multi-platform deployment

---

*Phase 1 completed: 2025-2026*

