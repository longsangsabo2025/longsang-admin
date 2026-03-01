#!/usr/bin/env node
/**
 * 🏗️ UNIVERSAL KNOWLEDGE PROCESSOR
 * 
 * Takes raw/cleaned transcripts from ANY source and produces:
 *   1. AI-fixed titles (for garbled Vietnamese YouTube titles)
 *   2. AI-categorized into topic folders
 *   3. Clean .md files with proper frontmatter
 *   4. Unified _index.json per source
 * 
 * Sources supported:
 *   --source thuattaivan    → Re-process existing cleaned files (fix titles + categorize)
 *   --source hormozi        → Process raw JSON, split into categorized .md
 *   --source tiktok         → Process raw JSON, split into categorized .md
 * 
 * Usage:
 *   node --max-old-space-size=2048 tools/process-knowledge.js --source thuattaivan
 *   node --max-old-space-size=2048 tools/process-knowledge.js --source hormozi
 *   node --max-old-space-size=2048 tools/process-knowledge.js --source tiktok
 *   node --max-old-space-size=2048 tools/process-knowledge.js --source all
 *   node --max-old-space-size=2048 tools/process-knowledge.js --source all --dry-run
 */
import { chat, estimateCost } from '../src/core/llm.js';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
dotenv.config({ path: join(ROOT, '.env') });

// ─── Config ─────────────────────────────────────────────────
function getArg(name) {
  const eqForm = process.argv.find(a => a.startsWith(`--${name}=`));
  if (eqForm) return eqForm.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(`--${name}`);
  if (idx > -1 && idx + 1 < process.argv.length && !process.argv[idx + 1].startsWith('--')) return process.argv[idx + 1];
  return null;
}
const hasFlag = (n) => process.argv.includes(`--${n}`);

const SOURCE = getArg('source') || 'all';
const DRY_RUN = hasFlag('dry-run');
const RESUME = hasFlag('resume');
const LIMIT = getArg('limit') ? parseInt(getArg('limit')) : null;
const MODEL = process.env.DEFAULT_MODEL || 'gemini-2.0-flash';
const KNOWLEDGE_DIR = join(ROOT, 'src', 'knowledge');

// ─── Categories definition ─────────────────────────────────
const CATEGORIES = {
  // Vietnamese topics
  'tai-chinh': { vi: 'Tài chính & Đầu tư', en: 'Finance & Investment', keywords: ['tiền', 'đầu tư', 'chứng khoán', 'crypto', 'bitcoin', 'lãi suất', 'fed', 'kinh tế', 'ngân hàng', 'money', 'invest', 'stock', 'finance', 'wealth', 'rich', 'business revenue', 'profit', 'income'] },
  'tam-ly': { vi: 'Tâm lý & Tư duy', en: 'Psychology & Mindset', keywords: ['tâm lý', 'não', 'tư duy', 'cảm xúc', 'dopamine', 'thói quen', 'mindset', 'psychology', 'habit', 'brain', 'mental', 'discipline', 'motivation', 'think'] },
  'phat-trien': { vi: 'Phát triển bản thân', en: 'Self-Development', keywords: ['phát triển', 'kỹ năng', 'thành công', 'mục tiêu', 'growth', 'success', 'skill', 'productivity', 'goal', 'improve', 'learn', 'career'] },
  'kinh-doanh': { vi: 'Kinh doanh & Khởi nghiệp', en: 'Business & Entrepreneurship', keywords: ['kinh doanh', 'khởi nghiệp', 'doanh nghiệp', 'startup', 'business', 'entrepreneur', 'company', 'scale', 'sales', 'marketing', 'customer', 'offer', 'lead', 'acquisition'] },
  'dia-chinh-tri': { vi: 'Địa chính trị & Thế giới', en: 'Geopolitics & World', keywords: ['chính trị', 'thế giới', 'chiến tranh', 'trump', 'mỹ', 'trung quốc', 'politics', 'war', 'global', 'government', 'policy'] },
  'xa-hoi': { vi: 'Xã hội & Văn hoá', en: 'Society & Culture', keywords: ['xã hội', 'văn hoá', 'con người', 'society', 'culture', 'people', 'life', 'relationship', 'social'] },
  'suc-khoe': { vi: 'Sức khỏe & Đời sống', en: 'Health & Lifestyle', keywords: ['sức khỏe', 'tập', 'ăn', 'ngủ', 'health', 'fitness', 'diet', 'sleep', 'exercise', 'body', 'weight'] },
  'triet-hoc': { vi: 'Triết học & Tâm linh', en: 'Philosophy & Spirituality', keywords: ['triết', 'phật', 'tâm linh', 'nhân quả', 'thiền', 'philosophy', 'spiritual', 'meditation', 'wisdom', 'stoic'] },
};

// ─── Source definitions ─────────────────────────────────────
const SOURCES = {
  thuattaivan: {
    label: 'THUẬT TÀI VẬN (YouTube)',
    inputType: 'cleaned-dir',      // Already cleaned .md files
    inputPath: join(KNOWLEDGE_DIR, 'transcripts-thuattaivan'),
    outputDir: join(KNOWLEDGE_DIR, 'thuattaivan'),
    checkpointFile: join(ROOT, 'data', '.process-thuattaivan.json'),
    lang: 'vi',
    needsTitleFix: true,
    needsClean: false,              // Already AI-cleaned
    needsCategory: true,
  },
  hormozi: {
    label: 'Alex Hormozi (YouTube)',
    inputType: 'raw-json',
    inputPath: join(ROOT, 'data', 'alexhormozi-transcripts.json'),
    outputDir: join(KNOWLEDGE_DIR, 'hormozi'),
    checkpointFile: join(ROOT, 'data', '.process-hormozi.json'),
    lang: 'en',
    needsTitleFix: false,           // English titles are fine
    needsClean: false,              // English auto-captions are good enough
    needsCategory: true,
  },
  tiktok: {
    label: 'Ẩn Bí Mật Luật Ngầm (TikTok)',
    inputType: 'raw-json',
    inputPath: join(ROOT, 'data', 'akbimatluatngam-transcripts.json'),
    outputDir: join(KNOWLEDGE_DIR, 'akbimatluatngam'),
    checkpointFile: join(ROOT, 'data', '.process-tiktok.json'),
    lang: 'vi',
    needsTitleFix: false,           // TikTok titles are descriptions, fine
    needsClean: true,               // TikTok captions may need cleanup
    needsCategory: true,
  },
};

// ─── Helpers ────────────────────────────────────────────────
function log(msg, level = 'info') {
  const icons = { info: '📋', success: '✅', warn: '⚠️', error: '❌', progress: '🔄', title: '📝', category: '📂' };
  const ts = new Date().toLocaleTimeString('vi-VN');
  console.log(`${icons[level] || '•'} [${ts}] ${msg}`);
}

let totalCost = 0;
let totalTokensIn = 0;
let totalTokensOut = 0;

async function aiCall(systemPrompt, userMessage, temp = 0.3, maxTokens = 500) {
  const result = await chat({ model: MODEL, systemPrompt, userMessage, temperature: temp, maxTokens, agentId: 'knowledge-processor' });
  const cost = estimateCost(MODEL, result.tokens.input, result.tokens.output);
  totalCost += cost;
  totalTokensIn += result.tokens.input;
  totalTokensOut += result.tokens.output;
  return result.content.trim();
}

async function loadCheckpoint(file) {
  if (!RESUME) return new Set();
  try { return new Set(JSON.parse(await readFile(file, 'utf-8')).completed || []); } catch { return new Set(); }
}
async function saveCheckpoint(file, completed, stats) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ completed: [...completed], lastUpdated: new Date().toISOString(), stats }, null, 2), 'utf-8');
}

// ─── AI: Fix garbled Vietnamese title ───────────────────────
async function fixTitle(garbledTitle, transcriptSnippet, channel) {
  const result = await aiCall(
    `Bạn nhận tiêu đề video YouTube bị lỗi encoding tiếng Việt (mất dấu, ký tự lạ). 
Dựa vào đoạn transcript bên dưới để hiểu nội dung, sau đó phục hồi tiêu đề gốc tiếng Việt.
CHỈ trả về tiêu đề đã sửa, không giải thích. Giữ nguyên phần "| ${channel}" ở cuối nếu có.`,
    `Tiêu đề lỗi: "${garbledTitle}"\n\nĐoạn transcript (200 ký tự đầu):\n${transcriptSnippet.substring(0, 300)}`,
    0.2, 200
  );
  return result.replace(/^["']|["']$/g, '');
}

// ─── AI: Categorize video ───────────────────────────────────
const CATEGORY_LIST = Object.entries(CATEGORIES).map(([k, v]) => `${k}: ${v.vi} / ${v.en}`).join('\n');

async function categorizeVideo(title, transcriptSnippet, lang) {
  const langHint = lang === 'vi' ? 'Nội dung tiếng Việt.' : 'Content is in English.';
  const result = await aiCall(
    `Classify this video into exactly ONE category. ${langHint}
Reply with ONLY the category key (e.g. "tai-chinh"), nothing else.

Categories:
${CATEGORY_LIST}`,
    `Title: ${title}\n\nTranscript (first 400 chars):\n${transcriptSnippet.substring(0, 400)}`,
    0.1, 30
  );
  const key = result.toLowerCase().replace(/[^a-z-]/g, '').trim();
  return CATEGORIES[key] ? key : 'phat-trien'; // fallback
}

// ─── AI: Light clean for TikTok Vietnamese ──────────────────
async function lightClean(text) {
  if (text.length < 100) return text;
  // Only fix obvious errors, don't rewrite
  const result = await aiCall(
    `Sửa lỗi chính tả và dấu tiếng Việt trong transcript TikTok. Thêm ngắt đoạn hợp lý.
KHÔNG thay đổi ý nghĩa, KHÔNG thêm nội dung mới. CHỈ output văn bản đã sửa.`,
    text.substring(0, 6000), // TikTok videos are short
    0.3, 4096
  );
  return result;
}

// ─── Build output .md file ──────────────────────────────────
function buildMarkdown({ videoId, title, channel, duration, views, lang, uploadDate, category, transcript, platform }) {
  const catInfo = CATEGORIES[category] || CATEGORIES['phat-trien'];
  const durationStr = typeof duration === 'number' 
    ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`
    : duration;
  
  return [
    '---',
    `videoId: "${videoId}"`,
    `title: "${title.replace(/"/g, '\\"')}"`,
    `channel: "${channel}"`,
    `platform: "${platform || 'youtube'}"`,
    `category: "${category}"`,
    `categoryLabel: "${catInfo.vi}"`,
    `duration: "${durationStr}"`,
    `views: ${views || 0}`,
    `lang: "${lang}"`,
    `uploadDate: "${uploadDate || ''}"`,
    `processedAt: "${new Date().toISOString()}"`,
    '---',
    '',
    `# ${title}`,
    '',
    `**Kênh:** ${channel} | **Chuyên mục:** ${catInfo.vi} | **Thời lượng:** ${durationStr} | **Views:** ${(views || 0).toLocaleString()}`,
    '',
    '---',
    '',
    transcript,
    '',
  ].join('\n');
}

// ─── Process: THUATTAIVAN (re-process cleaned files) ────────
async function processThuattaivan(cfg) {
  log(`Processing ${cfg.label}...`, 'progress');
  
  const files = (await readdir(cfg.inputPath)).filter(f => f.endsWith('.md'));
  log(`Found ${files.length} cleaned files`, 'info');

  const completed = await loadCheckpoint(cfg.checkpointFile);
  let items = files.filter(f => !completed.has(f));
  if (LIMIT) items = items.slice(0, LIMIT);
  
  if (RESUME && completed.size > 0) log(`Resuming: ${completed.size} done, ${items.length} remaining`, 'info');

  let success = 0, failed = 0;
  const indexEntries = [];

  // Also load already-completed entries for index
  for (const f of files.filter(f => completed.has(f))) {
    // Try to read existing output to get index data
    const videoId = f.replace('.md', '');
    const cats = Object.keys(CATEGORIES);
    for (const cat of cats) {
      const outPath = join(cfg.outputDir, cat, f);
      if (existsSync(outPath)) {
        try {
          const content = await readFile(outPath, 'utf-8');
          const titleMatch = content.match(/^title:\s*"(.+?)"/m);
          const viewsMatch = content.match(/^views:\s*(\d+)/m);
          const durationMatch = content.match(/^duration:\s*"(.+?)"/m);
          indexEntries.push({ videoId, title: titleMatch?.[1] || '', category: cat, views: parseInt(viewsMatch?.[1]) || 0, duration: durationMatch?.[1] || '', file: `${cat}/${f}` });
        } catch {}
        break;
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    const file = items[i];
    const videoId = file.replace('.md', '');
    const progress = `[${i + 1 + completed.size}/${files.length}]`;

    try {
      const content = await readFile(join(cfg.inputPath, file), 'utf-8');
      
      // Extract existing frontmatter
      const fmMatch = content.match(/^---[\s\S]*?---/);
      const body = content.replace(/^---[\s\S]*?---\s*/, '');
      
      // Extract transcript (after the header section and ---)
      const parts = body.split(/\n---\n/);
      const transcript = parts.length > 1 ? parts.slice(1).join('\n---\n').trim() : body.trim();
      
      // Extract metadata from frontmatter
      const titleMatch = content.match(/^title:\s*"(.+?)"/m);
      const viewsMatch = content.match(/^views:\s*(\d+)/m);
      const durationMatch = content.match(/^duration:\s*"(.+?)"/m);
      const langMatch = content.match(/^lang:\s*"(.+?)"/m);
      const uploadMatch = content.match(/^uploadDate:\s*"(.+?)"/m);
      
      let title = titleMatch?.[1] || videoId;
      const views = parseInt(viewsMatch?.[1]) || 0;
      const duration = durationMatch?.[1] || '0:00';
      const lang = langMatch?.[1] || 'vi';
      const uploadDate = uploadMatch?.[1] || '';

      // Fix garbled title
      if (isTitleGarbled(title)) {
        const fixedTitle = await fixTitle(title, transcript, 'THUẬT TÀI VẬN');
        log(`${progress} 📝 "${title.substring(0, 40)}" → "${fixedTitle.substring(0, 40)}"`, 'title');
        title = fixedTitle;
      }

      // Categorize
      const category = await categorizeVideo(title, transcript, 'vi');
      log(`${progress} 📂 ${category} — ${title.substring(0, 50)}`, 'category');

      // Write output
      const outContent = buildMarkdown({ videoId, title, channel: 'THUẬT TÀI VẬN', duration, views, lang, uploadDate, category, transcript, platform: 'youtube' });
      const outDir = join(cfg.outputDir, category);
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, file), outContent, 'utf-8');

      indexEntries.push({ videoId, title, category, views, duration, file: `${category}/${file}` });
      success++;
      completed.add(file);
      
      if ((i + 1) % 5 === 0) await saveCheckpoint(cfg.checkpointFile, completed, { success, failed, cost: totalCost });

    } catch (err) {
      failed++;
      log(`${progress} ❌ ${err.message?.substring(0, 80)}`, 'error');
      if (err.message?.includes('429')) { log('Rate limited — 30s wait', 'warn'); await new Promise(r => setTimeout(r, 30000)); i--; continue; }
    }
  }

  await saveCheckpoint(cfg.checkpointFile, completed, { success, failed, cost: totalCost });
  await writeIndex(cfg.outputDir, cfg.label, indexEntries);
  return { success, failed, total: files.length };
}

// ─── Process: Raw JSON (Hormozi / TikTok) ───────────────────
async function processRawJson(cfg) {
  log(`Processing ${cfg.label}...`, 'progress');

  if (!existsSync(cfg.inputPath)) { log(`Input not found: ${cfg.inputPath}`, 'error'); return { success: 0, failed: 0, total: 0 }; }
  const data = JSON.parse(await readFile(cfg.inputPath, 'utf-8'));
  const allVideos = data.videos.filter(v => v.hasTranscript && v.transcript && v.transcript.length > 80);
  log(`Found ${allVideos.length} videos with transcript`, 'info');

  const completed = await loadCheckpoint(cfg.checkpointFile);
  let items = allVideos.filter(v => !completed.has(v.videoId));
  if (LIMIT) items = items.slice(0, LIMIT);

  if (RESUME && completed.size > 0) log(`Resuming: ${completed.size} done, ${items.length} remaining`, 'info');

  let success = 0, failed = 0;
  const indexEntries = [];

  // Load completed entries for index
  for (const v of allVideos.filter(v => completed.has(v.videoId))) {
    const cats = Object.keys(CATEGORIES);
    for (const cat of cats) {
      const outPath = join(cfg.outputDir, cat, `${v.videoId}.md`);
      if (existsSync(outPath)) {
        try {
          const content = await readFile(outPath, 'utf-8');
          const titleMatch = content.match(/^title:\s*"(.+?)"/m);
          indexEntries.push({ videoId: v.videoId, title: titleMatch?.[1] || v.title, category: cat, views: v.viewCount || 0, duration: v.duration || 0, file: `${cat}/${v.videoId}.md`, chars: v.transcriptChars || 0 });
        } catch {}
        break;
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    const video = items[i];
    const progress = `[${i + 1 + completed.size}/${allVideos.length}]`;

    try {
      let title = video.title || `Video ${video.videoId}`;
      let transcript = video.transcript;

      // Fix garbled title if needed (Vietnamese channels)
      if (cfg.needsTitleFix && isTitleGarbled(title)) {
        title = await fixTitle(title, transcript, cfg.label);
        log(`${progress} 📝 title fixed → "${title.substring(0, 50)}"`, 'title');
      }

      // Light clean for TikTok
      if (cfg.needsClean && cfg.lang === 'vi') {
        transcript = await lightClean(transcript);
      }

      // Categorize
      const category = await categorizeVideo(title, transcript, cfg.lang);

      // Determine platform
      const platform = cfg.inputPath.includes('tiktok') || cfg.inputPath.includes('akbimatluatngam') ? 'tiktok' : 'youtube';

      // Build & write
      const outContent = buildMarkdown({
        videoId: video.videoId, title, channel: cfg.label,
        duration: video.duration || 0, views: video.viewCount || 0,
        lang: video.transcriptLang || cfg.lang,
        uploadDate: video.uploadDate || '', category, transcript, platform,
      });

      const outDir = join(cfg.outputDir, category);
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, `${video.videoId}.md`), outContent, 'utf-8');

      indexEntries.push({ videoId: video.videoId, title, category, views: video.viewCount || 0, duration: video.duration || 0, chars: transcript.length, file: `${category}/${video.videoId}.md` });
      success++;
      completed.add(video.videoId);

      log(`${progress} ✅ ${category} — ${title.substring(0, 50)} (${transcript.length} chars)`, 'success');

      if ((i + 1) % 5 === 0) await saveCheckpoint(cfg.checkpointFile, completed, { success, failed, cost: totalCost });

    } catch (err) {
      failed++;
      log(`${progress} ❌ ${err.message?.substring(0, 80)}`, 'error');
      if (err.message?.includes('429')) { log('Rate limited — 30s wait', 'warn'); await new Promise(r => setTimeout(r, 30000)); i--; continue; }
    }
  }

  await saveCheckpoint(cfg.checkpointFile, completed, { success, failed, cost: totalCost });
  await writeIndex(cfg.outputDir, cfg.label, indexEntries);
  return { success, failed, total: allVideos.length };
}

// ─── Detect garbled title ───────────────────────────────────
function isTitleGarbled(title) {
  if (!title) return false;
  // Check for garbled UTF-8: many consecutive uppercase without proper Vietnamese diacritics
  // Vietnamese titles should have diacritical marks (ắ, ề, ổ, etc.)
  const upperSegments = title.match(/[A-Z]{2,}/g) || [];
  const totalUpperChars = upperSegments.reduce((s, w) => s + w.length, 0);
  // If >40% of the title is uppercase segments and no proper Vietnamese chars
  if (totalUpperChars > title.length * 0.4) {
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(title);
    if (!hasVietnamese) return true;
  }
  // Check for typical garbled patterns: single consonants separated by spaces
  const words = title.split(/\s+/);
  const singleChars = words.filter(w => w.length === 1 && /[A-Z]/.test(w));
  if (singleChars.length > words.length * 0.2) return true;
  // Check for "�" replacement character
  if (title.includes('�')) return true;
  return false;
}

// ─── Write index ────────────────────────────────────────────
async function writeIndex(outputDir, channelLabel, entries) {
  // Category summary
  const catSummary = {};
  for (const e of entries) {
    catSummary[e.category] = (catSummary[e.category] || 0) + 1;
  }

  const index = {
    channel: channelLabel,
    totalVideos: entries.length,
    categories: catSummary,
    processedAt: new Date().toISOString(),
    videos: entries.sort((a, b) => (b.views || 0) - (a.views || 0)),
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, '_index.json'), JSON.stringify(index, null, 2), 'utf-8');
  log(`Index written: ${entries.length} videos, ${Object.keys(catSummary).length} categories`, 'success');
}

// ─── Build unified master index ─────────────────────────────
async function buildMasterIndex() {
  log('Building unified master index...', 'progress');
  
  const sources = [];
  const allDirs = ['transcripts-clean', 'thuattaivan', 'hormozi', 'akbimatluatngam'];
  
  for (const dir of allDirs) {
    const indexPath = join(KNOWLEDGE_DIR, dir, '_index.json');
    if (existsSync(indexPath)) {
      try {
        const idx = JSON.parse(await readFile(indexPath, 'utf-8'));
        sources.push({
          directory: dir,
          channel: idx.channel,
          totalVideos: idx.totalVideos,
          categories: idx.categories,
        });
        log(`  ${dir}: ${idx.totalVideos} videos`, 'info');
      } catch {}
    }
  }

  const masterIndex = {
    generatedAt: new Date().toISOString(),
    totalSources: sources.length,
    totalVideos: sources.reduce((s, src) => s + src.totalVideos, 0),
    sources,
  };

  await writeFile(join(KNOWLEDGE_DIR, '_master_index.json'), JSON.stringify(masterIndex, null, 2), 'utf-8');
  log(`Master index: ${masterIndex.totalSources} sources, ${masterIndex.totalVideos} videos total`, 'success');
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  🏗️  UNIVERSAL KNOWLEDGE PROCESSOR');
  console.log(`  Source: ${SOURCE}`);
  console.log(`  Dry run: ${DRY_RUN}`);
  console.log(`  Resume: ${RESUME}`);
  console.log(`  Limit: ${LIMIT || 'none'}`);
  console.log('='.repeat(60) + '\n');

  const results = {};
  const sources = SOURCE === 'all' ? ['thuattaivan', 'hormozi', 'tiktok'] : [SOURCE];

  if (DRY_RUN) {
    for (const src of sources) {
      const cfg = SOURCES[src];
      if (!cfg) { log(`Unknown source: ${src}`, 'error'); continue; }
      console.log(`\n📋 ${cfg.label}:`);
      console.log(`   Input: ${cfg.inputPath}`);
      console.log(`   Output: ${cfg.outputDir}`);
      console.log(`   Title fix: ${cfg.needsTitleFix}, Clean: ${cfg.needsClean}, Categorize: ${cfg.needsCategory}`);
      
      if (cfg.inputType === 'raw-json' && existsSync(cfg.inputPath)) {
        const d = JSON.parse(await readFile(cfg.inputPath, 'utf-8'));
        const withTx = d.videos.filter(v => v.hasTranscript && v.transcript?.length > 80).length;
        console.log(`   Videos with transcript: ${withTx}`);
      } else if (cfg.inputType === 'cleaned-dir' && existsSync(cfg.inputPath)) {
        const files = (await readdir(cfg.inputPath)).filter(f => f.endsWith('.md'));
        console.log(`   Cleaned files: ${files.length}`);
      }
    }
    console.log('\n--dry-run: No changes made.');
    return;
  }

  for (const src of sources) {
    const cfg = SOURCES[src];
    if (!cfg) { log(`Unknown source: ${src}`, 'error'); continue; }

    console.log('\n' + '─'.repeat(50));
    
    if (cfg.inputType === 'cleaned-dir') {
      results[src] = await processThuattaivan(cfg);
    } else {
      results[src] = await processRawJson(cfg);
    }

    console.log(`  ${cfg.label}: ✅ ${results[src].success} / ❌ ${results[src].failed} / 📊 ${results[src].total} total`);
  }

  // Build master index
  await buildMasterIndex();

  // Summary
  const elapsed = process.uptime().toFixed(0);
  console.log('\n' + '='.repeat(60));
  console.log('  📊 PROCESSING COMPLETE');
  console.log('='.repeat(60));
  for (const [src, r] of Object.entries(results)) {
    console.log(`  ${SOURCES[src]?.label}: ${r.success} success, ${r.failed} failed`);
  }
  console.log(`  💰 Total cost: $${totalCost.toFixed(4)}`);
  console.log(`  📊 Tokens: ${totalTokensIn.toLocaleString()} in + ${totalTokensOut.toLocaleString()} out`);
  console.log(`  ⏱️ Time: ${elapsed}s`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
