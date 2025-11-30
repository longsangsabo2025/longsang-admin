# ⚡ Quick Setup Guide - Complete System

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (2 min)

```bash
# Node.js dependencies
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\api
npm install

# Python dependencies
cd ..\mcp-server
pip install -r requirements.txt
```

### Step 2: Configure Environment (1 min)

Edit `.env` file:
```env
# TikTok Ads (NEW)
TIKTOK_ACCESS_TOKEN=your_token
TIKTOK_ADVERTISER_ID=your_advertiser_id

# JWT (NEW)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Logging (NEW)
LOG_LEVEL=info
```

### Step 3: Start Services (1 min)

```powershell
# Automated (Recommended)
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
.\start-phase2-services.ps1
```

### Step 4: Verify (1 min)

```bash
# Check API Server
curl http://localhost:3001/api/health

# Check API Documentation
# Open: http://localhost:3001/api-docs

# Check MCP Server
curl http://localhost:3003/docs
```

---

## ✅ Verification Commands

```bash
# Test all integrations
cd api
node scripts/test-end-to-end.js

# Test TikTok
curl -X POST http://localhost:3001/api/multi-platform/platforms

# Test Robyn
curl -X POST http://localhost:3003/mcp/robyn/optimize-budget \
  -H "Content-Type: application/json" \
  -d '{"historical_data":[],"total_budget":1000,"channels":["facebook","google"]}'
```

---

## 📚 Documentation

- **API Docs**: http://localhost:3001/api-docs
- **MCP Server Docs**: http://localhost:3003/docs
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Integration Status**: `COMPLETE_INTEGRATION_STATUS.md`

---

*Quick Setup: 2025-2026*
*All Systems Ready! 🚀*

