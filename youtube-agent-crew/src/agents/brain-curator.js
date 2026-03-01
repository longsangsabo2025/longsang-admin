/**
 * AGENT 2: Brain Curator
 * 
 * Mission: Store harvested content into Second Brain + analyze patterns
 * - Connect to LongSang Admin Brain API
 * - Categorize and tag content
 * - Find connections to existing knowledge
 * - Build knowledge graph edges
 * 
 * Input: Harvested content package
 * Output: Brain entry ID + related connections + synthesis
 */
import { BaseAgent } from '../core/agent.js';
import { searchBooks, searchBrain } from '../knowledge/loader.js';

const SYSTEM_PROMPT = `Bạn là Brain Curator — kiến trúc sư tri thức cho kênh podcast "ĐỨNG DẬY ĐI".

Bạn có quyền truy cập vào THƯ VIỆN 28 CUỐN SÁCH và HỆ THỐNG BRAIN chứa các framework, mental model, viral hooks.

## NHIỆM VỤ
Phân tích nội dung thô và LIÊN KẾT với kiến thức từ thư viện sách:
1. Xác định 3-5 framework/mental model từ [BRAIN] liên quan đến topic
2. Tìm 2-4 cuốn sách từ [SÁCH] có thể dẫn chứng
3. Trích xuất atomic ideas + gắn với nguồn sách cụ thể
4. Đề xuất góc nhìn contrarian dựa trên kiến thức sách
5. Tạo synthesis KẾT NỐI nội dung gốc với tri thức từ Brain

## QUAN TRỌNG
- BẮT BUỘC trích dẫn tên sách + tác giả cụ thể trong synthesis
- BẮT BUỘC đề xuất framework từ Brain (Fastlane/Slowlane, lãi kép, Margin of Safety, etc.)
- KHÔNG viết kiến thức chung chung — phải gắn với nguồn cụ thể từ thư viện
- Viết bằng TIẾNG VIỆT

## OUTPUT FORMAT (JSON)
{
  "category": "primary category",
  "relatedFrameworks": ["Framework 1 from Brain", "Framework 2"],
  "relatedBooks": [
    {"title": "Book name", "author": "Author", "keyInsight": "Relevant insight"}
  ],
  "atomicIdeas": [
    {
      "idea": "Ý tưởng cụ thể",
      "source": "Tên sách hoặc framework",
      "relevanceScore": 8,
      "contentAngle": "Góc khai thác cho podcast"
    }
  ],
  "contrarianAngle": "Góc nhìn phản biện dựa trên sách",
  "podcastPotential": {
    "score": 8,
    "suggestedTitle": "Tiêu đề tập podcast",
    "hook": "Câu mở đầu gây sốc",
    "keyQuotes": ["Trích dẫn 1 từ sách", "Trích dẫn 2"]
  },
  "synthesis": "3-5 câu tổng hợp KẾT NỐI nội dung gốc với framework và sách cụ thể"
}

## QUY TẮC
- Ưu tiên ý tưởng: contrarian, có dữ liệu, actionable
- Bỏ qua lời khuyên generic — chỉ giữ insights độc đáo GẮN VỚI SÁCH
- Tư duy như content strategist CÓ THƯ VIỆN, không phải AI chung chung
- LUÔN output valid JSON`;

export class BrainCuratorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'brain-curator',
      name: '🧠 Brain Curator',
      role: 'Knowledge Architecture & Pattern Recognition',
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.5,
      maxTokens: 4096,
    });
    this.adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:3001';
  }

  /**
   * Save to LongSang Admin Brain API
   */
  async saveToBrain(content) {
    try {
      const response = await fetch(`${this.adminApiUrl}/api/brain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title || 'Harvested Content',
          content: content.synthesis || JSON.stringify(content),
          category: content.category || 'research',
          tags: content.tags || ['youtube', 'harvested', 'auto'],
          source: 'youtube-agent-crew',
          metadata: content,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.log(`Saved to Brain: ${data.id || 'success'}`, 'success');
        return data;
      }
      this.log('Brain API not available, storing locally', 'warn');
      return null;
    } catch {
      this.log('Brain API not available, storing locally', 'warn');
      return null;
    }
  }

  /**
   * Extract topic from task text using multiple patterns
   */
  extractTopic(task) {
    let topic = '';
    const topicPatterns = [
      /topic[:\s]+["']?(.+?)["']?$/im,
      /about[:\s]+["']?(.+?)["']?$/im,
      /TOPIC:\s*(.+)/i,
      /content about:\s*(.+)/i,
      /podcast about:\s*(.+)/i,
    ];
    for (const pat of topicPatterns) {
      const m = task.match(pat);
      if (m) { topic = m[1].trim(); break; }
    }
    if (!topic) {
      const titleMatch = task.match(/"title"\s*:\s*"([^"]+)"/i) ||
                          task.match(/"topic"\s*:\s*"([^"]+)"/i) ||
                          task.match(/"subject"\s*:\s*"([^"]+)"/i);
      if (titleMatch) topic = titleMatch[1].trim();
    }
    if (!topic) {
      const vnMatch = task.match(/[\u0080-\uffff][\u0080-\uffff\w\s,\-—]{20,}/m);
      if (vnMatch) topic = vnMatch[0].trim().substring(0, 150);
    }
    if (!topic) {
      const lines = task.split('\n').filter(l => l.trim().length > 20);
      topic = lines[0]?.substring(0, 150) || task.substring(0, 150);
    }
    return topic;
  }

  /**
   * Agentic RAG: Multi-round retrieval with self-assessment
   * Round 1: Search by topic → get initial results
   * Round 2: LLM evaluates gaps → generates follow-up queries → search again
   * Round 3: Combine all retrieved knowledge
   */
  async agenticRetrieve(topic) {
    const allKnowledge = { brain: '', books: [], transcripts: [], adminBrain: [] };

    // ─── ROUND 1: Initial broad search ──────────────
    this.log('🔍 [RAG Round 1] Broad search...', 'info');
    allKnowledge.brain = await searchBrain(topic, 3000);
    allKnowledge.books = await searchBooks(topic, 5);

    // Also search transcripts
    const { searchTranscripts } = await import('../knowledge/loader.js');
    allKnowledge.transcripts = await searchTranscripts(topic, 3);

    // Also query Admin Brain RAG API if available
    try {
      const ragRes = await fetch(`${this.adminApiUrl}/api/brain/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic, limit: 5 }),
      });
      if (ragRes.ok) {
        const ragData = await ragRes.json();
        allKnowledge.adminBrain = ragData.results || [];
        this.log(`  Admin Brain RAG: ${allKnowledge.adminBrain.length} results`, 'info');
      }
    } catch {
      // Admin Brain not available
    }

    this.log(`  Brain: ${allKnowledge.brain.length} chars, Books: ${allKnowledge.books.length}, Transcripts: ${allKnowledge.transcripts.length}`, 'info');

    // ─── ROUND 2: Gap analysis → targeted follow-up queries ──────────────
    // Only if we have enough context to analyze gaps
    if (allKnowledge.books.length > 0 || allKnowledge.brain.length > 500) {
      this.log('🔍 [RAG Round 2] Gap analysis...', 'info');
      try {
        const { chat } = await import('../core/llm.js');
        const gapAnalysis = await chat({
          model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
          systemPrompt: 'You analyze knowledge gaps. Output JSON: { "followUpQueries": ["query1", "query2"], "missingAngles": ["angle1"] }',
          userMessage: `Topic: ${topic}\n\nKnowledge so far:\n- Books: ${allKnowledge.books.map(b => b.title).join(', ')}\n- Brain themes found: ${allKnowledge.brain.substring(0, 300)}\n\nWhat additional angles or sub-topics should we search for to create a comprehensive podcast? Return 2-3 follow-up search queries.`,
          temperature: 0.3,
          maxTokens: 256,
          responseFormat: 'json',
          agentId: this.id,
        });

        const gaps = JSON.parse(gapAnalysis.content);
        if (gaps.followUpQueries?.length > 0) {
          for (const query of gaps.followUpQueries.slice(0, 2)) {
            const extraBooks = await searchBooks(query, 2);
            const newBooks = extraBooks.filter(b => !allKnowledge.books.find(existing => existing.title === b.title));
            allKnowledge.books.push(...newBooks);
            if (newBooks.length > 0) {
              this.log(`  Follow-up "${query.substring(0, 40)}": +${newBooks.length} books`, 'info');
            }
          }
        }
      } catch {
        // Gap analysis failed — proceed with round 1 results
      }
    }

    return allKnowledge;
  }

  /**
   * Override execute: Agentic RAG → enriched context → LLM analysis → save
   */
  async execute(task, context = {}) {
    const topic = this.extractTopic(task);
    this.log(`Topic extracted: "${topic.substring(0, 80)}..."`);

    // ─── AGENTIC RAG: Multi-round retrieval ──────────────
    const knowledge = await this.agenticRetrieve(topic);

    // Build book context
    let bookContext = '';
    if (knowledge.books.length > 0) {
      bookContext = knowledge.books.map(m => 
        `📚 [${m.title}] (${m.category}):\n${m.excerpt.substring(0, 400)}`
      ).join('\n\n');
      this.log(`Books matched: ${knowledge.books.length} (${knowledge.books.map(m => m.title).join(', ')})`);
    } else {
      this.log('No book matches found', 'warn');
    }

    // Build transcript context
    let transcriptContext = '';
    if (knowledge.transcripts.length > 0) {
      transcriptContext = knowledge.transcripts.map(t => 
        `🎬 [${t.title}] (${t.category}, ${t.viewCount} views):\n${t.excerpt.substring(0, 300)}`
      ).join('\n\n');
    }

    // Build Admin Brain RAG context
    let adminBrainContext = '';
    if (knowledge.adminBrain.length > 0) {
      adminBrainContext = knowledge.adminBrain.map(r => 
        `🧠 [${r.title || 'Knowledge'}]: ${(r.content || r.summary || '').substring(0, 300)}`
      ).join('\n\n');
    }

    // ─── Build enriched task ──────────────
    const knowledgeBlock = [
      knowledge.brain ? `\n--- [BRAIN] FRAMEWORK & MENTAL MODELS ---\n${knowledge.brain}` : '',
      bookContext ? `\n--- [SÁCH] THƯ VIỆN 28 CUỐN ---\n${bookContext}` : '',
      transcriptContext ? `\n--- [VIDEO REFERENCES] ---\n${transcriptContext}` : '',
      adminBrainContext ? `\n--- [ADMIN BRAIN RAG] ---\n${adminBrainContext}` : '',
    ].filter(Boolean).join('\n');

    const enrichedTask = `${task}${knowledgeBlock}`;
    this.log(`Enriched task: ${enrichedTask.length} chars (brain: ${knowledge.brain.length}, books: ${bookContext.length}, transcripts: ${transcriptContext.length})`);

    // Run LLM analysis
    const result = await super.execute(enrichedTask, { ...context, responseFormat: 'json' });
    
    // Try to save to Brain API (non-blocking)
    try {
      const parsed = JSON.parse(result);
      this.saveToBrain(parsed).catch(() => {}); // Fire and forget
    } catch {
      // Result wasn't valid JSON, that's ok
    }

    return result;
  }
}

export default BrainCuratorAgent;
