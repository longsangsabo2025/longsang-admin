# Phase 2 Quick Start - Manual Setup

## ✅ Đã Hoàn Thành

1. **FFmpeg** ✅ - Đã tìm thấy tại `C:\ffmpeg\bin\ffmpeg.exe`
2. **Code Updates** ✅ - Video generation tự động tìm FFmpeg
3. **Dependencies Check** ✅ - scipy, numpy đã có

## 🚀 Bước Tiếp Theo (Manual)

### Terminal 1: Start MCP Server

```powershell
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\mcp-server

# Install dependencies nếu chưa có
pip install -r requirements.txt

# Start server
python server.py
```

**Expected Output:**
```
✅ Gemini AI client initialized
✅ HTTP API server started on port 3003
Starting MCP Server on port 3002
```

### Terminal 2: Start API Server

```powershell
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\api

# Install dependencies nếu chưa có
npm install

# Start server
npm run dev
```

**Expected Output:**
```
🚀 API Server running on http://localhost:3001
```

### Terminal 3: Run Test Script

```powershell
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\api

node scripts/test-phase2-video-ab.js
```

**Expected:** Tất cả tests pass ✅

---

## 🧪 Test với Real Campaign Data

Sau khi test script pass, có thể test với real data:

### 1. Generate Video Ad
```bash
curl -X POST http://localhost:3001/api/video-ads/generate \
  -H "Content-Type: application/json" \
  -d '{
    "product_info": {
      "name": "Your Product",
      "description": "Product description"
    },
    "ad_style": "product",
    "duration": 15,
    "aspect_ratio": "9:16"
  }'
```

### 2. A/B Testing Analysis
```bash
curl -X POST http://localhost:3003/mcp/ab-testing/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_data": {
      "variant_a_name": "Variant A",
      "variant_b_name": "Variant B",
      "metrics": {
        "CTR": {
          "variant_a": [2.1, 2.3, 2.0, 2.2],
          "variant_b": [2.5, 2.7, 2.6, 2.8]
        }
      },
      "conversions": {
        "variant_a_conversions": 45,
        "variant_a_impressions": 1000,
        "variant_b_conversions": 62,
        "variant_b_impressions": 1000
      }
    }
  }'
```

### 3. Campaign Optimization
```bash
curl -X POST http://localhost:3001/api/campaign-optimizer/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_data": {
      "campaign_id": "campaign-123",
      "variant_a_name": "Product Style",
      "variant_b_name": "Lifestyle Style",
      "variant_a_impressions": 1000,
      "variant_b_impressions": 1000,
      "variant_a_conversions": 45,
      "variant_b_conversions": 62,
      "variant_a_metrics": {
        "CTR": [2.1, 2.3, 2.0, 2.2]
      },
      "variant_b_metrics": {
        "CTR": [2.5, 2.7, 2.6, 2.8]
      }
    }
  }'
```

---

## 📝 Notes

- **FFmpeg**: Đã tự động detect tại `C:\ffmpeg\bin\ffmpeg.exe`
- **Services**: Cần start trong separate terminals
- **Video Generation**: Có thể mất 1-5 phút tùy số lượng images
- **A/B Testing**: Cần ít nhất 1000 impressions để có kết quả đáng tin cậy

---

*Ready to test!*

