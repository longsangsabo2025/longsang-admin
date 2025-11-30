# Phase 2 Setup Guide

## 🎯 Overview

Phase 2 adds:
1. **Video Generation** - Create short-form video ads (15-60s)
2. **A/B Testing Framework** - Statistical analysis for campaigns
3. **Campaign Optimization Agent** - Auto-optimize based on performance

---

## 📋 Prerequisites

### 1. FFmpeg Installation

Video generation requires FFmpeg. Install based on your OS:

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify:**
```bash
ffmpeg -version
```

### 2. Python Dependencies

```bash
cd mcp-server
pip install -r requirements.txt
```

**New dependencies:**
- `scipy>=1.11.0` - Statistical tests
- `numpy>=1.24.0` - Numerical operations

### 3. Node.js Dependencies

```bash
cd api
npm install
```

(No new dependencies - uses existing `axios`)

---

## 🚀 Setup Steps

### Step 1: Install FFmpeg

Follow OS-specific instructions above.

**Test:**
```bash
ffmpeg -version
# Should show FFmpeg version info
```

### Step 2: Install Python Dependencies

```bash
cd mcp-server
pip install scipy numpy
# Or reinstall all:
pip install -r requirements.txt
```

**Verify:**
```bash
python -c "import scipy; import numpy; print('✅ Dependencies installed')"
```

### Step 3: Configure Environment

Ensure `.env` has:
```env
MCP_SERVER_URL=http://localhost:3003
API_URL=http://localhost:3001
```

### Step 4: Start Services

**Terminal 1: MCP Server**
```bash
cd mcp-server
python server.py
```

**Expected output:**
```
✅ Gemini AI client initialized
✅ HTTP API server started on port 3003
Starting MCP Server on port 3002
```

**Terminal 2: API Server**
```bash
cd api
npm run dev
```

**Expected output:**
```
🚀 API Server running on http://localhost:3001
```

### Step 5: Test Video Generation

```bash
curl -X POST http://localhost:3001/api/video-ads/generate \
  -H "Content-Type: application/json" \
  -d '{
    "product_info": {
      "name": "Test Product",
      "description": "Test description"
    },
    "ad_style": "product",
    "duration": 15,
    "aspect_ratio": "9:16"
  }'
```

**Expected:** Video file created in `mcp-server/generated_videos/`

### Step 6: Test A/B Testing

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

**Expected:** Statistical analysis with p-values and recommendations

### Step 7: Test Campaign Optimizer

```bash
curl -X POST http://localhost:3001/api/campaign-optimizer/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_data": {
      "campaign_id": "test-123",
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

**Expected:** Optimization recommendations

---

## 🧪 Run Test Script

```bash
cd api
node scripts/test-phase2-video-ab.js
```

This will test:
- ✅ Service health checks
- ✅ Platform formats
- ✅ Video generation
- ✅ Video variants
- ✅ A/B testing analysis
- ✅ Campaign optimization

---

## 🔍 Troubleshooting

### Issue: FFmpeg not found
```bash
# Check if FFmpeg is in PATH
which ffmpeg  # Linux/macOS
where ffmpeg  # Windows

# Add to PATH if needed
# Windows: Add FFmpeg bin folder to System PATH
# Linux/macOS: Already in PATH if installed via package manager
```

### Issue: scipy/numpy import errors
```bash
# Reinstall
pip uninstall scipy numpy
pip install scipy numpy

# Or upgrade pip first
pip install --upgrade pip
pip install scipy numpy
```

### Issue: Video generation fails
```bash
# Check FFmpeg
ffmpeg -version

# Check image generation (prerequisite)
curl -X POST http://localhost:3003/mcp/google/generate_image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "aspect_ratio": "1:1"}'
```

### Issue: A/B testing returns errors
```bash
# Check scipy installation
python -c "from scipy import stats; print('OK')"

# Check data format
# Ensure metrics arrays have same length
# Ensure impression counts > 0
```

---

## ✅ Verification Checklist

- [ ] FFmpeg installed and in PATH
- [ ] Python dependencies installed (scipy, numpy)
- [ ] MCP Server running (port 3002 + 3003)
- [ ] API Server running (port 3001)
- [ ] Video generation test passes
- [ ] A/B testing test passes
- [ ] Campaign optimizer test passes
- [ ] Test script passes all tests

---

## 📝 Notes

- **Video Generation Time**: 1-5 minutes depending on number of images
- **A/B Testing**: Requires sufficient sample size (min 1000 impressions recommended)
- **Campaign Optimizer**: Uses A/B testing results + Brain insights (if available)
- **FFmpeg**: Must be installed separately (not a Python package)

---

*Phase 2 Setup: 2025-2026*

