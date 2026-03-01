/**
 * AGENT 6: Video Assembler
 * 
 * Mission: Assemble final video from audio + visuals
 * - Combine audio chunks into full track
 * - Overlay visuals according to storyboard
 * - Add text overlays, transitions
 * - Export final MP4
 * 
 * For MVP: use FFmpeg commands
 * Future: Remotion for programmatic video
 * 
 * Input: Audio files + visual storyboard
 * Output: Final video file path
 */
import { BaseAgent } from '../core/agent.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const SYSTEM_PROMPT = `You are a Video Assembler — you create FFmpeg commands to assemble podcast videos.

## YOUR MISSION
Generate FFmpeg command(s) to assemble a podcast video from:
- Audio chunks (MP3 files in a directory)
- Visual storyboard (scenes with timestamps)
- Text overlays

## OUTPUT FORMAT (JSON)
{
  "steps": [
    {
      "step": 1,
      "description": "Concatenate audio chunks",
      "command": "ffmpeg command...",
      "outputFile": "full_audio.mp3"
    },
    {
      "step": 2, 
      "description": "Create video with black background + audio",
      "command": "ffmpeg command...",
      "outputFile": "base_video.mp4"
    },
    {
      "step": 3,
      "description": "Add text overlays",
      "command": "ffmpeg command...",
      "outputFile": "final_video.mp4"
    }
  ],
  "finalOutput": "final_video.mp4",
  "estimatedDuration": "12:30"
}

## FFmpeg PATTERNS
- Concatenate audio: ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp3
- Black bg + audio: ffmpeg -f lavfi -i color=c=black:s=1920x1080:r=30 -i audio.mp3 -shortest -pix_fmt yuv420p output.mp4
- Text overlay: drawtext=text='TEXT':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2
- Fade: fade=t=in:st=0:d=1

## RULES
- Always output 1920x1080 (Full HD)
- 30fps
- H.264 codec for maximum compatibility  
- Keep file sizes reasonable (target <500MB for 15min)
- Use -movflags +faststart for web playback
- ALWAYS output valid JSON`;

export class VideoAssemblerAgent extends BaseAgent {
  constructor() {
    super({
      id: 'video-assembler',
      name: '🎥 Video Assembler',
      role: 'Video Assembly & Post-Production',
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.2, // Low for precise commands
      maxTokens: 4096,
    });
    this.outputDir = process.env.OUTPUT_DIR || './output';
  }

  /**
   * Concatenate audio files using FFmpeg
   */
  async concatAudio(audioDir, outputPath) {
    const files = await readdir(audioDir);
    const audioFiles = files
      .filter(f => f.endsWith('.mp3'))
      .sort()
      .map(f => `file '${join(audioDir, f)}'`);

    if (audioFiles.length === 0) {
      throw new Error('No audio files found');
    }

    const listPath = join(audioDir, 'filelist.txt');
    await writeFile(listPath, audioFiles.join('\n'));

    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    this.log(`Running: ${cmd}`);
    
    try {
      await execAsync(cmd);
      this.log(`Audio concatenated: ${outputPath}`, 'success');
      return outputPath;
    } catch (error) {
      this.log(`FFmpeg concat failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Create basic video (black bg + audio + text overlays)
   */
  async createBasicVideo(audioPath, outputPath, title = '') {
    const drawtext = title
      ? `-vf "drawtext=text='${title.replace(/'/g, "\\'")}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/Windows/Fonts/arial.ttf"`
      : '';

    const cmd = `ffmpeg -y -f lavfi -i color=c=0x1a1a2e:s=1920x1080:r=30 -i "${audioPath}" ${drawtext} -shortest -pix_fmt yuv420p -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;

    this.log('Creating video...');
    try {
      await execAsync(cmd, { timeout: 600000 }); // 10 min timeout
      this.log(`Video created: ${outputPath}`, 'success');
      return outputPath;
    } catch (error) {
      this.log(`FFmpeg video failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Override execute to actually run video assembly
   */
  async execute(task, context = {}) {
    const pipelineId = context.pipelineId || 'standalone';
    const { memory } = await import('../core/memory.js');
    
    // Check if we have audio to work with
    const audioDir = memory.get(pipelineId, 'audio_dir');
    const audioPaths = memory.get(pipelineId, 'audio_paths') || [];

    if (audioPaths.length > 0 && audioDir) {
      // We have real audio — assemble video
      const videoDir = join(this.outputDir, pipelineId, 'video');
      await mkdir(videoDir, { recursive: true });

      try {
        // Step 1: Concat audio
        const fullAudioPath = join(videoDir, 'full_audio.mp3');
        await this.concatAudio(audioDir, fullAudioPath);

        // Step 2: Create video
        const scriptData = memory.get(pipelineId, 'script-writer_output');
        let title = '';
        try {
          const script = JSON.parse(scriptData);
          title = script.title || '';
        } catch { /* no title */ }

        const videoPath = join(videoDir, 'final_video.mp4');
        await this.createBasicVideo(fullAudioPath, videoPath, title);

        memory.set(pipelineId, 'video_path', videoPath);
        return JSON.stringify({ videoPath, audioPath: fullAudioPath });

      } catch (error) {
        this.log('Video assembly failed, generating FFmpeg plan instead', 'warn');
        // Fall through to LLM-generated plan
      }
    }

    // No audio available or assembly failed — generate FFmpeg commands via LLM
    return super.execute(task, { ...context, responseFormat: 'json' });
  }
}

export default VideoAssemblerAgent;
