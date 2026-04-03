# 00-MASTER-ADMIN — Monorepo Hub

**Solo admin workspace** quản lý tất cả dự án từ một nơi.

## Cấu Trúc

```
├── admin/          ← Dashboard trung tâm (React + Vite + TypeScript)
├── api/            ← Backend API Gateway (Express, port 3001)
├── services/       ← Tất cả microservices
│   ├── youtube-crew/     Node.js — video pipeline (port 3001 on Render)
│   ├── moltbook-agent/   Python  — social media automation
│   ├── voxcpm-tts/       Python  — Vietnamese TTS (port 8100)
│   ├── fish-speech/      Python  — multi-language TTS
│   ├── mcp-server/       Python  — MCP tools server (port 3002)
│   ├── ai-assistant/     Node.js — AI chat service (port 3013)
│   ├── brain-rag/        Node.js — RAG pipeline (port 3012)
│   ├── gemini-image/     Node.js — image generation (port 3010)
│   ├── veo-video/        Node.js — video generation (port 3011)
│   ├── lyblack-content/  AI Influencer content & assets
│   ├── brain-upgrade/    Brain upgrade tools
│   ├── bulk-video/       [DATA] Generated video content (~25GB)
│   ├── fish-speech-venv/ [DATA] Python venv (~5GB)
│   └── temp-demucs/      [DATA] Audio processing temp
├── workflows/      ← Automation configs
│   ├── n8n/              n8n workflow JSONs
│   ├── scripts/          PowerShell health-check, deploy scripts
│   └── n8n-local/        Local n8n instance data
├── reference/      ← Documentation & learning
│   ├── docs/             Project docs
│   ├── books/            Book summaries (Vietnamese)
│   └── marketingskills/  Claude Code skills library
├── infra/          ← Deploy & orchestration configs
│   ├── render.yaml       Render blueprint
│   ├── ecosystem.config.cjs  PM2 config (all services)
│   ├── start-all.ps1     Start dev environment
│   └── stop-all.ps1      Stop all services
├── _archive/       ← Stale/experimental projects (gitignored)
└── .gitignore
```

## Quick Start

```powershell
# Start everything
cd infra; .\start-all.ps1

# Or use PM2
npx pm2 start infra/ecosystem.config.cjs

# Stop everything
cd infra; .\stop-all.ps1
```

## Deploy

```powershell
# Render (youtube-crew only)
# Push to GitHub → Render auto-deploys from infra/render.yaml
```

## API References

- SABOHUB Backend API Reference:
	- `../_DOCS/07-API/SABOHUB_BACKEND_API_REFERENCE.md`
- Postman Collection:
	- `../_DOCS/07-API/SABOHUB_BACKEND.postman_collection.json`
- Postman Environment (local):
	- `../_DOCS/07-API/SABOHUB_LOCAL.postman_environment.json`
- Postman Environment (staging):
	- `../_DOCS/07-API/SABOHUB_STAGING.postman_environment.json`
- Postman Environment (production):
	- `../_DOCS/07-API/SABOHUB_PRODUCTION.postman_environment.json`
- Live Swagger (local):
	- `http://localhost:3001/api-docs/`
