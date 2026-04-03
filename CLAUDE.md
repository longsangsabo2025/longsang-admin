# CLAUDE.md — Workspace Context for Claude Code

## Who you are
You are the AI assistant for SoloForge — a one-person business running 10+ products.
Owner: Long Sang (longsangsabo@gmail.com)
Language preference: Vietnamese + English technical terms

## Workspace Structure
Root: `D:\0.PROJECTS\00-MASTER-ADMIN\`

### Core Apps
- `admin/` — Main dashboard (Vite + React + TypeScript + Tailwind + shadcn/ui, port 8080)
- `api/` — Backend API (Express.js, port 3001)
- `apps/admin/` — Additional admin app

### Services
- `services/youtube-crew/` — YouTube automation pipeline (Node.js)
- `services/fish-speech/` — TTS engine (Python)
- `services/brain-rag/` — RAG knowledge base
- `services/gemini-image/` — Image generation via Gemini
- `services/veo-video/` — Video generation
- `services/mcp-server/` — MCP server
- `services/lyblack-content/` — Content generation
- `services/voxcpm-tts/` — TTS alternative

### Infrastructure
- `infra/` — PM2, Render deployment configs
- `scripts/` — Utility scripts
- `workflows/n8n/` — n8n automation workflows
- `supabase/` (in admin/) — Database migrations

### Database
- Supabase (PostgreSQL) — hosted at `diexsbzqwsbpilsymnfb.supabase.co`
- Env vars in `admin/.env` and `api/.env`

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Node.js
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API, Gemini API, Fish Speech TTS
- **Deployment**: Render, Vercel
- **Package Manager**: npm (not yarn/pnpm)
- **OS**: Windows 11

## Conventions
- Use TypeScript for frontend, JavaScript for backend/services
- Use `biome` for linting (not eslint)
- API routes follow REST pattern: `/api/<resource>`
- Environment variables in `.env` files (never commit)
- Vietnamese comments are OK, but code/variable names in English

## Important Files
- `admin/src/` — Frontend source
- `api/server.js` — API entry point
- `services/youtube-crew/src/server.js` — YouTube pipeline entry
- `admin/supabase/migrations/` — Database migrations

## Commands
```bash
# Frontend dev
cd admin && npm run dev

# API dev  
cd api && node server.js

# Type check
cd admin && npx tsc --noEmit

# Lint
cd admin && npx biome check .

# YouTube crew
cd services/youtube-crew && node src/server.js
```

## Current Priorities
1. YouTube automation pipeline — finishing last 2% (channel creation)
2. Admin dashboard — feature complete, maintenance mode
3. Revenue generation — all products at $0, need to ship and monetize
