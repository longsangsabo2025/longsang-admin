# 🚀 Commands Cheat Sheet - Long Sang Forge

## ✅ **DEVELOPMENT** (Đang chạy thành công)

### Run Dev Server (Frontend + API)

```bash
npm run dev
```

- **Frontend**: <http://localhost:8080/>
- **API**: <http://localhost:3001/>
- **Google Drive API**: <http://localhost:3001/api/drive>
- Chạy đồng thời 2 servers với concurrently
- HMR (Hot Module Reload) tự động

### Run Frontend Only

```bash
npm run dev:frontend
```

- Chỉ chạy Vite dev server (port 8080)

### Run API Only

```bash
npm run dev:api
```

- Chỉ chạy Node.js API server (port 3001)

### Run Full Stack (Frontend + API + N8N)

```bash
npm run dev:full
```

- Chạy tất cả: Frontend + API + N8N workflows

---

## 🏗️ **BUILD**

### Production Build

```bash
npm run build
```

- Build frontend vào thư mục `dist/`
- Optimize & minify code
- Ready for deployment

### Development Build

```bash
npm run build:dev
```

- Build với mode development
- Không minify, giữ source maps

### Preview Build

```bash
npm run preview
```

- Preview production build locally
- Test trước khi deploy

---

## 🧪 **TESTING**

### Run All Tests

```bash
npm run test
# or
npm run test:all
```

### Run Tests with UI

```bash
npm run test:ui
```

- Vitest UI dashboard

### Run Tests with Coverage

```bash
npm run test:coverage
```

- Generate code coverage report

### Run Specific Tests

```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:run         # Run once (no watch mode)
```

### System Tests

```bash
npm run test:system      # Test entire system
npm run test:fix         # Test & auto-fix issues
```

---

## 🔄 **N8N WORKFLOWS**

### Start N8N

```bash
npm run n8n:start
```

- Start N8N workflow automation
- Access at: <http://localhost:5678/>

### Start N8N with Tunnel

```bash
npm run n8n:dev
```

- Start with external tunnel (webhooks work from internet)

### N8N as Service

```bash
npm run n8n:service
```

- Run N8N as Windows service

### Create Workflows

```bash
npm run workflows:create
```

- Auto-create workflows from templates

---

## 🔍 **SEO TOOLS**

### SEO Analysis

```bash
npm run seo:analyze      # Analyze SEO metrics
npm run seo:monitor      # Monitor SEO performance
npm run seo:audit        # Full SEO audit
npm run seo:keywords     # Keyword research
npm run seo:score        # Calculate SEO scores
npm run seo:full-report  # Complete SEO report
```

### SEO Generation

```bash
npm run seo:generate-sitemap  # Generate sitemap.xml
npm run seo:sync-gsc          # Sync Google Search Console
```

---

## 🗄️ **DATABASE (SUPABASE)**

### Deploy Database

```bash
npm run deploy:db
# or
supabase db push
```

- Push migrations to Supabase

### Deploy Edge Functions

```bash
npm run deploy:functions
```

- Deploy all Supabase Edge Functions:
  - `trigger-content-writer`
  - `send-scheduled-emails`
  - `publish-social-posts`
  - `generate-sitemap`

### Check Supabase Status

```bash
npm run supabase:status
```

- List functions & secrets

### Link to Supabase Project

```bash
npm run supabase:link
```

- Link local project to Supabase

---

## 📦 **DEPLOYMENT**

### Deploy All (Full System)

```bash
npm run deploy:all
```

- Deploy DB + Functions + Build frontend
- Run PowerShell script

---

## 🛠️ **SETUP**

### Initial Setup

```bash
npm run setup
```

- Install dependencies
- Link Supabase
- Deploy database

### Quick Setup Consultation Booking

```bash
# Windows
.\QUICK-SETUP-CONSULTATION.bat
# or
.\setup-consultation-booking.bat

# Linux/Mac
./setup-consultation-booking.sh
```

---

## 🏃 **QUICK START SCRIPTS**

### Start Everything

```bash
# Windows
.\start-all.bat
# or
.\START-SYSTEM.bat

# PowerShell
.\start-all.ps1

# Linux/Mac
./start-all.sh
```

### Stop Everything

```bash
.\STOP-SYSTEM.bat
```

### Start Agent Center

```bash
.\start-agent-center.bat
```

---

## 📊 **CURRENT STATUS**

### ✅ Working Now

- `npm run dev` - Frontend (8080) + API (3001) ✅
- HMR (Hot Module Reload) ✅
- All routes accessible ✅
- Academy backend connected ✅

### ⚠️ Minor Issues

- Source map warning (google-auth-library) - **NON-CRITICAL**
- Không ảnh hưởng functionality

---

## 🎯 **RECOMMENDED WORKFLOW**

### Development

```bash
# 1. Start dev servers
npm run dev

# 2. Open browser
# Frontend: http://localhost:8080/
# API: http://localhost:3001/

# 3. Make changes → Auto reload ✅
```

### Production Build

```bash
# 1. Build
npm run build

# 2. Preview
npm run preview

# 3. Deploy
npm run deploy:all
```

### Testing

```bash
# Quick test
npm run test:run

# Full test with coverage
npm run test:coverage

# System test
npm run test:system
```

---

## 🔥 **TROUBLESHOOTING**

### Port Already in Use

```powershell
# Stop all Node processes
Stop-Process -Name "node" -Force

# Or kill specific port
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Clear Cache & Restart

```bash
# Clear node_modules
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

### Database Issues

```bash
# Re-deploy migrations
npm run deploy:db

# Check status
npm run supabase:status
```

---

## 📝 **NOTES**

1. **Always use `npm run dev`** for development (not `npm start` alone)
2. **Port 8080** = Frontend, **Port 3001** = API
3. **Source map warnings** are normal and don't break functionality
4. **Google Sheets operations** should go through API server (Node.js only)
5. **Academy backend** is fully connected to Supabase ✅

---

## 🚀 **QUICK ACCESS URLS**

- **Frontend**: <http://localhost:8080/>
- **API**: <http://localhost:3001/>
- **Google Drive API**: <http://localhost:3001/api/drive>
- **Academy**: <http://localhost:8080/academy>
- **N8N**: <http://localhost:5678/> (when running)

---

**Last Updated**: 2025-11-12  
**Status**: ✅ All systems operational
