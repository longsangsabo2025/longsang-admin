# Phase 2 Services - Startup Guide

## 🚀 Quick Start

### Option 1: PowerShell Script (Recommended)
```powershell
.\start-phase2-services.ps1
```

**Features:**
- ✅ Auto-detects Python, Node.js, FFmpeg
- ✅ Checks port availability
- ✅ Starts both services in background jobs
- ✅ Monitors service health
- ✅ Shows logs and status

**Stop Services:**
```powershell
.\stop-phase2-services.ps1
```

### Option 2: Batch Script (Windows)
```cmd
start-phase2-services.bat
```

**Features:**
- ✅ Starts services in separate windows
- ✅ Easy to see logs
- ✅ Simple to use

**Stop Services:**
- Close the command windows manually
- Or use: `stop-phase2-services.ps1`

### Option 3: Manual Start

**Terminal 1: MCP Server**
```powershell
cd mcp-server
python server.py
```

**Terminal 2: API Server**
```powershell
cd api
npm run dev
```

---

## 📋 Prerequisites

Before starting, ensure:

- [ ] **Python** installed and in PATH
- [ ] **Node.js** installed and in PATH
- [ ] **FFmpeg** installed (or at `C:\ffmpeg\bin\ffmpeg.exe`)
- [ ] **Dependencies** installed:
  ```bash
  # Python
  cd mcp-server
  pip install -r requirements.txt

  # Node.js
  cd api
  npm install
  ```

---

## 🔍 Verify Services

After starting, check:

1. **MCP Server HTTP API**: http://localhost:3003/docs
2. **API Server**: http://localhost:3001/api/health

Or run test script:
```bash
cd api
node scripts/test-phase2-video-ab.js
```

---

## 🛑 Stop Services

### PowerShell:
```powershell
.\stop-phase2-services.ps1
```

### Manual:
- Press `Ctrl+C` in each terminal
- Or close the command windows

---

## 📝 Service Ports

- **3001**: API Server (Express.js)
- **3002**: MCP Server (MCP Protocol)
- **3003**: MCP Server HTTP API (FastAPI)

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <pid> /F
```

### Services Not Starting
1. Check Python/Node.js are in PATH
2. Check dependencies are installed
3. Check `.env` file exists
4. Check logs in job output:
   ```powershell
   Receive-Job -Id <job-id> -Keep
   ```

### FFmpeg Not Found
- Add `C:\ffmpeg\bin` to PATH
- Or update `video_generation.py` with your FFmpeg path

---

*Phase 2 Startup Guide: 2025-2026*

