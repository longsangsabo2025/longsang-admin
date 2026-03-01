/**
 * AGENT: Transcript Cleaner
 * 
 * Reads raw YouTube auto-caption transcripts (Vietnamese) and:
 * 1. Fixes spelling/diacritical errors from auto-captions
 * 2. Removes sponsor/ad segments embedded in content
 * 3. Fixes proper nouns (people, brands, technical terms)
 * 4. Adds paragraph breaks for readability
 * 5. Preserves the original meaning and structure
 * 
 * Input: Raw transcript text (from .md files)
 * Output: Clean, corrected Vietnamese transcript
 * 
 * Model: GPT-4o-mini (cheap, fast, good enough for text correction)
 * Strategy: Process in chunks of ~4000 chars to stay within context limits
 *           and maintain quality. Overlap 200 chars between chunks for continuity.
 */
import { BaseAgent } from '../core/agent.js';
import { chat, estimateCost } from '../core/llm.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TRANSCRIPTS_DIR = join(__dirname, '..', 'knowledge', 'transcripts');

const SYSTEM_PROMPT = `Bạn là chuyên gia hiệu đính văn bản tiếng Việt. Nhiệm vụ: sửa lỗi transcript từ YouTube auto-captions.

NHIỆM VỤ CHÍNH:
1. SỬA LỖI CHÍNH TẢ & DẤU: YouTube auto-captions thường nuốt dấu, sai dấu, ghép sai âm tiết.
   Ví dụ phổ biến: "đoàn bảy" → "đòn bẩy", "lâu nhận" → "lợi nhuận", "tu" → "tự do", "sót" → "short",
   "tiy" → "tỷ", "lác" → "lạc", "bả" → "bản", "đỉ" → "đỉnh", "mải mê" đúng rồi, giữ nguyên.

2. SỬA THUẬT NGỮ CHUYÊN NGÀNH:
   - Crypto/Tài chính: "Chen Linking" → "Chainlink", "RVK" → "RWA", "Alcoin" → "Altcoin", 
     "Makinbeker" → "Market Maker", "Alflow" → "Outflow", "DXI" → "DXY", "mimcoin" → "memecoin",
     "marketer" → "Market Maker", "sport" → "spot", "Fidelity" giữ nguyên
   - Tâm lý: "dopamin" → "dopamine", "oxyin" → "oxy-tocin" hoặc giữ nếu ngữ cảnh đúng
   - Tên riêng: Giữ nguyên tên sách, tác giả, tổ chức nếu nhận ra được

3. XÓA ĐOẠN QUẢNG CÁO/SPONSOR: Các transcript thường xen đoạn quảng cáo giữa nội dung.
   DẤU HIỆU NHẬN BIẾT:
   - "Chậm một nhịp thôi, bạn sẽ thành người tối cổ ngay" → thường là intro sponsor
   - Gemini Pro, ChatGPT, Netflix, YouTube Premium, tài khoản... → sponsor segment
   - "Sơn Hải Nguyễn", "đầu tư thông minh bứt phá giới hạn" → sponsor
   - "Bảo hành thép", "lỗi là hoàn tiền", "cài đặt tận tình" → sponsor
   - "hỗ trợ 24/7", "link ở mô tả", "giảm giá X%" → sponsor
   - Bất kỳ đoạn nào quảng bá dịch vụ/sản phẩm không liên quan đến nội dung chính
   → XÓA TOÀN BỘ đoạn sponsor, KHÔNG giữ lại bất kỳ phần nào.

4. NGẮT ĐOẠN: Thêm xuống dòng (\\n\\n) khi chuyển ý, mỗi đoạn 3-5 câu. Tạo đoạn văn rõ ràng.

5. SỬA INTRO/OUTRO CỦA KÊNH: 
   - "Chào mừng đến với Self" → "Chào mừng đến với The Hidden Self"
   - "Chào mừng đến với The Hid" → "Chào mừng đến với The Hidden Self"
   - Giữ nguyên các câu signature của kênh nếu nhận ra được.

QUY TẮC TUYỆT ĐỐI:
- KHÔNG thêm thông tin mới, KHÔNG sáng tác nội dung
- KHÔNG thay đổi ý nghĩa, KHÔNG tóm tắt
- GIỮ NGUYÊN giọng văn, phong cách, cảm xúc của người nói
- CHỈ output văn bản đã sửa, KHÔNG thêm ghi chú hay giải thích
- Nếu không chắc một từ sai hay đúng → GIỮ NGUYÊN`;

const CHUNK_SIZE = 6000;    // chars per chunk (larger = fewer API calls, better context)
const CHUNK_OVERLAP = 200;  // overlap for continuity

// Known sponsor/ad patterns to strip in post-processing
const SPONSOR_PATTERNS = [
  // "Sơn Hải Nguyễn" sponsor block
  /Chậm một nhịp thôi[\s\S]*?bứt phá giới hạn\.?/gi,
  // Gemini Pro ad
  /Gemini Pro không chỉ trả lời[\s\S]*?(?:bứt phá giới hạn|lập tức|chu đáo)\.?/gi,
  // Generic sponsor with known markers
  /(?:Đừng bỏ lỡ công nghệ này|hãy đến Sơn Hải Nguyễn)[\s\S]*?(?:bứt phá giới hạn|lập tức|chu đáo)\.?/gi,
  // "link ở mô tả" type CTAs for sponsors
  /(?:Link (?:ở |trong )?mô tả|Link bên dưới|Mã giảm giá)[\s\S]{0,300}?(?:giảm giá|ưu đãi|click|nhấn vào)\.?/gi,
  // Standalone "Sơn Hải Nguyễn đầu tư thông minh" tagline
  /Sơn Hải Nguyễn[^.]*?(?:thông minh|giới hạn)\.?/gi,
  // Any "bảo hành thép, lỗi là hoàn tiền" block
  /[Bb]ảo hành thép[\s\S]*?(?:lập tức|chu đáo|tận tình)\.?/gi,
  // Netflix/YouTube Premium/ChatGPT account selling
  /[Ss]ẵn kho tài khoản[\s\S]*?(?:ChatGPT|CHGBT|Premium)\.?/gi,
];

export class TranscriptCleanerAgent extends BaseAgent {
  constructor() {
    super({
      id: 'transcript-cleaner',
      name: '🧹 Transcript Cleaner',
      role: 'Vietnamese Transcript Editor & Proofreader',
      model: process.env.TRANSCRIPT_CLEANER_MODEL || 'gpt-4o-mini',
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.3, // Low temperature for accurate corrections
      maxTokens: 8192,
    });
  }

  /**
   * Clean a single transcript
   * @param {string} text - Raw transcript text (without frontmatter)
   * @param {string} title - Video title (for context)
   * @param {string} category - Video category (for context)
   * @returns {Promise<{cleaned: string, stats: object}>}
   */
  async cleanTranscript(text, title = '', category = '') {
    if (!text || text.length < 50) {
      return { cleaned: text, stats: { chunks: 0, unchanged: true } };
    }

    // Split into chunks with overlap
    const chunks = this._splitIntoChunks(text);
    this.log(`Processing ${chunks.length} chunks (${text.length} chars) — "${title.substring(0, 50)}..."`);

    const cleanedChunks = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const contextHint = i === 0
        ? `Đây là PHẦN ĐẦU của transcript video "${title}" (chuyên mục: ${category}).`
        : `Đây là PHẦN ${i + 1}/${chunks.length} (tiếp nối từ đoạn trước).`;

      const userMessage = `${contextHint}\n\nHãy sửa lỗi và làm sạch đoạn transcript sau:\n\n---\n${chunk}\n---`;

      try {
        const result = await chat({
          model: this.model,
          systemPrompt: this.systemPrompt,
          userMessage,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
        });

        cleanedChunks.push(result.content.trim());
        totalInputTokens += result.tokens.input;
        totalOutputTokens += result.tokens.output;

      } catch (error) {
        this.log(`Chunk ${i + 1} failed: ${error.message}`, 'warn');
        // Fallback: keep original chunk
        cleanedChunks.push(chunk);
      }
    }

    // Merge chunks (remove overlap duplicates)
    let cleaned = this._mergeChunks(cleanedChunks);

    // Post-processing: strip any remaining sponsor segments the LLM missed
    cleaned = this._removeSponsorSegments(cleaned);

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    // Track costs
    this.totalTokens.input += totalInputTokens;
    this.totalTokens.output += totalOutputTokens;
    this.totalCost += estimateCost(this.model, totalInputTokens, totalOutputTokens);
    this.executionCount++;

    const stats = {
      chunks: chunks.length,
      originalChars: text.length,
      cleanedChars: cleaned.length,
      reduction: ((1 - cleaned.length / text.length) * 100).toFixed(1) + '%',
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cost: estimateCost(this.model, totalInputTokens, totalOutputTokens),
    };

    return { cleaned, stats };
  }

  /**
   * Process a single .md transcript file
   * Preserves YAML frontmatter, cleans body content
   * Saves cleaned version to transcripts-clean/{category}/{videoId}.md
   */
  async processFile(filePath, outputDir = null) {
    const content = await readFile(join(TRANSCRIPTS_DIR, filePath), 'utf-8');

    // Split frontmatter and body
    const fmMatch = content.match(/^(---[\s\S]*?---)\s*\n([\s\S]*)$/);
    if (!fmMatch) {
      this.log(`No frontmatter found: ${filePath}`, 'warn');
      return null;
    }

    const frontmatter = fmMatch[1];
    const body = fmMatch[2].trim();

    // Extract metadata from frontmatter
    const titleMatch = frontmatter.match(/title:\s*"(.+?)"/);
    const categoryMatch = frontmatter.match(/category:\s*"(.+?)"/);
    const title = titleMatch?.[1] || '';
    const category = categoryMatch?.[1] || '';

    // Extract just the transcript text (after the metadata header line and ---)
    // Body format: # TITLE\n\n**Kênh:** ... | ...\n\n---\n\nACTUAL_TRANSCRIPT
    const bodyParts = body.split(/\n---\n/);
    const headerPart = bodyParts[0] || '';
    const transcriptText = bodyParts.slice(1).join('\n---\n').trim();

    if (!transcriptText || transcriptText.length < 50) {
      this.log(`Transcript too short: ${filePath}`, 'warn');
      return null;
    }

    // Clean the transcript
    const { cleaned, stats } = await this.cleanTranscript(transcriptText, title, category);

    // Also clean the title if it has garbled text
    let cleanedTitle = title;
    if (this._isTitleGarbled(title)) {
      cleanedTitle = await this._cleanTitle(title, category);
    }

    // Rebuild frontmatter with cleaned title
    let cleanedFrontmatter = frontmatter;
    if (cleanedTitle !== title) {
      cleanedFrontmatter = frontmatter.replace(
        `title: "${title}"`,
        `title: "${cleanedTitle}"`
      );
    }

    // Rebuild the full file
    const cleanedHeader = cleanedTitle !== title
      ? headerPart.replace(title, cleanedTitle)
      : headerPart;
    const cleanedContent = `${cleanedFrontmatter}\n\n${cleanedHeader}\n---\n\n${cleaned}\n`;

    // Save to output directory
    const outDir = outputDir || join(TRANSCRIPTS_DIR, '..', 'transcripts-clean');
    const outPath = join(outDir, filePath);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, cleanedContent, 'utf-8');

    return {
      file: filePath,
      titleChanged: cleanedTitle !== title,
      originalTitle: title,
      cleanedTitle,
      ...stats,
    };
  }

  /**
   * Check if title has garbled/missing diacritical marks
   */
  _isTitleGarbled(title) {
    if (!title) return false;
    // Titles that are ALL CAPS with many short words (missing diacritics) are likely garbled
    const words = title.split(/\s+/);
    const shortWords = words.filter(w => w.length <= 2 && /^[A-Z]+$/.test(w));
    // If more than 30% are 1-2 char uppercase words, likely garbled
    return shortWords.length > words.length * 0.3;
  }

  /**
   * Clean a garbled title using AI
   */
  async _cleanTitle(title, category) {
    try {
      const result = await chat({
        model: this.model,
        systemPrompt: 'Bạn nhận một tiêu đề video YouTube bị lỗi dấu tiếng Việt (từ auto-captions). Hãy phục hồi tiêu đề gốc. CHỈ trả về tiêu đề đã sửa, không giải thích.',
        userMessage: `Tiêu đề bị lỗi: "${title}"\nChuyên mục: ${category}\n\nTiêu đề đã sửa:`,
        temperature: 0.2,
        maxTokens: 200,
      });
      this.totalTokens.input += result.tokens.input;
      this.totalTokens.output += result.tokens.output;
      this.totalCost += estimateCost(this.model, result.tokens.input, result.tokens.output);
      return result.content.trim().replace(/^["']|["']$/g, '');
    } catch {
      return title; // Keep original on failure
    }
  }

  /**
   * Remove known sponsor/ad segments that the LLM may have missed
   */
  _removeSponsorSegments(text) {
    let cleaned = text;
    for (const pattern of SPONSOR_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }
    return cleaned;
  }

  /**
   * Split text into chunks with overlap
   */
  _splitIntoChunks(text) {
    if (text.length <= CHUNK_SIZE) return [text];

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + CHUNK_SIZE;
      
      // Try to break at a sentence boundary
      if (end < text.length) {
        const searchStart = Math.max(0, end - 200);
        const searchEnd = Math.min(text.length, end + 200);
        const searchZone = text.substring(searchStart, searchEnd);
        const sentenceEnd = searchZone.search(/[.!?。]\s/);
        if (sentenceEnd !== -1) {
          end = searchStart + sentenceEnd + 2;
        }
      } else {
        end = text.length;
      }

      chunks.push(text.substring(start, end));

      // Next start with overlap, but stop if remaining is too small
      const nextStart = end - CHUNK_OVERLAP;
      if (nextStart <= start || end >= text.length) break; // Prevent infinite loop
      start = nextStart;
    }

    return chunks;
  }

  /**
   * Merge cleaned chunks, removing potential overlap duplicates
   */
  _mergeChunks(chunks) {
    if (chunks.length <= 1) return chunks[0] || '';

    let result = chunks[0];
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      // Try to find overlap point
      const overlapSearch = result.substring(result.length - 300);
      const chunkStart = chunk.substring(0, 300);

      // Find longest common substring at the boundary
      let bestOverlap = 0;
      for (let len = 20; len < Math.min(overlapSearch.length, chunkStart.length); len++) {
        const tail = overlapSearch.substring(overlapSearch.length - len);
        if (chunkStart.startsWith(tail)) {
          bestOverlap = len;
        }
      }

      if (bestOverlap > 20) {
        // Merge with overlap removal
        result += chunk.substring(bestOverlap);
      } else {
        // No clean overlap found — just concat with paragraph break
        result += '\n\n' + chunk;
      }
    }

    return result;
  }
}

export default TranscriptCleanerAgent;
