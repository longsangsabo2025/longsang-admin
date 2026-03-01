# 🚀 RENDER DEPLOYMENT HANDOVER — YouTube Agent Crew

> **Mục tiêu:** Deploy hệ thống YouTube Agent Crew lên Render để hoạt động 24/7, không phụ thuộc máy local.
> **Ngày tạo:** 2025-02-03
> **Trạng thái:** Sẵn sàng deploy Phase 1
> **Render URL hiện tại:** `youtube-pipeline-bgey.onrender.com` (đã test thành công generate-script)

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc & File Structure](#2-kiến-trúc--file-structure)
3. [Dependencies & Runtime](#3-dependencies--runtime)
4. [Tất cả API Routes](#4-tất-cả-api-routes)
5. [Biến môi trường (ENV)](#5-biến-môi-trường-env)
6. [Knowledge Base — Dữ liệu tĩnh](#6-knowledge-base--dữ-liệu-tĩnh)
7. [Dockerfile hiện tại](#7-dockerfile-hiện-tại)
8. [render.yaml hiện tại](#8-renderyaml-hiện-tại)
9. [Phân tích tính năng — Cloud vs Local](#9-phân-tích-tính-năng--cloud-vs-local)
10. [Kế hoạch deploy Feature-by-Feature](#10-kế-hoạch-deploy-feature-by-feature)
11. [Vấn đề cần xử lý](#11-vấn-đề-cần-xử-lý)
12. [Checklist deploy](#12-checklist-deploy)

---

## 1. TỔNG QUAN HỆ THỐNG

**YouTube Agent Crew** là hệ thống multi-agent tự động sản xuất video YouTube podcast. Gồm:

- **8 AI Agents**: Harvester → Brain Curator → Script Writer → Voice Producer → Visual Director → Video Composer → Publisher → Shorts Script Writer
- **2 Pipelines**: youtube-podcast (full video), youtube-shorts (short form)
- **Knowledge Base**: 815 video transcripts (4 nguồn) + 28 sách + BRAIN.md (64KB synthesized knowledge)
- **Admin Dashboard**: SPA 9 trang, quản lý toàn bộ hệ thống
- **LLM Backend**: Gemini 2.0 Flash (primary), OpenAI (backup)

### Luồng hoạt động chính:
```
User → Admin UI → API Server (Express :3099) → Conductor → Agents → Output
                                                    ↓
                                            Knowledge Base (BRAIN + Transcripts)
                                                    ↓  
                                            LLM (Gemini 2.0 Flash)
```

---

## 2. KIẾN TRÚC & FILE STRUCTURE

```
youtube-agent-crew/
├── src/
│   ├── server.js              # ⭐ HTTP Server chính (944 lines) — Entry point
│   ├── index.js               # CLI pipeline runner (không cần cho web)
│   ├── core/
│   │   ├── conductor.js       # Pipeline orchestrator
│   │   ├── llm.js             # LLM abstraction (OpenAI + Gemini)
│   │   ├── agent.js           # Base Agent class
│   │   ├── memory.js          # Agent memory system
│   │   ├── message-bus.js     # Inter-agent messaging
│   │   └── reporter.js        # Pipeline reporting
│   ├── agents/
│   │   ├── harvester.js       # Thu thập video/transcript
│   │   ├── brain-curator.js   # Phân tích knowledge
│   │   ├── script-writer.js   # ⭐ Viết script YouTube (sử dụng Gemini)
│   │   ├── shorts-script-writer.js  # Script cho Shorts
│   │   ├── voice-producer.js  # TTS (Fish Speech — LOCAL ONLY)
│   │   ├── visual-director.js # Storyboard generation
│   │   ├── video-composer.js  # Video assembly (FFMPEG — LOCAL ONLY)
│   │   ├── publisher.js       # YouTube upload
│   │   ├── transcript-cleaner.js
│   │   ├── tts-auditor.js
│   │   └── tts-preprocessor.js
│   ├── knowledge/
│   │   ├── loader.js          # ⭐ Knowledge loader (524 lines)
│   │   ├── BRAIN.md           # ⭐ Core knowledge base (847 lines, 64KB)
│   │   ├── BRAIN_v1.md        # Backup v1
│   │   ├── BRAIN_v2.md        # Backup v2
│   │   ├── VOICE.md           # Voice DNA profile
│   │   ├── books.json         # 28 sách content
│   │   ├── _master_index.json # Video index
│   │   ├── transcripts/       # HiddenSelf — 315 files
│   │   ├── thuattaivan/       # THUẬT TÀI VẬN — 210 files
│   │   ├── hormozi/           # Alex Hormozi — 120 files
│   │   ├── akbimatluatngam/   # Ẩn Bí Mật — 170 files
│   │   ├── transcripts-clean/ # Cleaned transcripts
│   │   ├── deepwork.md, kỷ-luật.md, quản-trị.md, tài-chính.md, tâm-lý.md
│   │   └── (tổng ~815 transcript files)
│   ├── pipelines/
│   │   ├── youtube-podcast.js # Full pipeline definition
│   │   └── youtube-shorts.js  # Shorts pipeline
│   └── utils/                 # Helper utilities
├── admin-ui/
│   ├── index.html             # ⭐ Admin SPA Dashboard (538 lines, 53KB)
│   └── index_v1.html          # Backup UI cũ
├── tools/
│   ├── batch-generate.js      # ⭐ Batch script generator
│   ├── video-factory.js       # Single script + storyboard
│   ├── build-brain-v2.js      # BRAIN builder tool
│   ├── crawl-channel.js       # YouTube channel crawler
│   ├── crawl-tiktok.js        # TikTok crawler  
│   ├── clean-transcripts.js   # Transcript cleaner
│   ├── process-knowledge.js   # Knowledge processor
│   └── ...
├── data/
│   ├── calendar.json          # ⭐ Content calendar (persistent data)
│   ├── channel-transcripts.json
│   ├── *-transcripts.json     # Transcript indexes
│   └── ...
├── output/                    # Generated outputs (14 items hiện tại)
│   ├── youtube-podcast_*/     # Full pipeline outputs
│   ├── standalone_*/          # Standalone outputs
│   ├── _video-factory/        # Script factory outputs
│   ├── _batch/                # Batch generated outputs
│   ├── _pre_generated/        # Pre-generated scripts
│   └── .checkpoints/          # Pipeline checkpoints
├── Dockerfile                 # ⭐ Docker config (có sẵn)
├── render.yaml                # ⭐ Render Blueprint (có sẵn)
├── package.json               # Node.js config
├── ecosystem.config.cjs       # PM2 config (local only)
└── .env                       # Environment variables
```

---

## 3. DEPENDENCIES & RUNTIME

### Runtime
- **Node.js**: v20+ (Dockerfile dùng `node:20-alpine`)
- **Module System**: ESM (`"type": "module"` trong package.json)
- **Entry Point**: `node src/server.js`
- **Default Port**: 3001 (trong Dockerfile), 3099 (local dev — vì 3001 bị chiếm)

### NPM Dependencies
```json
{
  "@google/generative-ai": "^0.21.0",   // ⭐ Gemini LLM — CRITICAL
  "chalk": "^5.3.0",                     // Terminal colors
  "dotenv": "^16.4.7",                   // ⭐ Env loader — CRITICAL
  "express": "^4.21.0",                  // ⭐ HTTP server — CRITICAL
  "eventemitter3": "^5.0.1",             // Event system
  "googleapis": "^171.4.0",              // YouTube API
  "langfuse": "^3.38.6",                 // LLM observability (optional)
  "nanoid": "^5.0.9",                    // Unique IDs
  "openai": "^4.77.0",                   // OpenAI backup LLM
  "ora": "^8.1.1",                       // Spinners (CLI only)
  "youtubei.js": "^12.2.0"              // YouTube data scraping
}
```

### System Dependencies (trong Docker)
- `ffmpeg` — Video processing (LOCAL-DEPENDENT feature)
- `yt-dlp` — Video download (LOCAL-DEPENDENT feature)
- `python3` — Required by yt-dlp

---

## 4. TẤT CẢ API ROUTES

### Core Pipeline Routes
| Method | Route | Mô tả | Cloud Ready? |
|--------|-------|--------|:---:|
| `GET` | `/health` | Health check + uptime + version | ✅ |
| `POST` | `/api/youtube-crew/trigger` | Start full podcast pipeline | ⚠️ Partial |
| `GET` | `/api/youtube-crew/status/:id` | Pipeline run status | ✅ |
| `POST` | `/api/youtube-crew/shorts-batch` | Start shorts batch | ⚠️ Partial |

### Admin API Routes
| Method | Route | Mô tả | Cloud Ready? |
|--------|-------|--------|:---:|
| `GET` | `/api/admin/stats` | Dashboard statistics | ✅ |
| `GET` | `/api/admin/knowledge/videos` | List all videos with filtering | ✅ |
| `GET` | `/api/admin/knowledge/video/:videoId` | Video detail + transcript | ✅ |
| `GET` | `/api/admin/knowledge/brain` | BRAIN.md content | ✅ |
| `GET` | `/api/admin/knowledge/search` | Full-text search (brain + books + transcripts) | ✅ |
| `GET` | `/api/admin/pipeline/runs` | Active pipeline runs | ✅ |
| `GET` | `/api/admin/outputs` | List all generated outputs | ✅ |
| `GET` | `/api/admin/script/:outputId(*)` | Read script detail from any output type | ✅ |

### Calendar Routes
| Method | Route | Mô tả | Cloud Ready? |
|--------|-------|--------|:---:|
| `GET` | `/api/admin/calendar` | Get calendar entries + settings | ✅ |
| `POST` | `/api/admin/calendar/add` | Add calendar entry | ✅ |
| `PUT` | `/api/admin/calendar/update/:id` | Update calendar entry | ✅ |
| `DELETE` | `/api/admin/calendar/delete/:id` | Delete calendar entry | ✅ |
| `PUT` | `/api/admin/calendar/settings` | Update calendar settings | ✅ |

### Script Generation Routes
| Method | Route | Mô tả | Cloud Ready? |
|--------|-------|--------|:---:|
| `POST` | `/api/admin/generate-script` | Generate single script (Gemini) | ✅ |
| `POST` | `/api/admin/batch-generate` | Batch generate scripts | ✅ |
| `GET` | `/api/admin/batches` | List all batch results | ✅ |

### Static Files
| Route | Mô tả | Cloud Ready? |
|-------|--------|:---:|
| `/admin` | Admin SPA Dashboard | ✅ |

---

## 5. BIẾN MÔI TRƯỜNG (ENV)

### ⭐ BẮT BUỘC cho Cloud (Phase 1 — Script Generation + Admin)
```env
# LLM — Gemini là primary, OpenAI backup
GOOGLE_AI_API_KEY=AIzaSy...        # ⭐ CRITICAL — Gemini 2.0 Flash
OPENAI_API_KEY=sk-proj-...          # Backup LLM (optional, quota exceeded)

# LLM Config
DEFAULT_MODEL=gemini-2.0-flash
SCRIPT_WRITER_MODEL=gemini-2.0-flash

# Server
NODE_ENV=production
PORT=3001                           # Render sẽ set port tự động

# Output
OUTPUT_DIR=./output
```

### 🔶 OPTIONAL cho Cloud (Phase 2+)
```env
# Supabase — Brain Storage (không cần cho Phase 1)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx

# YouTube API (Phase 3 — khi cần auto-upload)
YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REFRESH_TOKEN=xxx
YOUTUBE_CHANNEL_ID=xxx

# Langfuse — LLM Observability (optional)
LANGFUSE_SECRET_KEY=xxx
LANGFUSE_PUBLIC_KEY=xxx
LANGFUSE_HOST=xxx
```

### ❌ KHÔNG CẦN cho Cloud
```env
# Local-only tools
FFMPEG_PATH=C:\...                  # Windows path — không dùng trên cloud
YT_DLP_PATH=C:\...                  # Windows path — không dùng trên cloud

# Local services
FISH_SPEECH_API_URL=http://127.0.0.1:8080    # Self-hosted TTS — local only
ADMIN_API_URL=http://localhost:3001           # Main admin — local proxy only

# Social seeding (Phase 4+)
TELEGRAM_BOT_TOKEN=xxx
TWITTER_BEARER_TOKEN=xxx
FB_PAGE_TOKEN=xxx
```

---

## 6. KNOWLEDGE BASE — DỮ LIỆU TĨNH

Knowledge base là **dữ liệu tĩnh đã xử lý sẵn**, cần được COPY vào Docker image.

### Files cần include trong Docker:
```
src/knowledge/
├── BRAIN.md              # 64KB — Core knowledge map
├── BRAIN_v1.md           # Backup
├── BRAIN_v2.md           # Backup  
├── VOICE.md              # Voice DNA
├── books.json            # 28 sách (~2MB)
├── _master_index.json    # Video index
├── transcripts/          # 315 files (HiddenSelf)
├── thuattaivan/          # 210 files
├── hormozi/              # 120 files
├── akbimatluatngam/      # 170 files
├── transcripts-clean/    # Cleaned versions
└── *.md                  # Book summaries
```

**Tổng kích thước ước tính:** ~50-80MB (transcripts + books)

### ⚠️ QUAN TRỌNG
- Knowledge base PHẢI được COPY vào Docker image (không phải mount volume)
- Đây là dữ liệu **READ-ONLY** — agents chỉ đọc, không ghi
- Nếu muốn update knowledge, phải rebuild Docker image

---

## 7. DOCKERFILE HIỆN TẠI

```dockerfile
FROM node:20-alpine

# Install ffmpeg and yt-dlp
RUN apk add --no-cache ffmpeg python3 py3-pip \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source
COPY src/ ./src/

# Runtime
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "src/server.js"]
```

### ⚠️ VẤN ĐỀ VỚI DOCKERFILE HIỆN TẠI

1. **Thiếu `admin-ui/`** — Admin dashboard không được COPY
2. **Thiếu `tools/`** — Batch generator không được COPY
3. **Thiếu `data/`** — Calendar data không được COPY
4. **Thiếu `output/`** — Cần tạo thư mục output
5. **ffmpeg + yt-dlp không cần thiết cho Phase 1** — Tăng image size vô ích
6. **Thiếu `.dockerignore`** — Có thể copy node_modules vào image

### ✅ DOCKERFILE ĐỀ XUẤT CHO PHASE 1

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies (layer caching)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY src/ ./src/

# Copy admin dashboard
COPY admin-ui/ ./admin-ui/

# Copy tools (batch generator)
COPY tools/ ./tools/

# Copy data files
COPY data/ ./data/

# Create output directory
RUN mkdir -p ./output

# Runtime
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "src/server.js"]
```

---

## 8. RENDER.YAML HIỆN TẠI

```yaml
services:
  - type: web
    name: youtube-pipeline
    runtime: docker
    plan: starter  # $7/mo, always on
    healthCheckPath: /health
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3001"
    autoDeploy: false
```

### ✅ RENDER.YAML ĐỀ XUẤT

```yaml
services:
  - type: web
    name: youtube-pipeline
    runtime: docker
    plan: starter             # $7/mo — 512MB RAM, always on
    region: singapore         # Gần Việt Nam
    healthCheckPath: /health
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3001"
      - key: DEFAULT_MODEL
        value: gemini-2.0-flash
      - key: SCRIPT_WRITER_MODEL
        value: gemini-2.0-flash
      - key: OUTPUT_DIR
        value: ./output
      # Secrets → Set in Render Dashboard (KHÔNG commit):
      # - GOOGLE_AI_API_KEY
      # - OPENAI_API_KEY (optional backup)
      # - SUPABASE_URL (Phase 2)
      # - SUPABASE_KEY (Phase 2)
    autoDeploy: false
```

---

## 9. PHÂN TÍCH TÍNH NĂNG — CLOUD vs LOCAL

### ✅ HOẠT ĐỘNG TRÊN CLOUD NGAY (Phase 1)

| Tính năng | Mô tả | Dependencies |
|-----------|--------|:---:|
| Admin Dashboard | SPA 9 trang | Express static |
| Generate Script | Tạo script từ topic | Gemini API |
| Batch Generate | Tạo nhiều scripts | Gemini API |
| Knowledge Search | Tìm kiếm brain + books + transcripts | File system |
| Video Browser | Duyệt 815 videos | File system |
| BRAIN Viewer | Xem knowledge map | File system |
| Content Calendar | Lịch đăng bài CRUD | File system (calendar.json) |
| Outputs Browser | Xem outputs đã tạo | File system |
| Script Reader | Đọc chi tiết script | File system |
| Stats Dashboard | Thống kê tổng quan | File system + memory |
| Health Check | Liveness probe | Express |

### ⚠️ CẦN ĐIỀU CHỈNH (Phase 2)

| Tính năng | Vấn đề | Giải pháp |
|-----------|--------|-----------|
| Full Pipeline (trigger) | Voice Producer cần Fish Speech TTS (local GPU) | Skip TTS stage trên cloud, chỉ export script |
| Video Composer | Cần ffmpeg + local GPU | Skip hoặc dùng cloud ffmpeg |
| Harvester | Cần yt-dlp để download video | Install trong Docker (đã có) |

### ❌ KHÔNG THỂ TRÊN CLOUD (cần local)

| Tính năng | Lý do |
|-----------|-------|
| Fish Speech TTS | Self-hosted on RTX 4090, cần GPU |
| Real-time video rendering | Cần GPU + ffmpeg + lượng RAM lớn |
| Proxy to Main Admin | localhost:3001 không tồn tại trên cloud |

---

## 10. KẾ HOẠCH DEPLOY FEATURE-BY-FEATURE

### 🟢 PHASE 1 — Core Admin + Script Generation ($7/tháng)
**Mục tiêu:** Admin dashboard + AI script generation hoạt động 24/7

**Scope:**
- Health check
- Admin SPA Dashboard
- Generate Script (single + batch)
- Knowledge Browser (videos, brain, search)
- Content Calendar
- Outputs Browser + Script Reader
- Stats Dashboard

**Cần làm:**
1. Cập nhật Dockerfile (thêm admin-ui, tools, data)
2. Set env vars trên Render Dashboard (GOOGLE_AI_API_KEY)
3. Deploy via Render Dashboard hoặc `render.yaml`
4. Test: `https://youtube-pipeline-bgey.onrender.com/health`
5. Test: `https://youtube-pipeline-bgey.onrender.com/admin`

**Chi phí:** ~$7/tháng (Render Starter) + ~$0.001/script (Gemini)

---

### 🟡 PHASE 2 — Data Persistence
**Mục tiêu:** Calendar data + outputs persist qua deploy

**Vấn đề:** Render không có persistent disk trên Starter plan. Mỗi deploy sẽ mất data.

**Giải pháp (chọn 1):**
1. **Render Disk** ($0.25/GB/tháng) — Mount /app/data và /app/output
2. **Supabase** — Lưu calendar + outputs metadata vào PostgreSQL
3. **S3/Cloudflare R2** — Lưu output files

**Scope:**
- Calendar data persists qua deploy
- Generated scripts/outputs không bị mất
- Checkpoint data cho pipeline resume

---

### 🟡 PHASE 3 — Full Pipeline (không TTS)
**Mục tiêu:** Chạy full pipeline nhưng skip TTS và video assembly

**Cần làm:**
- Modify pipeline to gracefully skip voice-producer khi không có TTS endpoint
- Skip video-composer khi không có GPU
- Output = script + storyboard + metadata (không có audio/video)
- Auto-upload metadata to YouTube (draft mode)

---

### 🔴 PHASE 4 — Social Seeding & Notifications
**Mục tiêu:** Auto-post to social media sau khi tạo script

**Cần thêm env:**
- TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
- (Optional) TWITTER_BEARER_TOKEN, FB_PAGE_TOKEN

---

## 11. VẤN ĐỀ CẦN XỬ LÝ

### 11.1. Dockerfile cần cập nhật
**Ưu tiên: CAO**

Dockerfile hiện tại thiếu nhiều thư mục. Cần:
- COPY `admin-ui/` (Admin dashboard)
- COPY `tools/` (Batch generator — được import bởi server.js)
- COPY `data/` (Calendar JSON)
- Tạo `output/` directory
- Thêm `.dockerignore` để loại `node_modules`, `.env`, `output/`, `.tmp/`

### 11.2. Data Persistence
**Ưu tiên: TRUNG BÌNH**

Calendar.json và output files sẽ bị reset khi deploy mới. Phase 1 chấp nhận được, Phase 2 cần giải quyết.

### 11.3. Knowledge Base Size
**Ưu tiên: THẤP**

~50-80MB transcripts trong Docker image. Có thể tăng build time nhưng chấp nhận được cho Starter plan (512MB RAM).

### 11.4. CORS
**Ưu tiên: THẤP**

Hiện tại không có CORS config. Nếu admin UI được truy cập trực tiếp qua Render URL thì OK (same-origin). Nếu cần truy cập từ domain khác, thêm CORS middleware.

### 11.5. Authentication
**Ưu tiên: CAO (Phase 2)**

Hiện tại KHÔNG có authentication. Bất kỳ ai có URL đều truy cập được admin. Cần thêm ít nhất basic auth hoặc API key cho production.

---

## 12. CHECKLIST DEPLOY

### Pre-Deploy
- [ ] Cập nhật Dockerfile (thêm admin-ui, tools, data, output dir)
- [ ] Tạo `.dockerignore` (loại node_modules, .env, .tmp, output/*)
- [ ] Test build Docker local: `docker build -t youtube-crew .`
- [ ] Test run Docker local: `docker run -p 3001:3001 --env-file .env youtube-crew`
- [ ] Verify endpoints: /health, /admin, /api/admin/stats

### Deploy to Render
- [ ] Push code to Git repository (GitHub/GitLab)
- [ ] Set Environment Variables trên Render Dashboard:
  - `GOOGLE_AI_API_KEY` (Secret)
  - `NODE_ENV=production`
  - `PORT=3001`
  - `DEFAULT_MODEL=gemini-2.0-flash`
  - `SCRIPT_WRITER_MODEL=gemini-2.0-flash`
  - `OUTPUT_DIR=./output`
- [ ] Deploy via Render Dashboard
- [ ] Verify health: `curl https://youtube-pipeline-bgey.onrender.com/health`
- [ ] Verify admin: Open `https://youtube-pipeline-bgey.onrender.com/admin`
- [ ] Test generate-script: POST to `/api/admin/generate-script`

### Post-Deploy Verification
- [ ] Admin Dashboard loads correctly (9 pages)
- [ ] Stats page shows knowledge data (815 videos, 28 books)
- [ ] Knowledge search works
- [ ] Video browser lists transcripts
- [ ] BRAIN viewer shows content
- [ ] Generate script produces output
- [ ] Batch generate works
- [ ] Calendar CRUD works
- [ ] Outputs page lists generated scripts

---

## 📎 FILE THAM KHẢO

| File | Mô tả | Quan trọng |
|------|--------|:---:|
| `src/server.js` | Server chính — 944 lines, 20 routes | ⭐⭐⭐ |
| `admin-ui/index.html` | Admin SPA — 538 lines, 53KB | ⭐⭐⭐ |
| `src/knowledge/loader.js` | Knowledge loader — 524 lines | ⭐⭐ |
| `src/knowledge/BRAIN.md` | Core knowledge — 847 lines, 64KB | ⭐⭐ |
| `tools/batch-generate.js` | Batch generator — 280 lines | ⭐⭐ |
| `tools/video-factory.js` | Script factory — 596 lines | ⭐⭐ |
| `src/core/llm.js` | LLM abstraction — 190 lines | ⭐⭐ |
| `src/core/conductor.js` | Pipeline orchestrator | ⭐ |
| `data/calendar.json` | Calendar data store | ⭐ |
| `package.json` | Dependencies | ⭐ |
| `.env.example` | Env template — 71 lines | ⭐ |

---

## 🎯 TÓM TẮT CHO AI DEPLOY

**Nhiệm vụ của bạn:**

1. **Cập nhật Dockerfile** — Thêm `admin-ui/`, `tools/`, `data/`, tạo `output/`, thêm HEALTHCHECK
2. **Tạo `.dockerignore`** — Loại files không cần thiết
3. **Verify build local** — `docker build` + `docker run` + test endpoints
4. **Push to Git** — Đảm bảo repo chứa toàn bộ knowledge base
5. **Set Render env vars** — Chủ yếu là `GOOGLE_AI_API_KEY`
6. **Deploy Phase 1** — Admin + Script Generation
7. **Test tất cả 20 routes** — Đặc biệt /admin, /api/admin/generate-script, /api/admin/knowledge/*
8. **KHÔNG deploy** features phụ thuộc local (TTS, video composer, proxy to main admin)

**Quan trọng nhất:** Phase 1 chỉ cần Gemini API key. Không cần GPU, không cần ffmpeg, không cần TTS. Chỉ cần Express server + Knowledge files + Gemini API.

---

*Report generated: 2025-02-03 | youtube-agent-crew v0.1.0*
