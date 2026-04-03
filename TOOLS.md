# TOOLS.md - Local Notes

skills define HOW tools work. This file is for YOUR specifics.

## Services (LongSang Ecosystem)

| Service | Port | Type | Notes |
|---------|------|------|-------|
| Admin Dashboard | 5173 (dev) / 8080 (prod) | Vite+React | Main UI |
| API Gateway | 3001 | Express.js | Main backend |
| MCP Server | 3002 | Python | Tool gateway |
| Gemini Image | 3010 | Node.js | Image gen |
| VEO Video | 3011 | Node.js | Video gen |
| Brain RAG | 3012 | Node.js | Vector KB |
| AI Assistant | 3013 | Node.js | Chat service |
| VoxCPM TTS | 8100 | Python/FastAPI | Vietnamese TTS |
| n8n | 5678 | Node.js | Automation hub |
| OpenClaw Gateway | 18789 (ws) | - | Agent runtime |

## Process Manager

`ash
pm2 status              # Overview all services
pm2 restart api-gateway  # Restart one service
pm2 logs voxcpm-tts     # View logs
pm2 start ecosystem.config.js  # Start all
`config: apps/admin/ecosystem.config.js

## Key Paths

- Workspace root: D:\0.PROJECTS\00-MASTER-ADMIN
- OpenClaw config: C:\Users\admin\.openclaw\openclaw.json
- OpenClaw env: C:\Users\admin\.openclaw\.env
- n8n: workflows\n8n\
- Admin: admin\ (Vite+React)
- API: api\ (Express)
- Services: services\

## Telegram

- Bot: LongSang AI Assistant
- Bot token: stored in admin/.env and openclaw/.env
- Admin Chat ID: 554888288

## AI Config

- Primary model: google/gemini-2.5-flash
- Embeddings: gemini-embedding-001
- Agents: main (this workspace), lyblack, sabo, dev

---

Add more as you learn your setup.