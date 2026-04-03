# LongSang Ecosystem — Project Context (Long-Term Memory)

## Who I Am

I'm Claw — the main AI agent for LongSang's master workspace.
I coordinate automation, monitor services, run scheduled analysis, and support CEO decisions.

## The Workspace

`D:\0.PROJECTS\00-MASTER-ADMIN` — everything lives here.

## Services Running Locally

| Service | Port | Stack |
|---------|------|-------|
| Admin Dashboard | 5173/8080 | Vite + React + TypeScript + shadcn/ui |
| API Gateway | 3001 | Express.js |
| MCP Server | 3002 | Python |
| Gemini Image | 3010 | Node.js |
| VEO Video | 3011 | Node.js |
| Brain RAG | 3012 | Node.js (vector KB) |
| AI Assistant | 3013 | Node.js |
| VoxCPM TTS | 8100 | Python/FastAPI (Vietnamese) |
| n8n Automation | 5678 | Node.js (self-hosted) |
| OpenClaw Gateway | 18789 (ws) | Agent runtime |

Process manager: pm2 — config at `services/brain-upgrade/ecosystem.config.js`

## AI Stack

- Primary model: `google/gemini-2.5-flash`
- Embeddings: `gemini-embedding-001`
- Agents: main (this), lyblack, sabo, dev
- Auth profile: `google:gemini-manual`

## Cron Jobs (all on Gemini)

1. `foundation-hourly-sentinel` — every 1h, watches for drift
2. `foundation-daily-brief` — 8:00 AM daily, morning context digest
3. `foundation-midday-triage` — 1:00 PM daily, priorities check (currently erroring)
4. `foundation-eod-review` — 10:00 PM daily, end-of-day review
5. `foundation-weekly-review` — 9:00 AM Monday, weekly planning

All agent jobs deliver to Telegram (chat ID: 554888288)

## Key Technologies

React 18+ · Vite · TypeScript · shadcn/ui · Radix · Tailwind CSS
Supabase · TanStack Query · zustand · React Router
Express.js · Python/FastAPI · pm2
n8n (self-hosted, port 5678)
Gemini 2.5 Flash (AI), gemini-embedding-001 (vectors)
OpenClaw (agent runtime)

## Architecture

YouTube Crew Pipeline:
`[Harvester] → [Brain Curator] → [Script Writer] → [Voice Producer || Visual Director] → [Video Composer] → [Publisher]`

MCP Gateway tools: tts_synthesize, brain_search, generate_image, generate_video, youtube_pipeline_trigger, n8n_trigger_workflow

## Supabase

Tables: pipeline_checkpoints, pipeline_runs, llm_call_logs
Admin UI: Supabase Dashboard (cloud)

## Recent Events

- **2026-03-20:** OpenClaw setup completed. All agents and automation successfully migrated from OpenAI to Gemini. All validations passed at the time.
- **2026-03-21 (Current):** Critical outage of core LongSang ecosystem services detected. PM2-managed applications (`brain-api-server`, `brain-telegram-bot`, `brain-morning-brief`, `brain-weekly-digest`, `brain-weekly-distill`), API Gateway (port 3001), and n8n Automation (port 5678) are all offline or in an unstable/errored state. This is an ongoing issue requiring immediate attention.

## Current Priorities

1. **CRITICAL:** Diagnose and resolve the LongSang ecosystem service outage (PM2 services, API Gateway, n8n).
2. n8n workflows for YouTube + business reporting
3. Brain RAG knowledge base — needs content seeding
4. Admin dashboard stability