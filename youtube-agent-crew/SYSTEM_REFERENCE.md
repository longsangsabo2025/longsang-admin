# 🏭 YOUTUBE AGENT CREW — SYSTEM REFERENCE
> **Tài liệu tham chiếu toàn hệ thống — Đọc file này nếu mất ngữ cảnh**
> 
> Cập nhật: 2026-02-11 | Version: 0.1.0
> 
> Path: `d:\0.PROJECTS\00-MASTER-ADMIN\youtube-agent-crew\`

---

## 📋 MỤC LỤC
1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Pipeline toàn bộ](#3-pipeline-toàn-bộ)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [7 Agents chi tiết](#5-7-agents-chi-tiết)
6. [Core Framework](#6-core-framework)
7. [Hệ thống tri thức](#7-hệ-thống-tri-thức-knowledge-system)
8. [Cấu hình & API Keys](#8-cấu-hình--api-keys)
9. [Dữ liệu đã có](#9-dữ-liệu-đã-có)
10. [Trạng thái hiện tại](#10-trạng-thái-hiện-tại)
11. [Cách chạy](#11-cách-chạy)
12. [Vấn đề đã biết](#12-vấn-đề-đã-biết)
13. [Roadmap](#13-roadmap)

---

## 1. TỔNG QUAN DỰ ÁN

### Mục tiêu
Xây dựng **nhà máy sản xuất video podcast YouTube tự động** bằng hệ thống multi-agent AI.

### Kênh mục tiêu
| Thuộc tính | Giá trị |
|---|---|
| **Tên kênh** | **ĐỨNG DẬY ĐI** |
| **YouTube Channel ID** | UCh08dvkDfJVJ8f1C-TbXbew |
| **Handle** | @dungdaydi |
| **Tagline** | "Nơi có những sự thật mà cuộc sống đã giấu bạn, và sức mạnh mà bạn quên mình đang có." |
| **Sign-off** | "Không ai cứu bạn ngoài chính bạn. Đứng dậy đi." |
| **Giọng** | Triết gia bóng tối với trái tim chiến binh |
| **Ngôn ngữ** | Tiếng Việt (xen English terms giữ nguyên) |

### Kênh tham chiếu (Reference)
| Thuộc tính | Giá trị |
|---|---|
| **Tên** | THE HIDDEN SELF |
| **Handle** | @thehiddenself.pocast |
| **Channel ID** | UCrMTLFvpsmXlSKfkaMjGqgQ |
| **Vai trò** | Voice/style reference ONLY — KHÔNG COPY nội dung |
| **Tổng video** | ~426 |
| **Đã crawl** | 317 videos (6.27M chars, 27.4MB) |

### Tech Stack
- **Runtime**: Node.js 18+ (ES Modules)
- **LLM chính**: OpenAI GPT-4o-mini
- **LLM phụ**: Google Gemini 2.0 Flash, Anthropic Claude
- **Transcript**: yt-dlp (primary) + youtubei.js (metadata only)
- **Video**: FFmpeg
- **Database**: Supabase (planned for Brain storage)
- **TTS**: Fish Speech / ElevenLabs (planned)

---

## 2. KIẾN TRÚC HỆ THỐNG

```
┌──────────────────────────────────────────────────────────────┐
│                     CONDUCTOR (Orchestrator)                 │
│  Đăng ký agents → Chạy pipeline stages → Retry → Report     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────┐   ┌──────────┐   ┌─────────────┐                │
│  │  LLM  │   │ Message  │   │   Memory    │                │
│  │       │   │   Bus    │   │  (Shared)   │                │
│  │OpenAI │   │EventEmit │   │  Per-Run    │                │
│  │Gemini │   │  3-way   │   │  Namespace  │                │
│  └───┬───┘   └────┬─────┘   └──────┬──────┘                │
│      │            │                │                         │
│  ┌───▼────────────▼────────────────▼───┐                    │
│  │          BASE AGENT CLASS           │                    │
│  │  execute → think → act → report     │                    │
│  │  Token tracking + cost estimation   │                    │
│  └────────────────┬────────────────────┘                    │
│                   │                                          │
│  ┌────────────────▼────────────────────────────────────┐    │
│  │                 7 SPECIALIZED AGENTS                 │    │
│  │                                                     │    │
│  │  1. 🔍 Harvester     — YouTube content extraction   │    │
│  │  2. 🧠 Brain Curator — Knowledge management        │    │
│  │  3. ✍️ Script Writer — VOICE DNA + Book knowledge  │    │
│  │  4. 🎤 Voice Producer — TTS preparation            │    │
│  │  5. 🎬 Visual Director — Storyboard design         │    │
│  │  6. 🎞️ Video Assembler — FFmpeg commands           │    │
│  │  7. 📢 Publisher      — SEO + YouTube metadata     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│               KNOWLEDGE LAYER (loader.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐              │
│  │ VOICE.md │  │ BRAIN.md │  │  books.json  │              │
│  │ 16.2KB   │  │ 14.8KB   │  │  431.7KB     │              │
│  │ Voice DNA│  │ 8 Themes │  │  28 Books    │              │
│  │ 11 rules │  │ 20 Hooks │  │  5 Categories│              │
│  └──────────┘  └──────────┘  └──────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

### Luồng dữ liệu giữa các thành phần
```
User Input (URL/Topic)
     │
     ▼
  Conductor.executePipeline()
     │
     ├─ Memory.set(pipelineId, 'input', input)
     │
     ├─ Stage 1: Harvester.execute(task)
     │     ├─ yt-dlp → transcript (Vietnamese auto-sub)
     │     ├─ youtubei.js → metadata
     │     └─ LLM → structured analysis (JSON)
     │     → Memory.set('harvested_content', result)
     │
     ├─ Stage 2: BrainCurator.execute(task + Memory.harvested_content)
     │     ├─ searchBooks(topic) → relevant book knowledge
     │     └─ LLM → categorize + connect + rate
     │     → Memory.set('curated_knowledge', result)
     │
     ├─ Stage 3: ScriptWriter.execute(task + Memory.curated + Memory.harvested)
     │     ├─ loadVoice() → VOICE.md (16.2KB voice rules)
     │     ├─ buildKnowledgeContext(topic) → BRAIN.md + books + VOICE DNA
     │     └─ LLM → full podcast script (JSON with sections + markers)
     │     → Memory.set('podcast_script', result)
     │
     ├─ Stage 4: VoiceProducer.execute(Memory.podcast_script)
     │     └─ LLM → TTS-ready chunks + SSML markers
     │     → Memory.set('audio_data', result)
     │
     ├─ Stage 5: VisualDirector.execute(Memory.podcast_script)
     │     └─ LLM → storyboard + image prompts + transitions
     │     → Memory.set('visual_storyboard', result)
     │
     ├─ Stage 6: VideoAssembler.execute(Memory.storyboard + Memory.audio)
     │     └─ LLM → FFmpeg command sequence
     │     → Memory.set('video_data', result)
     │
     └─ Stage 7: Publisher.execute(Memory.script + Memory.harvested)
           └─ LLM → SEO title/desc/tags/thumbnail concept
           → Memory.set('publish_metadata', result)
     
     ▼
  Output: ./output/{pipelineId}/
     ├─ results.json (all stage outputs)
     ├─ script.json (parsed script)
     ├─ script.txt (readable)
     └─ metadata.json (YouTube SEO)
```

---

## 3. PIPELINE TOÀN BỘ

### 7 Stages (Sequential)
| # | Stage | Agent | Required | Output Key | Mô tả |
|---|-------|-------|----------|------------|--------|
| 1 | **Harvest Content** | harvester | ✅ Yes | `harvested_content` | Lấy transcript + metadata từ YouTube |
| 2 | **Brain Curation** | brain-curator | ✅ Yes | `curated_knowledge` | Phân tích, phân loại, liên kết kiến thức |
| 3 | **Script Writing** | script-writer | ✅ Yes | `podcast_script` | Viết script podcast theo VOICE DNA |
| 4 | **Voice Production** | voice-producer | ❌ No | `audio_data` | Chuẩn bị script cho TTS |
| 5 | **Visual Direction** | visual-director | ❌ No | `visual_storyboard` | Thiết kế visual storyboard |
| 6 | **Video Assembly** | video-assembler | ❌ No | `video_data` | Tạo FFmpeg commands |
| 7 | **Publishing** | publisher | ✅ Yes | `publish_metadata` | SEO metadata cho YouTube |

> **Required stages** (1,2,3,7) sẽ dừng pipeline nếu fail.
> **Optional stages** (4,5,6) cho phép skip nếu fail — pipeline vẫn chạy tiếp.

### Input Options
```bash
# Từ URL cụ thể
node src/index.js --url "https://youtube.com/watch?v=XXX"

# Từ topic
node src/index.js --topic "Tại sao giới trẻ VN nghèo hơn thế hệ trước"

# Từ channel (lấy video mới nhất)  
node src/index.js --channel "@thehiddenself.pocast" --latest

# Dry run (không TTS/video)
node src/index.js --topic "..." --dry-run
```

---

## 4. CẤU TRÚC THƯ MỤC

```
youtube-agent-crew/
├── .env                          # API keys (KHÔNG COMMIT)
├── .env.example                  # Template cho env
├── package.json                  # Dependencies
├── SYSTEM_REFERENCE.md           # 📌 FILE NÀY — đọc khi mất ngữ cảnh
├── README.md                     # README cơ bản
│
├── src/
│   ├── index.js                  # CLI entry point (--url, --topic, --channel, --latest, --dry-run)
│   │
│   ├── core/                     # Framework core
│   │   ├── llm.js                # LLM abstraction (OpenAI + Gemini)
│   │   ├── agent.js              # BaseAgent class (execute→think→act→report)
│   │   ├── conductor.js          # Pipeline orchestrator (stage exec, retry, cost)
│   │   ├── memory.js             # Shared memory (namespaced per pipeline run)
│   │   └── message-bus.js        # EventEmitter3 inter-agent communication
│   │
│   ├── agents/                   # 7 specialized agents
│   │   ├── harvester.js          # YouTube extraction (yt-dlp + youtubei.js)
│   │   ├── brain-curator.js      # Knowledge curation + book search
│   │   ├── script-writer.js      # Script generation (VOICE DNA + books)
│   │   ├── voice-producer.js     # TTS preparation (Fish Speech/ElevenLabs)
│   │   ├── visual-director.js    # Visual storyboard design
│   │   ├── video-assembler.js    # FFmpeg video assembly
│   │   └── publisher.js          # YouTube SEO + metadata
│   │
│   ├── knowledge/                # Knowledge layer
│   │   ├── loader.js             # Knowledge loading + search + context building
│   │   ├── VOICE.md              # 🎯 Voice DNA (16.2KB, 11 sections, hand-crafted)
│   │   ├── BRAIN.md              # Knowledge map (14.8KB, 8 themes, 20 hooks)
│   │   ├── books.json            # 28 books full content (431.7KB, 5 categories)
│   │   ├── tài-chính.md          # Category summary
│   │   ├── tâm-lý.md             # Category summary
│   │   ├── quản-trị.md           # Category summary
│   │   ├── deepwork.md           # Category summary
│   │   └── kỷ-luật.md            # Category summary
│   │
│   ├── config/
│   │   └── channel.js            # Channel identity (name, pillars, visual brand)
│   │
│   └── pipelines/
│       └── youtube-podcast.js    # 7-stage pipeline definition
│
├── data/                         # Data files
│   ├── channel-transcripts.json  # 317 videos raw transcripts (27.4MB)
│   ├── clean-transcripts.json    # 315 videos cleaned + classified (8.1MB)
│   ├── test-script-*.json        # Test outputs
│   └── script-fulltext.txt       # Last test script readable
│
├── crawl-channel.js              # Standalone channel crawler (with resume)
├── process-transcripts.js        # 3-step transcript processor
├── extract-voice.js              # Multi-pass voice extractor
└── test-script.js                # Quick script generation test
```

---

## 5. 7 AGENTS CHI TIẾT

### Agent 1: 🔍 Harvester (`src/agents/harvester.js`)
- **Input**: YouTube URL hoặc topic
- **Output**: JSON `{ title, coreTopic, keyPoints, dataPoints, quotableLines, frameworks, sentiment }`
- **Tools**: 
  - **yt-dlp** (primary) — Lấy Vietnamese auto-sub (`vi-orig` → `vi` → `en`)
  - **youtubei.js** — Metadata (title, desc, view count)
- **Flow**: `fetchTranscriptYtDlp()` → `parseJson3Transcript()` → LLM analysis
- **Retry**: 2 lần
- **Đặc biệt**: yt-dlp là **fallback chính** vì youtubei.js bị lỗi HTTP 400 cho transcript

### Agent 2: 🧠 Brain Curator (`src/agents/brain-curator.js`)
- **Input**: Harvested content từ Stage 1
- **Output**: JSON `{ category, atomicIdeas[], connections[], podcastPotential }`
- **Đặc biệt**: Có `searchBooks()` — tìm kiến thức liên quan từ 28 cuốn sách

### Agent 3: ✍️ Script Writer (`src/agents/script-writer.js`) ⭐ CRITICAL
- **Input**: Curated knowledge + harvested content
- **Output**: JSON `{ title, hook, script[{section, timestamp, text, voiceDirection, visualNote}], seoKeywords }`
- **Knowledge injection** (tự động qua `execute()` override):
  1. `loadVoice()` → VOICE.md (16.2KB voice rules)
  2. `buildKnowledgeContext(topic)` → BRAIN.md + relevant books + VOICE DNA
- **System prompt**: Aligned with "Đứng Dậy Đi" identity, "The Dark Arc" structure
- **Temperature**: 0.85 (creative)
- **Max tokens**: 8192
- **Cấm kỵ**: Giọng sách giáo khoa, hype, motivational sáo rỗng, copy

### Agent 4: 🎤 Voice Producer (`src/agents/voice-producer.js`)
- **Input**: Podcast script
- **Output**: JSON `{ chunks[], voiceSettings }`
- **Status**: Logic sẵn, chưa kết nối TTS API (Fish Speech / ElevenLabs)

### Agent 5: 🎬 Visual Director (`src/agents/visual-director.js`)
- **Input**: Podcast script
- **Output**: Storyboard JSON (each 10-20s segment: footage keywords, text overlays, transitions)
- **Status**: LLM design only, chưa tạo image thật

### Agent 6: 🎞️ Video Assembler (`src/agents/video-assembler.js`)
- **Input**: Storyboard + audio data
- **Output**: FFmpeg command sequence
- **Status**: Tạo commands, chưa exec FFmpeg tự động

### Agent 7: 📢 Publisher (`src/agents/publisher.js`)
- **Input**: Script + harvested content
- **Output**: JSON `{ youtube: {title, description, tags}, socialMedia, communityPost }`
- **Status**: Tạo metadata, chưa tự động upload YouTube

---

## 6. CORE FRAMEWORK

### llm.js — LLM Abstraction
```
chat({ model, systemPrompt, userMessage, temperature, maxTokens, responseFormat })
→ { content, tokens: {input, output}, model, durationMs }
```
- OpenAI: `gpt-4o-mini`, `gpt-4o`, `o1-*`, `o3-*`
- Gemini: `gemini-2.0-flash`, etc.
- Singleton providers (không tạo client mới mỗi lần)
- `estimateCost(model, inputTokens, outputTokens)` → USD

### agent.js — BaseAgent
```
execute(task, context) → LLM call → store in Memory → report to MessageBus
```
- Token + cost tracking per agent
- Status: idle → thinking → acting → done → error

### conductor.js — Pipeline Orchestrator
```
registerAgent(agent) → registerPipeline(pipeline) → executePipeline(name, input)
```
- Sequential stage execution
- Per-stage retry logic
- Required vs optional stages
- Cost summary at end
- Output saved to `./output/{pipelineId}/`

### memory.js — Shared Memory
- Namespaced by `pipelineId` (e.g., `youtube-podcast_abc123`)
- `set(namespace, key, value)` / `get(namespace, key)` / `getAll(namespace)`
- Stages pass data via memory keys (e.g., `harvested_content` → `curated_knowledge`)

### message-bus.js — EventEmitter3
- Agents publish results to conductor
- Conductor routes messages
- Pattern: `send({ from, to, type, payload })`

---

## 7. HỆ THỐNG TRI THỨC (Knowledge System)

### loader.js — Knowledge Loading Hub
| Function | Returns | Size |
|----------|---------|------|
| `loadVoice()` | VOICE.md content | 16.2KB |
| `loadBrain()` | BRAIN.md content | 14.8KB |
| `loadBooks()` | Array of 28 books | 431.7KB |
| `searchBooks(query)` | Top 3 matching excerpts | varies |
| `getBooksByCategory(cat)` | Books in category | varies |
| `getRandomHook()` | 1 viral hook string | ~100 chars |
| `buildKnowledgeContext(topic)` | VOICE DNA + relevant BRAIN + hooks | ~15KB |

### VOICE.md (16.2KB, 235 lines, 11 sections)
Voice DNA cho kênh "Đứng Dậy Đi". Hand-crafted từ phân tích 315 transcripts:
1. Tổng quan — identity: "Triết gia bóng tối + trái tim chiến binh"
2. Công thức mở bài — 5 patterns (A-E) với transcript quotes thật
3. Cấu trúc bài — "The Dark Arc" (7 stages với timeline)
4. Công thức kết bài — Tough love → Signature outro
5. Từ vựng DNA — 60+ terms trong 5 groups (chiến tranh, tài chính, tâm lý, triết lý, quyền lực)
6. Ẩn dụ đặc trưng — 10+ metaphors nguyên văn (cơ thể, chiến tranh, thiên nhiên, đời thường)
7. Câu signature — Intro, outro, 8 câu cửa miệng
8. Nhịp văn — "The Wave" + "Triple Strike" + "Long build → Short kill"
9. Tone matrix — Percentages (80% nghiêm túc, 70% provocative, 20% hài hước)
10. Cấm kỵ — 10 anti-patterns
11. Ví dụ mẫu — Full opening/body/closing examples

### BRAIN.md (14.8KB)
Knowledge map tổng hợp từ 28 cuốn sách:
- 8 Themes: Tài chính, Đầu tư, Tâm lý, Thuyết phục, Khởi nghiệp, Quản lý, Kỷ luật, EQ
- 20 Viral Hooks (câu mở bài tiềm năng)
- 2 Mental Model Maps (liên kết giữa các chủ đề)

### books.json (431.7KB)
28 cuốn sách, 5 categories:
| Category | Số sách | Ví dụ |
|----------|---------|-------|
| Tài chính | ~8 | The Millionaire Fastlane, Rich Dad Poor Dad |
| Tâm lý | ~6 | Thinking Fast and Slow, Influence |
| Quản trị | ~5 | Good to Great, The Lean Startup |
| Deepwork | ~5 | Deep Work, Atomic Habits |
| Kỷ luật | ~4 | Discipline Equals Freedom, The Hard Thing |

---

## 8. CẤU HÌNH & API KEYS

### .env status (checked 2026-02-11)
| Key | Status | Dùng cho |
|-----|--------|----------|
| `OPENAI_API_KEY` | ✅ Configured | LLM chính (GPT-4o-mini) |
| `GOOGLE_AI_API_KEY` | ✅ Configured | Gemini 2.0 Flash (backup) |
| `ANTHROPIC_API_KEY` | ✅ Configured | Claude (backup) |
| `SUPABASE_URL` | ✅ Configured | Brain storage (planned) |
| `SUPABASE_KEY` | ✅ Configured | Supabase auth |
| `YOUTUBE_CLIENT_ID` | ✅ Configured | YouTube OAuth |
| `YOUTUBE_REFRESH_TOKEN` | ✅ Configured | YouTube upload |
| `YT_DLP_PATH` | ✅ Configured | Transcript extraction |
| `FFMPEG_PATH` | ✅ Configured | Video assembly |

### External Tools
| Tool | Path | Status |
|------|------|--------|
| yt-dlp | `C:\Users\admin\AppData\Local\Microsoft\WinGet\Links\yt-dlp.exe` | ✅ Working |
| FFmpeg | `C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\...\bin` | ✅ Installed |
| Node.js | v18+ | ✅ Working |
| Python | 3.13.9 (venv at project root) | ✅ Available |

---

## 9. DỮ LIỆU ĐÃ CÓ

### Transcript Data
| File | Size | Nội dung |
|------|------|----------|
| `data/channel-transcripts.json` | 27.4 MB | 317/426 videos từ THE HIDDEN SELF (raw Vietnamese auto-sub) |
| `data/clean-transcripts.json` | 8.1 MB | 315 videos đã clean noise + classify 7 categories |

### Phân loại Transcripts (từ clean data)
| Category | Số video | Ví dụ chủ đề |
|----------|----------|-------------|
| tai-chinh | 92 | Vàng, BĐS, chứng khoán, lạm phát |
| tam-ly | 68 | Bản chất con người, thiên kiến, FOMO |
| dia-chinh-tri | 67 | Mỹ-Trung, Ukraine, trật tự thế giới |
| phat-trien | 33 | Đọc sách, kỷ luật, mindset |
| van-hoa | 22 | Triết học, tôn giáo, xã hội |
| xa-hoi | 19 | Thời sự, xu hướng |
| kinh-doanh | 14 | Startup, e-commerce, marketing |

### Test Output
| File | Nội dung |
|------|----------|
| `data/test-script-1770819348513.json` | Script test đầu tiên (topic: giới trẻ VN nghèo) |
| `data/script-fulltext.txt` | Text đầy đủ của script test |

---

## 10. TRẠNG THÁI HIỆN TẠI (2026-02-11)

### ✅ Hoàn thành
- [x] Full multi-agent framework (conductor, agents, memory, message bus)
- [x] 7 agents đã code xong
- [x] 28 cuốn sách chuyển thành knowledge (BRAIN.md + books.json)
- [x] 317 video transcripts đã crawl (yt-dlp)
- [x] Transcripts đã clean + classify 7 categories
- [x] VOICE.md hand-crafted (11 sections, real quotes)
- [x] Script Writer system prompt aligned với "Đứng Dậy Đi"
- [x] Channel identity config tạo xong
- [x] Knowledge loader tích hợp VOICE + BRAIN + Books
- [x] Test script generation thành công (9/15 DNA terms, 12K tokens, ~$0.003)
- [x] CLI entry point (--url, --topic, --channel, --latest, --dry-run)

### 🔄 Đang làm / Cần hoàn thiện
- [ ] **TTS Integration** — Voice Producer chưa kết nối Fish Speech / ElevenLabs
- [ ] **Video Assembly thực** — Video Assembler tạo FFmpeg commands nhưng chưa exec
- [ ] **YouTube Upload tự động** — Publisher tạo metadata nhưng chưa upload
- [ ] **Crawl thêm 109 videos** còn lại (317/426)
- [ ] **Script quality tuning** — Script test hơi ngắn (~5 phút, target 10-15 phút)
- [ ] **Supabase Brain storage** — Chưa kết nối Brain API
- [ ] **Full pipeline test** — Chưa chạy `node src/index.js --topic "..."` end-to-end

### ❌ Chưa bắt đầu
- [ ] Thumbnail generation (AI image)
- [ ] Background music / sound effects
- [ ] Scheduling và auto-publish
- [ ] Analytics tracking
- [ ] Multi-language support
- [ ] CI/CD deployment

---

## 11. CÁCH CHẠY

### Prerequisites
```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\youtube-agent-crew
npm install   # Đã install, chỉ cần nếu thiếu node_modules
```

### Quick Test (chỉ Script Writer)
```bash
node test-script.js "Topic bạn muốn test"
# Mặc định: "Tại sao giới trẻ Việt Nam ngày càng nghèo hơn thế hệ trước"
# Output: data/test-script-{timestamp}.json
```

### Full Pipeline
```bash
# Từ topic
node src/index.js --topic "Tại sao Fed in tiền ảnh hưởng đến BĐS Việt Nam"

# Từ video URL
node src/index.js --url "https://youtube.com/watch?v=XXXXX"

# Output: ./output/{pipelineId}/results.json, script.json, script.txt
```

### Crawl thêm transcripts
```bash
# Resume crawl (tự động skip videos đã có)
node crawl-channel.js
# Output: data/channel-transcripts.json (append)
```

### Process transcripts
```bash
node process-transcripts.js
# Output: data/clean-transcripts.json + VOICE.md update
```

---

## 12. VẤN ĐỀ ĐÃ BIẾT

| Vấn đề | Nguyên nhân | Workaround |
|--------|-------------|------------|
| **youtubei.js transcript HTTP 400** | API thay đổi, Vietnamese auto-sub không hỗ trợ | Dùng yt-dlp làm primary |
| **youtubei.js ParsingError warnings** | Parser lỗi format mới | Non-fatal, ignore |
| **Script quá ngắn (~5 phút thay vì 10-15)** | GPT-4o-mini context limit + generation limit | Tăng maxTokens hoặc dùng GPT-4o |
| **VOICE DNA adoption ~60%** | GPT-4o-mini không follow instruction tốt bằng GPT-4o | Dùng GPT-4o cho script writing |
| **Crawler bị crash giữa chừng** | Memory / rate limit | Có resume capability, chạy lại |
| **PowerShell Unicode** | Terminal encoding | Dùng UTF-8 encoding |

---

## 13. ROADMAP

### Phase 1: Script Quality ← ĐANG Ở ĐÂY
- [ ] Upgrade Script Writer sang GPT-4o cho script dài hơn + voice adoption tốt hơn
- [ ] Test full pipeline end-to-end
- [ ] Fine-tune VOICE.md nếu cần
- [ ] Crawl nốt 109 videos

### Phase 2: Voice & Video
- [ ] Tích hợp Fish Speech / ElevenLabs TTS
- [ ] Voice cloning (nếu có sample audio)
- [ ] Visual asset pipeline (stock footage, overlays)
- [ ] FFmpeg exec automation

### Phase 3: Auto-Publish
- [ ] YouTube upload tự động via OAuth
- [ ] Thumbnail AI generation
- [ ] Scheduling (PM2 / cron)
- [ ] Community post auto-generation

### Phase 4: Scale
- [ ] Multi-channel support
- [ ] Content calendar AI
- [ ] Analytics → Content strategy feedback loop
- [ ] Admin dashboard integration (LongSang Admin)

---

## 📎 QUICK REFERENCE

### Chạy nhanh
```bash
cd d:\0.PROJECTS\00-MASTER-ADMIN\youtube-agent-crew
node test-script.js                    # Test script generation
node src/index.js --topic "..."        # Full pipeline
node crawl-channel.js                  # Crawl more transcripts
```

### Files quan trọng nhất
```
src/agents/script-writer.js    ← Agent quan trọng nhất
src/knowledge/VOICE.md         ← Voice DNA (phải đọc)
src/knowledge/loader.js        ← Knowledge injection logic
src/pipelines/youtube-podcast.js ← Pipeline definition
src/config/channel.js          ← Channel identity
src/index.js                   ← CLI entry point
SYSTEM_REFERENCE.md            ← FILE NÀY
```

### Channel info
```
Tên: ĐỨNG DẬY ĐI
Giọng: "Triết gia bóng tối với trái tim chiến binh"
Tagline: "Nơi có những sự thật mà cuộc sống đã giấu bạn..."
Sign-off: "Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."
YouTube: UCh08dvkDfJVJ8f1C-TbXbew
Reference: THE HIDDEN SELF (@thehiddenself.pocast) — style only
```
