/**
 * 🕷️ CHANNEL TRANSCRIPT CRAWLER
 * 
 * Standalone script — runs in background, crawls ALL videos from a YouTube channel,
 * extracts Vietnamese transcripts via yt-dlp, saves incrementally to JSON.
 * 
 * Usage: node crawl-channel.js [--channel @handle] [--max N] [--resume]
 * 
 * Output: ./data/channel-transcripts.json (incremental, crash-safe)
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

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

const CHANNEL = getArg('channel') || '@thehiddenself.pocast';
const MAX_VIDEOS = getArg('max') ? parseInt(getArg('max')) : 9999;
const SORT_BY_VIEWS = process.argv.includes('--sort-by-views');
const RESUME = process.argv.includes('--resume');
const YT_DLP = process.env.YT_DLP_PATH || 'yt-dlp';
const DATA_DIR = join(__dirname, '..', 'data');

const outputArg = getArg('output');
const OUTPUT_FILE = outputArg 
  ? join(DATA_DIR, outputArg)
  : join(DATA_DIR, 'channel-transcripts.json');

const TMP_DIR = join(__dirname, '..', '.tmp');
const PREFERRED_LANGS = getArg('lang') 
  ? getArg('lang').split(',') 
  : ['vi-orig', 'vi', 'en'];
const DELAY_BETWEEN_VIDEOS_MS = 2000; // Be nice to YouTube

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
  return { channel: CHANNEL, crawledAt: null, videos: [] };
}

// ================== STEP 1: List all videos ==================
async function listChannelVideos(channelHandle) {
  log(`Fetching video list from ${channelHandle}...`, 'progress');
  
  const channelUrl = channelHandle.startsWith('http') 
    ? channelHandle 
    : `https://www.youtube.com/${channelHandle}/videos`;

  try {
    // yt-dlp can dump all video URLs + metadata from a channel
    const { stdout } = await execFileAsync(YT_DLP, [
      '--flat-playlist',
      '--print', '%(id)s\t%(title)s\t%(duration)s\t%(view_count)s\t%(upload_date)s',
      '--no-update',
      channelUrl
    ], { timeout: 120000, maxBuffer: 10 * 1024 * 1024 });

    const videos = stdout.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [id, title, duration, views, uploadDate] = line.split('\t');
        return {
          videoId: id,
          title: title || '(no title)',
          duration: parseInt(duration) || 0,
          viewCount: parseInt(views) || 0,
          uploadDate: uploadDate || null,
        };
      })
      .filter(v => v.videoId && v.videoId.length === 11);

    log(`Found ${videos.length} videos on channel`, 'success');
    return videos;
  } catch (error) {
    log(`Failed to list videos: ${error.message}`, 'error');
    throw error;
  }
}

// ================== STEP 2: Extract transcript for one video ==================
async function extractTranscript(videoId) {
  await mkdir(TMP_DIR, { recursive: true });
  const tmpFile = join(TMP_DIR, videoId);

  for (const lang of PREFERRED_LANGS) {
    try {
      await execFileAsync(YT_DLP, [
        '--write-auto-sub',
        '--sub-lang', lang,
        '--sub-format', 'json3',
        '--skip-download',
        '--no-update',
        '-o', tmpFile,
        `https://www.youtube.com/watch?v=${videoId}`
      ], { timeout: 60000 });

      const subFile = `${tmpFile}.${lang}.json3`;
      if (!existsSync(subFile)) continue;

      const data = JSON.parse(await readFile(subFile, 'utf-8'));
      const result = parseJson3(data);

      // Cleanup
      try { const { unlink: ul } = await import('fs/promises'); await ul(subFile); } catch {}

      if (result.text.length > 50) {
        return { ...result, lang, source: 'yt-dlp-auto-sub' };
      }
    } catch {
      continue;
    }
  }

  // Cleanup any leftover files
  try {
    const { readdir, unlink: ul } = await import('fs/promises');
    const files = await readdir(TMP_DIR);
    for (const f of files.filter(f => f.startsWith(videoId))) {
      try { await ul(join(TMP_DIR, f)); } catch {}
    }
  } catch {}

  return null;
}

function parseJson3(json3Data) {
  const events = (json3Data.events || []).filter(e => e.segs?.length > 0);
  let fullText = '';
  const segments = [];

  for (const event of events) {
    const text = (event.segs || []).map(s => s.utf8 || '').join('').replace(/\n/g, ' ').trim();
    if (!text) continue;
    
    const startSec = (event.tStartMs || 0) / 1000;
    segments.push({ start: startSec, text });
    fullText += text + ' ';
  }

  const cleanText = fullText.replace(/\s+/g, ' ').trim();
  return { text: cleanText, segments, charCount: cleanText.length };
}

// ================== MAIN CRAWLER ==================
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  🕷️  YOUTUBE CHANNEL TRANSCRIPT CRAWLER');
  console.log('  Channel: ' + CHANNEL);
  console.log('  Max videos: ' + MAX_VIDEOS);
  console.log('  Sort by views: ' + SORT_BY_VIEWS);
  console.log('  Resume mode: ' + RESUME);
  console.log('='.repeat(60) + '\n');

  // Load existing data if resuming
  let data = RESUME ? await loadExistingData() : { channel: CHANNEL, crawledAt: null, videos: [] };
  const alreadyCrawled = new Set(data.videos.map(v => v.videoId));

  if (RESUME && alreadyCrawled.size > 0) {
    log(`Resuming — ${alreadyCrawled.size} videos already crawled`, 'info');
  }

  // Step 1: List all videos
  const allVideos = await listChannelVideos(CHANNEL);

  // Sort by views if requested (descending)
  if (SORT_BY_VIEWS) {
    allVideos.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    log(`Sorted by views — top: ${allVideos[0]?.title.substring(0, 50)} (${(allVideos[0]?.viewCount || 0).toLocaleString()} views)`, 'info');
  }

  const videosToProcess = allVideos
    .filter(v => !alreadyCrawled.has(v.videoId))
    .slice(0, MAX_VIDEOS - data.videos.length);

  if (videosToProcess.length === 0) {
    log('All videos already crawled! Nothing to do.', 'success');
    return;
  }

  log(`Will crawl ${videosToProcess.length} new videos (${alreadyCrawled.size} already done)`, 'info');

  // Step 2: Crawl each video
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < videosToProcess.length; i++) {
    const video = videosToProcess[i];
    const progress = `[${i + 1 + alreadyCrawled.size}/${allVideos.length}]`;
    
    log(`${progress} ${video.title.substring(0, 60)}...`, 'progress');

    try {
      const transcript = await extractTranscript(video.videoId);

      const entry = {
        videoId: video.videoId,
        title: video.title,
        duration: video.duration,
        durationFormatted: formatDuration(video.duration),
        viewCount: video.viewCount,
        uploadDate: video.uploadDate,
        hasTranscript: !!transcript,
        transcriptLang: transcript?.lang || null,
        transcriptChars: transcript?.charCount || 0,
        transcript: transcript?.text || '',
        segments: transcript?.segments || [],
        crawledAt: new Date().toISOString(),
      };

      data.videos.push(entry);
      
      if (transcript) {
        successCount++;
        log(`${progress} ✅ ${transcript.charCount} chars (${transcript.lang})`, 'success');
      } else {
        failCount++;
        log(`${progress} ⚠️ No transcript available`, 'warn');
      }

      // Save after EVERY video (crash-safe)
      data.crawledAt = new Date().toISOString();
      data.totalVideos = allVideos.length;
      data.stats = {
        crawled: data.videos.length,
        withTranscript: data.videos.filter(v => v.hasTranscript).length,
        totalChars: data.videos.reduce((sum, v) => sum + v.transcriptChars, 0),
        avgCharsPerVideo: Math.round(data.videos.filter(v => v.hasTranscript).reduce((sum, v) => sum + v.transcriptChars, 0) / Math.max(1, data.videos.filter(v => v.hasTranscript).length)),
      };
      await saveData(data);

    } catch (error) {
      failCount++;
      log(`${progress} ❌ Error: ${error.message}`, 'error');
    }

    // Delay between requests
    if (i < videosToProcess.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_VIDEOS_MS));
    }
  }

  // Final summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log('\n' + '='.repeat(60));
  console.log('  📊 CRAWL COMPLETE');
  console.log('='.repeat(60));
  console.log(`  Total videos on channel: ${allVideos.length}`);
  console.log(`  Successfully crawled:    ${successCount} this run`);
  console.log(`  Failed/no transcript:    ${failCount} this run`);
  console.log(`  Total in database:       ${data.videos.length}`);
  console.log(`  Total transcript chars:  ${data.stats.totalChars.toLocaleString()}`);
  console.log(`  Avg chars per video:     ${data.stats.avgCharsPerVideo.toLocaleString()}`);
  console.log(`  Time elapsed:            ${elapsed}s`);
  console.log(`  Output:                  ${OUTPUT_FILE}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  console.error(err);
  process.exit(1);
});
