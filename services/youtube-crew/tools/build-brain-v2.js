#!/usr/bin/env node
/**
 * BRAIN v2 Builder — Synthesizes knowledge from 815+ videos into a condensed BRAIN.md
 *
 * Strategy:
 * 1. Read all indexes → group videos by category
 * 2. Pick top 5 videos per category (by views, or by source diversity)
 * 3. Read transcripts (truncated to ~4000 chars each)
 * 4. Call Gemini to extract key themes, hooks, mental models
 * 5. Assemble BRAIN_v2.md
 *
 * Usage:
 *   node tools/build-brain-v2.js
 *   node tools/build-brain-v2.js --dry-run    # Preview what would be processed
 *   node tools/build-brain-v2.js --samples 3  # Fewer samples per category
 */
import 'dotenv/config';
import { readFile, writeFile, readdir } from 'fs/promises';
import { existsSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const KNOWLEDGE_DIR = join(ROOT, 'src', 'knowledge');

const MODEL = process.env.DEFAULT_MODEL || 'gemini-2.0-flash';
const API_KEY = process.env.GOOGLE_AI_API_KEY;

// ─── Source Configuration ────────────────────────
const SOURCES = [
  { id: 'transcripts',       dir: 'transcripts',       label: 'THE HIDDEN SELF',       lang: 'vi/en' },
  { id: 'thuattaivan',       dir: 'thuattaivan',        label: 'THUẬT TÀI VẬN',        lang: 'vi' },
  { id: 'hormozi',           dir: 'hormozi',            label: 'Alex Hormozi',          lang: 'en' },
  { id: 'akbimatluatngam',   dir: 'akbimatluatngam',    label: 'Ẩn Bí Mật Luật Ngầm',  lang: 'vi' },
];

const CATEGORY_LABELS = {
  'tai-chinh':      'Tài Chính & Đầu Tư',
  'tam-ly':         'Tâm Lý & Bản Năng',
  'phat-trien':     'Phát Triển Bản Thân',
  'kinh-doanh':     'Kinh Doanh & Khởi Nghiệp',
  'dia-chinh-tri':  'Địa Chính Trị & Quyền Lực',
  'xa-hoi':         'Xã Hội & Văn Hóa',
  'suc-khoe':       'Sức Khỏe & Năng Lượng',
  'triet-hoc':      'Triết Học & Tâm Linh',
  'van-hoa':        'Văn Hóa & Nghệ Thuật',
};

// ─── CLI Args ────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SAMPLES_PER_CAT = parseInt(args.find((a, i) => args[i - 1] === '--samples') || '5');
const MAX_CHARS = 4000; // Truncate each transcript to this length

// ─── Gemini API Call ─────────────────────────────
async function callGemini(prompt, maxTokens = 4000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.4,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Load All Indexes ────────────────────────────
async function loadAllVideos() {
  const allVideos = [];
  
  for (const source of SOURCES) {
    const indexFile = join(KNOWLEDGE_DIR, source.dir, '_index.json');
    if (!existsSync(indexFile)) {
      console.warn(`⚠ Index not found: ${source.dir}/_index.json`);
      continue;
    }
    
    const data = JSON.parse(readFileSync(indexFile, 'utf-8'));
    for (const v of data.videos) {
      allVideos.push({
        ...v,
        sourceId: source.id,
        sourceLabel: source.label,
        sourceDir: source.dir,
        lang: source.lang,
      });
    }
  }
  
  return allVideos;
}

// ─── Group by Category & Pick Best Samples ───────
function pickSamples(allVideos) {
  // Group by category
  const byCategory = {};
  for (const v of allVideos) {
    const cat = v.category || 'uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(v);
  }
  
  const samples = {};
  
  for (const [cat, videos] of Object.entries(byCategory)) {
    if (cat === 'uncategorized') continue;
    
    // Sort by views descending, then prefer diversity across sources
    const sorted = [...videos].sort((a, b) => {
      const va = a.viewCount || a.views || 0;
      const vb = b.viewCount || b.views || 0;
      return vb - va;
    });
    
    // Pick top N, ensuring source diversity
    const picked = [];
    const usedSources = new Set();
    
    // First pass: one from each source
    for (const v of sorted) {
      if (picked.length >= SAMPLES_PER_CAT) break;
      if (!usedSources.has(v.sourceId)) {
        picked.push(v);
        usedSources.add(v.sourceId);
      }
    }
    
    // Second pass: fill remaining slots with top views
    for (const v of sorted) {
      if (picked.length >= SAMPLES_PER_CAT) break;
      if (!picked.includes(v)) {
        picked.push(v);
      }
    }
    
    samples[cat] = picked;
  }
  
  return samples;
}

// ─── Read Transcript Content ─────────────────────
async function readTranscript(video) {
  const filePath = join(KNOWLEDGE_DIR, video.sourceDir, video.file);
  if (!existsSync(filePath)) return null;
  
  let content = readFileSync(filePath, 'utf-8');
  
  // Remove markdown header (# Title)
  content = content.replace(/^#[^\n]*\n+/, '');
  
  // Truncate to MAX_CHARS
  if (content.length > MAX_CHARS) {
    content = content.slice(0, MAX_CHARS) + '\n... [truncated]';
  }
  
  return content;
}

// ─── Synthesize Category Knowledge ───────────────
async function synthesizeCategory(category, videos) {
  const label = CATEGORY_LABELS[category] || category;
  
  // Read all transcripts
  const transcriptData = [];
  for (const v of videos) {
    const content = await readTranscript(v);
    if (content) {
      transcriptData.push({
        title: v.title,
        source: v.sourceLabel,
        content: content,
      });
    }
  }
  
  if (transcriptData.length === 0) {
    return { category, label, result: null };
  }
  
  // Build prompt
  const transcriptsText = transcriptData.map((t, i) => 
    `=== VIDEO ${i + 1}: "${t.title}" (${t.source}) ===\n${t.content}`
  ).join('\n\n');
  
  const prompt = `Bạn là chuyên gia phân tích nội dung cho kênh YouTube "Đứng Dậy Đi" — kênh về phát triển bản thân, tài chính, tâm lý cho người Việt.

Phân tích ${transcriptData.length} video transcript dưới đây thuộc chủ đề "${label}" và tổng hợp thành một phần trong "BRAIN" — tài liệu kiến thức cốt lõi cho Script Writer.

NHIỆM VỤ:
1. Rút ra 4-6 THEME chính (tên theme bằng tiếng Việt, có giải thích ngắn)
2. Mỗi theme có 2-3 bullet points cô đọng nhất
3. Mỗi theme có 1 "Hook" — câu gây ấn tượng mạnh có thể dùng mở đầu video
4. Thêm "VN" (Vietnamese context) nếu có
5. Tạo 5-8 "Viral Hooks" tổng hợp từ tất cả video

FORMAT (Markdown):
### [Tên Theme] ([Nguồn video])
- Bullet point 1
- Bullet point 2
- Hook: *"câu hook ấn tượng"*
- VN: Áp dụng cho Việt Nam

Cuối cùng thêm bảng VIRAL HOOKS:
| # | Hook | Nguồn |
|---|------|-------|
| 1 | "..." | Video title |

CHÚ Ý:
- Viết NGẮN GỌN, mỗi theme 3-5 dòng
- Hook phải gây tò mò, provocative, emotional
- Ưu tiên insight thực tế, không lý thuyết suông
- Output THUẦN tiếng Việt (kể cả quote từ video tiếng Anh → dịch sang Vietnamese)

TRANSCRIPTS:
${transcriptsText}`;

  console.log(`  📝 Synthesizing ${label} (${transcriptData.length} samples, ${transcriptsText.length} chars)...`);
  
  const result = await callGemini(prompt, 3000);
  return { category, label, result };
}

// ─── Build Final BRAIN.md v2 ─────────────────────
async function buildBrainV2(categoryResults) {
  // Read existing BRAIN.md for the book knowledge section
  let existingBrain = '';
  try {
    existingBrain = readFileSync(join(KNOWLEDGE_DIR, 'BRAIN.md'), 'utf-8');
  } catch {}
  
  // Build the new document
  const sections = [];
  
  sections.push(`# YOUTUBE PODCAST BRAIN v2 — 28 Sách + 815 Video

> Đây là "bộ não" nâng cấp của kênh "Đứng Dậy Đi".
> **Nguồn kiến thức**: 28 cuốn sách + 815 video từ 4 kênh tham khảo.
> Script Writer sử dụng file này để viết script có chiều sâu, đa dạng nguồn.

---

## NGUỒN DỮ LIỆU

| Nguồn | Số lượng | Ngôn ngữ | Chủ đề chính |
|-------|----------|-----------|--------------|
| 📚 28 Cuốn Sách | 28 books | EN/VI | Tài chính, Tâm lý, Kinh doanh, Kỷ luật |
| 🎬 THE HIDDEN SELF | 315 videos | VI | Tâm lý, Tài chính, Địa chính trị |
| 💰 THUẬT TÀI VẬN | 210 videos | VI | Tài chính, Kinh doanh |
| 🔥 Alex Hormozi | 120 videos | EN | Kinh doanh, Phát triển bản thân |
| 🧠 Ẩn Bí Mật Luật Ngầm | 170 videos | VI | Tâm lý, Phát triển bản thân |

**Tổng: 28 sách + 815 video = 843 nguồn kiến thức**

---
`);
  
  // ── Part 1: Book Knowledge (from existing BRAIN.md) ──
  // Extract themes from existing BRAIN.md
  const bookSection = existingBrain
    .replace(/^# YOUTUBE PODCAST BRAIN[^\n]*\n+/, '')
    .replace(/^>[^\n]*\n+/gm, '')
    .replace(/---\n*/g, '')
    .trim();
  
  sections.push(`## PHẦN A: KIẾN THỨC TỪ SÁCH (28 cuốn)

${bookSection}

---
`);

  // ── Part 2: Video Knowledge (synthesized) ──
  sections.push(`## PHẦN B: KIẾN THỨC TỪ VIDEO (815 video)

> Được tổng hợp từ 4 kênh tham khảo bằng AI.
> Mỗi chủ đề có themes + hooks + Vietnamese context.

---
`);

  // Sort categories by video count (from the results)
  const catOrder = ['tai-chinh', 'tam-ly', 'kinh-doanh', 'phat-trien', 'dia-chinh-tri', 'xa-hoi', 'suc-khoe', 'triet-hoc', 'van-hoa'];
  
  for (const cat of catOrder) {
    const r = categoryResults.find(cr => cr.category === cat);
    if (r?.result) {
      sections.push(`### VIDEO THEME: ${r.label.toUpperCase()}

${r.result}

---
`);
    }
  }

  // ── Part 3: Cross-Reference Map ──
  sections.push(`## PHẦN C: BẢN ĐỒ LIÊN KẾT KIẾN THỨC

\`\`\`
BRAIN MAP — Sách ↔ Video Cross-Reference
├── Tài Chính & Đầu Tư
│   ├── Sách: Psychology of Money, Intelligent Investor, Millionaire Fastlane
│   ├── Video: THUẬT TÀI VẬN (131), THE HIDDEN SELF (92), Hormozi (10)
│   └── Tổng: 7 sách + 233 video
├── Tâm Lý & Bản Năng
│   ├── Sách: Thinking Fast & Slow, Predictably Irrational, Influence, EQ
│   ├── Video: Ẩn Bí Mật (111), THE HIDDEN SELF (68), THUẬT TÀI VẬN (22)
│   └── Tổng: 6 sách + 203 video
├── Kinh Doanh & Khởi Nghiệp
│   ├── Sách: Zero to One, Lean Startup, E-Myth, Rework, Crossing the Chasm
│   ├── Video: Hormozi (76), THUẬT TÀI VẬN (39), THE HIDDEN SELF (14)
│   └── Tổng: 10 sách + 139 video
├── Phát Triển Bản Thân
│   ├── Sách: Deep Work, No Excuses, High Output Management
│   ├── Video: THE HIDDEN SELF (33), Hormozi (27), Ẩn Bí Mật (24)
│   └── Tổng: 3 sách + 98 video
├── Địa Chính Trị & Quyền Lực
│   ├── Sách: The Crowd
│   ├── Video: THE HIDDEN SELF (67), THUẬT TÀI VẬN (3)
│   └── Tổng: 1 sách + 70 video
├── Xã Hội & Văn Hóa
│   ├── Video: THE HIDDEN SELF (19+22), Ẩn Bí Mật (4), Hormozi (1)
│   └── Tổng: 0 sách + 46 video
├── Sức Khỏe & Năng Lượng
│   ├── Video: Ẩn Bí Mật (11), Hormozi (4)
│   └── Tổng: 0 sách + 15 video
└── Triết Học & Tâm Linh
    ├── Video: Ẩn Bí Mật (5)
    └── Tổng: 0 sách + 5 video
\`\`\`

---

## SỬ DỤNG BRAIN

### Cho Script Writer:
1. **Mở đầu**: Tìm Hook từ bảng VIRAL HOOKS  
2. **Thân bài**: Cross-reference sách + video cùng chủ đề
3. **Kết bài**: Dùng Mental Model Map để tạo framework  
4. **Deep dive**: Dùng \`searchTranscripts(topic)\` để tìm transcript gốc

### Cho Research:
- Dùng \`searchBooks(keyword)\` cho sách
- Dùng \`searchTranscripts(keyword)\` cho video
- Cross-check nhiều nguồn cùng chủ đề để viết sâu hơn
`);

  return sections.join('\n');
}

// ─── Main ────────────────────────────────────────
async function main() {
  console.log('🧠 BRAIN v2 Builder');
  console.log(`   Model: ${MODEL}`);
  console.log(`   Samples per category: ${SAMPLES_PER_CAT}`);
  console.log(`   Dry run: ${DRY_RUN}\n`);
  
  // Step 1: Load all videos
  console.log('📂 Loading all indexes...');
  const allVideos = await loadAllVideos();
  console.log(`   Total: ${allVideos.length} videos\n`);
  
  // Step 2: Pick samples
  console.log('🎯 Picking sample videos...');
  const samples = pickSamples(allVideos);
  
  let totalSamples = 0;
  for (const [cat, videos] of Object.entries(samples)) {
    const label = CATEGORY_LABELS[cat] || cat;
    console.log(`   ${label}: ${videos.length} samples`);
    for (const v of videos) {
      console.log(`     - [${v.sourceLabel}] ${v.title.slice(0, 70)}`);
    }
    totalSamples += videos.length;
  }
  console.log(`   Total samples: ${totalSamples}\n`);
  
  if (DRY_RUN) {
    console.log('🏁 Dry run complete. Use without --dry-run to generate BRAIN v2.');
    return;
  }
  
  // Step 3: Synthesize each category
  console.log('🤖 Synthesizing knowledge with Gemini...\n');
  const results = [];
  
  for (const [cat, videos] of Object.entries(samples)) {
    try {
      const result = await synthesizeCategory(cat, videos);
      results.push(result);
      console.log(`   ✅ ${result.label} done\n`);
    } catch (err) {
      console.error(`   ❌ ${cat}: ${err.message}\n`);
      results.push({ category: cat, label: CATEGORY_LABELS[cat], result: null });
    }
    
    // Small delay between API calls
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Step 4: Build BRAIN v2
  console.log('\n📝 Building BRAIN_v2.md...');
  const brainContent = await buildBrainV2(results);
  
  const outputPath = join(KNOWLEDGE_DIR, 'BRAIN_v2.md');
  await writeFile(outputPath, brainContent, 'utf-8');
  
  console.log(`\n🧠 BRAIN v2 written: ${outputPath}`);
  console.log(`   Size: ${(brainContent.length / 1024).toFixed(1)} KB`);
  console.log(`   Categories synthesized: ${results.filter(r => r.result).length}/${results.length}`);
  
  // Step 5: Optionally replace BRAIN.md
  const backupPath = join(KNOWLEDGE_DIR, 'BRAIN_v1.md');
  const currentBrain = join(KNOWLEDGE_DIR, 'BRAIN.md');
  if (existsSync(currentBrain) && !existsSync(backupPath)) {
    const { copyFileSync } = await import('fs');
    copyFileSync(currentBrain, backupPath);
    console.log(`   Backup: BRAIN.md → BRAIN_v1.md`);
  }
  
  // Copy v2 as the new BRAIN.md
  const { copyFileSync } = await import('fs');
  copyFileSync(outputPath, currentBrain);
  console.log(`   ✅ BRAIN.md updated to v2!`);
  
  console.log('\n🏁 Done!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
