/**
 * 🕷️ TIKTOK CHANNEL TRANSCRIPT CRAWLER
 * 
 * Crawls TikTok channel videos, extracts subtitles (VTT),
 * falls back to Whisper for videos without captions.
 * 
 * Usage: node crawl-tiktok.js --channel @handle [--max N] [--lang vie-VN] [--output file.json] [--resume] [--sort-by-views] [--whisper-fallback]
 * 
 * Output: ./data/<output>.json (incremental, crash-safe)
 */
import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir, unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

// ================== CONFIG ==================
function getArg(name) {
  const eqForm = process.argv.find(a => a.startsWith(`--${name}=`));
  if (eqForm) return eqForm.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(`--${name}`);
  if (idx > -1 && idx + 1 < process.argv.length && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1];
  }
  return null;
}

const CHANNEL = getArg('channel') || '@akbimatluatngam';
const MAX_VIDEOS = getArg('max') ? parseInt(getArg('max')) : 9999;
const SORT_BY_VIEWS = process.argv.includes('--sort-by-views');
const RESUME = process.argv.includes('--resume');
const WHISPER_FALLBACK = process.argv.includes('--whisper-fallback');
const YT_DLP = process.env.YT_DLP_PATH || 'yt-dlp';
const DATA_DIR = join(__dirname, '..', 'data');
const SUB_LANGS = getArg('lang') || 'vie-VN,eng-US';

const outputArg = getArg('output');
const OUTPUT_FILE = outputArg
  ? join(DATA_DIR, outputArg)
  : join(DATA_DIR, 'tiktok-transcripts.json');

const TMP_DIR = join(__dirname, '..', '.tmp', 'tiktok');
const DELAY_MS = 3000; // TikTok needs more delay than YouTube
const WHISPER_MODEL = getArg('whisper-model') || 'base';

// ================== HELPERS ==================
function log(msg, level = 'info') {
  const icons = { info: '📋', success: '✅', warn: '⚠️', error: '❌', progress: '🔄' };
  const ts = new Date().toLocaleTimeString('vi-VN');
  console.log(`${icons[level] || '•'} [${ts}] ${msg}`);
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s}s`;
}

async function saveData(data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function loadExistingData() {
  try {
    if (existsSync(OUTPUT_FILE)) {
      return JSON.parse(await readFile(OUTPUT_FILE, 'utf-8'));
    }
  } catch {}
  return { channel: CHANNEL, platform: 'tiktok', crawledAt: null, videos: [] };
}

// ================== STEP 1: List all videos (flat-playlist) ==================
async function listChannelVideos(channelHandle) {
  log(`Fetching video list from TikTok ${channelHandle}...`, 'progress');

  const channelUrl = channelHandle.startsWith('http')
    ? channelHandle
    : `https://www.tiktok.com/${channelHandle}`;

  try {
    const { stdout } = await execFileAsync(YT_DLP, [
      '--flat-playlist',
      '--print', '%(id)s\t%(view_count)s\t%(duration)s\t%(upload_date)s',
      '--no-update',
      channelUrl
    ], { timeout: 180000, maxBuffer: 10 * 1024 * 1024 });

    const videos = stdout.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [id, views, duration, uploadDate] = line.split('\t');
        return {
          videoId: id?.trim(),
          viewCount: parseInt(views) || 0,
          duration: parseInt(duration) || 0,
          uploadDate: uploadDate?.trim() || null,
        };
      })
      .filter(v => v.videoId && v.videoId.length > 5);

    log(`Found ${videos.length} videos on TikTok channel`, 'success');
    return videos;
  } catch (error) {
    log(`Failed to list videos: ${error.message}`, 'error');
    throw error;
  }
}

// ================== STEP 2: Get full metadata for a video ==================
async function getVideoMetadata(videoId) {
  const url = `https://www.tiktok.com/@_/video/${videoId}`;
  try {
    const { stdout } = await execFileAsync(YT_DLP, [
      '--skip-download',
      '--dump-json',
      '--no-update',
      url
    ], { timeout: 60000, maxBuffer: 5 * 1024 * 1024 });

    const d = JSON.parse(stdout);
    return {
      title: d.description || d.title || `TikTok #${videoId}`,
      description: d.description || '',
      uploader: d.uploader || d.creator || '',
      likeCount: d.like_count || 0,
      commentCount: d.comment_count || 0,
      shareCount: d.repost_count || 0,
      viewCount: d.view_count || 0,
      duration: d.duration || 0,
      uploadDate: d.upload_date || null,
    };
  } catch (error) {
    log(`  Metadata error: ${error.message.substring(0, 80)}`, 'warn');
    return null;
  }
}

// ================== STEP 3: Extract subtitles (VTT) ==================
async function extractSubtitles(videoId) {
  await mkdir(TMP_DIR, { recursive: true });
  const tmpFile = join(TMP_DIR, videoId);
  const url = `https://www.tiktok.com/@_/video/${videoId}`;

  const langs = SUB_LANGS.split(',').map(l => l.trim());

  try {
    await execFileAsync(YT_DLP, [
      '--write-subs',
      '--write-auto-subs',
      '--sub-lang', langs.join(','),
      '--sub-format', 'vtt',
      '--skip-download',
      '--no-update',
      '-o', tmpFile,
      url
    ], { timeout: 60000 });

    // Check which subtitle files were created
    for (const lang of langs) {
      const subFile = `${tmpFile}.${lang}.vtt`;
      if (existsSync(subFile)) {
        const vttContent = await readFile(subFile, 'utf-8');
        const result = parseVTT(vttContent);
        
        // Cleanup
        try { await unlink(subFile); } catch {}

        if (result.text.length > 30) {
          return { ...result, lang, source: 'tiktok-subs' };
        }
      }
    }
  } catch {
    // Subtitles not available, that's okay
  }

  // Cleanup any leftover files
  await cleanupTmpFiles(videoId);
  return null;
}

function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const segments = [];
  let currentStart = 0;
  let fullText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Match timestamp line: 00:00:00.120 --> 00:00:04.720
    const tsMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (tsMatch) {
      currentStart = parseTimestamp(tsMatch[1]);
      continue;
    }

    // Skip WEBVTT header, empty lines, NOTE lines
    if (line === 'WEBVTT' || line === '' || line.startsWith('NOTE') || /^\d+$/.test(line)) {
      continue;
    }

    // This is a text line — strip any VTT formatting tags
    const cleanLine = line.replace(/<[^>]+>/g, '').trim();
    if (cleanLine) {
      segments.push({ start: currentStart, text: cleanLine });
      fullText += cleanLine + ' ';
    }
  }

  // Deduplicate consecutive identical text (TikTok VTT often repeats)
  const deduped = [];
  let lastText = '';
  for (const seg of segments) {
    if (seg.text !== lastText) {
      deduped.push(seg);
      lastText = seg.text;
    }
  }

  const cleanText = fullText.replace(/\s+/g, ' ').trim();
  // Further dedup: TikTok VTT has lots of repeated phrases
  const dedupedText = deduplicateText(cleanText);
  
  return { text: dedupedText, segments: deduped, charCount: dedupedText.length };
}

function parseTimestamp(ts) {
  const [h, m, s] = ts.split(':');
  return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
}

function deduplicateText(text) {
  // TikTok VTT often has overlapping subtitle lines that repeat words
  // Simple approach: split into sentences and deduplicate
  const words = text.split(' ');
  const result = [];
  let i = 0;
  
  while (i < words.length) {
    result.push(words[i]);
    
    // Check if next few words are a repeat of recent words (sliding window)
    // Skip if we find a repeated segment
    if (i + 3 < words.length) {
      let isRepeat = false;
      for (let windowSize = 3; windowSize <= Math.min(8, result.length); windowSize++) {
        const recent = result.slice(-windowSize).join(' ').toLowerCase();
        const upcoming = words.slice(i + 1, i + 1 + windowSize).join(' ').toLowerCase();
        if (recent === upcoming && windowSize >= 3) {
          i += windowSize; // Skip the repeated segment
          isRepeat = true;
          break;
        }
      }
      if (!isRepeat) i++;
    } else {
      i++;
    }
  }

  return result.join(' ');
}

// ================== STEP 4: Whisper fallback ==================
async function whisperTranscribe(videoId) {
  if (!WHISPER_FALLBACK) return null;

  await mkdir(TMP_DIR, { recursive: true });
  const audioFile = join(TMP_DIR, `${videoId}.mp3`);
  const url = `https://www.tiktok.com/@_/video/${videoId}`;

  try {
    // Download audio only
    log(`    🎤 Downloading audio for Whisper...`, 'info');
    await execFileAsync(YT_DLP, [
      '-x', '--audio-format', 'mp3',
      '--audio-quality', '5', // Lower quality is fine for speech
      '--no-update',
      '-o', audioFile,
      url
    ], { timeout: 120000 });

    if (!existsSync(audioFile)) {
      log(`    Audio download failed`, 'warn');
      return null;
    }

    // Run Whisper
    log(`    🎤 Running Whisper (model: ${WHISPER_MODEL})...`, 'info');
    const { stdout } = await execAsync(
      `whisper "${audioFile}" --model ${WHISPER_MODEL} --language vi --output_format txt --output_dir "${TMP_DIR}"`,
      { timeout: 300000 } // 5 min timeout for Whisper
    );

    const txtFile = join(TMP_DIR, `${videoId}.txt`);
    if (existsSync(txtFile)) {
      const text = (await readFile(txtFile, 'utf-8')).trim();
      
      // Cleanup
      try { await unlink(audioFile); } catch {}
      try { await unlink(txtFile); } catch {}

      if (text.length > 30) {
        return {
          text,
          segments: [],
          charCount: text.length,
          lang: 'vi-whisper',
          source: 'whisper-' + WHISPER_MODEL,
        };
      }
    }
  } catch (error) {
    log(`    Whisper error: ${error.message.substring(0, 80)}`, 'warn');
  }

  // Cleanup
  try { await unlink(audioFile); } catch {}
  return null;
}

// ================== CLEANUP ==================
async function cleanupTmpFiles(videoId) {
  try {
    const files = await readdir(TMP_DIR);
    for (const f of files.filter(f => f.startsWith(videoId))) {
      try { await unlink(join(TMP_DIR, f)); } catch {}
    }
  } catch {}
}

// ================== MAIN CRAWLER ==================
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  🕷️  TIKTOK CHANNEL TRANSCRIPT CRAWLER');
  console.log('  Channel: ' + CHANNEL);
  console.log('  Max videos: ' + MAX_VIDEOS);
  console.log('  Sub languages: ' + SUB_LANGS);
  console.log('  Sort by views: ' + SORT_BY_VIEWS);
  console.log('  Whisper fallback: ' + WHISPER_FALLBACK);
  console.log('  Resume mode: ' + RESUME);
  console.log('  Output: ' + OUTPUT_FILE);
  console.log('='.repeat(60) + '\n');

  // Load existing data if resuming
  let data = RESUME ? await loadExistingData() : { channel: CHANNEL, platform: 'tiktok', crawledAt: null, videos: [] };
  const alreadyCrawled = new Set(data.videos.map(v => v.videoId));

  if (RESUME && alreadyCrawled.size > 0) {
    log(`Resuming — ${alreadyCrawled.size} videos already crawled`, 'info');
  }

  // Step 1: List all videos
  const allVideos = await listChannelVideos(CHANNEL);

  // Sort by views if requested
  if (SORT_BY_VIEWS) {
    allVideos.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    if (allVideos.length > 0) {
      log(`Sorted by views — top: ${(allVideos[0]?.viewCount || 0).toLocaleString()} views`, 'info');
    }
  }

  const videosToProcess = allVideos
    .filter(v => !alreadyCrawled.has(v.videoId))
    .slice(0, MAX_VIDEOS - data.videos.length);

  if (videosToProcess.length === 0) {
    log('All videos already crawled! Nothing to do.', 'success');
    return;
  }

  log(`Will crawl ${videosToProcess.length} videos (${alreadyCrawled.size} already done)`, 'info');

  // Step 2: Crawl each video
  let successCount = 0;
  let whisperCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < videosToProcess.length; i++) {
    const video = videosToProcess[i];
    const totalIdx = i + 1 + alreadyCrawled.size;
    const totalCount = Math.min(allVideos.length, MAX_VIDEOS);
    const progress = `[${totalIdx}/${totalCount}]`;

    log(`${progress} ID: ${video.videoId} (${(video.viewCount || 0).toLocaleString()} views, ${formatDuration(video.duration)})`, 'progress');

    try {
      // Get metadata (title/description)
      const meta = await getVideoMetadata(video.videoId);
      const title = meta?.title || `TikTok #${video.videoId}`;

      // Try subtitles first
      let transcript = await extractSubtitles(video.videoId);

      // Whisper fallback
      if (!transcript && WHISPER_FALLBACK) {
        transcript = await whisperTranscribe(video.videoId);
        if (transcript) whisperCount++;
      }

      const entry = {
        videoId: video.videoId,
        title: title.substring(0, 300),
        description: meta?.description || '',
        duration: meta?.duration || video.duration,
        durationFormatted: formatDuration(meta?.duration || video.duration),
        viewCount: meta?.viewCount || video.viewCount,
        likeCount: meta?.likeCount || 0,
        commentCount: meta?.commentCount || 0,
        uploadDate: meta?.uploadDate || video.uploadDate,
        hasTranscript: !!transcript,
        transcriptLang: transcript?.lang || null,
        transcriptSource: transcript?.source || null,
        transcriptChars: transcript?.charCount || 0,
        transcript: transcript?.text || '',
        segments: transcript?.segments || [],
        crawledAt: new Date().toISOString(),
      };

      data.videos.push(entry);

      if (transcript) {
        successCount++;
        const srcLabel = transcript.source === 'whisper-' + WHISPER_MODEL ? '🎤' : '📝';
        log(`${progress} ✅ ${srcLabel} ${transcript.charCount} chars (${transcript.lang}) — ${title.substring(0, 50)}`, 'success');
      } else {
        failCount++;
        log(`${progress} ⚠️ No transcript — ${title.substring(0, 50)}`, 'warn');
      }

      // Save after EVERY video (crash-safe)
      data.crawledAt = new Date().toISOString();
      data.totalVideos = allVideos.length;
      data.stats = {
        crawled: data.videos.length,
        withTranscript: data.videos.filter(v => v.hasTranscript).length,
        whisperTranscribed: whisperCount,
        totalChars: data.videos.reduce((sum, v) => sum + v.transcriptChars, 0),
        avgCharsPerVideo: Math.round(
          data.videos.filter(v => v.hasTranscript).reduce((sum, v) => sum + v.transcriptChars, 0) /
          Math.max(1, data.videos.filter(v => v.hasTranscript).length)
        ),
      };
      await saveData(data);

    } catch (error) {
      failCount++;
      log(`${progress} ❌ Error: ${error.message.substring(0, 80)}`, 'error');
    }

    // Delay between requests (TikTok is stricter)
    if (i < videosToProcess.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  // Final summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log('\n' + '='.repeat(60));
  console.log('  📊 TIKTOK CRAWL COMPLETE');
  console.log('='.repeat(60));
  console.log(`  Total videos on channel: ${allVideos.length}`);
  console.log(`  Crawled this run:        ${successCount + failCount}`);
  console.log(`  With transcript (subs):  ${successCount - whisperCount}`);
  console.log(`  With transcript (whisper): ${whisperCount}`);
  console.log(`  No transcript:           ${failCount}`);
  console.log(`  Total in database:       ${data.videos.length}`);
  console.log(`  Total transcript chars:  ${(data.stats?.totalChars || 0).toLocaleString()}`);
  console.log(`  Avg chars per video:     ${(data.stats?.avgCharsPerVideo || 0).toLocaleString()}`);
  console.log(`  Time elapsed:            ${elapsed}s`);
  console.log(`  Output:                  ${OUTPUT_FILE}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  console.error(err);
  process.exit(1);
});
