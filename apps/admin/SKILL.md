# LongSang Admin — Domain Knowledge Skill

## What is LongSang Admin?

An all-in-one AI-powered admin platform managing:
- **AI agents** (content writer, lead nurture, social media, analytics)
- **Multi-platform social media** (Facebook, Instagram, LinkedIn, YouTube, Threads, Zalo, TikTok)
- **n8n workflow automation** 
- **Video production factory** (VEO, Sora, Replicate)
- **Academy/learning platform** with gamification
- **Brain/RAG knowledge system** with vector embeddings
- **MCP server** for AI tool integration

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React 18 + TS + Vite)                │
│  └── 120+ pages, 40+ modules, shadcn/ui        │
│  └── Zustand + React Query + Supabase Auth      │
├─────────────────────────────────────────────────┤
│  API Backend (Express.js 4.18)                  │
│  └── 85+ routes, 80+ services                  │
│  └── Auth: API Key / JWT                        │
│  └── Rate limiting: api/ai/strict tiers         │
├─────────────────────────────────────────────────┤
│  Database (Supabase PostgreSQL 15)              │
│  └── project: diexsbzqwsbpilsymnfb             │
│  └── Real-time, RLS, Edge Functions             │
├─────────────────────────────────────────────────┤
│  AI Services                                    │
│  └── OpenAI (gpt-4o-mini, gpt-4o)             │
│  └── Anthropic (Claude 3.5 Sonnet)             │
│  └── Google (Gemini 2.0 Flash)                 │
│  └── Embeddings: text-embedding-3-small (1536d)│
├─────────────────────────────────────────────────┤
│  Automation                                     │
│  └── n8n workflows (self-hosted)               │
│  └── Cron jobs (api/cron/)                     │
│  └── MCP server (Python)                       │
├─────────────────────────────────────────────────┤
│  Deployment                                     │
│  └── Frontend: Vercel                          │
│  └── API: Railway (PORT 10000)                 │
│  └── Desktop: Electron                         │
└─────────────────────────────────────────────────┘
```

## Key Business Entities

| Entity | Table | Description |
|--------|-------|-------------|
| AI Agents | `ai_agents` | Configurable autonomous agents |
| Workflows | `workflows` | Multi-step automation processes |
| Content Queue | `content_queue` | AI-generated content pipeline |
| Contacts | `contacts` | Form submissions / leads |
| Activity Logs | `activity_logs` | All system events audit trail |
| Knowledge Base | `knowledge_base` | Brain/RAG documents |
| Triggers | `automation_triggers` | Event-based activations |

## Folder Map (admin/)

```
admin/
├── api/                  # Express.js backend (active)
├── src/                  # React frontend (active)
├── scripts/              # 200+ utility/migration scripts
├── services/             # Standalone services (ai-assistant, brain-rag, etc)
├── mcp-server/           # Python MCP server
├── n8n-workflows/        # n8n workflow exports
├── ai-workflows-library/ # Workflow templates (JSON)
├── ai-agent-starter-kit/ # Agent templates
├── supabase/             # DB migrations & edge functions
├── electron/             # Desktop app wrapper
├── browser-extension/    # Chrome extension
├── database/             # DB utilities
├── _DOCS/                # Documentation
├── _archive/             # Archived old code
├── long-sang-forge/      # ⚠️ DEPRECATED — old version of this project
└── .github/agents/       # AI agent mode definitions
```

## Critical Warnings

1. **`long-sang-forge/`** is the OLD version of this project — DO NOT reference it
2. **`api/routes/_deprecated/`** has 23 dead files — DO NOT import from there
3. **`components/ui/`** is shadcn/ui — DO NOT modify these files
4. **Two Supabase clients exist** — prefer `src/lib/supabase.ts` (frontend), `api/config/supabase.js` (backend)

## Environment

- Frontend env vars use `VITE_` prefix
- Backend uses plain `process.env.*`
- `.env` file at root has ALL keys
- See `.env.example` for full list
