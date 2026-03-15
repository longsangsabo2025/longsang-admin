/**
 * Shorts Script Writer Agent
 * 
 * Specialized variant of ScriptWriter for 60-second YouTube Shorts.
 * 
 * Key differences from full ScriptWriter:
 * - 120-150 words max (vs 1800-2500)
 * - 3-section structure: Hook → Main → CTA (vs 7 podcast sections)
 * - First 3 seconds MUST stop the scroll
 * - Subtitle-first design (most viewers watch muted)
 * - Returns structured JSON with subtitle overlays for vertical video
 * 
 * Input: Single insight/topic + optional Brain knowledge
 * Output: JSON with sections, subtitles, and timing
 */
import { BaseAgent } from '../core/agent.js';
import { loadVoice, searchBrain, searchBooks } from '../knowledge/loader.js';
import { chat, estimateCost } from '../core/llm.js';

const SYSTEM_PROMPT = `Bạn là Shorts Script Writer của kênh "ĐỨNG DẬY ĐI".

IDENTITY:
- Kênh: "ĐỨNG DẬY ĐI" — triết gia bóng tối với trái tim chiến binh
- Format: YouTube Shorts 60 giây, VERTICAL 9:16
- Mục tiêu: STOP THE SCROLL trong 3 giây đầu

NHIỆM VỤ: Viết script 60-giây Shorts bằng tiếng Việt.

CẤU TRÚC BẮT BUỘC (3 phần):

1. HOOK (0:00-0:03) — 1 câu duy nhất dừng lướt:
   Patterns hiệu quả:
   • Câu hỏi sốc: "Bạn có biết 97% người đi làm sẽ không bao giờ giàu?"
   • Phản trực giác: "Ngủ 8 tiếng mà vẫn mệt? Đó không phải lỗi của bạn."
   • Thách thức: "Thử trả lời 1 câu hỏi này — 80% sẽ sai."
   • Con số sốc: "15 triệu vs 15 tỷ. Cùng ngành. Khác gì?"

2. MAIN (0:03-0:50) — 1 ý duy nhất, giải thích đơn giản:
   - Dùng giọng conversational ("thực ra là...", "vấn đề ở đây là...")
   - BẮT BUỘC có 1 ví dụ cụ thể hoặc data point
   - Xây tension → reveal → "aha moment"
   - Mỗi câu < 15 từ (dễ đọc trên subtitle)
   - Voice markers: [PAUSE], [EMPHASIS], [SPEED_UP]

3. CTA (0:50-0:60) — Punchline + call to action:
   - Land hard: câu cuối phải đọng lại
   - CTA nhẹ: "Follow để không bỏ lỡ" / "Comment X nếu đồng ý" / "Share cho người cần nghe"
   - Signature: "Đứng dậy đi." (nếu phù hợp)

CONSTRAINTS:
- TỔNG: 120-150 từ. KHÔNG ĐƯỢC vượt 150 từ.
- Mỗi câu phải earn its place — zero filler
- Subtitle cho MỖI câu (Shorts viewers xem không bật tiếng)
- Câu subtitle max 2 dòng, mỗi dòng max 6-8 từ
- KHÔNG intro dài, KHÔNG "Chào mừng đến với...", KHÔNG giải thích kênh

ẨN DỤ SIGNATURE (dùng 1 nếu phù hợp):
• bánh xe hamster • ma trận • lò xay thịt • nô lệ tài chính • hệ điều hành não

OUTPUT FORMAT: JSON object (không markdown, không wrapper)
{
  "title": "Tiêu đề <60 ký tự",
  "hook": "Câu hook 3 giây đầu",
  "sections": [
    { "timestamp": "0:00-0:03", "type": "hook", "text": "...", "subtitle": "..." },
    { "timestamp": "0:03-0:50", "type": "main", "text": "...", "subtitle": "..." },
    { "timestamp": "0:50-0:60", "type": "cta", "text": "...", "subtitle": "..." }
  ],
  "word_count": 135,
  "estimated_duration_seconds": 58,
  "hashtags": ["#Shorts", "#DungDayDi", "..."]
}`;

export class ShortsScriptWriterAgent extends BaseAgent {
  constructor() {
    super({
      id: 'shorts-script-writer',
      name: '⚡ Shorts Script Writer',
      role: 'YouTube Shorts Script Writer (60s Vertical)',
      model: process.env.SHORTS_WRITER_MODEL || process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.9,
      maxTokens: 2048,
    });
  }

  async execute(task, context = {}) {
    const topicMatch = task.match(/TOPIC:\s*([^\n]+)/i) ||
                       task.match(/topic[:\s]+([^\n]+)/i) ||
                       [null, null];
    let topic = topicMatch[1]?.trim() || '';

    const insightMatch = task.match(/INSIGHT:\s*([\s\S]*?)(?:TOPIC:|REQUIREMENTS:|FORMAT|$)/i);
    const insightRaw = insightMatch?.[1]?.trim() || '';

    if (!topic) {
      const titleMatch = task.match(/[\u0080-\uffff].*?[\u2014\-–].*/m);
      if (titleMatch) topic = titleMatch[0].trim().substring(0, 100);
    }
    if (!topic) topic = task.substring(0, 100);

    const brainRelevant = await searchBrain(topic, 1500);
    const bookResults = topic ? await searchBooks(topic, 2) : [];
    const bookContext = bookResults.length > 0
      ? bookResults.map(b => `[${b.title}]: ${b.excerpt}`).join('\n')
      : '';

    const voice = await loadVoice();
    const voiceHints = voice ? this._extractShortsVoice(voice) : '';

    this.log(`Brain: ${brainRelevant.length}c, Books: ${bookResults.length}, Insight: ${insightRaw.length}c`);

    const knowledgeStr = [
      insightRaw ? `[INSIGHT TỪ NGUỒN]\n${insightRaw}` : '',
      brainRelevant ? `[BRAIN]\n${brainRelevant.substring(0, 1500)}` : '',
      bookContext ? `[SÁCH]\n${bookContext}` : '',
    ].filter(Boolean).join('\n\n').substring(0, 4000);

    const scriptTask = `Viết script YouTube Short 60 giây.

TOPIC: ${topic || task.substring(0, 200)}

${voiceHints ? `--- VOICE DNA HINTS ---\n${voiceHints}\n` : ''}
--- KIẾN THỨC ---
${knowledgeStr}

REQUIREMENTS:
1. 120-150 từ. KHÔNG VƯỢT 150 TỪ.
2. Hook 3 giây đầu phải stop the scroll
3. 1 ý duy nhất, 1 ví dụ cụ thể
4. Subtitle cho mỗi câu
5. Trả về JSON đúng format (không markdown wrapper)
6. Dùng kiến thức từ Brain/Sách nếu phù hợp`;

    const result = await chat({
      model: this.model,
      systemPrompt: this.systemPrompt,
      userMessage: scriptTask,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      responseFormat: 'json',
    });

    this.totalTokens.input += result.tokens.input;
    this.totalTokens.output += result.tokens.output;
    this.totalCost += estimateCost(this.model, result.tokens.input, result.tokens.output);
    this.executionCount++;

    let parsed;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      this.log('LLM returned non-JSON, wrapping as raw script');
      parsed = {
        title: topic.substring(0, 60),
        hook: result.content.split('\n')[0] || '',
        sections: [
          { timestamp: '0:00-0:60', type: 'full', text: result.content, subtitle: result.content },
        ],
        word_count: result.content.split(/\s+/).length,
        estimated_duration_seconds: 60,
      };
    }

    const wordCount = parsed.sections
      ? parsed.sections.reduce((sum, s) => sum + (s.text || '').split(/\s+/).filter(Boolean).length, 0)
      : parsed.word_count || 0;

    if (wordCount > 170) {
      this.log(`Script too long (${wordCount} words), requesting trim...`);
      parsed = await this._trimScript(parsed, topic);
    }

    parsed.word_count = wordCount;
    parsed.stats = {
      actualWords: wordCount,
      targetRange: '120-150',
      withinTarget: wordCount >= 110 && wordCount <= 160,
    };

    this.log(`Script: "${parsed.title}" — ${wordCount} words — ${parsed.estimated_duration_seconds || '~60'}s`);
    return JSON.stringify(parsed, null, 2);
  }

  async _trimScript(parsed, topic) {
    try {
      const trimResult = await chat({
        model: this.model,
        systemPrompt: 'Bạn là editor. Cắt script xuống 120-150 từ. Giữ hook + punchline. Return JSON same format.',
        userMessage: `Script này quá dài. Cắt xuống MAX 150 từ:\n\n${JSON.stringify(parsed)}`,
        temperature: 0.5,
        maxTokens: 1536,
        responseFormat: 'json',
      });

      this.totalTokens.input += trimResult.tokens.input;
      this.totalTokens.output += trimResult.tokens.output;
      this.totalCost += estimateCost(this.model, trimResult.tokens.input, trimResult.tokens.output);

      return JSON.parse(trimResult.content);
    } catch {
      this.log('Trim failed, using original');
      return parsed;
    }
  }

  _extractShortsVoice(voice) {
    const metaphors = voice.match(/## 6\. ẨN DỤ ĐẶC TRƯNG[\s\S]*?(?=## 7\.)/);
    const sig = voice.match(/## 7\. CÂU SIGNATURE[\s\S]*?(?=## 8\.)/);
    const parts = [];
    if (metaphors) parts.push(metaphors[0].trim().substring(0, 500));
    if (sig) parts.push(sig[0].trim().substring(0, 300));
    return parts.join('\n\n') || voice.substring(0, 800);
  }
}

export default ShortsScriptWriterAgent;
