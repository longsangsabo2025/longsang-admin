# 📊 YOUTUBE AGENT CREW — BÁO CÁO TIẾN ĐỘ

> **Cập nhật:** 12/02/2026  
> **Phiên bản:** 0.1.0  
> **Kênh:** Đứng Dậy Đi  
> **Trạng thái:** ✅ Pipeline E2E hoạt động — sẵn sàng sản xuất

---

## 1. TỔNG QUAN DỰ ÁN

**YouTube Agent Crew** là hệ thống AI tự động hoá hoàn toàn quy trình sản xuất video podcast cho kênh YouTube "Đứng Dậy Đi". Từ một chủ đề đầu vào, hệ thống:

1. Nghiên cứu & thu thập nội dung
2. Phân tích qua Knowledge Base (28 sách, 317 transcripts)
3. Viết script podcast 2000+ từ với giọng riêng (94% Voice DNA)
4. Chuyển thành giọng nói clone qua VoxCPM-1.5-VN
5. Tạo hình ảnh nền + thumbnail bằng FLUX.1 Schnell
6. Ghép video hoàn chỉnh với phụ đề
7. Upload lên YouTube (private) + SEO metadata

**Chi phí mỗi video:** ~$0.05 | **Thời gian:** ~26 phút tự động hoàn toàn

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Multi-Agent Architecture (7 Agents)

```
┌─────────────────────────────────────────────────────────────┐
│                     CONDUCTOR (Pipeline Orchestrator)        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] Harvester ──→ [2] Brain Curator ──→ [3] Script Writer  │
│   gpt-4o-mini       gpt-4o-mini           gpt-4o            │
│                                                              │
│  [4] Voice Producer ──→ [5] Visual Director                  │
│   VoxCPM-1.5-VN         gpt-4o-mini                         │
│                                                              │
│  [6] Video Composer ──→ [7] Publisher                        │
│   FLUX.1 + FFmpeg        YouTube API v3                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Codebase

| File | Dòng | Mô tả |
|------|------|-------|
| `src/agents/video-composer.js` | 1155 | Tạo video: FLUX background + thumbnail + Whisper subtitles + FFmpeg |
| `src/agents/script-writer.js` | 447 | Viết script podcast với Voice DNA + Brain knowledge |
| `src/agents/publisher.js` | 311 | SEO metadata + YouTube upload + set thumbnail |
| `src/agents/harvester.js` | 311 | Thu thập & phân tích nội dung YouTube |
| `src/agents/voice-producer.js` | 293 | VoxCPM TTS, split chunks, concat audio |
| `src/agents/tts-preprocessor.js` | 262 | 80+ phonetic mappings Vietnamese, GPT-4o-mini fallback |
| `src/agents/brain-curator.js` | 185 | Phân tích + enrichment từ BRAIN.md & books.json |
| `src/agents/video-assembler.js` | 183 | (Legacy — thay bằng video-composer.js) |
| `src/agents/visual-director.js` | 80 | Storyboard generation |
| `src/core/conductor.js` | 224 | Pipeline orchestration, retry, cost tracking |
| `src/core/agent.js` | 181 | Base agent class |
| `src/core/llm.js` | 113 | OpenAI/Gemini LLM abstraction |
| `src/core/memory.js` | 82 | Shared memory giữa các stages |
| `src/core/message-bus.js` | 98 | Event-based messaging |
| `src/pipelines/youtube-podcast.js` | 195 | 7-stage pipeline definition |
| `src/index.js` | 181 | CLI entry point |
| **Tổng** | **~4,300** | **16 files, 154KB** |

### 2.3 Knowledge Base

| File | Size | Nội dung |
|------|------|----------|
| `src/knowledge/BRAIN.md` | 15KB | Extracted knowledge từ 317 video transcripts |
| `src/knowledge/VOICE.md` | 16KB | Voice DNA — phong cách viết riêng của kênh |
| `src/knowledge/books.json` | 432KB | 28 cuốn sách đã extract (key insights, quotes) |
| `src/knowledge/tài-chính.md` | 28KB | Brain section: tài chính |
| `src/knowledge/tâm-lý.md` | 36KB | Brain section: tâm lý |
| `src/knowledge/quản-trị.md` | 39KB | Brain section: quản trị |
| `src/knowledge/kỷ-luật.md` | 4KB | Brain section: kỷ luật |
| `src/knowledge/deepwork.md` | 4KB | Brain section: deep work |

---

## 3. TECH STACK

### 3.1 AI Models

| Model | Vai trò | Specs | Chi phí |
|-------|---------|-------|---------|
| **GPT-4o** | Script Writer | Best quality, 128K context | ~$0.04/script |
| **GPT-4o-mini** | All other agents | Fast, cheap | ~$0.01/run |
| **FLUX.1 Schnell** | Image generation | 12B params, FP8, 4 steps | $0 (local) |
| **VoxCPM-1.5-VN** | Vietnamese TTS | 800M params, 3.56GB | $0 (local) |
| **Whisper Medium** | Subtitle generation | ~1.5GB | $0 (local) |

### 3.2 Infrastructure

| Service | Port | Trạng thái |
|---------|------|------------|
| **ComfyUI** (FLUX.1) | 8188 | `--highvram --fast --fp16-vae` |
| **VoxCPM TTS** | 8100 | Auto-transcribe voice ref tại startup |
| **FFmpeg** | CLI | WinGet install, filter_complex_script |

### 3.3 Hardware

- **GPU:** NVIDIA RTX 4090 (24GB VRAM)
- **FLUX inference:** 3s/image, 11GB VRAM
- **TTS inference:** ~17s/chunk, CUDA bfloat16

### 3.4 Dependencies

```
@google/generative-ai, chalk, dotenv, eventemitter3,
googleapis, nanoid, openai, ora, youtubei.js
```

---

## 4. KẾT QUẢ E2E TEST

### Run: `H6AxvL-7fz` — "Tại sao 90% người trẻ không bao giờ giàu"

| Metric | Giá trị |
|--------|---------|
| **Tổng thời gian** | 1,589s (26.5 phút) |
| **Tổng chi phí** | $0.0504 |
| **Script** | 2,015 từ (~13.4 phút podcast) |
| **Audio** | 492.9s, 11.5MB MP3 |
| **Video** | 27.2MB MP4, 1080p |
| **Background** | 794KB PNG (FLUX.1) |
| **Thumbnail** | 657KB PNG, 1280×720 (FLUX.1) |
| **TTS chunks** | 35/35 thành công |
| **YouTube SEO** | Title + 16 tags + description + timestamps |
| **Privacy** | Private (an toàn — publish thủ công) |

### Chi phí theo Agent

| Agent | Chi phí | Thời gian |
|-------|---------|-----------|
| Harvester | $0.0002 | 8.9s |
| Brain Curator | $0.0010 | 14.2s |
| Script Writer | $0.0430 | 37.8s (+ expansion) |
| Voice Producer | — | 601s (TTS local) |
| Visual Director | $0.0030 | 33.8s |
| Video Composer | — | 803s (FLUX + FFmpeg local) |
| Publisher | $0.0031 | 25.9s |

### Output Files

```
output/youtube-podcast_H6AxvL-7fz/
├── results.json            (58KB)  — Full pipeline results
├── script.json             (14KB)  — Structured script
├── script.txt              (12KB)  — Human-readable script
├── metadata.json           (2KB)   — YouTube SEO metadata
├── audio/
│   ├── chunk_000..034.wav          — 35 TTS chunks
│   ├── podcast_full.wav    (42MB)  — Concatenated WAV
│   └── podcast_full.mp3    (11MB)  — Final MP3
└── video/
    ├── background.png      (794KB) — FLUX.1 Schnell
    ├── thumbnail.png       (657KB) — FLUX.1 1280x720
    ├── podcast_video.mp4   (27MB)  — Final video
    ├── podcast_full.srt    (17KB)  — Whisper subtitles
    ├── subtitles.ass       (1KB)   — Styled ASS subtitles
    └── metadata.json       (2KB)   — YouTube metadata
```

---

## 5. CÁC VẤN ĐỀ ĐÃ GIẢI QUYẾT

### 5.1 Trong quá trình phát triển

| # | Vấn đề | Giải pháp |
|---|--------|-----------|
| 1 | DALL-E 3 tốn $0.04/ảnh | Chuyển sang FLUX.1 Schnell local → $0 |
| 2 | SD 1.5 chất lượng thấp | Upgrade FLUX.1 12B FP8 → 3s, 990KB |
| 3 | SDXL hi-res fix black image | Bypass hi-res, dùng FLUX thay thế |
| 4 | ComfyUI OOM với --bf16-unet | Bỏ flag, chỉ dùng `--highvram --fast --fp16-vae` |
| 5 | Fish Speech quality kém | Chuyển VoxCPM-1.5-VN (800M, Vietnamese native) |
| 6 | Voice clone không giống | Trim ref 10s, cfg=2.0, min_len=50, speed=0.92 |
| 7 | TTS phát âm sai tiếng Việt | TTS Preprocessor: 80+ phonetic mappings |
| 8 | Script quá ngắn | Auto-expand: detect sections < threshold, LLM expand lặp lại |
| 9 | FFmpeg shell escaping Windows | `-filter_complex_script` file thay vì inline |

### 5.2 Trong E2E test

| # | Vấn đề | Giải pháp |
|---|--------|-----------|
| 10 | VoxCPM 500: `prompt_wav_path and prompt_text must both be provided` | Auto-transcribe voice ref bằng Whisper tại server startup, fallback text mặc định |
| 11 | Whisper `ETIMEDOUT` trên audio dài | Chuyển `execSync` → async `execFile` với 20-min timeout |
| 12 | YouTube upload 401 auth expired | Pre-refresh token trước upload + persist refreshed token vào process.env |
| 13 | Whisper không trên PATH (Windows) | Resolve full path: `%APPDATA%/Python/Python313/Scripts/whisper.exe` |

---

## 6. TRẠNG THÁI HOÀN THÀNH

### ✅ Đã hoàn thành (Production-Ready)

- [x] Multi-agent framework (7 agents, pipeline, conductor)
- [x] Knowledge Base: BRAIN.md + VOICE.md + 28 books + 4 brain sections
- [x] Script Writer: 2000+ từ, 94% Voice DNA, 47% Brain knowledge
- [x] VoxCPM TTS: voice clone, speed 0.92, timesteps 25
- [x] TTS Preprocessor: 80+ phonetic mappings
- [x] FLUX.1 Schnell: background + thumbnail generation ($0)
- [x] Video Composer: FFmpeg composite (background + audio + subtitles)
- [x] Thumbnail Generator: FLUX 1280×720 + FFmpeg text overlay
- [x] Whisper Subtitles: Vietnamese, async, 20-min timeout
- [x] Publisher: YouTube upload + SEO metadata + set thumbnail
- [x] CLI: `node src/index.js --topic "..." `
- [x] E2E test thành công: 7/7 stages, $0.05/video

### ⚡ Cần cải thiện (Priority)

- [ ] **Whisper subtitle chính xác hơn** — hiện dùng medium model, có thể upgrade large-v3
- [ ] **YouTube OAuth refresh** — cần cơ chế lưu refreshed token persistent (file/.env)
- [ ] **Subtitle styling** — ASS fallback khi Whisper timeout, cần format ASS đẹp hơn
- [ ] **Chunk 1 TTS** — chunk đầu tiên thường là JSON metadata, cần filter tốt hơn

---

## 7. ROADMAP — PHÁT TRIỂN TƯƠNG LAI

### 🔴 Phase 1: Chất lượng (Next Sprint)

| Task | Mô tả | Ưu tiên |
|------|--------|---------|
| **Smart Chunking** | Cải thiện voice-producer: filter metadata chunks, split theo câu thay vì ký tự | 🔴 Cao |
| **Whisper Large-v3** | Upgrade model cho subtitle chính xác hơn | 🔴 Cao |
| **ASS Subtitle Styling** | Gradient text, shadow, animation cho phụ đề đẹp hơn | 🟡 TB |
| **Thumbnail Text Overlay** | Vietnamese font (Be Vietnam Pro), auto line-break | 🟡 TB |
| **Audio Post-Processing** | Normalize loudness, noise reduction, EQ podcast | 🟡 TB |

### 🟡 Phase 2: Tính năng mới

| Task | Mô tả | Ưu tiên |
|------|--------|---------|
| **Multi-scene Video** | Nhiều background thay đổi theo section, không chỉ 1 ảnh | 🟡 TB |
| **B-roll Integration** | Stock footage / Pexels API xen kẽ | 🟡 TB |
| **Schedule Publishing** | Auto-schedule YouTube upload theo lịch | 🟡 TB |
| **Batch Mode** | Chạy nhiều topic liên tiếp, queue hàng đợi | 🟡 TB |
| **Dashboard Web UI** | Theo dõi pipeline, preview video, manage content | 🟢 Thấp |

### 🟢 Phase 3: Mở rộng

| Task | Mô tả | Ưu tiên |
|------|--------|---------|
| **Video AI** | Wan2.1 14B (SwarmUI) cho AI-generated video clips | 🟢 Thấp |
| **Multi-channel** | Hỗ trợ nhiều kênh với voice/brain khác nhau | 🟢 Thấp |
| **API Server** | REST API thay vì CLI, webhook notifications | 🟢 Thấp |
| **Analytics** | Track performance video, auto-adjust content strategy | 🟢 Thấp |
| **Shorts Generator** | Tự động cắt highlights → YouTube Shorts | 🟢 Thấp |

---

## 8. HƯỚNG DẪN CHẠY

### Prerequisites

```bash
# Services cần chạy trước:
# 1. ComfyUI (FLUX.1 Schnell)
cd D:\Private_AI_Workspace\ComfyUI
.\venv\Scripts\python.exe main.py --highvram --fast --fp16-vae --listen 127.0.0.1 --port 8188

# 2. VoxCPM TTS
cd D:\0.PROJECTS\00-MASTER-ADMIN\voxcpm-tts
.\.venv\Scripts\python.exe server.py --port 8100 --voice_ref ..\youtube-agent-crew\assets\voice\voice_ref_10s.wav
```

### Chạy Pipeline

```bash
cd D:\0.PROJECTS\00-MASTER-ADMIN\youtube-agent-crew

# Tạo video từ topic
node src/index.js --topic "Tại sao người giàu nghĩ khác"

# Từ URL YouTube
node src/index.js --url "https://youtube.com/watch?v=..."

# Dry-run (không TTS/video)
node src/index.js --topic "Test topic" --dry-run
```

### Environment Variables (.env)

```
OPENAI_API_KEY=sk-...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_ACCESS_TOKEN=...
YOUTUBE_REFRESH_TOKEN=...
YOUTUBE_CHANNEL_ID=...
OUTPUT_DIR=./output
```

---

## 9. CẤU TRÚC THƯ MỤC

```
youtube-agent-crew/
├── src/
│   ├── agents/
│   │   ├── harvester.js          — Thu thập nội dung
│   │   ├── brain-curator.js      — Phân tích & enrichment
│   │   ├── script-writer.js      — Viết script podcast
│   │   ├── tts-preprocessor.js   — Phonetic preprocessing
│   │   ├── voice-producer.js     — VoxCPM TTS
│   │   ├── visual-director.js    — Storyboard
│   │   ├── video-composer.js     — FLUX + FFmpeg + Whisper
│   │   └── publisher.js          — YouTube upload + SEO
│   ├── core/
│   │   ├── agent.js              — Base agent class
│   │   ├── conductor.js          — Pipeline orchestrator
│   │   ├── llm.js                — LLM abstraction
│   │   ├── memory.js             — Shared state
│   │   └── message-bus.js        — Event messaging
│   ├── knowledge/
│   │   ├── BRAIN.md              — Knowledge base
│   │   ├── VOICE.md              — Voice DNA
│   │   ├── books.json            — 28 cuốn sách
│   │   └── loader.js             — Knowledge loader
│   ├── pipelines/
│   │   └── youtube-podcast.js    — 7-stage pipeline
│   └── index.js                  — CLI entry
├── assets/voice/                 — Voice reference WAV files
├── output/                       — Generated videos
├── .env                          — API keys
└── package.json
```

---

> **Ghi chú:** Dự án đã qua E2E test thành công. Video được tạo ở chế độ `private` — publish thủ công trên YouTube Studio để kiểm tra chất lượng trước khi public. Tổng chi phí ước tính cho 100 video: **~$5**.
