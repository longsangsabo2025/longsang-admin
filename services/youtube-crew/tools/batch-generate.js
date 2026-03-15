#!/usr/bin/env node
/**
 * 🚀 BATCH SCRIPT GENERATOR — Generate multiple scripts at once
 * 
 * Usage:
 *   # From JSON file
 *   node tools/batch-generate.js --file topics.json
 * 
 *   # From CLI topics
 *   node tools/batch-generate.js --topics "Topic 1" "Topic 2" "Topic 3"
 * 
 *   # With options
 *   node tools/batch-generate.js --file topics.json --concurrency 2 --script-only
 * 
 *   # Auto-generate topics from knowledge base
 *   node tools/batch-generate.js --auto 10
 */
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chat, estimateCost } from '../src/core/llm.js';
import {
  loadVoice, searchBrain, searchBooks, searchTranscripts,
  getKnowledgeStats, loadBrain,
} from '../src/knowledge/loader.js';

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

// Collect all topics after --topics flag
function getTopicsFromCLI() {
  const idx = process.argv.indexOf('--topics');
  if (idx === -1) return [];
  const topics = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) break;
    topics.push(process.argv[i]);
  }
  return topics;
}

const CONFIG = {
  file: getArg('file'),
  topics: getTopicsFromCLI(),
  auto: parseInt(getArg('auto') || '0', 10),
  concurrency: parseInt(getArg('concurrency') || '1', 10),
  scriptOnly: hasFlag('script-only'),
  dryRun: hasFlag('dry-run'),
  model: getArg('model') || process.env.DEFAULT_MODEL || 'gemini-2.0-flash',
  scriptModel: getArg('script-model') || process.env.SCRIPT_WRITER_MODEL || 'gemini-2.0-flash',
  outputDir: getArg('output-dir') || join(ROOT, 'output', '_batch'),
};

const log = (icon, msg) => console.log(`${icon} [${new Date().toLocaleTimeString('vi-VN')}] ${msg}`);
const stats = { tokensIn: 0, tokensOut: 0, cost: 0, calls: 0, success: 0, failed: 0 };

function trackCost(model, result) {
  stats.tokensIn += result.tokens.input;
  stats.tokensOut += result.tokens.output;
  stats.cost += estimateCost(model, result.tokens.input, result.tokens.output);
  stats.calls++;
}

// ─── VOICE CHEAT SHEET ────────────────────────────────────────
const VOICE_CHEAT_SHEET = `🎯 SIGNATURE INTRO:
"Chào mừng đến với ĐỨNG DẬY ĐI — nơi có những sự thật mà cuộc sống đã giấu bạn, và sức mạnh mà bạn quên mình đang có."

🎯 SIGNATURE OUTRO:
"Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."

🎯 CÂU CỬA MIỆNG — dùng ÍT NHẤT 4 câu:
• "Và đó mới chỉ là phần nổi của tảng băng."
• "Sự thật phũ phàng là..."
• "Hay nói cho chính xác hơn..."
• "Đây không phải ý kiến cá nhân — đây là dữ liệu."
• "Cuộc đời không dạy bạn bằng lời — cuộc đời dạy bằng mất mát."

🎯 ẨN DỤ — dùng ÍT NHẤT 3:
• ma trận • bánh xe hamster • lò xay thịt • trò chơi/luật chơi • nô lệ tài chính • hệ điều hành`;

// ─── AUTO TOPIC GENERATOR ─────────────────────────────────────
async function autoGenerateTopics(count) {
  log('🤖', `Auto-generating ${count} topics from knowledge base...`);
  
  const brain = await loadBrain();
  const kStats = await getKnowledgeStats();
  const categories = Object.keys(kStats.categories || {});
  
  const result = await chat({
    model: CONFIG.model,
    systemPrompt: `Bạn là Content Strategist cho kênh YouTube "ĐỨNG DẬY ĐI" — kênh podcast phát triển bản thân, tài chính, tâm lý.
Target: Nam 20-35 tuổi Việt Nam, đang tìm hướng đi trong cuộc sống.
Tone: Triết gia bóng tối, chân thật, không sáo rỗng.`,
    userMessage: `Dựa trên knowledge base gồm ${kStats.totalVideos} videos, ${kStats.totalBooks} sách, các danh mục: ${categories.join(', ')}.

Brain excerpt:
${brain.substring(0, 3000)}

Hãy đề xuất ${count} chủ đề video MỚI, CHƯA LÀM, thu hút views cao.

RULES:
1. Mỗi chủ đề phải có góc nhìn ĐỘC ĐÁO, không generic
2. Tiêu đề dạng gây tò mò, clickbait lành mạnh
3. Mix đều các category
4. Tránh trùng với các videos đã có
5. Mỗi topic kèm 1 dòng mô tả ngắn

OUTPUT JSON:
{ "topics": [{ "title": "...", "description": "...", "category": "..." }] }`,
    temperature: 0.9,
    maxTokens: 4096,
    responseFormat: 'json',
    agentId: 'batch-auto-topics',
  });
  trackCost(CONFIG.model, result);

  try {
    const parsed = JSON.parse(result.content);
    return parsed.topics || [];
  } catch {
    log('⚠️', 'Failed to parse auto-generated topics');
    return [];
  }
}

// ─── GENERATE SINGLE SCRIPT ──────────────────────────────────
async function generateSingleScript(topic, index, total) {
  const startTime = Date.now();
  const title = typeof topic === 'string' ? topic : topic.title;
  const description = typeof topic === 'string' ? '' : (topic.description || '');
  
  log('✍️', `[${index + 1}/${total}] Generating: "${title}"`);

  // Load knowledge context
  let voiceCondensed = '';
  let brainContext = '';
  let bookContext = '';
  let transcriptContext = '';

  try {
    const voice = await loadVoice();
    voiceCondensed = voice ? voice.substring(0, 2000) : '';
    brainContext = await searchBrain(title, 2000);
    const books = await searchBooks(title, 2);
    bookContext = books.map(b => `[${b.title}]: ${b.excerpt}`).join('\n\n');
    const transcripts = await searchTranscripts(title, 2);
    transcriptContext = transcripts.map(t => `[${t.title}]: ${t.excerpt}`).join('\n\n');
  } catch (e) {
    log('⚠️', `Knowledge partial: ${e.message}`);
  }

  const knowledgeBlock = [
    brainContext ? `[BRAIN]\n${brainContext}` : '',
    bookContext ? `[SÁCH]\n${bookContext}` : '',
    transcriptContext ? `[VIDEO REF]\n${transcriptContext}` : '',
  ].filter(Boolean).join('\n\n');

  const prompt = `Viết NGUYÊN VĂN script podcast cho kênh ĐỨNG DẬY ĐI.

TOPIC: ${title}
${description ? `MÔ TẢ: ${description}` : ''}

--- VOICE DNA ---
${voiceCondensed.substring(0, 1500)}

--- 🎯 CHEAT SHEET (BẮT BUỘC) ---
${VOICE_CHEAT_SHEET}

--- KIẾN THỨC THAM KHẢO ---
${knowledgeBlock}

CRITICAL REQUIREMENTS:
1. TỐI THIỂU 1800 từ (mục tiêu 2200-2500)
2. Format: --- [TIMESTAMP] SECTION_NAME ---
   Sections: HOOK, SIGNATURE_INTRO, BOI_CANH, GIAI_PHAU, TWIST, DUNG_DAY, KET
3. GIAI_PHAU = phần DÀI NHẤT (800-1200 từ)
4. ÍT NHẤT 3 ẩn dụ + 4 câu cửa miệng
5. Voice markers: [PAUSE], [EMPHASIS], [SLOW], [INTENSE]
6. CHỈ output script text, KHÔNG wrapper`;

  const result = await chat({
    model: CONFIG.scriptModel,
    systemPrompt: `Bạn là Script Writer của kênh "ĐỨNG DẬY ĐI".
Giọng: Triết gia bóng tối với trái tim chiến binh.
Viết MỌI TỪ host sẽ đọc. Viết cho TAI nghe.
TỔNG TỐI THIỂU: 1800 từ. MỤC TIÊU: 2200-2500.`,
    userMessage: prompt,
    temperature: 0.85,
    maxTokens: 16384,
    agentId: 'batch-script-writer',
  });
  trackCost(CONFIG.scriptModel, result);

  // Parse
  const wordCount = result.content.split(/\s+/).filter(Boolean).length;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Generate metadata
  let metadata = {};
  try {
    const metaResult = await chat({
      model: CONFIG.model,
      systemPrompt: 'Generate YouTube metadata in JSON.',
      userMessage: `Topic: "${title}". Output JSON: { "title": "Vietnamese clickable (max 60)", "seoKeywords": ["5 keywords"], "thumbnailIdea": "concept", "description": "YouTube desc 2 lines" }`,
      temperature: 0.5,
      maxTokens: 512,
      responseFormat: 'json',
      agentId: 'batch-meta',
    });
    trackCost(CONFIG.model, metaResult);
    try { metadata = JSON.parse(metaResult.content); } catch {}
  } catch {}

  log('✅', `[${index + 1}/${total}] Done: ${wordCount} words, ${elapsed}s`);

  return {
    title: metadata.title || title,
    originalTopic: title,
    description,
    script: result.content,
    wordCount,
    metadata,
    durationMs: Date.now() - startTime,
    cost: estimateCost(CONFIG.scriptModel, result.tokens.input, result.tokens.output),
  };
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log(`
╔══════════════════════════════════════════════════╗
║       🚀 BATCH SCRIPT GENERATOR v1.0             ║
║       Generate multiple scripts at once           ║
╚══════════════════════════════════════════════════╝`);

  const startTime = Date.now();

  // ── Collect topics ──
  let topics = [];

  if (CONFIG.file) {
    const raw = await readFile(CONFIG.file, 'utf-8');
    const parsed = JSON.parse(raw);
    topics = parsed.topics || parsed;
    log('📄', `Loaded ${topics.length} topics from ${CONFIG.file}`);
  } else if (CONFIG.topics.length > 0) {
    topics = CONFIG.topics.map(t => ({ title: t }));
    log('📝', `${topics.length} topics from CLI`);
  } else if (CONFIG.auto > 0) {
    topics = await autoGenerateTopics(CONFIG.auto);
    log('🤖', `Auto-generated ${topics.length} topics`);
  } else {
    console.log(`
Usage:
  node tools/batch-generate.js --file topics.json
  node tools/batch-generate.js --topics "Topic 1" "Topic 2"
  node tools/batch-generate.js --auto 10
  
Options:
  --concurrency 2       Parallel generation (default: 1)
  --script-only         Skip storyboard
  --model gemini-2.0-flash
  --script-model gemini-2.0-flash
  --dry-run             Preview only
  --output-dir ./out
`);
    process.exit(0);
  }

  if (topics.length === 0) {
    log('❌', 'No topics to process');
    process.exit(1);
  }

  // ── Dry run check ──
  if (CONFIG.dryRun) {
    log('🏃', 'DRY RUN — Would generate:');
    topics.forEach((t, i) => {
      const title = typeof t === 'string' ? t : t.title;
      log('  ', `${i + 1}. ${title}`);
    });
    log('  ', `Model: ${CONFIG.scriptModel} | Concurrency: ${CONFIG.concurrency}`);
    process.exit(0);
  }

  // ── Create batch output dir ──
  const batchId = `batch_${Date.now()}`;
  const batchDir = join(CONFIG.outputDir, batchId);
  await mkdir(batchDir, { recursive: true });

  // ── Generate scripts ──
  const results = [];

  if (CONFIG.concurrency <= 1) {
    // Sequential
    for (let i = 0; i < topics.length; i++) {
      try {
        const result = await generateSingleScript(topics[i], i, topics.length);
        results.push(result);
        stats.success++;
        
        // Save individual script
        const slug = result.originalTopic.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '-').substring(0, 50);
        await writeFile(join(batchDir, `${i + 1}_${slug}.txt`), result.script, 'utf-8');
      } catch (err) {
        log('❌', `[${i + 1}/${topics.length}] Failed: ${err.message}`);
        results.push({ title: topics[i].title || topics[i], error: err.message });
        stats.failed++;
      }
    }
  } else {
    // Parallel with concurrency limit
    for (let i = 0; i < topics.length; i += CONFIG.concurrency) {
      const batch = topics.slice(i, i + CONFIG.concurrency);
      const promises = batch.map((topic, j) =>
        generateSingleScript(topic, i + j, topics.length)
          .then(result => {
            stats.success++;
            return result;
          })
          .catch(err => {
            log('❌', `Failed: ${err.message}`);
            stats.failed++;
            return { title: topic.title || topic, error: err.message };
          })
      );
      const batchResults = await Promise.all(promises);
      
      for (let j = 0; j < batchResults.length; j++) {
        results.push(batchResults[j]);
        if (!batchResults[j].error) {
          const r = batchResults[j];
          const slug = r.originalTopic.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '-').substring(0, 50);
          await writeFile(join(batchDir, `${i + j + 1}_${slug}.txt`), r.script, 'utf-8');
        }
      }
    }
  }

  // ── Save batch report ──
  const report = {
    batchId,
    generatedAt: new Date().toISOString(),
    config: {
      model: CONFIG.scriptModel,
      concurrency: CONFIG.concurrency,
    },
    stats: {
      total: topics.length,
      success: stats.success,
      failed: stats.failed,
      totalWords: results.filter(r => !r.error).reduce((s, r) => s + (r.wordCount || 0), 0),
      totalCost: stats.cost,
      totalCalls: stats.calls,
      durationMs: Date.now() - startTime,
    },
    results: results.map(r => ({
      title: r.title || r.originalTopic,
      originalTopic: r.originalTopic,
      wordCount: r.wordCount || 0,
      cost: r.cost || 0,
      durationMs: r.durationMs || 0,
      error: r.error || null,
      metadata: r.metadata || null,
    })),
  };
  
  await writeFile(join(batchDir, '_batch-report.json'), JSON.stringify(report, null, 2), 'utf-8');

  // ── Summary ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalWords = results.filter(r => !r.error).reduce((s, r) => s + (r.wordCount || 0), 0);
  
  console.log(`
╔══════════════════════════════════════════════════╗
║  ✅ BATCH GENERATION COMPLETE                    ║
╠══════════════════════════════════════════════════╣
║  Total: ${String(topics.length).padEnd(4)} scripts                          ║
║  Success: ${String(stats.success).padEnd(3)} | Failed: ${String(stats.failed).padEnd(3)}                   ║
║  Words: ${String(totalWords).padEnd(6)} total                            ║
║  Cost: $${stats.cost.toFixed(4).padEnd(10)}                            ║
║  Time: ${elapsed}s                                      ║
║  Output: ${batchDir.substring(batchDir.length - 39).padEnd(39)}║
╚══════════════════════════════════════════════════╝`);
}

// Export for API usage
export { generateSingleScript, autoGenerateTopics };

main().catch(err => {
  console.error(`\n❌ Fatal: ${err.message}`);
  process.exit(1);
});
