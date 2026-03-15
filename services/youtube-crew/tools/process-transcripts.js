/**
 * 🧹 TRANSCRIPT PROCESSOR
 * 
 * 3-step pipeline:
 * 1. Clean noise (regex) — remove [âm nhạc], ads, fix common errors
 * 2. Classify topics (LLM) — tag each video with category
 * 3. Extract Voice DNA (LLM) — create VOICE.md from top videos
 * 
 * Usage: node process-transcripts.js
 * Output: 
 *   data/clean-transcripts.json
 *   src/knowledge/VOICE.md
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { chat } from './src/core/llm.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const INPUT = join(__dirname, 'data/channel-transcripts.json');
const OUTPUT = join(__dirname, 'data/clean-transcripts.json');
const VOICE_FILE = join(__dirname, 'src/knowledge/VOICE.md');

function log(msg, icon = '📋') {
  console.log(`${icon} [${new Date().toLocaleTimeString('vi-VN')}] ${msg}`);
}

// =====================================================
// STEP 1: CLEAN TRANSCRIPTS (Pure regex, no API cost)
// =====================================================

// Common speech-to-text errors in Vietnamese
const TYPO_MAP = {
  'lã suất': 'lãi suất',
  'lã xuất': 'lãi suất',
  'trề tranh': 'chiến tranh',
  'giào cản': 'rào cản',
  'tả liệu': 'tài liệu',
  'cướp cạ': 'cướp cạn',
  'giược mơ': 'giấc mơ',
  'giước mơ': 'giấc mơ',
  'mê giới': 'biên giới',
  'chỗ dậy': 'chỗi dậy',
  'giả đi': 'già đi',
  'chữ thế giới': 'trữ thế giới',
  'căn gia nhập': 'rào cản gia nhập',
  'giáo rỗng': 'sáo rỗng',
  'xáo rỗng': 'sáo rỗng',
  'tức đoạt': 'tước đoạt',
  'hỏi hăn': 'hỏi han',
  'kim chỉ nam': 'kim chỉ nam',
  'dự chữ': 'dự trữ',
};

// Ad patterns to remove (sponsored segments)
const AD_PATTERNS = [
  /AI không còn là công nghệ tương lai.*?(?:sânnguyenuyen\.com|sơnuyen\.com|đặt hàng)[^.]*\./gs,
  /Có chat CBT dùng chung.*?(?:hỗ trợ cài đặt)[^.]*\./gs,
  /(?:Link|Liên kết|Mua ngay|Đặt hàng).*?(?:\.com|\.vn)[^.]*\./gi,
  /chỉ \d+\.?\d*đ tại \S+\.[^.]*\./gi,
];

// Noise patterns
const NOISE_PATTERNS = [
  /\[âm nhạc\]/gi,
  /\[Âm nhạc\]/gi,
  /\[music\]/gi,
  /\[vỗ tay\]/gi,
  /\[applause\]/gi,
  /\[tiếng cười\]/gi,
  /\[im lặng\]/gi,
];

function cleanTranscript(text) {
  if (!text) return '';
  
  let clean = text;

  // Remove noise markers
  for (const pattern of NOISE_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  // Remove ad segments
  for (const pattern of AD_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  // Fix common typos
  for (const [wrong, right] of Object.entries(TYPO_MAP)) {
    clean = clean.replace(new RegExp(wrong, 'gi'), right);
  }

  // Clean whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

// =====================================================
// STEP 2: CLASSIFY TOPICS (1 LLM call for all titles)
// =====================================================

async function classifyTopics(videos) {
  log('Classifying 315 videos into categories...', '🏷️');

  // Batch titles into chunks of ~80 to fit context window
  const BATCH_SIZE = 80;
  const allCategories = {};

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);
    const titleList = batch.map((v, idx) => `${i + idx}. ${v.title}`).join('\n');

    const result = await chat({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 4096,
      responseFormat: 'json',
      systemPrompt: `You are a content classifier for a Vietnamese YouTube channel called "THE HIDDEN SELF".
The channel covers topics around psychology, finance, geopolitics, and self-development.

Classify each video into EXACTLY ONE category:
- "tai-chinh" (finance, money, investing, crypto, gold, markets)
- "dia-chinh-tri" (geopolitics, wars, US-China, currency wars, global power)
- "tam-ly" (psychology, behavior, FOMO, manipulation, relationships)
- "phat-trien" (self-development, discipline, growth, masculinity, success)
- "kinh-doanh" (business, entrepreneurship, marketing, market analysis)
- "van-hoa" (culture, literature, movies, book reviews, philosophy)
- "xa-hoi" (society, social issues, modern life, technology impact)

Output JSON: { "categories": { "0": "tai-chinh", "1": "tam-ly", ... } }
Only use the index numbers from the input.`,
      userMessage: `Classify these videos:\n${titleList}`,
    });

    try {
      const parsed = JSON.parse(result.content);
      Object.assign(allCategories, parsed.categories);
    } catch (e) {
      log(`Failed to parse batch ${i}-${i + BATCH_SIZE}: ${e.message}`, '⚠️');
    }

    log(`Classified batch ${i}-${Math.min(i + BATCH_SIZE, videos.length)}`, '🏷️');
  }

  return allCategories;
}

// =====================================================
// STEP 3: EXTRACT VOICE DNA (LLM on top videos)
// =====================================================

async function extractVoiceDNA(videos) {
  log('Extracting Voice DNA from top videos...', '🧬');

  // Pick top 25 by views, ensure category diversity
  const topVideos = videos
    .filter(v => v.cleanTranscript && v.cleanTranscript.length > 5000)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 25);

  // Extract opening (first 600 chars), middle hook, and closing (last 400 chars) from each
  const samples = topVideos.map(v => {
    const t = v.cleanTranscript;
    const opening = t.substring(0, 600);
    const mid = t.substring(Math.floor(t.length * 0.4), Math.floor(t.length * 0.4) + 400);
    const closing = t.substring(t.length - 400);
    return `--- [${v.category || 'unknown'}] ${v.title} (${v.viewCount} views) ---
MỞ BÀI: ${opening}
GIỮA BÀI: ${mid}
KẾT BÀI: ${closing}`;
  });

  const sampleText = samples.join('\n\n');

  const result = await chat({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    maxTokens: 8192,
    systemPrompt: `Bạn là chuyên gia phân tích phong cách sáng tạo nội dung. 
Nhiệm vụ: Phân tích CHÍNH XÁC phong cách viết/nói của kênh YouTube "THE HIDDEN SELF" từ các mẫu transcript dưới đây.

Tạo ra một BẢN HƯỚNG DẪN VOICE (Voice DNA) mà một AI writer có thể dùng để viết content y hệt phong cách này.

Output phải bao gồm:
1. TỔNG QUAN GIỌNG VĂN (2-3 câu)
2. CÔNG THỨC MỞ BÀI - Phân tích pattern mở bài, đưa 5 template cụ thể
3. CẤU TRÚC THÂN BÀI - Flow logic, cách chuyển ý, cách dẫn dắt
4. CÔNG THỨC KẾT BÀI - Pattern kết, call to action
5. TỪ VỰNG ĐẶC TRƯNG - 30-40 cụm từ/ẩn dụ hay dùng nhất (nhóm theo theme)
6. CÁCH DÙNG ẨN DỤ - Pattern so sánh, ví von đặc trưng
7. CÂU SIGNATURE - Các câu lặp lại nhiều nhất
8. NHỊP CÂU - Cách xây dựng momentum (câu ngắn-dài, liệt kê, đối lập)
9. TONE MATRIX - Phân bổ % các tone: nghiêm túc, khiêu khích, triết lý, cảm xúc, data, hài hước
10. CẤM KỴ - Những gì KHÔNG BAO GIỜ xuất hiện trong giọng văn này

Viết bằng TIẾNG VIỆT, format Markdown. Chi tiết, cụ thể, có ví dụ thực tế từ transcript.`,
    userMessage: `Phân tích Voice DNA từ 25 video top của kênh THE HIDDEN SELF:\n\n${sampleText}`,
  });

  return result.content;
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🧹 TRANSCRIPT PROCESSOR — Clean → Classify → Voice DNA');
  console.log('═'.repeat(60) + '\n');

  // Load raw data
  log('Loading raw transcripts...');
  const raw = JSON.parse(await readFile(INPUT, 'utf-8'));
  const videos = raw.videos.filter(v => v.hasTranscript && v.transcriptChars > 100);
  log(`Loaded ${videos.length} videos with transcripts`);

  // STEP 1: Clean
  log('=== STEP 1: CLEANING TRANSCRIPTS ===', '🧹');
  let totalRemoved = 0;
  for (const video of videos) {
    const original = video.transcript;
    video.cleanTranscript = cleanTranscript(original);
    const diff = original.length - video.cleanTranscript.length;
    totalRemoved += diff;
  }
  log(`Cleaned! Removed ${totalRemoved.toLocaleString()} chars of noise (${(totalRemoved / raw.stats.totalChars * 100).toFixed(1)}%)`, '✅');

  // STEP 2: Classify
  log('=== STEP 2: CLASSIFYING TOPICS ===', '🏷️');
  const categories = await classifyTopics(videos);
  
  const catCounts = {};
  for (let i = 0; i < videos.length; i++) {
    const cat = categories[String(i)] || 'unknown';
    videos[i].category = cat;
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  log('Category distribution:', '📊');
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat}: ${count} videos`);
  }

  // Save clean transcripts
  const cleanData = {
    channel: raw.channel,
    processedAt: new Date().toISOString(),
    totalVideos: videos.length,
    categories: catCounts,
    videos: videos.map(v => ({
      videoId: v.videoId,
      title: v.title,
      duration: v.duration,
      viewCount: v.viewCount,
      uploadDate: v.uploadDate,
      category: v.category,
      transcriptChars: v.cleanTranscript.length,
      transcript: v.cleanTranscript,
    })),
  };
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(cleanData, null, 2), 'utf-8');
  log(`Saved clean transcripts: ${OUTPUT}`, '✅');

  // STEP 3: Voice DNA
  log('=== STEP 3: EXTRACTING VOICE DNA ===', '🧬');
  const voiceDNA = await extractVoiceDNA(videos);
  
  const voiceContent = `# 🎙️ VOICE DNA — THE HIDDEN SELF
<!-- Auto-generated from ${videos.length} video transcripts -->
<!-- Generated: ${new Date().toISOString()} -->

${voiceDNA}
`;

  await mkdir(dirname(VOICE_FILE), { recursive: true });
  await writeFile(VOICE_FILE, voiceContent, 'utf-8');
  log(`Saved Voice DNA: ${VOICE_FILE}`, '✅');

  // Summary
  const cleanSize = JSON.stringify(cleanData).length;
  console.log('\n' + '═'.repeat(60));
  console.log('  📊 PROCESSING COMPLETE');
  console.log('═'.repeat(60));
  console.log(`  Videos processed:    ${videos.length}`);
  console.log(`  Noise removed:       ${totalRemoved.toLocaleString()} chars`);
  console.log(`  Categories:          ${Object.keys(catCounts).length}`);
  console.log(`  Clean data size:     ${(cleanSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Voice DNA:           ${voiceContent.length.toLocaleString()} chars`);
  console.log(`  Output files:`);
  console.log(`    → ${OUTPUT}`);
  console.log(`    → ${VOICE_FILE}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  log(`Fatal: ${err.message}`, '❌');
  console.error(err);
  process.exit(1);
});
