/**
 * AGENT 1: Harvester
 * 
 * Mission: Extract content from YouTube videos
 * - Fetch video metadata (title, description, tags)
 * - Extract transcript/captions
 * - Identify key topics, timestamps, quotes
 * 
 * Input: YouTube video URL or channel URL
 * Output: Structured content package { metadata, transcript, keyPoints }
 */
import { BaseAgent } from '../core/agent.js';
import { Innertube } from 'youtubei.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const SYSTEM_PROMPT = `You are a Content Harvester — an expert researcher who extracts maximum value from YouTube content.

## YOUR MISSION
Analyze video transcripts and extract structured intelligence:
1. Core thesis/argument of the video
2. Key data points, statistics, predictions
3. Notable quotes and soundbites
4. Underlying frameworks or mental models
5. Actionable insights for the audience

## OUTPUT FORMAT (JSON)
{
  "title": "Original video title",
  "coreTopic": "One sentence summary",
  "keyPoints": ["point 1", "point 2", ...],
  "dataPoints": ["stat/number 1", ...],
  "quotableLines": ["quote 1", ...],
  "frameworks": ["mental model or framework mentioned"],
  "sentiment": "bullish/bearish/neutral",
  "targetAudience": "who this content is for",
  "contentAngle": "unique angle or perspective"
}

## RULES
- Extract FACTS, not opinions
- Preserve specific numbers, dates, predictions
- Identify the emotional hook of the content
- Note any controversial or clickbait claims
- Rate content quality: S/A/B/C/D
- ALWAYS output valid JSON`;

export class HarvesterAgent extends BaseAgent {
  constructor() {
    super({
      id: 'harvester',
      name: '🔍 Harvester',
      role: 'Content Extraction & Research',
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.3, // Low temp for accurate extraction
      maxTokens: 4096,
    });
    this.yt = null;
  }

  async initYouTube() {
    if (!this.yt) {
      this.yt = await Innertube.create({ lang: 'vi', location: 'VN' });
    }
    return this.yt;
  }

  /**
   * Fetch video info + transcript from YouTube
   * Strategy: youtubei.js transcript → yt-dlp auto-subs fallback
   */
  async fetchVideo(videoId) {
    const yt = await this.initYouTube();
    
    try {
      const info = await yt.getInfo(videoId);
      const basicInfo = info.basic_info;

      let transcript = '';
      
      // Strategy 1: youtubei.js native transcript
      try {
        const transcriptData = await info.getTranscript();
        const segments = transcriptData?.transcript?.content?.body?.initial_segments || [];
        transcript = segments
          .map(s => s.snippet?.text || '')
          .filter(Boolean)
          .join(' ');
        if (transcript) this.log(`Transcript via youtubei.js: ${transcript.length} chars`);
      } catch {
        this.log('youtubei.js transcript failed, trying yt-dlp fallback...', 'warn');
      }

      // Strategy 2: yt-dlp auto-generated subtitles (especially for Vietnamese)
      if (!transcript) {
        try {
          const ytdlpResult = await this.fetchTranscriptYtDlp(videoId);
          transcript = ytdlpResult.text;
          if (transcript) this.log(`Transcript via yt-dlp: ${transcript.length} chars, lang: ${ytdlpResult.lang}`);
        } catch (e) {
          this.log(`yt-dlp fallback also failed: ${e.message}`, 'warn');
        }
      }

      if (!transcript) {
        this.log('No transcript available from any source, will work with metadata only', 'warn');
      }

      return {
        videoId,
        title: basicInfo.title,
        description: basicInfo.short_description,
        duration: basicInfo.duration,
        viewCount: basicInfo.view_count,
        channel: basicInfo.channel?.name || basicInfo.author,
        publishDate: basicInfo.publish_date,
        transcript,
        transcriptSource: transcript ? 'yt-dlp' : 'none',
      };
    } catch (error) {
      this.log(`Failed to fetch video ${videoId}: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Extract transcript using yt-dlp (handles auto-generated subs for Vietnamese etc.)
   * Tries: vi-orig → vi → en → first available language
   */
  async fetchTranscriptYtDlp(videoId, preferredLangs = ['vi-orig', 'vi', 'en']) {
    const ytdlpPath = process.env.YT_DLP_PATH || 'yt-dlp';
    const tmpDir = join(__dirname, '../../.tmp');
    const tmpFile = join(tmpDir, `${videoId}`);
    
    try {
      await mkdir(tmpDir, { recursive: true });

      // Try each preferred language
      for (const lang of preferredLangs) {
        try {
          await execFileAsync(ytdlpPath, [
            '--write-auto-sub',
            '--sub-lang', lang,
            '--sub-format', 'json3',
            '--skip-download',
            '--no-update',
            '-o', tmpFile,
            `https://www.youtube.com/watch?v=${videoId}`
          ], { timeout: 60000 });

          const subFile = `${tmpFile}.${lang}.json3`;
          const data = JSON.parse(await readFile(subFile, 'utf-8'));
          const result = this.parseJson3Transcript(data);
          
          // Cleanup
          try { await unlink(subFile); } catch {}
          
          if (result.text.length > 50) {
            return { ...result, lang };
          }
        } catch {
          // Try next language
          continue;
        }
      }

      // Last resort: try --write-auto-sub without specifying language
      try {
        await execFileAsync(ytdlpPath, [
          '--write-auto-sub',
          '--sub-format', 'json3',
          '--skip-download',
          '--no-update',
          '-o', tmpFile,
          `https://www.youtube.com/watch?v=${videoId}`
        ], { timeout: 60000 });

        // Find whatever subtitle file was created
        const { readdir } = await import('fs/promises');
        const files = await readdir(tmpDir);
        const subFile = files.find(f => f.startsWith(videoId) && f.endsWith('.json3'));
        
        if (subFile) {
          const data = JSON.parse(await readFile(join(tmpDir, subFile), 'utf-8'));
          const result = this.parseJson3Transcript(data);
          const lang = subFile.replace(`${videoId}.`, '').replace('.json3', '');
          try { await unlink(join(tmpDir, subFile)); } catch {}
          return { ...result, lang };
        }
      } catch {}

      throw new Error('No subtitles found via yt-dlp');
    } catch (error) {
      // Cleanup tmp files on error
      try {
        const { readdir } = await import('fs/promises');
        const files = await readdir(tmpDir);
        for (const f of files.filter(f => f.startsWith(videoId))) {
          try { await unlink(join(tmpDir, f)); } catch {}
        }
      } catch {}
      throw error;
    }
  }

  /**
   * Parse YouTube json3 subtitle format into clean text with timestamps
   */
  parseJson3Transcript(json3Data) {
    const events = (json3Data.events || []).filter(e => e.segs && e.segs.length > 0);
    
    const segments = [];
    let fullText = '';

    for (const event of events) {
      const text = (event.segs || [])
        .map(s => s.utf8 || '')
        .join('')
        .replace(/\n/g, ' ')
        .trim();
      
      if (!text) continue;

      const startSec = (event.tStartMs || 0) / 1000;
      segments.push({
        start: startSec,
        text,
        timestamp: this.formatTimestamp(startSec),
      });
      fullText += text + ' ';
    }

    // Deduplicate overlapping segments and clean whitespace
    const cleanText = fullText
      .replace(/\s+/g, ' ')
      .trim();

    return { text: cleanText, segments, charCount: cleanText.length };
  }

  formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Search channel for recent videos
   */
  async searchChannel(channelQuery, maxResults = 5) {
    const yt = await this.initYouTube();
    const results = await yt.search(channelQuery, { type: 'video' });
    
    return (results.results || []).slice(0, maxResults).map(v => ({
      videoId: v.id,
      title: v.title?.text || v.title,
      duration: v.duration?.text,
      viewCount: v.view_count?.text || v.short_view_count?.text,
      publishedTime: v.published?.text,
    }));
  }

  /**
   * Override execute: fetch video first, then analyze with LLM
   */
  async execute(task, context = {}) {
    // If task contains a video ID, fetch it first
    const videoIdMatch = task.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      this.log(`Fetching video: ${videoId}`);
      
      const videoData = await this.fetchVideo(videoId);
      
      if (videoData.transcript) {
        const enrichedTask = `Analyze this YouTube video and extract key content:

TITLE: ${videoData.title}
CHANNEL: ${videoData.channel}
VIEWS: ${videoData.viewCount}
DESCRIPTION: ${videoData.description?.substring(0, 500)}

TRANSCRIPT:
${videoData.transcript.substring(0, 12000)}

${task}`;
        
        // Store raw video data in memory
        const { memory } = await import('../core/memory.js');
        memory.set(context.pipelineId || 'standalone', 'raw_video_data', videoData);
        
        return super.execute(enrichedTask, { ...context, responseFormat: 'json' });
      }
    }

    // Fallback: just analyze whatever text was provided
    return super.execute(task, context);
  }
}

export default HarvesterAgent;
