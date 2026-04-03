/**
 * Analytics Collector
 *
 * Scrapes public YouTube video metadata from competitor channels.
 * Outputs: data/viral-training-data.csv (append mode — accumulates over time)
 *
 * Usage:
 *   node src/scripts/analytics-collector.js
 *   node src/scripts/analytics-collector.js --channels @alexhormozi,@thuattaivan --limit 30
 */

import { Innertube } from 'youtubei.js';
import { createWriteStream, existsSync, appendFileSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const CSV_PATH = join(DATA_DIR, 'viral-training-data.csv');

dotenv.config({ path: join(__dirname, '../../.env') });

// ─── Default competitor channels to scrape ─────────────────────────────────
const DEFAULT_CHANNELS = [
  '@alexhormozi',       // Business / wealth mindset (EN)
  '@thuattaivan',       // Vietnamese motivation
  '@GaryVee',           // Entrepreneurship (EN)
  '@RobertKiyosaki',    // Finance / mindset (EN)
  '@akbimatluatngam',   // Vietnamese philosophy
];

const CSV_HEADER = [
  'videoId',
  'title',
  'channel',
  'publishDate',
  'publishHour',
  'dayOfWeek',       // 0=Sun ... 6=Sat
  'durationSec',
  'viewCount',
  'likeCount',
  'commentCount',
  'titleLength',
  'titleWordCount',
  'hasNumber',       // 1/0 — title contains digits
  'hasQuestion',     // 1/0 — title has ?
  'hasEmoji',        // 1/0
  'hasColon',        // 1/0 — "How to: ..." pattern
  'collectedAt',     // ISO date of data collection
].join(',');

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseDuration(isoDuration) {
  // PT1H2M3S → seconds
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 3600) +
         (parseInt(match[2] || 0) * 60) +
         parseInt(match[3] || 0);
}

function hasEmoji(text) {
  return /[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(text);
}

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function videoToCSVRow(video, channelHandle) {
  const pub = video.publishDate ? new Date(video.publishDate) : null;
  const publishHour = pub ? pub.getUTCHours() : '';
  const dayOfWeek = pub ? pub.getUTCDay() : '';
  const title = video.title || '';
  const words = title.trim().split(/\s+/).filter(Boolean);

  return [
    escapeCSV(video.videoId || video.id || ''),
    escapeCSV(title),
    escapeCSV(channelHandle),
    escapeCSV(video.publishDate || ''),
    publishHour,
    dayOfWeek,
    video.durationSec ?? 0,
    video.viewCount ?? 0,
    video.likeCount ?? 0,
    video.commentCount ?? 0,
    title.length,
    words.length,
    /\d/.test(title) ? 1 : 0,
    title.includes('?') ? 1 : 0,
    hasEmoji(title) ? 1 : 0,
    title.includes(':') ? 1 : 0,
    new Date().toISOString(),
  ].join(',');
}

// ─── Fetch channel videos via youtubei.js ──────────────────────────────────

async function fetchChannelVideos(yt, channelHandle, limit = 20) {
  console.log(`  [fetch] ${channelHandle} (max ${limit} videos)`);
  try {
    const channel = await yt.getChannel(channelHandle);
    const videosTab = await channel.getVideos();
    const videos = [];

    for (const item of (videosTab?.videos || [])) {
      if (videos.length >= limit) break;

      const videoId = item.id;
      if (!videoId) continue;

      // Fetch full info for richer metadata
      let viewCount = 0;
      let likeCount = 0;
      let commentCount = 0;
      let durationSec = 0;
      let publishDate = null;

      try {
        const info = await yt.getInfo(videoId);
        const basic = info.basic_info;
        viewCount = basic.view_count ?? 0;
        likeCount = basic.like_count ?? 0;
        commentCount = basic.comment_count ?? 0;
        durationSec = basic.duration ?? 0;
        publishDate = basic.publish_date || null;
      } catch {
        // Use what's available from the listing
        viewCount = item.view_count?.text
          ? parseInt(item.view_count.text.replace(/\D/g, '')) || 0
          : 0;
        durationSec = item.duration?.seconds ?? 0;
      }

      videos.push({
        videoId,
        title: item.title?.text || item.title || '',
        publishDate,
        durationSec,
        viewCount,
        likeCount,
        commentCount,
      });

      // Polite rate limiting — avoid hammering YouTube
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`  [ok] ${channelHandle}: ${videos.length} videos collected`);
    return videos;
  } catch (err) {
    console.error(`  [error] ${channelHandle}: ${err.message}`);
    return [];
  }
}

// ─── Already-collected video IDs (avoid duplicates) ───────────────────────

function loadExistingIds() {
  const existing = new Set();
  if (!existsSync(CSV_PATH)) return existing;
  try {
    const lines = readFileSync(CSV_PATH, 'utf-8').trim().split('\n').slice(1); // skip header
    for (const line of lines) {
      const id = line.split(',')[0]?.replace(/"/g, '');
      if (id) existing.add(id);
    }
  } catch {}
  return existing;
}

// ─── Main ─────────────────────────────────────────────────────────────────

export async function collectAnalytics({ channels, limit = 20 } = {}) {
  const targetChannels = channels || DEFAULT_CHANNELS;
  console.log('\n[Analytics Collector] Starting...');
  console.log(`  Channels: ${targetChannels.join(', ')}`);
  console.log(`  Limit per channel: ${limit}`);
  console.log(`  Output: ${CSV_PATH}\n`);

  // Ensure data dir exists
  mkdirSync(DATA_DIR, { recursive: true });

  // Write header if file doesn't exist
  const isNew = !existsSync(CSV_PATH);
  if (isNew) {
    appendFileSync(CSV_PATH, CSV_HEADER + '\n', 'utf-8');
    console.log('  [csv] Created new CSV with header');
  }

  const existingIds = loadExistingIds();
  console.log(`  [csv] ${existingIds.size} existing video records found\n`);

  const yt = await Innertube.create({ lang: 'en', location: 'US' });

  let totalNew = 0;
  let totalSkipped = 0;

  for (const channelHandle of targetChannels) {
    const videos = await fetchChannelVideos(yt, channelHandle, limit);

    for (const video of videos) {
      if (existingIds.has(video.videoId)) {
        totalSkipped++;
        continue;
      }
      const row = videoToCSVRow(video, channelHandle);
      appendFileSync(CSV_PATH, row + '\n', 'utf-8');
      existingIds.add(video.videoId);
      totalNew++;
    }

    // Between channels — be polite
    await new Promise(r => setTimeout(r, 1000));
  }

  const summary = {
    status: 'ok',
    csvPath: CSV_PATH,
    newRecords: totalNew,
    skippedDuplicates: totalSkipped,
    totalRecords: existingIds.size,
    channels: targetChannels,
    collectedAt: new Date().toISOString(),
  };

  console.log('\n[Analytics Collector] Done!');
  console.log(`  New: ${totalNew} | Skipped: ${totalSkipped} | Total: ${existingIds.size}`);

  return summary;
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const channelsArg = args.find(a => a.startsWith('--channels='))?.split('=')[1];
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];

  const channels = channelsArg ? channelsArg.split(',').map(c => c.trim()) : undefined;
  const limit = limitArg ? parseInt(limitArg) : 20;

  collectAnalytics({ channels, limit })
    .then(r => { console.log('\nResult:', JSON.stringify(r, null, 2)); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
}
