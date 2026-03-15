#!/usr/bin/env node
/**
 * 🎬 VIDEO FACTORY — Script + Hailuo Storyboard Generator
 * 
 * All-in-one tool: Transcript/Topic → Podcast Script → Hailuo 2.3 Storyboard
 * 
 * Usage:
 *   # From a transcript in knowledge base
 *   node tools/video-factory.js --transcript __8QxKuzKKE
 * 
 *   # From a topic (AI generates everything)
 *   node tools/video-factory.js --topic "Bí mật thẻ tín dụng"
 * 
 *   # From a raw text file
 *   node tools/video-factory.js --file ./my-script.txt
 * 
 *   # Options
 *   --scenes 12           Number of scenes (8-15, default: 12)
 *   --style dark-cinematic Style preset (dark-cinematic|bright-modern|storytelling)
 *   --duration 6           Per-scene duration in seconds (default: 6)
 *   --script-only          Only generate script, skip storyboard
 *   --storyboard-only      Only generate storyboard from existing script
 *   --output-dir ./out     Output directory (default: ./output/_video-factory)
 *   --dry-run              Show plan without calling LLM
 *   --model gpt-4o-mini    Override LLM model
 *   --no-knowledge         Skip knowledge base injection
 */
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chat, estimateCost } from '../src/core/llm.js';
import { loadVoice, searchBrain, searchBooks, searchTranscripts, loadTranscript } from '../src/knowledge/loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── CLI ARGS ────────────────────────────────────────────────
function getArg(name) {
  const eqForm = process.argv.find(a => a.startsWith(`--${name}=`));
  if (eqForm) return eqForm.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(`--${name}`);
  if (idx > -1 && idx + 1 < process.argv.length && !process.argv[idx + 1].startsWith('--'))
    return process.argv[idx + 1];
  return null;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const CONFIG = {
  transcript: getArg('transcript'),
  topic: getArg('topic'),
  file: getArg('file'),
  scenes: parseInt(getArg('scenes') || '12', 10),
  style: getArg('style') || 'dark-cinematic',
  duration: parseInt(getArg('duration') || '6', 10),
  scriptOnly: hasFlag('script-only'),
  storyboardOnly: hasFlag('storyboard-only'),
  outputDir: getArg('output-dir') || join(ROOT, 'output', '_video-factory'),
  dryRun: hasFlag('dry-run'),
  model: getArg('model') || process.env.DEFAULT_MODEL || 'gpt-4o-mini',
  scriptModel: getArg('script-model') || process.env.SCRIPT_WRITER_MODEL || 'gpt-4o',
  noKnowledge: hasFlag('no-knowledge'),
};

// ─── STYLE PRESETS ───────────────────────────────────────────
const STYLE_PRESETS = {
  'dark-cinematic': {
    name: 'Dark Cinematic',
    colorDesc: 'dark moody background (#0a0a0f), volumetric golden light, deep shadows, cinematic color grading',
    moodWords: 'cinematic, dramatic, dark, moody, atmospheric, volumetric lighting',
    transitions: ['slow dissolve', 'fade through black', 'match cut', 'light leak transition'],
  },
  'bright-modern': {
    name: 'Bright Modern',
    colorDesc: 'clean white/light gray background, soft natural lighting, pastel accent colors, minimal shadows',
    moodWords: 'clean, modern, minimal, bright, professional, soft lighting',
    transitions: ['quick cut', 'slide transition', 'zoom through', 'whip pan'],
  },
  'storytelling': {
    name: 'Storytelling',
    colorDesc: 'warm earthy tones, golden hour lighting, film grain texture, vintage color palette',
    moodWords: 'warm, nostalgic, storybook, textured, film grain, golden hour',
    transitions: ['slow crossfade', 'page turn', 'gentle zoom', 'soft dissolve'],
  },
};

// ─── HAILUO 2.3 MOTION LIBRARY ──────────────────────────────
const MOTIONS = {
  establishing: ['slow zoom out revealing scene', 'aerial drone descending', 'wide dolly forward'],
  intimate: ['slow push in to subject', 'subtle orbit around subject', 'gentle dolly in, shallow DOF'],
  dramatic: ['dramatic crane up', 'fast zoom in', 'dutch angle tilt', 'vertical tilt up revealing scale'],
  transition: ['dolly through doorway', 'pan left to right revealing', 'tracking shot following subject'],
  closing: ['slow zoom out to wide', 'crane up rising above scene', 'orbit + zoom out'],
  data: ['overhead top-down shot', 'slow pan across details', 'macro close-up with rack focus'],
};

// ─── LOGGING ─────────────────────────────────────────────────
const log = (icon, msg) => console.log(`${icon} [${new Date().toLocaleTimeString('vi-VN')}] ${msg}`);
const stats = { tokensIn: 0, tokensOut: 0, cost: 0, calls: 0 };

function trackCost(model, result) {
  stats.tokensIn += result.tokens.input;
  stats.tokensOut += result.tokens.output;
  stats.cost += estimateCost(model, result.tokens.input, result.tokens.output);
  stats.calls++;
}

// ─── VOICE DNA CONDENSED ─────────────────────────────────────
function condenseVoice(voice) {
  const sections = [];
  const patterns = [
    /## 2\. CÔNG THỨC MỞ BÀI[\s\S]*?(?=## 3\.)/,
    /## 4\. CÔNG THỨC KẾT BÀI[\s\S]*?(?=## 5\.)/,
    /## 5\. TỪ VỰNG DNA[\s\S]*?(?=## 6\.)/,
    /## 7\. CÂU SIGNATURE[\s\S]*?(?=## 8\.)/,
  ];
  for (const pat of patterns) {
    const m = voice.match(pat);
    if (m) sections.push(m[0].trim());
  }
  return sections.length > 0 ? sections.join('\n\n') : voice.substring(0, 3000);
}

const VOICE_CHEAT_SHEET = `🎯 SIGNATURE INTRO (CHÍNH XÁC trong SIGNATURE_INTRO):
"Chào mừng đến với ĐỨNG DẬY ĐI — nơi có những sự thật mà cuộc sống đã giấu bạn, và sức mạnh mà bạn quên mình đang có."

🎯 SIGNATURE OUTRO (CHÍNH XÁC cuối KET):
"Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."

🎯 CÂU CỬA MIỆNG — dùng ÍT NHẤT 4 câu:
• "Và đó mới chỉ là phần nổi của tảng băng."
• "Sự thật phũ phàng là..."
• "Hay nói cho chính xác hơn..."
• "Đây không phải ý kiến cá nhân — đây là dữ liệu."
• "Cuộc đời không dạy bạn bằng lời — cuộc đời dạy bằng mất mát."
• "Biết rồi sao? Bạn vẫn phải sống. Vẫn phải chiến đấu."

🎯 ẨN DỤ — dùng ÍT NHẤT 3:
• ma trận • bánh xe hamster • lò xay thịt • trò chơi/luật chơi • nô lệ tài chính • hệ điều hành

🎯 CTA TRƯỚC OUTRO:
"Nếu bạn thấy video này khiến bạn suy nghĩ, hãy chia sẻ cho một người bạn đang cần nghe điều này. Đừng quên đăng ký kênh và nhấn chuông để không bỏ lỡ những tập tiếp theo."`;

// ═══════════════════════════════════════════════════════════════
// STEP 1: LOAD INPUT
// ═══════════════════════════════════════════════════════════════
async function loadInput() {
  if (CONFIG.transcript) {
    log('📥', `Loading transcript: ${CONFIG.transcript}`);
    const content = await loadTranscript(CONFIG.transcript);
    if (!content) {
      // Fallback: try direct file read
      const paths = [
        join(ROOT, 'src/knowledge/transcripts-thuattaivan', `${CONFIG.transcript}.md`),
        join(ROOT, 'src/knowledge/transcripts-thehiddenself', `${CONFIG.transcript}.md`),
      ];
      for (const p of paths) {
        if (existsSync(p)) {
          const raw = await readFile(p, 'utf-8');
          const title = raw.match(/^#\s+(.+)/m)?.[1] || CONFIG.transcript;
          return { source: 'transcript', id: CONFIG.transcript, title, content: raw };
        }
      }
      throw new Error(`Transcript not found: ${CONFIG.transcript}`);
    }
    const title = content.match(/^#\s+(.+)/m)?.[1] || CONFIG.transcript;
    return { source: 'transcript', id: CONFIG.transcript, title, content };
  }

  if (CONFIG.file) {
    log('📄', `Loading file: ${CONFIG.file}`);
    const content = await readFile(CONFIG.file, 'utf-8');
    const title = content.match(/^#\s+(.+)/m)?.[1] || CONFIG.file;
    return { source: 'file', id: CONFIG.file, title, content };
  }

  if (CONFIG.topic) {
    log('💡', `Topic mode: "${CONFIG.topic}"`);
    return { source: 'topic', id: CONFIG.topic.replace(/\s+/g, '-').substring(0, 50), title: CONFIG.topic, content: '' };
  }

  throw new Error('Provide --transcript <videoId>, --topic "<text>", or --file <path>');
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: GENERATE SCRIPT
// ═══════════════════════════════════════════════════════════════
async function generateScript(input) {
  log('✍️', 'Generating podcast script...');

  // Load knowledge context
  let voiceCondensed = '';
  let brainContext = '';
  let bookContext = '';
  let transcriptContext = '';

  if (!CONFIG.noKnowledge) {
    try {
      const voice = await loadVoice();
      voiceCondensed = voice ? condenseVoice(voice) : '';
      brainContext = await searchBrain(input.title, 3000);
      const books = await searchBooks(input.title, 3);
      bookContext = books.map(b => `[${b.title}]: ${b.excerpt}`).join('\n\n');
      const transcripts = await searchTranscripts(input.title, 2);
      transcriptContext = transcripts.map(t => `[${t.title} (${t.viewCount} views)]: ${t.excerpt}`).join('\n\n');
      log('🧠', `Knowledge: voice ${voiceCondensed.length}c, brain ${brainContext.length}c, books ${books.length}, refs ${transcripts.length}`);
    } catch (e) {
      log('⚠️', `Knowledge load partial: ${e.message}`);
    }
  }

  const sourceContent = input.content
    ? `\n--- NỘI DUNG GỐC ---\n${input.content.substring(0, 8000)}`
    : '';

  const knowledgeBlock = [
    brainContext ? `[BRAIN - Framework & Mental Models]\n${brainContext}` : '',
    bookContext ? `[SÁCH CHI TIẾT]\n${bookContext}` : '',
    transcriptContext ? `[VIDEO THAM KHẢO]\n${transcriptContext}` : '',
  ].filter(Boolean).join('\n\n');

  const prompt = `Viết NGUYÊN VĂN script podcast cho kênh ĐỨNG DẬY ĐI.

TOPIC: ${input.title}
${sourceContent}

--- VOICE DNA ---
${voiceCondensed}

--- 🎯 CHEAT SHEET (BẮT BUỘC) ---
${VOICE_CHEAT_SHEET}

--- KIẾN THỨC THAM KHẢO ---
${knowledgeBlock}

CRITICAL REQUIREMENTS:
1. TỐI THIỂU 1800 từ (mục tiêu 2200-2500). < 1800 = THẤT BẠI.
2. Format: --- [TIMESTAMP] SECTION_NAME ---
   Sections: HOOK, SIGNATURE_INTRO, BOI_CANH, GIAI_PHAU, TWIST, DUNG_DAY, KET
3. GIAI_PHAU = phần DÀI NHẤT (800-1200 từ, 4-5 điểm chính)
4. ÍT NHẤT 3 ẩn dụ + 4 câu cửa miệng từ Cheat Sheet
5. BẮT BUỘC trích dẫn sách/framework từ Brain Knowledge
6. CHỈ output script text, KHÔNG wrapper
7. Voice markers: [PAUSE], [EMPHASIS], [SLOW], [INTENSE], [WHISPER]`;

  const systemPrompt = `Bạn là Script Writer của kênh "ĐỨNG DẬY ĐI".
Giọng: Triết gia bóng tối với trái tim chiến binh.
Tagline: "Nơi có những sự thật mà cuộc sống đã giấu bạn, và sức mạnh mà bạn quên mình đang có."
Viết MỌI TỪ host sẽ đọc. Viết cho TAI nghe. Nhịp "The Wave": dài xây momentum → ngắn đóng đinh.
TỔNG TỐI THIỂU: 1800 từ. MỤC TIÊU: 2200-2500.
CẤM KỴ: Giọng sách giáo khoa | YouTuber hype | Motivational sáo rỗng | Câu > 40 từ liên tục`;

  const result = await chat({
    model: CONFIG.scriptModel,
    systemPrompt,
    userMessage: prompt,
    temperature: 0.85,
    maxTokens: 16384,
    agentId: 'video-factory-script',
  });
  trackCost(CONFIG.scriptModel, result);

  // Parse sections
  const parsed = parseSections(result.content);
  log('✅', `Script: ${parsed.sections.length} sections, ${parsed.totalWords} words (≈${(parsed.totalWords / 150).toFixed(1)} min)`);

  // Generate metadata
  let metadata = {};
  try {
    const metaResult = await chat({
      model: CONFIG.model,
      systemPrompt: 'Generate YouTube metadata in JSON. Be concise.',
      userMessage: `Script topic: "${input.title}"
Hook: "${parsed.sections[0]?.text?.substring(0, 200) || ''}"

JSON: { "title": "Vietnamese clickable title (max 60 chars)", "titleEN": "English SEO", "seoKeywords": ["5-8 keywords"], "thumbnailIdea": "dark, provocative concept", "description": "YouTube description" }`,
      temperature: 0.5,
      maxTokens: 1024,
      responseFormat: 'json',
      agentId: 'video-factory-meta',
    });
    trackCost(CONFIG.model, metaResult);
    try { metadata = JSON.parse(metaResult.content); } catch {}
  } catch (e) {
    log('⚠️', `Metadata skipped: ${e.message}`);
  }

  return {
    title: metadata.title || input.title,
    titleEN: metadata.titleEN || '',
    script: parsed,
    metadata,
    rawText: result.content,
  };
}

function parseSections(rawText) {
  const sectionRegex = /---\s*\[?(\d+:\d+)\]?\s*(.+?)\s*---/g;
  const matches = [];
  let match;
  while ((match = sectionRegex.exec(rawText)) !== null) {
    matches.push({
      timestamp: match[1],
      section: match[2].trim().toLowerCase().replace(/\s+/g, '_'),
      index: match.index,
      headerEnd: match.index + match[0].length,
    });
  }

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextStart = matches[i + 1] ? matches[i + 1].index : rawText.length;
    const text = rawText.substring(current.headerEnd, nextStart).trim();
    sections.push({
      section: current.section,
      timestamp: current.timestamp,
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
  }

  if (sections.length === 0 && rawText.trim()) {
    sections.push({ section: 'full_script', timestamp: '0:00', text: rawText.trim(), wordCount: rawText.trim().split(/\s+/).length });
  }

  return {
    sections,
    totalWords: sections.reduce((s, x) => s + x.wordCount, 0),
    totalChars: sections.reduce((s, x) => s + x.text.length, 0),
  };
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: GENERATE HAILUO 2.3 STORYBOARD
// ═══════════════════════════════════════════════════════════════
async function generateStoryboard(scriptData) {
  log('🎬', `Generating Hailuo 2.3 storyboard (${CONFIG.scenes} scenes, ${CONFIG.duration}s each)...`);

  const preset = STYLE_PRESETS[CONFIG.style] || STYLE_PRESETS['dark-cinematic'];
  const allText = scriptData.script.sections.map(s => s.text).join('\n\n');

  // Split script into dialogue chunks for each scene
  const totalWords = scriptData.script.totalWords;
  const wordsPerScene = Math.ceil(totalWords / CONFIG.scenes);

  const prompt = `You are an expert Minimax Hailuo AI 2.3 video prompt engineer.

INPUT SCRIPT (Vietnamese podcast, ${scriptData.script.totalWords} words, ≈${(scriptData.script.totalWords / 150).toFixed(0)} minutes):
---
${allText.substring(0, 12000)}
---

TASK: Create a ${CONFIG.scenes}-scene storyboard. Each scene is ${CONFIG.duration} seconds.

STYLE PRESET: "${preset.name}"
- Colors: ${preset.colorDesc}
- Mood: ${preset.moodWords}
- Transitions: ${preset.transitions.join(', ')}

OUTPUT FORMAT — Return ONLY a JSON array:
[
  {
    "scene": 1,
    "dialogue": "Exact Vietnamese dialogue for this 6s segment (extract from script, ~20-30 words)",
    "prompt": "Hailuo 2.3 prompt: [Subject] + [Action/Pose] + [Setting/Background] + [Camera angle/movement] + [Lighting] + [Style keywords]. Must include ONE motion keyword from: zoom in, zoom out, slow pan left, slow pan right, tilt up, tilt down, dolly forward, dolly back, orbit, crane up, crane down, tracking shot, push in, pull out. End with style: ${preset.moodWords}",
    "motion": "primary camera motion keyword used",
    "transition": "transition to next scene"
  }
]

RULES:
1. Each "dialogue" = exact Vietnamese text the narrator says during that ${CONFIG.duration}s (~20-30 words max)
2. Each "prompt" must follow Hailuo 2.3 syntax: Subject + Action + Camera + Style + Motion
3. Cover the FULL script from HOOK to KET — first scene = hook, last scene = closing/CTA
4. NO two consecutive scenes use the same camera motion
5. Visual variety: alternate between close-up, medium, wide, aerial, macro, conceptual
6. Scene prompts must MATCH the dialogue content (not random visuals)
7. Include at least 2 "conceptual/metaphorical" scenes (for abstract ideas)
8. Transition flow: opener (establishing) → story (intimate) → climax (dramatic) → resolve (wide)
9. ALL prompts in English
10. Return ONLY the JSON array, no markdown wrapper`;

  const result = await chat({
    model: CONFIG.model,
    systemPrompt: 'You are a professional video storyboard creator specialized in Minimax Hailuo AI 2.3 text-to-video prompts. Output only valid JSON arrays.',
    userMessage: prompt,
    temperature: 0.7,
    maxTokens: 8192,
    responseFormat: 'json',
    agentId: 'video-factory-storyboard',
  });
  trackCost(CONFIG.model, result);

  let scenes = [];
  try {
    const parsed = JSON.parse(result.content);
    scenes = Array.isArray(parsed) ? parsed : (parsed.scenes || parsed.storyboard || []);
  } catch (e) {
    log('⚠️', `JSON parse failed, attempting fix...`);
    const jsonMatch = result.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try { scenes = JSON.parse(jsonMatch[0]); } catch {}
    }
  }

  log('✅', `Storyboard: ${scenes.length} scenes generated`);
  return { scenes, style: preset, config: { scenes: CONFIG.scenes, duration: CONFIG.duration } };
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: FORMAT OUTPUT
// ═══════════════════════════════════════════════════════════════
function formatMarkdownTable(storyboard) {
  const lines = [
    `| # | Thoại (${CONFIG.duration}s) | Hailuo 2.3 Prompt | Motion | Transition | Duration |`,
    `|---|-----------|-------------------|--------|------------|----------|`,
  ];

  for (const scene of storyboard.scenes) {
    const dialogue = (scene.dialogue || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const prompt = (scene.prompt || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const motion = scene.motion || '';
    const transition = scene.transition || '';
    lines.push(`| ${scene.scene} | ${dialogue} | ${prompt} | ${motion} | ${transition} | ${CONFIG.duration}s |`);
  }

  return lines.join('\n');
}

function formatPromptList(storyboard) {
  return storyboard.scenes.map((s, i) =>
    `### Scene ${s.scene || i + 1}\n**Thoại:** ${s.dialogue}\n**Prompt:** \`${s.prompt}\`\n**Motion:** ${s.motion} | **Transition:** ${s.transition}\n`
  ).join('\n');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log(`
╔══════════════════════════════════════════════════╗
║          🎬 VIDEO FACTORY v1.0                   ║
║          Script + Hailuo Storyboard              ║
╚══════════════════════════════════════════════════╝`);

  const startTime = Date.now();

  // ── Validate ──
  if (!CONFIG.transcript && !CONFIG.topic && !CONFIG.file) {
    console.log(`
Usage:
  node tools/video-factory.js --transcript <videoId>
  node tools/video-factory.js --topic "Your topic"
  node tools/video-factory.js --file ./script.txt

Options:
  --scenes 12            Scenes count (8-15)
  --style dark-cinematic Style: dark-cinematic|bright-modern|storytelling
  --duration 6           Per-scene seconds
  --script-only          Only generate script
  --storyboard-only      Only storyboard (needs --file with existing script)
  --model gpt-4o-mini    LLM model for storyboard
  --script-model gpt-4o  LLM model for script
  --no-knowledge         Skip knowledge base
  --dry-run              Preview without LLM calls
  --output-dir ./out     Output directory
`);
    process.exit(0);
  }

  // ── Load input ──
  const input = await loadInput();
  log('📋', `Input: [${input.source}] "${input.title}" (${input.content.length} chars)`);

  if (CONFIG.dryRun) {
    log('🏃', 'DRY RUN — would generate:');
    log('  ', `Script model: ${CONFIG.scriptModel}`);
    log('  ', `Storyboard model: ${CONFIG.model}`);
    log('  ', `Scenes: ${CONFIG.scenes} × ${CONFIG.duration}s = ${CONFIG.scenes * CONFIG.duration}s`);
    log('  ', `Style: ${CONFIG.style}`);
    log('  ', `Output: ${CONFIG.outputDir}`);
    process.exit(0);
  }

  // ── Create output dir ──
  const runId = `${input.id}_${Date.now()}`;
  const outDir = join(CONFIG.outputDir, runId);
  await mkdir(outDir, { recursive: true });

  let scriptData = null;
  let storyboard = null;

  // ── STEP 1: Script ──
  if (!CONFIG.storyboardOnly) {
    scriptData = await generateScript(input);

    // Save script outputs
    await writeFile(join(outDir, 'script.txt'), scriptData.rawText, 'utf-8');
    await writeFile(join(outDir, 'script.json'), JSON.stringify({
      title: scriptData.title,
      titleEN: scriptData.titleEN,
      metadata: scriptData.metadata,
      stats: {
        totalWords: scriptData.script.totalWords,
        totalChars: scriptData.script.totalChars,
        sections: scriptData.script.sections.length,
        estimatedMinutes: (scriptData.script.totalWords / 150).toFixed(1),
      },
      sections: scriptData.script.sections,
    }, null, 2), 'utf-8');

    log('💾', `Script saved → ${outDir}/script.txt + script.json`);
  } else {
    // Load existing script from file
    const content = input.content || await readFile(CONFIG.file, 'utf-8');
    const parsed = parseSections(content);
    scriptData = { title: input.title, script: parsed, rawText: content };
    log('📄', `Using existing script: ${parsed.totalWords} words`);
  }

  // ── STEP 2: Storyboard ──
  if (!CONFIG.scriptOnly) {
    storyboard = await generateStoryboard(scriptData);

    // Save storyboard outputs
    await writeFile(join(outDir, 'storyboard.json'), JSON.stringify(storyboard, null, 2), 'utf-8');

    // Save as markdown table
    const mdContent = `# 🎬 STORYBOARD: ${scriptData.title}

> Generated: ${new Date().toLocaleString('vi-VN')}
> Style: ${storyboard.style.name} | Scenes: ${storyboard.scenes.length} × ${CONFIG.duration}s = ${storyboard.scenes.length * CONFIG.duration}s
> Model: ${CONFIG.model}

## Storyboard Table

${formatMarkdownTable(storyboard)}

## Prompt List (Copy-Paste Ready)

${formatPromptList(storyboard)}

## Production Notes

| Setting | Value |
|---------|-------|
| Total scenes | ${storyboard.scenes.length} |
| Total duration | ${storyboard.scenes.length * CONFIG.duration}s (${(storyboard.scenes.length * CONFIG.duration / 60).toFixed(1)} min highlight) |
| Style preset | ${storyboard.style.name} |
| Color palette | ${storyboard.style.colorDesc} |
| Transitions | ${storyboard.style.transitions.join(', ')} |

## How to Use

1. **Copy each prompt** → Paste into Minimax Hailuo 2.3 text-to-video
2. **Generate each scene** separately (${CONFIG.duration}s each)
3. **Import to editor** (DaVinci Resolve / Premiere / CapCut)
4. **Add voiceover** from VoxCPM TTS pipeline
5. **Match dialogue timing** to video clips
6. **Add transitions** as specified in table
7. **Export** → Upload to YouTube
`;
    await writeFile(join(outDir, 'storyboard.md'), mdContent, 'utf-8');

    // Save prompts-only file (easy copy-paste)
    const promptsOnly = storyboard.scenes.map((s, i) =>
      `[Scene ${s.scene || i + 1}]\n${s.prompt}\n`
    ).join('\n');
    await writeFile(join(outDir, 'prompts.txt'), promptsOnly, 'utf-8');

    log('💾', `Storyboard saved → ${outDir}/storyboard.md + storyboard.json + prompts.txt`);
  }

  // ── Summary ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`
╔══════════════════════════════════════════════════╗
║  ✅ VIDEO FACTORY COMPLETE                       ║
╠══════════════════════════════════════════════════╣
║  Title: ${(scriptData?.title || '').substring(0, 40).padEnd(40)}║
║  Script: ${scriptData ? `${scriptData.script.totalWords} words (≈${(scriptData.script.totalWords / 150).toFixed(0)} min)` : 'skipped'}${' '.repeat(Math.max(0, 27 - (scriptData ? `${scriptData.script.totalWords} words (≈${(scriptData.script.totalWords / 150).toFixed(0)} min)` : 'skipped').length))}║
║  Storyboard: ${storyboard ? `${storyboard.scenes.length} scenes × ${CONFIG.duration}s` : 'skipped'}${' '.repeat(Math.max(0, 34 - (storyboard ? `${storyboard.scenes.length} scenes × ${CONFIG.duration}s` : 'skipped').length))}║
║  Cost: $${stats.cost.toFixed(4)} (${stats.calls} LLM calls)${' '.repeat(Math.max(0, 29 - `$${stats.cost.toFixed(4)} (${stats.calls} LLM calls)`.length))}║
║  Time: ${elapsed}s${' '.repeat(Math.max(0, 41 - `${elapsed}s`.length))}║
║  Output: ${outDir.substring(outDir.length - 39).padEnd(39)}║
╚══════════════════════════════════════════════════╝`);
}

main().catch(err => {
  console.error(`\n❌ Fatal: ${err.message}`);
  if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
  process.exit(1);
});
