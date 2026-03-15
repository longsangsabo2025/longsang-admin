/**
 * AGENT 7: Publisher
 * 
 * Mission: Upload video + optimize metadata for YouTube
 * - Generate SEO-optimized title, description, tags
 * - Upload video via YouTube Data API v3
 * - Set custom thumbnail
 * - Create community post draft
 * 
 * Input: Video file + script metadata
 * Output: Upload result + SEO metadata
 */
import { BaseAgent } from '../core/agent.js';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { uploadVideo, checkCredentials } from '../utils/youtube-uploader.js';

const SYSTEM_PROMPT = `You are a YouTube Publisher — a viral content optimization machine.

## YOUR MISSION
Create the complete YouTube metadata package that maximizes:
1. Click-through rate (CTR) — thumbnail + title
2. Watch time — description timestamps, value promise
3. Discovery — tags, SEO, end screens
4. Engagement — community post, comment prompt

## YOUTUBE PSYCHOLOGY
- Title formula: [Number/Hook] + [Topic] + [Benefit/Fear]
  - "3 Lý Do Tại Sao Bạn Sẽ Nghèo Đi Trong 2026"
  - "Chu Kỳ 18 Năm: Điều Không Ai Nói Cho Bạn Về BĐS"
- Description: First 2 lines are VISIBLE in search — make them count
- Tags: Mix broad + specific, Vietnamese + English

## MARKETING PSYCHOLOGY (from Marketing Skills)
- Social Proof: "10,000+ người đã xem"
- Scarcity: "Video này sẽ bị xóa sau 7 ngày" (use sparingly)
- Authority: Reference sources, data, experts
- Curiosity Gap: Promise knowledge, withhold in title
- Loss Aversion: "Đừng để mất tiền vì không biết điều này"

## OUTPUT FORMAT (JSON)
{
  "youtube": {
    "title": "Vietnamese title (max 60 chars, include hook)",
    "description": "Full description with timestamps",
    "tags": ["tag1", "tag2", ...],
    "category": "Education",
    "language": "vi",
    "defaultLanguage": "vi", 
    "privacy": "private",
    "madeForKids": false,
    "scheduledTime": null,
    "thumbnailText": "Max 5 words Vietnamese for thumbnail"
  },
  "seo": {
    "primaryKeyword": "main keyword",
    "secondaryKeywords": ["kw1", "kw2"],
    "searchVolumePotential": "high/medium/low",
    "competitionLevel": "high/medium/low"
  },
  "social": {
    "communityPost": "Vietnamese community post text",
    "twitterPost": "Short teaser for X/Twitter",
    "hookVariants": ["Hook A", "Hook B", "Hook C"]
  },
  "analytics": {
    "estimatedCTR": "4-6%",
    "targetAudience": "Vietnamese 25-45",
    "contentCategory": "Education"
  }
}

## RULES
- Title MUST be in Vietnamese
- Description MUST include timestamps from script
- Include 15-25 tags (Vietnamese + English mix)
- Add relevant hashtags (#đầutư #tàichính #2026)
- Community post should create FOMO or curiosity
- privacy MUST default to "private" (safe — publish manually)
- ALWAYS output valid JSON`;

export class PublisherAgent extends BaseAgent {
  constructor() {
    super({
      id: 'publisher',
      name: '📤 Publisher',
      role: 'YouTube SEO & Publishing Strategy',
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 4096,
    });
  }

  /**
   * Main execute — generate metadata + optionally auto-upload via youtube-uploader
   */
  async execute(task, context = {}) {
    const pipelineId = context.pipelineId || `standalone_${Date.now()}`;
    const { memory } = await import('../core/memory.js');

    const videoPath = memory.get(pipelineId, 'video_path');
    const videoDir = memory.get(pipelineId, 'video_dir');
    const thumbnailPath = videoDir ? join(videoDir, 'thumbnail.png') : null;

    // Step 1: Generate SEO metadata via LLM
    this.log('🏷️ Generating SEO metadata...', 'info');
    const metadataStr = await super.execute(task, context);

    let metadata;
    try {
      const jsonMatch = metadataStr.match(/\{[\s\S]*\}/);
      metadata = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(metadataStr);
    } catch {
      this.log('🏷️ Could not parse metadata JSON, using defaults', 'warn');
      metadata = { youtube: { title: 'Untitled', description: '', tags: [], privacy: 'private' } };
    }

    const ytMeta = metadata.youtube || {};
    this.log(`🏷️ Title: ${ytMeta.title}`, 'info');
    this.log(`🏷️ Tags: ${(ytMeta.tags || []).length} | Privacy: ${ytMeta.privacy || 'private'}`, 'info');

    // Save metadata locally
    if (videoDir) {
      await writeFile(join(videoDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
      this.log(`🏷️ Metadata saved to ${videoDir}/metadata.json`, 'info');
    }

    // Step 2: Auto-upload to YouTube if credentials are configured
    let uploadResult = null;
    const creds = checkCredentials();

    if (videoPath && existsSync(videoPath) && creds.ready) {
      this.log('📤 YouTube credentials found — starting auto-upload...', 'info');
      try {
        uploadResult = await uploadVideo({
          videoPath,
          title: ytMeta.title || 'Untitled',
          description: ytMeta.description || '',
          tags: ytMeta.tags || [],
          thumbnailPath: thumbnailPath && existsSync(thumbnailPath) ? thumbnailPath : undefined,
          category: ytMeta.category || 'Education',
          privacy: ytMeta.privacy || 'private',
          madeForKids: ytMeta.madeForKids || false,
          scheduledTime: ytMeta.scheduledTime || null,
          log: (msg, level) => this.log(`📤 ${msg}`, level || 'info'),
          onProgress: ({ percent }) => {
            if (percent % 25 === 0) this.log(`📤 Upload: ${percent}%`, 'info');
          },
        });
      } catch (error) {
        this.log(`📤 Upload failed: ${error.message}`, 'error');
        uploadResult = { error: error.message, skipped: true };
      }
    } else {
      const reason = !videoPath
        ? 'no_video'
        : !existsSync(videoPath)
          ? 'video_missing'
          : `missing_credentials: ${creds.missing.join(', ')}`;
      this.log(`📤 YouTube upload skipped: ${reason}`, 'info');
      uploadResult = { skipped: true, reason };
    }

    // Store in memory
    if (uploadResult?.videoId) {
      memory.set(pipelineId, 'youtube_video_id', uploadResult.videoId);
      memory.set(pipelineId, 'youtube_url', uploadResult.videoUrl);
    }
    memory.set(pipelineId, 'thumbnail_text', ytMeta.thumbnailText || null);

    return JSON.stringify({ metadata, upload: uploadResult });
  }
}

export default PublisherAgent;
