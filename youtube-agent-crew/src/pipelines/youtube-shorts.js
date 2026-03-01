/**
 * YouTube Shorts Pipeline
 * 
 * 60-second vertical videos (9:16) for YouTube Shorts monetization.
 * Faster monetization via 100M views fund + channel growth engine.
 * 
 * 5 stages (simplified from 7-stage podcast pipeline):
 *   Stage 1: Harvest → Extract TOP 1 insight/quote
 *   Stage 2: Shorts Script → 120-150 word script (hook + point + CTA)
 *   Stage 3: Voice → Short TTS (45-60s)
 *   Stage 4: Video → FFmpeg 9:16 assembly with text overlay
 *   Stage 5: Publish → Shorts-specific metadata (#shorts, <60 char title)
 */

export const youtubeShortsPipeline = {
  name: 'youtube-shorts',
  description: 'Transform a topic/insight into a 60-second YouTube Short',
  version: '1.0.0',

  stages: [
    // ─── STAGE 1: HARVEST (extract ONE insight) ────────
    {
      name: 'Harvest Insight',
      agentId: 'harvester',
      outputKey: 'harvested_insight',
      retries: 2,
      required: true,
      task: (memory, input) => {
        if (input.videoUrl) {
          return `Harvest this YouTube video for a SHORT (60-second vertical video): ${input.videoUrl}

IMPORTANT — SHORTS MODE:
Extract ONLY the TOP 1 most viral-worthy insight:
- The single most shocking statistic OR
- The most quotable contrarian statement OR
- The one "holy shit" moment viewers would share

Return as JSON:
{
  "insight": "The key insight in 1-2 sentences",
  "hook_angle": "Why this grabs attention in 3 seconds",
  "source_context": "Brief context from original content",
  "emotional_trigger": "curiosity|shock|fear|hope|anger"
}`;
        }
        if (input.topic) {
          return `Research this topic for a YouTube SHORT (60-second vertical video): ${input.topic}

IMPORTANT — SHORTS MODE:
Find ONLY the TOP 1 most viral-worthy insight:
- A shocking statistic or data point
- A contrarian take that challenges common belief
- Something that makes people stop scrolling

Return as JSON:
{
  "insight": "The key insight in 1-2 sentences",
  "hook_angle": "Why this grabs attention in 3 seconds",
  "source_context": "Brief context/evidence",
  "emotional_trigger": "curiosity|shock|fear|hope|anger"
}`;
        }
        return `Find a trending Vietnamese YouTube topic and extract the single most viral-worthy insight for a 60-second Short. Return JSON with insight, hook_angle, source_context, emotional_trigger.`;
      },
    },

    // ─── STAGE 2: SHORTS SCRIPT (120-150 words) ────────
    {
      name: 'Shorts Script',
      agentId: 'shorts-script-writer',
      outputKey: 'shorts_script',
      required: true,
      task: (memory, input) => {
        const insight = memory.harvested_insight || '{}';
        const topic = input.topic || '';
        return `Write a 60-SECOND YouTube Shorts script.

INSIGHT:
${insight}

TOPIC: ${topic}

FORMAT — STRICT STRUCTURE:
1. HOOK (0-3 seconds): One explosive sentence that stops the scroll. 
   Start with a question, shocking stat, or "Bạn có biết..." pattern.
   
2. MAIN POINT (3-50 seconds): ONE clear idea explained simply.
   - Use conversational Vietnamese ("mày/tao" energy, not textbook)
   - Include 1 concrete example or data point
   - Build tension → reveal → "aha moment"
   
3. PUNCHLINE + CTA (50-60 seconds): 
   - Land the punchline hard
   - CTA: "Follow để không bỏ lỡ" or "Comment X nếu bạn đồng ý"

CONSTRAINTS:
- Total: 120-150 words (Vietnamese)
- Every sentence must earn its place — no filler
- Format: vertical 1080x1920 (text must be readable on phone)
- Add [PAUSE], [EMPHASIS], [SPEED_UP] markers for TTS
- Include subtitle text for each sentence (viewers watch without audio)

Return as JSON:
{
  "title": "Short title (<60 chars, no #shorts — added later)",
  "hook": "First 3-second line",
  "sections": [
    { "timestamp": "0:00-0:03", "type": "hook", "text": "...", "subtitle": "..." },
    { "timestamp": "0:03-0:50", "type": "main", "text": "...", "subtitle": "..." },
    { "timestamp": "0:50-0:60", "type": "cta", "text": "...", "subtitle": "..." }
  ],
  "word_count": 135,
  "estimated_duration_seconds": 58
}`;
      },
    },

    // ─── STAGE 3: VOICE PRODUCTION (45-60s) ────────────
    {
      name: 'Shorts Voice',
      agentId: 'voice-producer',
      outputKey: 'shorts_audio',
      required: false,
      task: (memory) => {
        const script = memory.shorts_script || '';
        return `Prepare this SHORT script for TTS (45-60 seconds total audio):

${script}

SHORTS TTS REQUIREMENTS:
- Slightly faster pace than podcast (1.1x-1.2x speed feel)
- Strong emphasis on hook line (first sentence)
- Natural pauses between sections (0.3s max — keep it tight)
- Total audio MUST be under 60 seconds
- Clean text only — remove JSON formatting, keep spoken words
- Split into 2-3 chunks max (hook, main, cta)
- Each chunk under 300 characters`;
      },
    },

    // ─── STAGE 4: SHORTS VIDEO ASSEMBLY (9:16) ─────────
    {
      name: 'Shorts Video Assembly',
      agentId: 'video-assembler',
      outputKey: 'shorts_video',
      required: false,
      task: (memory) => {
        const script = memory.shorts_script || '';
        const audioData = memory.shorts_audio || '';
        return `Generate FFmpeg commands to create a YouTube Short (vertical video):

SCRIPT:
${script}

AUDIO DATA:
${audioData}

SHORTS VIDEO SPECS:
- Resolution: 1080x1920 (9:16 vertical)
- Duration: 45-60 seconds MAX
- Background: dark gradient (#0a0a0a → #1a1a2e) or solid dark with accent color
- NO background footage needed — text-focused design

TEXT OVERLAY SYSTEM:
- Large centered text (font size 64-80px, white, bold)
- Word-by-word or sentence-by-sentence highlight animation
- Active text: bright white (#FFFFFF)
- Inactive text: dim gray (#666666)
- Yellow accent (#FFD700) for key words/numbers
- Text position: center of screen (y=960 for 1920 height)
- Max 2 lines visible at once
- Text shadow for readability

SUBTITLE STYLE (TikTok-inspired):
- Bottom third subtitle bar (semi-transparent black bg)
- Current word highlighted in accent color
- Font: bold sans-serif, 48px

FFmpeg COMMANDS NEEDED:
1. Create dark gradient background video (1080x1920, 60s)
2. Add audio track
3. Overlay large centered text with timing from script sections
4. Add bottom subtitle track with word highlights
5. Add channel watermark (small, top-right corner)
6. Export: h264, aac, -movflags +faststart for web
7. Ensure total duration ≤ 60 seconds`;
      },
    },

    // ─── STAGE 5: SHORTS PUBLISHING ────────────────────
    {
      name: 'Shorts Publishing',
      agentId: 'publisher',
      outputKey: 'shorts_metadata',
      required: true,
      task: (memory) => {
        const script = memory.shorts_script || '';
        const insight = memory.harvested_insight || '';
        return `Create YouTube SHORTS publishing metadata:

SCRIPT:
${script}

ORIGINAL INSIGHT:
${insight}

SHORTS-SPECIFIC REQUIREMENTS:
- Title: MAX 60 characters, punchy, Vietnamese
  • Must work WITHOUT #Shorts in title (YouTube auto-detects vertical video)
  • Pattern: "[Shocking claim]" or "Tại sao [contrarian thing]?"
  
- Description:
  • First line: hook/question (appears in search)
  • Add #Shorts #YouTubeShorts #DungDayDi hashtags
  • 2-3 relevant Vietnamese hashtags
  • "Follow @ĐỨNG DẬY ĐI để xem thêm"
  • Keep under 200 chars total

- Tags: 8-12 tags (mix Vietnamese + English)
  • Must include: "shorts", "youtube shorts", "đứng dậy đi"
  • Topic-specific tags

- Thumbnail: Not critical for Shorts (auto-plays) but generate a concept anyway

- Cross-post hooks:
  • TikTok caption variant (different vibe, more casual)
  • Instagram Reels caption variant
  • Telegram teaser (1 line + emoji)

Return as JSON:
{
  "metadata": {
    "youtube": { "title", "description", "tags", "category": "Education" },
    "shorts_specific": { "hashtags", "first_comment" }
  },
  "cross_post": { "tiktok", "instagram_reels", "telegram" }
}`;
      },
    },
  ],
};

export default youtubeShortsPipeline;
