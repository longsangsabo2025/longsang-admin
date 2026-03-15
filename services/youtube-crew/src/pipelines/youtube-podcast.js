/**
 * YouTube Podcast Pipeline
 * 
 * The FULL pipeline: URL in → Video out
 * 
 * Stage 1: Harvest → Extract content from YouTube
 * Stage 2: Curate → Analyze + store in Brain
 * Stage 3: Write → Create podcast script in YOUR voice
 * Stage 4: Voice → Convert script to audio (TTS)
 * Stage 5: Visuals → Design visual storyboard
 * Stage 6: Assemble → Create final video
 * Stage 7: Publish → SEO metadata + upload plan
 */

export const youtubePodcastPipeline = {
  name: 'youtube-podcast',
  description: 'Transform a YouTube video into a podcast-style video with YOUR voice',
  version: '1.0.0',

  stages: [
    // ─── STAGE 1: HARVEST ─────────────────────────
    {
      name: 'Harvest Content',
      agentId: 'harvester',
      outputKey: 'harvested_content',
      retries: 2,
      required: true,
      task: (memory, input) => {
        if (input.videoUrl) {
          return `Harvest and analyze this YouTube video: ${input.videoUrl}
          
Focus on extracting:
- Key financial/investment insights
- Specific data points and predictions
- Quotable lines for a podcast
- The core argument or thesis`;
        }
        if (input.topic) {
          return `Research and analyze content about: ${input.topic}
          
Create a comprehensive content brief with:
- Key points to cover
- Data points to include
- Contrarian angles
- Hook ideas`;
        }
        return 'Search for the latest trending finance/investment video in Vietnamese YouTube and analyze it.';
      },
    },

    // ─── STAGE 2: BRAIN CURATION ──────────────────
    {
      name: 'Brain Curation',
      agentId: 'brain-curator',
      outputKey: 'curated_knowledge',
      required: true,
      task: (memory) => {
        const harvested = memory.harvested_content || '{}';
        return `Analyze and curate this harvested content for podcast potential:

${harvested}

Evaluate:
1. Which ideas are worth making a podcast about?
2. What's the unique angle we can take?
3. How does this connect to broader financial trends?
4. What would make our audience say "WOW I didn't know that"?`;
      },
    },

    // ─── STAGE 3: SCRIPT WRITING ──────────────────
    {
      name: 'Script Writing',
      agentId: 'script-writer',
      outputKey: 'podcast_script',
      required: true,
      task: (memory) => {
        const curated = memory.curated_knowledge || '{}';
        const harvested = memory.harvested_content || '{}';
        return `Write a complete podcast script based on this curated knowledge:

CURATED ANALYSIS:
${curated}

ORIGINAL CONTENT:
${harvested}

REQUIREMENTS:
- 10-15 minute podcast episode
- Vietnamese language, conversational tone
- Include strong hook, 3-5 key points, contrarian twist, clear CTA
- Add voice direction markers [PAUSE], [EMPHASIS], etc.
- Include timestamps for each section
- Write EVERY WORD the host will say — no placeholders`;
      },
    },

    // ─── STAGE 4: VOICE PRODUCTION ────────────────
    {
      name: 'Voice Production',
      agentId: 'voice-producer',
      outputKey: 'audio_data',
      required: false, // Can work without TTS (generates plan)
      parallel: true, // Run alongside Visual Direction
      task: (memory) => {
        const script = memory.podcast_script || '';
        return `Prepare this podcast script for TTS conversion:

${script}

Split into optimal chunks for Text-to-Speech:
- Clean text (remove markers, keep natural flow)
- Add appropriate pauses between sections
- Mark emphasis and speed variations
- Keep each chunk under 500 characters`;
      },
    },

    // ─── STAGE 5: VISUAL DIRECTION ────────────────
    {
      name: 'Visual Direction',
      agentId: 'visual-director',
      outputKey: 'visual_storyboard',
      required: false,
      parallel: true, // Run alongside Voice Production
      task: (memory) => {
        const script = memory.podcast_script || '';
        return `Create a visual storyboard for this podcast video:

PODCAST SCRIPT:
${script}

Design visuals for every 10-20 second segment:
- Stock footage search keywords
- Text overlays (max 6 words each)
- Chart/graph descriptions
- Transition types
- Thumbnail concept
- Color palette (dark theme, gold accents for finance)`;
      },
    },

    // ─── STAGE 6: VIDEO ASSEMBLY ──────────────────
    {
      name: 'Video Assembly',
      agentId: 'video-assembler',
      outputKey: 'video_data',
      required: false,
      task: (memory) => {
        const storyboard = memory.visual_storyboard || '';
        const audioData = memory.audio_data || '';
        return `Generate FFmpeg commands to assemble the final podcast video:

VISUAL STORYBOARD:
${storyboard}

AUDIO DATA:
${audioData}

Create step-by-step FFmpeg commands for:
1. Concatenate audio chunks into full track
2. Create base video (1920x1080, dark background)
3. Add text overlays at correct timestamps
4. Final export with h264 + aac`;
      },
    },

    // ─── STAGE 7: PUBLISH ─────────────────────────
    {
      name: 'Publishing',
      agentId: 'publisher',
      outputKey: 'publish_metadata',
      required: true,
      task: (memory) => {
        const script = memory.podcast_script || '';
        const harvested = memory.harvested_content || '';
        return `Create complete YouTube publishing metadata:

PODCAST SCRIPT:
${script}

ORIGINAL SOURCE:
${harvested}

Generate:
- SEO-optimized Vietnamese title (max 60 chars)
- Full description with timestamps
- 15-25 tags (Vietnamese + English mix)
- Thumbnail concept with text overlay
- Community post teaser
- Social media hook variants`;
      },
    },
  ],
};

export default youtubePodcastPipeline;
