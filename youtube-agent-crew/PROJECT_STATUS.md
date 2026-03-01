# PROJECT STATUS — YouTube Pipeline "ĐỨNG DẬY ĐI"
> 7-Agent AI Pipeline: URL → Full Video (auto)
> Last updated: 2026-02-25

---

## QUICK INFO

| Field | Value |
|-------|-------|
| **Channel** | Chưa tạo — tên: "ĐỨNG DẬY ĐI" |
| **Stack** | Node.js + Gemini 2.0 Flash + VoxCPM TTS + FFmpeg + Whisper |
| **Supabase** | `diexsbzqwsbpilsymnfb` (shared) |
| **Render** | render.yaml ready, chưa deploy |
| **Completion** | **98%** |
| **Revenue** | ❌ $0 — no channel, no uploads |

---

## CHECKLIST → 100%

### ✅ Pipeline Core (DONE)
- [x] 7 agents: Harvester → Brain → Script → Voice → Visual → Video → Publisher
- [x] Gemini 2.0 Flash as default LLM
- [x] VoxCPM TTS integration + quality gates
- [x] Whisper STT back-validation (avg 0.90 similarity)
- [x] Chunk repair system for failed audio
- [x] FFmpeg audio concat + video assembly
- [x] Whisper subtitle generation
- [x] First FULL video: podcast_video.mp4 (20.6MB, 8.3min)
- [x] Cost: $0.0094/video

### ✅ Automation (DONE)
- [x] n8n trigger: daily 8 AM, ENABLED
- [x] Content repurposer: video → blog + social + newsletter
- [x] Auto-seeder: Telegram/Twitter/FB/Reddit announce
- [x] Telegram notifications (10 event types)
- [x] Batch topics (week1-topics.json — 5 topics)
- [x] Shorts pipeline (5-stage, 60s vertical)
- [x] Batch Shorts generator (3-5 shorts per episode)
- [x] Pre-generate scripts (stages 1-3) + quick-produce (stages 4-7)

### ✅ Cloud Deployment (DONE)
- [x] Render blueprint (render.yaml + Dockerfile)
- [x] HTTP trigger server (server.js)
- [x] Supabase Edge Functions: youtube-pipeline-trigger, daily-content-scheduler
- [x] pg_cron: daily 8AM VN trigger

### ⬜ Channel Creation (MANUAL — CEO)
- [ ] **Create Google account** for channel
- [ ] **Create YouTube channel** "ĐỨNG DẬY ĐI"
- [ ] **Apply branding** from `channel-about.md` + `channel-config.json`
- [ ] **Upload channel art** (banner, profile pic, watermark)
- [ ] **Set up playlists** (9 defined in channel-config.json)

### ⬜ Authentication (MANUAL — CEO)
- [ ] **Google Cloud Console** → create OAuth2 credentials
- [ ] **Set YOUTUBE_CLIENT_ID** in .env
- [ ] **Set YOUTUBE_CLIENT_SECRET** in .env
- [ ] **Generate YOUTUBE_REFRESH_TOKEN** (consent flow)
- [ ] **Test upload** with youtube-uploader.js

### ⬜ First Batch
- [ ] Upload first video manually (test quality)
- [ ] Upload 5 videos in Week 1
- [ ] Run first batch of 10 Shorts
- [ ] Monitor analytics for 7 days
- [ ] Adjust Voice DNA based on feedback

### ⬜ Render Deployment
- [ ] Push youtube-agent-crew to GitHub repo
- [ ] Connect repo in Render Dashboard
- [ ] Verify auto-deploy from render.yaml
- [ ] Set env vars on Render (API keys, Supabase)
- [ ] Test HTTP trigger endpoint

---

## BLOCKERS

| Blocker | Owner | Impact | ETA |
|---------|:-----:|--------|:---:|
| **No YouTube channel** | CEO | Can't upload ANY content | 10 min |
| **No OAuth2 credentials** | CEO | Auto-upload broken | 15 min |
| **Not on Render** | CTO | No cloud pipeline (local GPU only) | 10 min |

---

## RECENT CHANGES

| Date | Change |
|------|--------|
| 2026-02-25 | First full video generated (20.6MB, 8.3min) |
| 2026-02-25 | Shorts pipeline + batch generator added |
| 2026-02-25 | Content repurposer integrated |
| 2026-02-25 | Telegram notifications (10 types) |
| 2026-02-25 | Cloud automation: Edge Functions + pg_cron |
| 2026-02-25 | Render blueprint created |
