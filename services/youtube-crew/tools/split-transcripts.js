#!/usr/bin/env node
/**
 * Split clean-transcripts.json → individual .md files per video
 * 
 * Output structure:
 *   src/knowledge/transcripts/
 *   ├── tam-ly/
 *   │   ├── 9NhdSLhA9eU.md
 *   │   └── ...
 *   ├── tai-chinh/
 *   ├── phat-trien/
 *   ├── van-hoa/
 *   ├── dia-chinh-tri/
 *   ├── kinh-doanh/
 *   ├── xa-hoi/
 *   └── _index.json          ← master index for loader
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_PATH = './data/clean-transcripts.json';
const OUT_DIR = './src/knowledge/transcripts';

// ── Load data ────────────────────────────────────────────────
console.log('📂 Loading clean-transcripts.json...');
const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
console.log(`   Channel: ${data.channel}`);
console.log(`   Videos: ${data.videos.length}`);
console.log(`   Categories: ${JSON.stringify(data.categories)}`);

// ── Create directory structure ───────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
const categories = Object.keys(data.categories);
for (const cat of categories) {
  mkdirSync(join(OUT_DIR, cat), { recursive: true });
}

// ── Category Vietnamese labels ───────────────────────────────
const CAT_LABELS = {
  'tam-ly': 'Tâm lý',
  'tai-chinh': 'Tài chính',
  'phat-trien': 'Phát triển bản thân',
  'van-hoa': 'Văn hoá',
  'dia-chinh-tri': 'Địa chính trị',
  'kinh-doanh': 'Kinh doanh',
  'xa-hoi': 'Xã hội',
};

// ── Process each video ───────────────────────────────────────
const index = {
  channel: data.channel,
  totalVideos: data.videos.length,
  categories: data.categories,
  processedAt: new Date().toISOString(),
  videos: [],
};

let skipped = 0;
let written = 0;

for (const video of data.videos) {
  const { videoId, title, duration, viewCount, uploadDate, category, transcriptChars, transcript } = video;

  // Skip if no meaningful transcript
  if (!transcript || transcript.length < 200) {
    console.log(`   ⏭️ Skipped (short): ${videoId} — ${title?.substring(0, 60)}`);
    skipped++;
    continue;
  }

  const cat = category || 'uncategorized';
  const catDir = join(OUT_DIR, cat);
  if (!existsSync(catDir)) mkdirSync(catDir, { recursive: true });

  // Format duration
  const mins = Math.floor((duration || 0) / 60);
  const secs = (duration || 0) % 60;
  const durationStr = `${mins}:${String(secs).padStart(2, '0')}`;

  // Clean title for display (remove mojibake)
  const cleanTitle = (title || 'Untitled')
    .replace(/[^\x20-\x7E\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F\u2000-\u206F\u2018-\u201F\u2013-\u2014\u2026"…–—''""!?.,;:()[\]{}\-\/\\@#$%^&*+=<>~`|₫đĐ\n\r\t ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Build markdown content
  const md = `---
videoId: "${videoId}"
title: "${cleanTitle.replace(/"/g, '\\"')}"
category: "${cat}"
categoryLabel: "${CAT_LABELS[cat] || cat}"
duration: ${duration || 0}
durationFormatted: "${durationStr}"
viewCount: ${viewCount || 0}
transcriptChars: ${transcriptChars || transcript.length}
url: "https://www.youtube.com/watch?v=${videoId}"
channel: "THE HIDDEN SELF"
---

# ${cleanTitle}

**Kênh:** THE HIDDEN SELF | **Chuyên mục:** ${CAT_LABELS[cat] || cat} | **Thời lượng:** ${durationStr} | **Lượt xem:** ${(viewCount || 0).toLocaleString()}

---

${transcript.trim()}
`;

  const filePath = join(catDir, `${videoId}.md`);
  writeFileSync(filePath, md, 'utf-8');
  written++;

  // Add to index
  index.videos.push({
    videoId,
    title: cleanTitle,
    category: cat,
    duration: duration || 0,
    viewCount: viewCount || 0,
    chars: transcriptChars || transcript.length,
    file: `${cat}/${videoId}.md`,
  });
}

// ── Write master index ──────────────────────────────────────
writeFileSync(join(OUT_DIR, '_index.json'), JSON.stringify(index, null, 2), 'utf-8');

// ── Summary ─────────────────────────────────────────────────
console.log('');
console.log('✅ Split complete!');
console.log(`   Written: ${written} files`);
console.log(`   Skipped: ${skipped} (too short)`);
console.log(`   Output: ${OUT_DIR}/`);
console.log('');
console.log('   Category breakdown:');
for (const cat of categories) {
  const count = index.videos.filter(v => v.category === cat).length;
  console.log(`     ${cat}: ${count} files`);
}
console.log(`\n   Index: ${OUT_DIR}/_index.json`);
