# LONGSANG ECOSYSTEM — SERVICES ARCHITECTURE

> Auto-generated: Feb 2026 | Post AI Trends 2026 Upgrade

## SERVICE MAP

| Service | Port | Type | Status |
|---------|------|------|--------|
| **API Gateway** | 3001 | Node.js/Express | Production |
| **MCP Server** | 3002 | Python | Production |
| **Gemini Image** | 3010 | Node.js | Production |
| **VEO Video** | 3011 | Node.js | Production |
| **Brain RAG** | 3012 | Node.js | Production |
| **AI Assistant** | 3013 | Node.js | Production |
| **VoxCPM TTS** | 8100 | Python/FastAPI | Production |
| **AI Video Gen** | 8203 | Python/FastAPI | Development |
| **n8n Automation** | 5678 | Node.js | Production |
| **Admin Frontend** | 5173 | Vite/React | Development |

## NEW API ENDPOINTS (AI Trends 2026 Upgrade)

### TTS API (`/api/tts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tts/health` | VoxCPM-1.5-VN health check |
| POST | `/api/tts/synthesize` | Single text → WAV audio |
| POST | `/api/tts/batch` | Multiple texts → batch results |
| POST | `/api/tts/stream` | Streaming TTS (chunked audio) |

### YouTube Agent Crew (`/api/youtube-crew`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/youtube-crew/trigger` | Start pipeline run |
| POST | `/api/youtube-crew/resume` | Resume from checkpoint |
| GET | `/api/youtube-crew/status/:runId` | Get run status + logs |
| GET | `/api/youtube-crew/runs` | List recent runs |
| GET | `/api/youtube-crew/checkpoints` | List available checkpoints |
| GET | `/api/youtube-crew/agents` | A2A Protocol agent cards |

### MCP Gateway (`/api/mcp-gateway`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mcp-gateway/services` | List all registered AI services |
| GET | `/api/mcp-gateway/tools` | MCP-compatible tool listing |
| POST | `/api/mcp-gateway/invoke/:toolName` | Invoke any tool by name |
| GET | `/api/mcp-gateway/health` | Health check all services |

## YOUTUBE AGENT CREW PIPELINE

```
[Harvester] → [Brain Curator] → [Script Writer] → [Voice Producer ‖ Visual Director] → [Video Composer] → [Publisher]
                                                         (parallel)
```

### Pipeline Features (Post-Upgrade)

- **Checkpointing**: State saved to local file + Supabase after each stage
- **Resume**: `--resume <pipelineId>` to continue from last checkpoint
- **Cost Budget**: `--max-cost 0.50` pauses pipeline when budget exceeded
- **Parallel Stages**: Voice + Visual run concurrently (Stage 4+5)
- **Langfuse Tracing**: Every LLM call traced for observability
- **Agentic RAG**: Brain Curator does 2-round retrieval with gap analysis

### CLI Usage

```bash
# Fresh run
node src/index.js --topic "AI Trends 2026"

# With cost limit
node src/index.js --topic "Chu ky 18 nam BDS" --max-cost 0.30

# Resume failed pipeline
node src/index.js --resume youtube-podcast_abc123
```

## MCP GATEWAY — REGISTERED TOOLS

| Tool | Service | Description |
|------|---------|-------------|
| `tts_synthesize` | VoxCPM TTS | Vietnamese text-to-speech |
| `brain_search` | Brain RAG | Knowledge base semantic search |
| `generate_image` | Gemini Image | AI image generation |
| `generate_video` | VEO Video | AI video generation |
| `ai_video_gen` | AI Video Gen | Local video generation (ComfyUI + WAN 2.1) |
| `youtube_pipeline_trigger` | YouTube Crew | Start podcast pipeline |
| `youtube_pipeline_resume` | YouTube Crew | Resume paused pipeline |
| `n8n_trigger_workflow` | n8n | Execute workflow via webhook |

## SUPABASE TABLES (New)

| Table | Purpose |
|-------|---------|
| `pipeline_checkpoints` | Pipeline state for resume |
| `pipeline_runs` | Execution history for dashboard |
| `llm_call_logs` | LLM cost tracking |

Migration: `youtube-agent-crew/supabase/migrations/001_pipeline_checkpoints.sql`

## PM2 ECOSYSTEM

All services managed via `apps/admin/ecosystem.config.js`:

```bash
pm2 start ecosystem.config.js          # Start all
pm2 restart api-gateway                 # Restart gateway
pm2 logs voxcpm-tts                     # View TTS logs
pm2 status                              # Overview
```

## ENVIRONMENT VARIABLES (New)

```env
# VoxCPM TTS
VOXCPM_API_URL=http://localhost:8100

# Langfuse Observability
LANGFUSE_SECRET_KEY=sk-lf-xxx
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_HOST=https://cloud.langfuse.com

# Pipeline Controls
PIPELINE_MAX_COST=0.50
CHECKPOINT_DIR=./output/.checkpoints
```

## ADMIN UI ROUTES (New)

| Route | Page | Description |
|-------|------|-------------|
| `/admin/pipeline` | PipelineDashboard | Monitor pipeline runs, trigger, resume |
| `/admin/ai-cost` | AICostDashboard | LLM cost tracking |

## N8N WORKFLOWS

| File | Trigger | Description |
|------|---------|-------------|
| `youtube-crew-trigger.json` | Webhook + Schedule (Mon/Wed/Fri) | Triggers YouTube pipeline → polls status → Telegram notify |
| `daily-ai-topic-research.json` | Cron 6AM | Google News+Reddit scan → Telegram |
| `auto-script-writer.json` | Telegram reply | AI script generation |
| `social-media-auto-post.json` | Webhook/Cron | Multi-platform posts |
| `daily-business-report.json` | Cron 9PM | Business metrics → Telegram |
| `content-idea-bank.json` | Telegram "idea:" | AI idea expansion |
