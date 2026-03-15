# YouTube Agent Crew 🚀

**AI-Powered Podcast Video Factory** — Feed it a YouTube URL, get a full podcast episode back.

Built by LongSang Admin. Elon Musk mode: ON.

## Architecture

```
URL Input → [Harvester] → [Brain Curator] → [Script Writer] → [Voice Producer] → [Visual Director] → [Video Assembler] → [Publisher]
    ↕            ↕              ↕                ↕                  ↕                  ↕                   ↕               ↕
                              Message Bus (EventEmitter3)
                              Shared Memory (in-memory + Supabase)
                              Conductor (orchestrator)
```

### 7 Agents

| # | Agent | Role | Model |
|---|-------|------|-------|
| 1 | 🔍 Harvester | YouTube content extraction | gpt-4o-mini |
| 2 | 🧠 Brain Curator | Knowledge analysis + Brain storage | gpt-4o-mini |
| 3 | ✍️ Script Writer | Podcast script in YOUR voice | gpt-4o-mini |
| 4 | 🎙️ Voice Producer | TTS preparation + audio generation | gpt-4o-mini |
| 5 | 🎬 Visual Director | Visual storyboard + image prompts | gpt-4o-mini |
| 6 | 🎥 Video Assembler | FFmpeg video assembly | gpt-4o-mini |
| 7 | 📤 Publisher | YouTube SEO + metadata | gpt-4o-mini |

### Core Framework

- **BaseAgent** — Execute → Think → Act → Report
- **Conductor** — Pipeline orchestrator, cost tracker
- **MessageBus** — Inter-agent communication
- **SharedMemory** — Cross-agent state management
- **LLM** — Provider abstraction (OpenAI, Gemini, Anthropic)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API keys
cp .env.example .env
# Edit .env with your keys (minimum: OPENAI_API_KEY)

# 3. Run!
node src/index.js --url "https://www.youtube.com/watch?v=VIDEO_ID"
```

## Usage

```bash
# Transform a specific video into a podcast
node src/index.js --url "https://www.youtube.com/watch?v=XXX"

# Create a podcast about a topic
node src/index.js --topic "Tại sao Fed in tiền ảnh hưởng đến BĐS Việt Nam"

# Harvest latest from a channel
node src/index.js --channel "THUẬT TÀI VẬN" --latest

# Dry run (no TTS/video, just script + metadata)
node src/index.js --topic "Chu kỳ 18 năm" --dry-run
```

## Output

Each run creates a folder in `./output/` with:
- `results.json` — Full pipeline results
- `script.json` — Structured podcast script
- `script.txt` — Human-readable script
- `metadata.json` — YouTube SEO metadata
- `audio/` — Generated audio chunks (if TTS configured)
- `video/` — Final video (if FFmpeg available)

## Cost Estimate

Using gpt-4o-mini for all agents:
- **~$0.01-0.03 per video** (mostly script writing)
- TTS cost depends on provider (Fish Speech = free self-hosted)

## Configuration

### Required
- `OPENAI_API_KEY` — For all agent LLM calls

### Optional
- `GOOGLE_AI_API_KEY` — For Gemini models (cheaper alternative)
- `FISH_SPEECH_API_URL` — Self-hosted TTS
- `ELEVENLABS_API_KEY` — Cloud TTS alternative
- `ADMIN_API_URL` — LongSang Admin Brain API connection
- `SUPABASE_URL` / `SUPABASE_KEY` — For persistent memory

## Extending

### Add a new agent
```javascript
import { BaseAgent } from './core/agent.js';

class MyAgent extends BaseAgent {
  constructor() {
    super({
      id: 'my-agent',
      name: '🤖 My Agent',
      role: 'Does amazing things',
      systemPrompt: '...',
    });
  }
}
```

### Add a new pipeline
```javascript
export const myPipeline = {
  name: 'my-pipeline',
  stages: [
    {
      name: 'Stage 1',
      agentId: 'my-agent',
      outputKey: 'stage_1_output',
      task: (memory, input) => `Do something with ${input.data}`,
    },
  ],
};
```

## Tech Stack

- **Runtime**: Node.js 18+ (ES Modules)
- **LLM**: OpenAI GPT-4o-mini (primary), Google Gemini (fallback)
- **TTS**: Fish Speech (self-hosted) / ElevenLabs
- **Video**: FFmpeg (MVP) / Remotion (future)
- **Communication**: EventEmitter3 message bus
- **YouTube**: youtubei.js (unofficial API, no key needed)

## License

MIT — Ship fast, iterate faster.
