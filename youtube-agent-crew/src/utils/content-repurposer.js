/**
 * Content Repurposer — Transforms YouTube pipeline output into multi-format content
 *
 * Takes completed pipeline output (script, metadata, topic) and generates:
 *   1. SEO-optimized blog post (Vietnamese, Markdown)
 *   2. Social media snippets (Twitter, LinkedIn, Facebook, Instagram, TikTok)
 *   3. Email newsletter digest
 *
 * Uses Gemini 2.0 Flash for generation.
 * Callable as post-pipeline hook or standalone CLI.
 */
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_ROOT = path.resolve(__dirname, '../../output');

function getGenAI() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY or GOOGLE_AI_KEY in environment');
  return new GoogleGenerativeAI(key);
}

async function geminiGenerate(prompt, { json = false } = {}) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ─── Pipeline Data Loader ────────────────────────────────────────────────────

async function loadPipelineData(pipelineId) {
  const resultsPath = path.join(OUTPUT_ROOT, pipelineId, 'results.json');
  const raw = await fs.readFile(resultsPath, 'utf-8');
  const data = JSON.parse(raw);

  const topic = data.input?.topic || '';

  let script = '';
  try {
    const scriptData = JSON.parse(data.podcast_script || '{}');
    script = (scriptData.script || []).map(s => s.text).join('\n\n');
    if (!script) script = data['script-writer_output'] || '';
  } catch {
    script = data['script-writer_output'] || data.podcast_script || '';
  }

  let metadata = {};
  try {
    metadata = JSON.parse(data.publish_metadata || '{}');
  } catch {
    metadata = {};
  }

  let harvested = {};
  try {
    const raw = data.harvested_content || data.harvester_output || '';
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    harvested = JSON.parse(cleaned);
  } catch {
    harvested = {};
  }

  let curated = {};
  try {
    curated = JSON.parse(data.curated_knowledge || '{}');
  } catch {
    curated = {};
  }

  const ytMeta = metadata?.metadata?.youtube || {};

  return {
    topic,
    script,
    title: ytMeta.title || topic,
    description: ytMeta.description || '',
    tags: ytMeta.tags || [],
    seo: metadata?.seo || {},
    harvested,
    curated,
    pipelineId,
  };
}

function stripVoiceTags(text) {
  return text
    .replaceAll('[PAUSE]', '')
    .replaceAll('[EMPHASIS]', '')
    .replaceAll('[SLOW]', '')
    .replaceAll('[INTENSE]', '')
    .replaceAll('[WHISPER]', '')
    .replaceAll(/---\s*\[\d+:\d+\]\s*\w+\s*---/g, '')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Blog Post Generator ─────────────────────────────────────────────────────

async function generateBlogPost(data, log) {
  log('Generating SEO-optimized blog post...');
  const cleanScript = stripVoiceTags(data.script);

  const prompt = `Bạn là một content writer chuyên nghiệp. Hãy chuyển đổi script podcast sau thành một bài blog SEO-optimized bằng tiếng Việt.

**Chủ đề:** ${data.title}
**SEO keyword chính:** ${data.seo?.primaryKeyword || data.topic}
**SEO keywords phụ:** ${(data.seo?.secondaryKeywords || []).join(', ')}
**Tags:** ${(data.tags || []).slice(0, 10).join(', ')}

**Script podcast:**
${cleanScript.substring(0, 6000)}

**Yêu cầu format output (Markdown):**
1. Tiêu đề H1 hấp dẫn (có chứa keyword chính)
2. Meta description (1-2 câu, dưới 160 ký tự) — đặt trong blockquote
3. Mục lục (Table of Contents) với anchor links
4. 4-6 phần nội dung chính với heading H2, mỗi phần 150-300 từ
5. Key takeaways (3-5 điểm chính, dạng bullet list)
6. Phần "Xem video đầy đủ" với embed reference placeholder: \`{{VIDEO_EMBED}}\`
7. Call-to-action cuối bài (đăng ký kênh, chia sẻ bài viết)
8. Sử dụng bold, italic, bullet points hợp lý
9. Giọng văn: chuyên nghiệp nhưng gần gũi, tương tự podcast
10. Tổng độ dài: 1000-1500 từ

Trả về NGUYÊN VĂN Markdown, không wrap trong code block.`;

  return await geminiGenerate(prompt);
}

// ─── Social Media Snippets ───────────────────────────────────────────────────

async function generateSocialMedia(data, log) {
  log('Generating social media snippets...');
  const cleanScript = stripVoiceTags(data.script);

  const prompt = `Bạn là một social media manager chuyên nghiệp. Từ nội dung podcast sau, hãy tạo các bài đăng mạng xã hội.

**Chủ đề:** ${data.title}
**Mô tả:** ${data.description?.substring(0, 500) || ''}
**Tags:** ${(data.tags || []).slice(0, 10).join(', ')}

**Nội dung podcast (tóm tắt):**
${cleanScript.substring(0, 4000)}

Trả về JSON object với cấu trúc sau:
{
  "twitter": [
    { "text": "...", "charCount": 280 }
  ],
  "linkedin": {
    "text": "...",
    "wordCount": 250
  },
  "facebook": {
    "text": "...",
    "wordCount": 150
  },
  "instagram": [
    { "caption": "...", "hashtags": ["...", "..."] }
  ],
  "tiktok": {
    "scriptIdea": "...",
    "duration": "60s",
    "hook": "...",
    "keyPoints": ["...", "..."],
    "cta": "..."
  }
}

**Yêu cầu chi tiết:**
- **Twitter (5 tweets):** Mỗi tweet dưới 280 ký tự, có hashtags, quotable và viral-worthy. Tiếng Việt.
- **LinkedIn (1 post):** Giọng chuyên nghiệp, 200-300 từ, có insight sâu, kết bằng câu hỏi mở. Tiếng Việt.
- **Facebook (1 post):** Giọng thân thiện, 100-200 từ, dễ share, có emoji vừa phải. Tiếng Việt.
- **Instagram (3 captions):** Mỗi caption có hashtags (15-20), giọng truyền cảm hứng. Tiếng Việt.
- **TikTok (1 script idea):** Kịch bản 60 giây, hook mạnh, key points nhanh, CTA rõ ràng. Tiếng Việt.

Trả về CHÍNH XÁC JSON, không thêm text giải thích.`;

  const raw = await geminiGenerate(prompt, { json: true });
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  }
}

// ─── Email Newsletter ────────────────────────────────────────────────────────

async function generateNewsletter(data, log) {
  log('Generating email newsletter...');
  const cleanScript = stripVoiceTags(data.script);

  const prompt = `Bạn là một email marketer chuyên nghiệp. Hãy viết một email newsletter giới thiệu tập podcast mới.

**Chủ đề podcast:** ${data.title}
**Mô tả:** ${data.description?.substring(0, 500) || ''}
**Key takeaways từ script:**
${cleanScript.substring(0, 3000)}

**Sách tham khảo trong podcast:** ${(data.curated?.relatedBooks || []).map(b => b.title).join(', ') || 'N/A'}

**Yêu cầu output (Markdown):**
1. **3 Subject line options** (mỗi dòng dưới 60 ký tự, tạo sự tò mò)
2. **Preview text** (1 câu, dưới 90 ký tự)
3. **Email body:**
   - Lời chào thân thiện
   - Giới thiệu ngắn gọn về tập podcast mới (2-3 câu)
   - 3-4 highlights/key takeaways từ tập podcast (bullet points)
   - Quote hay nhất từ podcast
   - CTA button text: "Xem Video Ngay" với placeholder link {{VIDEO_URL}}
   - Lời kết ngắn gọn, truyền cảm hứng
4. **Tổng độ dài:** 200-350 từ
5. **Giọng văn:** Thân thiện, chuyên nghiệp, tạo FOMO nhẹ
6. **Ngôn ngữ:** Tiếng Việt

Trả về NGUYÊN VĂN Markdown, không wrap trong code block.`;

  return await geminiGenerate(prompt);
}

// ─── File Writers ────────────────────────────────────────────────────────────

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function saveBlogPost(pipelineId, content) {
  const dir = path.join(OUTPUT_ROOT, pipelineId, 'repurposed');
  await ensureDir(dir);
  const filePath = path.join(dir, 'blog-post.md');
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

async function saveSocialMedia(pipelineId, content) {
  const dir = path.join(OUTPUT_ROOT, pipelineId, 'repurposed');
  await ensureDir(dir);
  const filePath = path.join(dir, 'social-media.json');
  await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');
  return filePath;
}

async function saveNewsletter(pipelineId, content) {
  const dir = path.join(OUTPUT_ROOT, pipelineId, 'repurposed');
  await ensureDir(dir);
  const filePath = path.join(dir, 'newsletter.md');
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Repurpose pipeline output into blog post, social media snippets, and newsletter.
 *
 * @param {string} pipelineId — e.g. "youtube-podcast_VLZq5UZRCB"
 * @param {object} [opts]
 * @param {boolean} [opts.blog=true]
 * @param {boolean} [opts.social=true]
 * @param {boolean} [opts.newsletter=true]
 * @param {(msg: string, level?: string) => void} [opts.log]
 * @returns {object} — { blog, social, newsletter, files }
 */
export async function repurposeContent(pipelineId, opts = {}) {
  const log = opts.log || ((msg) => console.log(`[ContentRepurposer] ${msg}`));
  const doBlog = opts.blog !== false;
  const doSocial = opts.social !== false;
  const doNewsletter = opts.newsletter !== false;

  log(`Starting content repurpose for pipeline: ${pipelineId}`);

  let data;
  try {
    data = await loadPipelineData(pipelineId);
  } catch (err) {
    log(`Failed to load pipeline data: ${err.message}`, 'error');
    return { error: err.message };
  }

  if (!data.script || data.script.length < 100) {
    log('Script too short or missing — skipping repurpose', 'warn');
    return { skipped: true, reason: 'no_script' };
  }

  const results = { files: [], timestamp: new Date().toISOString() };

  const tasks = [];

  if (doBlog) {
    tasks.push(
      generateBlogPost(data, log)
        .then(async (content) => {
          const filePath = await saveBlogPost(pipelineId, content);
          results.blog = { generated: true, file: filePath, wordCount: content.split(/\s+/).length };
          results.files.push(filePath);
          log(`Blog post saved: ${filePath}`);
        })
        .catch((err) => {
          results.blog = { generated: false, error: err.message };
          log(`Blog post generation failed: ${err.message}`, 'error');
        })
    );
  }

  if (doSocial) {
    tasks.push(
      generateSocialMedia(data, log)
        .then(async (content) => {
          const filePath = await saveSocialMedia(pipelineId, content);
          results.social = {
            generated: true,
            file: filePath,
            platforms: Object.keys(content),
            tweetCount: content.twitter?.length || 0,
            instagramCaptions: content.instagram?.length || 0,
          };
          results.files.push(filePath);
          log(`Social media snippets saved: ${filePath}`);
        })
        .catch((err) => {
          results.social = { generated: false, error: err.message };
          log(`Social media generation failed: ${err.message}`, 'error');
        })
    );
  }

  if (doNewsletter) {
    tasks.push(
      generateNewsletter(data, log)
        .then(async (content) => {
          const filePath = await saveNewsletter(pipelineId, content);
          results.newsletter = { generated: true, file: filePath, wordCount: content.split(/\s+/).length };
          results.files.push(filePath);
          log(`Newsletter saved: ${filePath}`);
        })
        .catch((err) => {
          results.newsletter = { generated: false, error: err.message };
          log(`Newsletter generation failed: ${err.message}`, 'error');
        })
    );
  }

  await Promise.allSettled(tasks);

  const successCount = results.files.length;
  const totalCount = [doBlog, doSocial, doNewsletter].filter(Boolean).length;
  log(`Content repurpose complete: ${successCount}/${totalCount} outputs generated`);

  return results;
}

// ─── Standalone CLI ──────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const idIdx = args.indexOf('--pipeline-id');
  if (idIdx === -1 || !args[idIdx + 1]) {
    console.error('Usage: node src/utils/content-repurposer.js --pipeline-id <pipelineId>');
    console.error('');
    console.error('Options:');
    console.error('  --pipeline-id <id>   Pipeline run ID (e.g. youtube-podcast_VLZq5UZRCB)');
    console.error('  --no-blog            Skip blog post generation');
    console.error('  --no-social          Skip social media generation');
    console.error('  --no-newsletter      Skip newsletter generation');
    process.exit(1);
  }

  const pipelineId = args[idIdx + 1];
  const opts = {
    blog: !args.includes('--no-blog'),
    social: !args.includes('--no-social'),
    newsletter: !args.includes('--no-newsletter'),
  };

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Content Repurposer — Pipeline: ${pipelineId}`);
  console.log(`${'='.repeat(50)}\n`);

  const result = await repurposeContent(pipelineId, opts);

  if (result.error) {
    console.error(`\nFailed: ${result.error}`);
    process.exit(1);
  }

  console.log('\n--- Results ---');
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nFiles generated: ${result.files?.length || 0}`);
  (result.files || []).forEach(f => console.log(`  ${f}`));
}

const isMain = process.argv[1] && (
  process.argv[1].endsWith('content-repurposer.js') ||
  process.argv[1].includes('content-repurposer')
);
if (isMain) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export default repurposeContent;
