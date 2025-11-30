# 🚀 AI Advertising Platform - Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. System Requirements

**Server:**

- OS: Windows 10+, Linux, or macOS
- RAM: Minimum 4GB (8GB recommended)
- Storage: 10GB free space
- CPU: Multi-core recommended

**Software:**

- Python 3.8+ installed
- Node.js 18+ installed
- FFmpeg installed (for video generation)
- Git installed

---

## 🔧 Step 1: Environment Setup

### 1.1 Clone/Checkout Repository

```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
```

### 1.2 Install Python Dependencies

```bash
cd mcp-server
pip install -r requirements.txt
```

**Verify:**

```bash
python -c "import scipy, numpy, fastapi; print('✅ Dependencies OK')"
```

### 1.3 Install Node.js Dependencies

```bash
cd ../api
npm install
```

**Verify:**

```bash
npm list google-ads-api ws axios
```

### 1.4 Install FFmpeg

**Windows:**

```powershell
# Check if already installed
ffmpeg -version

# If not, install via Chocolatey
choco install ffmpeg -y

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

---

## 🔐 Step 2: Configure Credentials

### 2.1 Create/Update `.env` File

Location: `d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\.env`

```env
# ════════════════════════════════════════════════════════════
# MCP SERVER CONFIGURATION
# ════════════════════════════════════════════════════════════
MCP_PORT=3002
MCP_SERVER_URL=http://localhost:3003

# ════════════════════════════════════════════════════════════
# API SERVER CONFIGURATION
# ════════════════════════════════════════════════════════════
API_PORT=3001
PORT=3001

# ════════════════════════════════════════════════════════════
# GOOGLE SERVICES
# ════════════════════════════════════════════════════════════
# Option 1: Service Account (for Imagen)
GOOGLE_SERVICE_ACCOUNT_JSON={"project_id":"...","private_key":"...","client_email":"..."}

# Option 2: Gemini API Key (fallback)
GEMINI_API_KEY=your_gemini_api_key_here

# ════════════════════════════════════════════════════════════
# FACEBOOK ADS
# ════════════════════════════════════════════════════════════
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_AD_ACCOUNT_ID=your_ad_account_id
FACEBOOK_PAGE_ID=your_page_id

# ════════════════════════════════════════════════════════════
# GOOGLE ADS (Phase 3)
# ════════════════════════════════════════════════════════════
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token

# ════════════════════════════════════════════════════════════
# BRAIN API (Optional)
# ════════════════════════════════════════════════════════════
BRAIN_API_URL=http://localhost:3001/api/brain
```

### 2.2 Get Credentials

**Google Services:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select project
3. Enable APIs: Vertex AI, Gemini API
4. Create Service Account → Download JSON
5. Or get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

**Facebook Ads:**

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create App → Get Access Token
3. Get Ad Account ID from [Facebook Ads Manager](https://business.facebook.com/adsmanager)

**Google Ads:**

1. Go to [Google Ads API Center](https://ads.google.com/aw/apicenter)
2. Apply for Developer Token
3. Create OAuth 2.0 credentials
4. Get Refresh Token

---

## 🚀 Step 3: Start Services

### Option 1: Automated Script (Recommended)

**Windows PowerShell:**

```powershell
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin
.\start-phase2-services.ps1
```

**Windows Batch:**

```cmd
start-phase2-services.bat
```

### Option 2: Manual Start

**Terminal 1: MCP Server**

```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\mcp-server
python server.py
```

**Expected Output:**

```
✅ Gemini AI client initialized
✅ HTTP API server started on port 3003
Starting MCP Server on port 3002
```

**Terminal 2: API Server**

```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\api
npm run dev
```

**Expected Output:**

```
🚀 API Server running on http://localhost:3001
📡 WebSocket monitoring: ws://localhost:3001/ws/campaign-monitoring
```

---

## ✅ Step 4: Verify Deployment

### 4.1 Health Checks

```bash
# API Server
curl http://localhost:3001/api/health

# MCP Server HTTP API
curl http://localhost:3003/docs
```

### 4.2 Run Test Scripts

```bash
# Phase 1
cd api
node scripts/test-phase1-ad-campaigns.js

# Phase 2
node scripts/test-phase2-video-ab.js

# Phase 3
node scripts/test-phase3-complete.js
```

### 4.3 Test Key Endpoints

```bash
# Get ad styles
curl http://localhost:3001/api/ad-campaigns/styles

# Get platform formats
curl http://localhost:3001/api/video-ads/platform-formats

# Get supported platforms
curl http://localhost:3001/api/multi-platform/platforms
```

---

## 🌐 Step 5: Production Deployment

### 5.1 Environment Variables

**Production `.env`:**

```env
# Use production URLs
MCP_SERVER_URL=https://mcp.yourdomain.com
API_URL=https://api.yourdomain.com

# Use production credentials
# (Never commit these to git!)
```

### 5.2 Process Management

**Option 1: PM2 (Node.js)**

```bash
npm install -g pm2
pm2 start api/server.js --name "advertising-api"
pm2 start mcp-server/server.py --name "mcp-server" --interpreter python
pm2 save
pm2 startup
```

**Option 2: systemd (Linux)**

```bash
# Create service files
sudo nano /etc/systemd/system/advertising-api.service
sudo nano /etc/systemd/system/mcp-server.service

# Enable and start
sudo systemctl enable advertising-api
sudo systemctl start advertising-api
```

**Option 3: Docker (Recommended)**

```bash
# Build images
docker build -t advertising-api ./api
docker build -t mcp-server ./mcp-server

# Run containers
docker-compose up -d
```

### 5.3 Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/advertising-platform
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 5.4 SSL Certificate

```bash
# Using Let's Encrypt
sudo certbot --nginx -d api.yourdomain.com
```

---

## 📊 Step 6: Monitoring & Logging

### 6.1 Log Files

**MCP Server:**

- Location: `mcp-server/mcp-server.log`
- Rotate: Use logrotate or similar

**API Server:**

- Console output
- Consider: Winston, Pino for structured logging

### 6.2 Health Monitoring

**Endpoints:**

- `GET /api/health` - API health
- `GET /api/campaign-monitoring/status` - Monitoring status

**Setup:**

- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (New Relic, Datadog)

---

## 🔒 Step 7: Security Hardening

### 7.1 API Security

- [ ] Enable HTTPS
- [ ] Implement authentication (JWT, OAuth)
- [ ] Rate limiting (already implemented)
- [ ] Input validation
- [ ] SQL injection prevention

### 7.2 Credentials Security

- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Rotate credentials regularly
- [ ] Never commit `.env` to git
- [ ] Use environment-specific configs

### 7.3 Network Security

- [ ] Firewall rules
- [ ] VPN for internal services
- [ ] DDoS protection
- [ ] WAF (Web Application Firewall)

---

## 📈 Step 8: Performance Optimization

### 8.1 Caching

- Redis for session/data caching
- CDN for static assets
- Response caching for API

### 8.2 Database Optimization

- Index optimization
- Query optimization
- Connection pooling

### 8.3 Load Balancing

- Multiple API server instances
- Load balancer (Nginx, HAProxy)
- Health checks

---

## 🐛 Troubleshooting

### Issue: Services won't start

```bash
# Check ports
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :3003

# Check logs
tail -f mcp-server/mcp-server.log
```

### Issue: FFmpeg not found

```bash
# Verify installation
ffmpeg -version

# Add to PATH if needed
# Windows: System Properties → Environment Variables
# Linux/macOS: Already in PATH if installed via package manager
```

### Issue: Dependencies missing

```bash
# Python
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Node.js
rm -rf node_modules package-lock.json
npm install
```

### Issue: Credentials not working

```bash
# Test Google credentials
python -c "from google_integration import google_client; print(google_client.is_available)"

# Test Facebook token
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
```

---

## ✅ Deployment Verification

### Checklist:

- [ ] All services running
- [ ] Health checks passing
- [ ] Test scripts passing
- [ ] API endpoints responding
- [ ] WebSocket connection working
- [ ] Credentials configured
- [ ] Logs being generated
- [ ] No errors in console

---

## 🚀 Production Readiness

### Before Going Live:

1. ✅ All tests passing
2. ✅ Security review completed
3. ✅ Performance tested
4. ✅ Monitoring setup
5. ✅ Backup strategy
6. ✅ Disaster recovery plan
7. ✅ Documentation complete
8. ✅ Team trained

---

_Deployment Guide: 2025-2026_
_AI Advertising Platform - Production Ready!_
