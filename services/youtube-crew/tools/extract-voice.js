/**
 * 🧬 DEEP VOICE DNA EXTRACTOR
 * 
 * Problem: VOICE.md v1 was too generic. GPT-4o-mini saw too few samples.
 * Solution: Multi-pass extraction from 40+ top videos with surgical prompting.
 * 
 * Pass 1: Extract RAW patterns (openings, closings, metaphors, sentence rhythm)
 * Pass 2: Synthesize into final VOICE.md for "Đứng Dậy Đi" channel
 */
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { chat } from './src/core/llm.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const CLEAN_FILE = join(__dirname, 'data/clean-transcripts.json');
const VOICE_FILE = join(__dirname, 'src/knowledge/VOICE.md');

function log(msg) { console.log(`🧬 [${new Date().toLocaleTimeString('vi-VN')}] ${msg}`); }

async function main() {
  log('Loading clean transcripts...');
  const data = JSON.parse(await readFile(CLEAN_FILE, 'utf-8'));
  
  // Pick 40 videos: top 20 by views + 4 from each underrepresented category
  const byViews = [...data.videos]
    .filter(v => v.transcriptChars > 5000)
    .sort((a, b) => b.viewCount - a.viewCount);
  
  const topIds = new Set();
  const selected = [];
  
  // Top 20 by views
  for (const v of byViews.slice(0, 20)) {
    selected.push(v);
    topIds.add(v.videoId);
  }
  
  // Fill categories
  for (const cat of ['tai-chinh', 'tam-ly', 'dia-chinh-tri', 'phat-trien', 'kinh-doanh', 'van-hoa', 'xa-hoi']) {
    let added = 0;
    for (const v of byViews.filter(v => v.category === cat && !topIds.has(v.videoId))) {
      if (added >= 3) break;
      selected.push(v);
      topIds.add(v.videoId);
      added++;
    }
  }

  log(`Selected ${selected.length} videos for deep analysis`);

  // ========== PASS 1: Extract raw patterns ==========
  log('PASS 1: Extracting raw voice patterns...');
  
  // 1A: Opening patterns (first 800 chars of each)
  const openings = selected.slice(0, 30).map(v => 
    `[${v.category}|${v.viewCount} views] ${v.title}\n→ ${v.transcript.substring(0, 800)}`
  ).join('\n\n---\n\n');

  const pass1a = await chat({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 4096,
    systemPrompt: `Bạn là chuyên gia phân tích ngôn ngữ học. Phân tích 30 đoạn MỞ BÀI dưới đây từ 1 kênh YouTube tiếng Việt.

NHIỆM VỤ: Tìm ra TẤT CẢ patterns mở bài. Đừng khái quát hóa - hãy trích dẫn CHÍNH XÁC câu mở đầu thật từ transcript.

Output:
1. Liệt kê 10 CÂU MỞ ĐẦU hay nhất (nguyên văn)
2. Phân loại pattern: câu hỏi tu từ / tuyên bố gây sốc / kể chuyện / bối cảnh lịch sử / thống kê
3. Đếm tần suất mỗi pattern
4. Cách chuyển từ hook sang nội dung chính (transition phrases)
5. Câu intro cố định lặp lại (signature intro)`,
    userMessage: openings,
  });
  log('Pass 1A done: Opening patterns');

  // 1B: Metaphors, vocabulary, sentence rhythm (mid sections)
  const midSections = selected.slice(0, 25).map(v => {
    const t = v.transcript;
    const chunk1 = t.substring(Math.floor(t.length * 0.2), Math.floor(t.length * 0.2) + 600);
    const chunk2 = t.substring(Math.floor(t.length * 0.5), Math.floor(t.length * 0.5) + 600);
    const chunk3 = t.substring(Math.floor(t.length * 0.8), Math.floor(t.length * 0.8) + 600);
    return `[${v.category}] ${v.title}\n--- đoạn 1 ---\n${chunk1}\n--- đoạn 2 ---\n${chunk2}\n--- đoạn 3 ---\n${chunk3}`;
  }).join('\n\n===\n\n');

  const pass1b = await chat({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 4096,
    systemPrompt: `Bạn là chuyên gia phân tích phong cách viết. Phân tích 25 đoạn content body từ 1 kênh YouTube.

NHIỆM VỤ:
1. TRÍCH XUẤT 30+ cụm ẩn dụ/so sánh ĐẶC TRƯNG (nguyên văn từ text). Nhóm theo theme: chiến tranh, sinh tồn, cơ thể, trò chơi, tự nhiên, tài chính.
2. TỪ VỰNG ĐẶC TRƯNG: Liệt kê 50+ từ/cụm từ xuất hiện nhiều nhất và tạo nên "mùi" của kênh. 
3. NHỊP CÂU: Phân tích chiều dài câu trung bình, pattern câu ngắn-dài, cách dùng liệt kê, cách tạo momentum.
4. CÁCH CHUYỂN Ý: Các transition phrases hay dùng.
5. CÁCH DÙNG DATA: Độ chính xác số liệu, cách trình bày thống kê.

QUAN TRỌNG: Trích dẫn NGUYÊN VĂN từ transcript, đừng paraphrase.`,
    userMessage: midSections,
  });
  log('Pass 1B done: Metaphors & vocabulary');

  // 1C: Closing patterns + emotional arc
  const closings = selected.slice(0, 25).map(v => {
    const t = v.transcript;
    return `[${v.category}] ${v.title}\n→ CUỐI: ${t.substring(t.length - 800)}`;
  }).join('\n\n---\n\n');

  const pass1c = await chat({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2048,
    systemPrompt: `Phân tích 25 đoạn KẾT BÀI của kênh YouTube tiếng Việt.

NHIỆM VỤ:
1. Pattern kết bài: Cách tóm tắt, cách kêu gọi hành động, cách tạo cảm xúc cuối
2. Câu kết hay nhất (nguyên văn) — top 10
3. Signature outro (câu lặp lại ở cuối mỗi video)
4. Emotional arc: Cảm xúc thay đổi từ đầu→giữa→cuối như thế nào

Trích dẫn NGUYÊN VĂN.`,
    userMessage: closings,
  });
  log('Pass 1C done: Closing patterns');

  // ========== PASS 2: Synthesize into final VOICE.md ==========
  log('PASS 2: Synthesizing Voice DNA for "Đứng Dậy Đi"...');

  const synthesis = await chat({
    model: 'gpt-4o-mini', 
    temperature: 0.5,
    maxTokens: 8192,
    systemPrompt: `Bạn là giám đốc sáng tạo đang xây dựng bản hướng dẫn giọng văn (Voice DNA) cho kênh YouTube mới tên "ĐỨNG DẬY ĐI".

Kênh này THAM KHẢO phong cách từ kênh "THE HIDDEN SELF" nhưng có bản sắc riêng:
- Cùng phong cách "Dark Philosopher" — nói sự thật phũ phàng, dùng ẩn dụ chiến tranh/sinh tồn
- Nhưng thêm yếu tố ĐỘNG LỰC (đứng dậy, hành động, không bỏ cuộc)
- Tone sâu lắng nhưng đầy lửa — không phải kiểu "toxic masculinity" mà là "tough love"
- Target: Người Việt 22-40 tuổi muốn thay đổi cuộc đời

Từ 3 bản phân tích RAW bên dưới, hãy tổng hợp thành BẢN VOICE DNA HOÀN CHỈNH.

FORMAT (Markdown tiếng Việt):

## 1. TỔNG QUAN (3-4 câu identity statement mạnh)

## 2. CÔNG THỨC MỞ BÀI
- 5 pattern mở bài cụ thể VỚI VÍ DỤ THỰC TẾ từ data
- Template mở bài cho mỗi pattern (có chỗ trống [___] để agent fill)

## 3. CẤU TRÚC BÀI — "The Dark Arc"
- Blueprint từ mở → thân → twist → kết
- Transition phrases chính xác
- Cách xây momentum (câu ngắn→dài→ngắn→bùng nổ)

## 4. CÔNG THỨC KẾT BÀI
- Pattern kết + ví dụ thực
- Call to action tự nhiên, không desperate

## 5. TỪ VỰNG DNA (60+ từ/cụm)
- Nhóm: Chiến tranh & Sinh tồn | Tài chính "sắc" | Tâm lý "tối" | Triết lý "nặng" | Quyền lực & Hệ thống
- Mỗi nhóm 10-15 từ

## 6. ẨN DỤ ĐẶC TRƯNG (20+)
- Nguyên văn từ data, nhóm theo theme

## 7. CÂU SIGNATURE KÊNH "ĐỨNG DẬY ĐI"
- Câu intro cố định (mới, khác THE HIDDEN SELF)
- Câu outro cố định
- 5-10 câu cửa miệng

## 8. NHỊP VĂN — "The Pulse"
- Ví dụ cụ thể về cách xây câu: ngắn (5 từ) → trung (15 từ) → dài (30+ từ) → punch (5 từ)
- Pattern liệt kê 3 nhịp: "X. Y. Và Z."
- Cách dùng dấu chấm để tạo pause

## 9. TONE MATRIX
- % phân bổ: nghiêm túc, khiêu khích, triết lý, cảm xúc, data-driven, động lực
- Ví dụ mỗi tone

## 10. CẤM KỴ — "Ranh Giới Đỏ"
- 10 điều KHÔNG BAO GIỜ làm
- Anti-patterns cụ thể

## 11. VÍ DỤ MẪU
- 1 đoạn mở bài mẫu hoàn chỉnh (~200 từ) theo đúng voice
- 1 đoạn thân bài mẫu (~300 từ)
- 1 đoạn kết bài mẫu (~150 từ)

CHI TIẾT. CỤ THỂ. ĐẦY ĐỦ VÍ DỤ. ĐỪNG KÉT CHỮ.`,
    userMessage: `=== PHÂN TÍCH MỞ BÀI ===
${pass1a.content}

=== PHÂN TÍCH ẨN DỤ & TỪ VỰNG ===
${pass1b.content}

=== PHÂN TÍCH KẾT BÀI ===
${pass1c.content}`,
  });
  log('Pass 2 done: Synthesis complete');

  // Write final VOICE.md
  const voiceMd = `# 🎙️ VOICE DNA — ĐỨNG DẬY ĐI
<!-- Deep-extracted from 315 video transcripts (${data.videos.length} videos, ${selected.length} sampled) -->
<!-- Reference channel: THE HIDDEN SELF (@thehiddenself.pocast) -->
<!-- Target channel: ĐỨNG DẬY ĐI -->
<!-- Generated: ${new Date().toISOString()} -->
<!-- Method: 3-pass deep extraction (openings → metaphors/vocab → closings → synthesis) -->

${synthesis.content}
`;

  await writeFile(VOICE_FILE, voiceMd, 'utf-8');
  log(`VOICE.md written: ${voiceMd.length.toLocaleString()} chars`);
  console.log('\n✅ Done! Check src/knowledge/VOICE.md');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
