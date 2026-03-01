/**
 * AGENT 3: Script Writer
 * 
 * THE MOST IMPORTANT AGENT.
 * 
 * Strategy: Plain text output (not JSON) → parse sections afterward
 * This forces the model to actually WRITE instead of structuring.
 * 
 * Two-pass approach:
 *   Pass 1 (GPT-4o): Generate full script as plain text (1800-2500 words)
 *   Pass 2 (GPT-4o-mini): Generate metadata (title, SEO, thumbnail) cheap
 * 
 * Input: Brain-curated content + podcast angle
 * Output: Full podcast script (parsed JSON)
 */
import { BaseAgent } from '../core/agent.js';
import { loadBrain, loadVoice, searchBooks, searchBrain, searchTranscripts } from '../knowledge/loader.js';
import { chat, estimateCost } from '../core/llm.js';

// ─── SYSTEM PROMPT (concise — voice rules come from VOICE.md injection) ─────
const SYSTEM_PROMPT = `Bạn là Script Writer của kênh "ĐỨNG DẬY ĐI".

IDENTITY:
- Giọng: Triết gia bóng tối với trái tim chiến binh
- Tagline: "Nơi có những sự thật mà cuộc sống đã giấu bạn, và sức mạnh mà bạn quên mình đang có."
- Sign-off: "Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."

NHIỆM VỤ: Viết NGUYÊN VĂN toàn bộ script podcast bằng tiếng Việt.
- Viết MỌI TỪ mà host sẽ đọc, KHÔNG tóm tắt, KHÔNG placeholder
- Dùng voice markers: [PAUSE], [EMPHASIS], [SLOW], [INTENSE], [WHISPER]
- Nhịp "The Wave": Câu dài xây momentum → Câu ngắn đóng đinh → Chuyển tiếp
- Viết cho TAI nghe, không cho MẮT đọc
- Xen English terms gốc khi cần (FOMO, ETF, GDP...)

CẤU TRÚC OUTPUT (plain text, mỗi section bắt đầu bằng --- [TIMESTAMP] SECTION_NAME ---):

--- [0:00] HOOK ---
(80-120 từ. Gây sốc, đập tan comfort zone theo 1 trong 5 patterns voice DNA. Phải rất cụ thể, scene-setting.)

--- [0:30] SIGNATURE_INTRO ---
(50-80 từ. "Chào mừng đến với ĐỨNG DẬY ĐI..." + giới thiệu chủ đề hôm nay + tại sao nên nghe.)

--- [1:00] BOI_CANH ---
(250-400 từ. Tại sao chủ đề này quan trọng NGAY BÂY GIỜ. Data thực tế, sự kiện, bối cảnh lịch sử, con số thống kê. Viết sâu, kể chuyện.)

--- [3:00] GIAI_PHAU ---
(800-1200 từ. ĐÂY LÀ PHẦN DÀI NHẤT. 4-5 điểm chính, MỖI điểm PHẢI có: Claim mạnh → Bằng chứng/số liệu → Ẩn dụ DNA → Impact thực tế. Mỗi điểm tối thiểu 150-250 từ. Dùng transitions: "Nhưng đó mới chỉ là bề mặt...", "Và đó mới chỉ là phần nổi...", "Chuyện chưa dừng ở đó...")

--- [8:00] TWIST ---
(200-350 từ. Góc nhìn không ai nói. "Nhưng đây là điều thú vị nhất..." Phải gây bất ngờ thực sự.)

--- [10:00] DUNG_DAY ---
(200-350 từ. Tough love + 3 hành động cụ thể. "Biết rồi sao? Bạn vẫn phải sống." Mỗi hành động phải rõ ràng, thực thi được.)

--- [12:00] KET ---
(100-150 từ. Summary nhanh + CTA tự nhiên + "Không ai cứu bạn ngoài chính bạn. Đứng dậy đi.")

TỔNG TỐI THIỂU: 1800 từ. MỤC TIÊU: 2200-2500 từ. Script < 1800 từ = THẤT BẠI HOÀN TOÀN.
HÃY ƯU TIÊN VIẾT DÀI PHẦN GIAI_PHAU (800-1200 từ) VÀ BOI_CANH (250-400 từ).

CẤM KỴ: Giọng sách giáo khoa | YouTuber hype | Motivational sáo rỗng | Copy nguyên văn | Câu > 40 từ liên tục | Kết yếu`;

export class ScriptWriterAgent extends BaseAgent {
  constructor() {
    super({
      id: 'script-writer',
      name: '✍️ Script Writer',
      role: 'Podcast Script Writer & Voice Architect',
      model: process.env.SCRIPT_WRITER_MODEL || 'gpt-4o',
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.85,
      maxTokens: 16384,
    });
  }

  /**
   * Override execute:
   * 1. Inject VOICE DNA (condensed) + knowledge into task
   * 2. Get plain text script from LLM
   * 3. Parse sections → structured JSON
   * 4. Generate metadata (title, SEO, thumbnail) in a cheap second call
   */
  async execute(task, context = {}) {
    // Extract topic from various formats (standalone test vs pipeline)
    const topicMatch = task.match(/topic[:\s]+([^\n]+)/i) || 
                       task.match(/about[:\s]+([^\n]+)/i) ||
                       task.match(/TOPIC:\s*([^\n]+)/i) ||
                       [null, null];
    let topic = topicMatch[1]?.trim() || '';
    
    // Fallback: extract from first meaningful line if pipeline format
    if (!topic && task.includes('podcast script')) {
      const titleMatch = task.match(/[\u0080-\uffff].*?[\u2014\-–].*/m);
      if (titleMatch) topic = titleMatch[0].trim().substring(0, 100);
    }
    if (!topic) topic = task.substring(0, 100);

    // Extract curated content from pipeline (stage 2 output)
    const curatedMatch = task.match(/CURATED ANALYSIS:\s*([\s\S]*?)(?:ORIGINAL CONTENT:|REQUIREMENTS:|$)/i);
    const curatedContent = curatedMatch?.[1]?.trim().substring(0, 3000) || '';

    // Load knowledge (NO double voice injection)
    const voice = await loadVoice();
    const voiceCondensed = voice ? this._condenseVoice(voice) : '';
    
    // Search Brain for RELEVANT sections (not raw first N chars)
    const brainRelevant = await searchBrain(topic, 3000);
    
    // Search for relevant book insights (word-level scoring)
    const bookResults = topic ? await searchBooks(topic, 3) : [];
    const bookContext = bookResults.length > 0
      ? bookResults.map(b => `[${b.title} (score:${b.score})]: ${b.excerpt}`).join('\n\n')
      : '';

    // Search reference video transcripts (ALL 815 videos, 4 channels)
    const transcriptResults = topic ? await searchTranscripts(topic, 4) : [];
    const transcriptContext = transcriptResults.length > 0
      ? transcriptResults.map(t => `[Video: ${t.title} (${t.sourceLabel} | ${t.viewCount} views)]: ${t.excerpt}`).join('\n\n')
      : '';

    this.log(`Brain: ${brainRelevant.length} chars, Books: ${bookResults.length} matches, Transcripts: ${transcriptResults.length} matches (4 sources), Curated: ${curatedContent.length} chars`);

    // Build compact knowledge string
    const knowledgeStr = [
      curatedContent ? `[PHÂN TÍCH TỪ NGUỒN]\n${curatedContent}` : '',
      brainRelevant ? `[BRAIN - Kiến thức từ sách]\n${brainRelevant}` : '',
      bookContext ? `[SÁCH CHI TIẾT]\n${bookContext}` : '',
      transcriptContext ? `[VIDEO THAM KHẢO từ 4 KÊNH (815 videos)]\n${transcriptContext}` : '',
    ].filter(Boolean).join('\n\n').substring(0, 10000);

    // STEP 1: Generate full script (plain text)
    const voiceCheatSheet = this._buildVoiceCheatSheet(voice);
    const scriptTask = `Viết NGUYÊN VĂN script podcast cho kênh ĐỨNG DẬY ĐI.

TOPIC: ${topic || task.substring(0, 200)}

--- VOICE DNA (Follow CHÍNH XÁC) ---
${voiceCondensed}

--- 🎯 VOICE DNA CHEAT SHEET (BẮT BUỘC DÙNG) ---
${voiceCheatSheet}

--- KIẾN THỨC THAM KHẢO ---
${knowledgeStr}

CRITICAL REQUIREMENTS:
1. PHẢI viết TỐI THIỂU 1800 từ (mục tiêu 2200-2500). Script < 1800 từ = THẤT BẠI.
2. Dùng CHÍNH XÁC format: --- [TIMESTAMP] SECTION_NAME --- (dùng tên section KHÔNG DẤU: HOOK, SIGNATURE_INTRO, BOI_CANH, GIAI_PHAU, TWIST, DUNG_DAY, KET)
3. GIAI_PHAU là phần DÀI NHẤT (800-1200 từ, 4-5 điểm chính, mỗi điểm 150-250 từ)
4. PHẢI dùng ÍT NHẤT 3 ẨN DỤ từ Cheat Sheet (ma trận, bánh xe hamster, lò xay thịt, etc.)
5. PHẢI dùng ÍT NHẤT 4 CÂU CỬA MIỆNG từ Cheat Sheet rải đều trong script
6. CHỈ output script text, KHÔNG wrapper JSON hay markdown code block
7. BẮT BUỘC dùng kiến thức từ [BRAIN] và [SÁCH]: trích dẫn tên sách, tác giả, framework, con số từ nguồn tri thức. Phần GIAI_PHAU PHẢI dựa trên ít nhất 2-3 framework từ Brain.
8. SIGNATURE_INTRO phải bắt đầu bằng câu signature intro từ Cheat Sheet. KET phải kết bằng SIGNATURE OUTRO + CTA (đăng ký, nhấn chuông, chia sẻ).`;

    this.log(`Injected: voice ${voiceCondensed.length}c + brain ${brainRelevant.length}c + books ${bookResults.length} + knowledge total ${knowledgeStr.length}c`);
    
    const rawScript = await super.execute(scriptTask, context);

    // STEP 2: Parse sections from plain text
    let parsed = this._parseSections(rawScript);
    this.log(`Pass 1: ${parsed.sections.length} sections, ${parsed.totalWords} words (≈${(parsed.totalWords / 150).toFixed(1)} min)`);

    // Build brain context for expansion passes
    const brainForExpansion = [brainRelevant, bookContext].filter(Boolean).join('\n').substring(0, 3000);

    // STEP 2.5: AUTO-EXPAND if under 1800 words (up to 2 rounds)
    const MIN_WORDS = 1800;
    for (let round = 1; round <= 2 && parsed.totalWords < MIN_WORDS; round++) {
      this.log(`⚠️ Round ${round}: ${parsed.totalWords} words < ${MIN_WORDS} — expanding short sections...`);
      const expandedScript = await this._expandSections(parsed, topic, voiceCondensed, brainForExpansion);
      if (expandedScript) {
        const reParsed = this._parseSections(expandedScript);
        if (reParsed.totalWords > parsed.totalWords) {
          parsed = reParsed;
          this.log(`  → Expanded to ${parsed.totalWords} words (≈${(parsed.totalWords / 150).toFixed(1)} min)`);
        } else {
          break; // No improvement, stop
        }
      } else {
        break; // Nothing to expand
      }
    }
    
    // STEP 3: Quick metadata call (cheap, gpt-4o-mini)
    let metadata = {};
    try {
      const metaResult = await chat({
        model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
        systemPrompt: 'Generate YouTube metadata in JSON. Be concise.',
        userMessage: `Given this Vietnamese podcast script topic: "${topic}"
And this opening hook: "${parsed.sections[0]?.text?.substring(0, 200) || ''}"

Generate JSON:
{
  "title": "Vietnamese clickable title (max 60 chars)",
  "titleEN": "English SEO translation",
  "seoKeywords": ["5-8 Vietnamese keywords"],
  "thumbnailIdea": "dark, provocative thumbnail concept",
  "description": "YouTube description with timestamps"
}`,
        temperature: 0.5,
        maxTokens: 1024,
        responseFormat: 'json',
      });
      
      try { metadata = JSON.parse(metaResult.content); } catch { metadata = {}; }
      
      this.totalTokens.input += metaResult.tokens.input;
      this.totalTokens.output += metaResult.tokens.output;
      this.totalCost += estimateCost('gpt-4o-mini', metaResult.tokens.input, metaResult.tokens.output);
    } catch (err) {
      this.log(`Metadata generation skipped: ${err.message}`);
    }

    // STEP 4: Combine into final output
    const output = {
      title: metadata.title || topic,
      titleEN: metadata.titleEN || '',
      hook: parsed.sections[0]?.text?.split('\n')[0] || '',
      estimatedDuration: `${Math.round(parsed.totalWords / 150)}:00`,
      script: parsed.sections,
      seoKeywords: metadata.seoKeywords || [],
      thumbnailIdea: metadata.thumbnailIdea || '',
      description: metadata.description || '',
      stats: {
        totalWords: parsed.totalWords,
        totalChars: parsed.totalChars,
        estimatedMinutes: (parsed.totalWords / 150).toFixed(1),
        sectionCount: parsed.sections.length,
      },
    };

    return JSON.stringify(output, null, 2);
  }

  /**
   * Expand short sections to hit minimum word count.
   * Targets each under-length section individually for focused expansion.
   */
  async _expandSections(parsed, topic, voiceCondensed, brainContext = '') {
    const targets = {
      hook: 80, signature_intro: 50, boi_canh: 250, giai_phau: 800,
      twist: 200, dung_day: 200, ket: 100,
    };

    // Find sections under 85% of target, OR if total still under MIN, pick the biggest deficit
    let shortSections = parsed.sections.filter(s => {
      const target = targets[s.section] || 150;
      return s.wordCount < target * 0.85;
    });

    // Fallback: if no individual sections below threshold but total still short,
    // force-expand the section with the biggest word deficit
    if (shortSections.length === 0) {
      const totalWords = parsed.sections.reduce((sum, s) => sum + s.wordCount, 0);
      if (totalWords < 1800) {
        const withDeficit = parsed.sections
          .map(s => ({ ...s, deficit: (targets[s.section] || 150) - s.wordCount }))
          .filter(s => s.deficit > 0)
          .sort((a, b) => b.deficit - a.deficit);
        if (withDeficit.length > 0) {
          shortSections = [withDeficit[0]]; // Expand the section with biggest deficit
        }
      }
    }

    if (shortSections.length === 0) return null;

    this.log(`Expanding ${shortSections.length} short sections: ${shortSections.map(s => `${s.section}(${s.wordCount}w)`).join(', ')}`);

    // Expand each short section individually
    const expandedSections = [...parsed.sections];
    
    for (const shortSection of shortSections) {
      const target = targets[shortSection.section] || 150;
      const sectionIdx = expandedSections.findIndex(s => s.section === shortSection.section);
      if (sectionIdx === -1) continue;

      // Get previous/next section text for context
      const prevText = sectionIdx > 0 ? expandedSections[sectionIdx - 1].text.substring(0, 200) : '';
      const nextText = sectionIdx < expandedSections.length - 1 ? expandedSections[sectionIdx + 1].text.substring(0, 200) : '';

      const expandPrompt = `Kênh "ĐỨNG DẬY ĐI". TOPIC: ${topic}

Phần ${shortSection.section.toUpperCase()} hiện chỉ có ${shortSection.wordCount} từ, cần TỐI THIỂU ${target} từ.

${prevText ? `[PHẦN TRƯỚC (context):]\n${prevText}...\n` : ''}
[PHẦN CẦN MỞ RỘNG - ${shortSection.section.toUpperCase()}:]
${shortSection.text}
${nextText ? `\n[PHẦN SAU (context):]\n${nextText}...` : ''}

--- VOICE DNA ---
${voiceCondensed.substring(0, 2000)}
${brainContext ? `\n--- BRAIN KNOWLEDGE (trích dẫn sách + framework) ---\n${brainContext.substring(0, 2000)}` : ''}

NHIỆM VỤ: Viết lại CHÍNH phần ${shortSection.section.toUpperCase()} này DÀI HƠN (tối thiểu ${target} từ).
${shortSection.section === 'giai_phau' ? '- Phải có 4-5 ĐIỂM CHÍNH riêng biệt.\n- Mỗi điểm: Claim mạnh → Bằng chứng cụ thể (TÊN SÁCH + TÁC GIẢ từ Brain) → Ẩn dụ DNA → Impact.\n- Mỗi điểm TỐI THIỂU 150-200 từ.\n- BẮT BUỘC trích dẫn ít nhất 2-3 framework/sách từ Brain Knowledge.' : ''}
${shortSection.section === 'ket' ? '- KẾT THÚC bằng: CTA (chia sẻ + đăng ký + nhấn chuông) → "Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."' : ''}
- Dùng ẩn dụ DNA: ma trận, bánh xe hamster, lò xay thịt, trò chơi/luật chơi, nô lệ tài chính
- Voice markers: [PAUSE], [EMPHASIS], [SLOW], [INTENSE]
- Nhịp "The Wave": Dài xây momentum → Ngắn đóng đinh
- Viết cho TAI nghe, không cho mắt đọc
- CHỈ output text của section này. KHÔNG header, KHÔNG wrapper.`;

      try {
        const expandModel = process.env.DEFAULT_MODEL || 'gpt-4o-mini';
        const result = await chat({
          model: expandModel,
          systemPrompt: `Bạn là Script Writer. Giọng: Triết gia bóng tối + chiến binh. Viết podcast script tiếng Việt. Viết ĐẦY ĐỦ ${target}+ từ. KHÔNG ĐƯỢC viết ít hơn ${target} từ.`,
          userMessage: expandPrompt,
          temperature: 0.95,
          maxTokens: 8192,
        });

        this.totalTokens.input += result.tokens.input;
        this.totalTokens.output += result.tokens.output;
        this.totalCost += estimateCost(expandModel, result.tokens.input, result.tokens.output);

        const expandedText = result.content.trim();
        const expandedWords = expandedText.split(/\s+/).filter(Boolean).length;
        
        if (expandedWords > shortSection.wordCount) {
          expandedSections[sectionIdx] = {
            ...shortSection,
            text: expandedText,
            wordCount: expandedWords,
          };
          this.log(`  ✅ ${shortSection.section}: ${shortSection.wordCount}→${expandedWords} words`);
        }
      } catch (err) {
        this.log(`  ❌ ${shortSection.section} expansion failed: ${err.message}`);
      }
    }

    // Reconstruct full script text with headers for re-parsing
    return expandedSections.map(s =>
      `--- [${s.timestamp}] ${s.section.toUpperCase()} ---\n${s.text}`
    ).join('\n\n');
  }

  /**
   * Parse plain text script into structured sections
   * Expected: --- [TIMESTAMP] SECTION_NAME ---\n...text...
   */
  _parseSections(rawText) {
    // Use .+? instead of character class — supports ALL Vietnamese diacritics
    const sectionRegex = /---\s*\[?(\d+:\d+)\]?\s*(.+?)\s*---/g;
    const allMatches = [];
    let match;

    while ((match = sectionRegex.exec(rawText)) !== null) {
      allMatches.push({
        timestamp: match[1],
        section: match[2].trim().toLowerCase().replace(/\s+/g, '_'),
        index: match.index,
        headerEnd: match.index + match[0].length,
      });
    }

    const sections = [];
    for (let i = 0; i < allMatches.length; i++) {
      const current = allMatches[i];
      const nextStart = allMatches[i + 1]
        ? allMatches[i + 1].index
        : rawText.length;
      const text = rawText.substring(current.headerEnd, nextStart).trim();
      const words = text.split(/\s+/).filter(Boolean).length;

      sections.push({
        section: current.section,
        timestamp: current.timestamp,
        text,
        wordCount: words,
      });
    }

    // Fallback: whole text as one block
    if (sections.length === 0 && rawText.trim()) {
      sections.push({
        section: 'full_script',
        timestamp: '0:00',
        text: rawText.trim(),
        wordCount: rawText.trim().split(/\s+/).length,
      });
    }

    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
    const totalChars = sections.reduce((sum, s) => sum + s.text.length, 0);
    return { sections, totalWords, totalChars };
  }

  /**
   * Extract most actionable VOICE.md sections (skip full examples, tone matrix)
   */
  _condenseVoice(voice) {
    const sections = [];
    
    const openings = voice.match(/## 2\. CÔNG THỨC MỞ BÀI[\s\S]*?(?=## 3\.)/);
    if (openings) sections.push(openings[0].trim());
    
    const endings = voice.match(/## 4\. CÔNG THỨC KẾT BÀI[\s\S]*?(?=## 5\.)/);
    if (endings) sections.push(endings[0].trim());

    const vocab = voice.match(/## 5\. TỪ VỰNG DNA[\s\S]*?(?=## 6\.)/);
    if (vocab) sections.push(vocab[0].trim());

    const metaphors = voice.match(/## 6\. ẨN DỤ ĐẶC TRƯNG[\s\S]*?(?=## 7\.)/);
    if (metaphors) sections.push(metaphors[0].trim());
    
    const sig = voice.match(/## 7\. CÂU SIGNATURE[\s\S]*?(?=## 8\.)/);
    if (sig) sections.push(sig[0].trim());
    
    if (sections.length === 0) return voice.substring(0, 4000);
    return sections.join('\n\n');
  }

  /**
   * Build a compact, ENFORCEABLE voice DNA cheat sheet with specific must-use items.
   * This is separate from _condenseVoice — cheat sheet = hard requirements.
   */
  _buildVoiceCheatSheet(voice) {
    return `🎯 SIGNATURE INTRO (dùng CHÍNH XÁC trong phần SIGNATURE_INTRO):
"Chào mừng đến với ĐỨNG DẬY ĐI — nơi có những sự thật mà cuộc sống đã giấu bạn, và sức mạnh mà bạn quên mình đang có."

🎯 SIGNATURE OUTRO (dùng CHÍNH XÁC ở cuối phần KET):
"Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."

🎯 CÂU CỬA MIỆNG — dùng ÍT NHẤT 4 câu rải đều trong script:
• "Và đó mới chỉ là phần nổi của tảng băng."
• "Sự thật phũ phàng là..."
• "Hay nói cho chính xác hơn..."
• "Đừng nhìn vào bề mặt — hãy nhìn xuyên qua."
• "Đây không phải ý kiến cá nhân — đây là dữ liệu."
• "Cuộc đời không dạy bạn bằng lời — cuộc đời dạy bằng mất mát."
• "Biết rồi sao? Bạn vẫn phải sống. Vẫn phải chiến đấu."
• "Quy luật kinh tế học thì chưa bao giờ sai."

🎯 ẨN DỤ ĐẶC TRƯNG — dùng ÍT NHẤT 3 cụm trong script body:
• ma trận (hệ thống vô hình kiểm soát)
• bánh xe hamster (chạy mãi không đến đâu)
• lò xay thịt (hệ thống nghiền nát người yếu)
• trò chơi / luật chơi (cuộc sống = game có rules)
• nô lệ tài chính (bị tiền kiểm soát)
• kịch bản cuộc đời (ai đó viết sẵn cho bạn)
• hệ điều hành (tư duy = phần mềm cần update)
• cuộc đại thanh lọc (thị trường loại bỏ kẻ yếu)

🎯 CTA KẾT BÀI (trong phần KET, trước signature outro):
"Nếu bạn thấy video này khiến bạn suy nghĩ, hãy chia sẻ cho một người bạn đang cần nghe điều này. Đừng quên đăng ký kênh và nhấn chuông để không bỏ lỡ những tập tiếp theo."`;
  }
}

export default ScriptWriterAgent;
