# Workspace Context — LongSang Ecosystem

## What This Workspace Is

Main admin workspace for LongSang ecosystem. CEO-level visibility across all projects and services.

## Folder Structure

```
D:\0.PROJECTS\00-MASTER-ADMIN\
├── admin/          # Vite + React + TypeScript frontend (port 5173/8080)
├── api/            # Express.js API gateway (port 3001)
├── services/       # Individual microservices
│   ├── youtube-crew/    # YouTube AI pipeline
│   ├── brain-rag/       # Vector knowledge base (port 3012)
│   ├── gemini-image/    # Image gen (port 3010)
│   ├── veo-video/       # Video gen (port 3011)
│   ├── mcp-server/      # MCP tool gateway (port 3002)
│   └── voxcpm-tts/      # Vietnamese TTS (port 8100)
├── agents/         # Agent-specific context (agents/ceo/)
├── workflows/      # n8n workflows + automation
│   ├── n8n/        # Workflow JSON files
│   └── scripts/    # Deploy + health check scripts
├── reference/      # Architecture docs, strategy docs
├── memory/         # Agent daily notes (RAG-indexed)
├── docs/           # Documentation
├── infra/          # Infrastructure config
└── logs/           # Service logs
```

## Important Entry Points

- Admin UI: http://localhost:5173 (dev) or http://localhost:8080
- API: http://localhost:3001
- n8n: http://localhost:5678
- OpenClaw dashboard: `openclaw dashboard`

## Key Files

- `AGENTS.md` — Agent instructions and rules
- `SOUL.md` — Agent personality/identity
- `USER.md` — About the human (LongSang, CEO)
- `TOOLS.md` — Local service notes and quick reference
- `HEARTBEAT.md` — Periodic check tasks
- `MEMORY.md` — Long-term curated memory
- `memory/YYYY-MM-DD.md` — Daily raw logs
- `reference/SERVICES_ARCHITECTURE.md` — Full service map
- `reference/MODERNIZATION_2026_STRATEGY.md` — Tech strategy

## Environment

- OS: Windows 10
- Node: v22
- Primary AI: Google Gemini 2.5 Flash
- Timezone: Asia/Ho_Chi_Minh (UTC+7)
