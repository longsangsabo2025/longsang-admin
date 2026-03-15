/**
 * TTS Text Preprocessor
 * 
 * Prepares Vietnamese script text for optimal TTS output:
 * 1. Transliterate foreign names → Vietnamese phonetics
 * 2. Add natural breathing pauses for pacing
 * 3. Normalize numbers, abbreviations, special chars
 * 4. Optimize sentence structure for TTS rhythm
 * 
 * Uses GPT-4o-mini (~$0.002/call) for intelligent transliteration
 */
import { chat } from '../core/llm.js';

/**
 * Common foreign name → Vietnamese phonetic mapping (cached, no LLM needed)
 */
const PHONETIC_MAP = {
  // Philosophers
  'Schopenhauer': 'Sô-pen-hao-ơ',
  'Nietzsche': 'Nít-sơ',
  'Friedrich Nietzsche': 'Phờ-rít-đờ-rích Nít-sơ',
  'Aristotle': 'A-ri-xtốt',
  'Socrates': 'Xô-crát',
  'Plato': 'Pla-tô',
  'Descartes': 'Đề-các',
  'Kant': 'Can-tơ',
  'Hegel': 'Hê-ghen',
  'Kierkegaard': 'Ki-ếc-kê-go',
  'Heidegger': 'Hai-đe-gơ',
  'Sartre': 'Xác-trơ',
  'Camus': 'Ca-muy',
  'Voltaire': 'Vôn-te',
  'Rousseau': 'Rút-xô',
  'Montaigne': 'Mông-ten',
  'Epicurus': 'Ê-pi-quya',
  'Epictetus': 'Ê-píc-tê-tút',
  'Seneca': 'Xê-nê-ca',
  'Marcus Aurelius': 'Mác-cút Ao-rê-li-út',
  'Confucius': 'Khổng Tử',
  'Lao Tzu': 'Lão Tử',
  'Zhuangzi': 'Trang Tử',
  'Mencius': 'Mạnh Tử',
  'Wittgenstein': 'Vít-ghen-xtai-nơ',
  'Husserl': 'Hút-xéc-lơ',
  'Foucault': 'Phu-cô',
  'Derrida': 'Đe-ri-đa',
  'Simone de Beauvoir': 'Xi-mô-nơ đờ Bô-voa',
  'Hannah Arendt': 'Ha-na A-ren-tơ',

  // Psychologists
  'Freud': 'Phờ-rôi-tơ',
  'Jung': 'Dung',
  'Adler': 'Át-lơ',
  'Maslow': 'Mát-xlâu',
  'Frankl': 'Phơ-ran-cồ',
  'Viktor Frankl': 'Víc-to Phơ-ran-cồ',
  'Carl Jung': 'Các Dung',
  'Sigmund Freud': 'Dích-mun Phờ-rôi-tơ',
  'Jordan Peterson': 'Gioóc-đần Pi-tơ-xơn',

  // Writers / Thinkers
  'Dostoevsky': 'Đốt-xtôi-ép-xki',
  'Tolstoy': 'Tôn-xtôi',
  'Shakespeare': 'Sếch-xpia',
  'Hemingway': 'Hê-minh-uây',
  'Kafka': 'Káp-ca',
  'Orwell': 'O-oen',
  'Thoreau': 'Tho-rô',
  'Emerson': 'E-mơ-xơn',
  'Napoleon Hill': 'Na-pô-lê-ông Hin',
  'Dale Carnegie': 'Đêu Ca-nê-ghi',
  'Stephen Covey': 'Xti-phờn Cô-vi',
  'Robert Greene': 'Rô-bớt Grin',
  'James Clear': 'Giêm-xờ Clia',
  'Mark Manson': 'Mác Men-xơn',
  'Ryan Holiday': 'Rai-ần Ho-li-đây',
  'Cal Newport': 'Cao Niu-po',
  'Malcolm Gladwell': 'Man-côm Glad-oen',
  'Daniel Kahneman': 'Đa-ni-en Ca-nơ-mần',
  'Yuval Noah Harari': 'Du-van Nô-a Ha-ra-ri',
  'Nassim Taleb': 'Na-xim Ta-lép',
  'Tim Ferriss': 'Tim Phe-rít',
  'Seth Godin': 'Xét Gô-đin',

  // Scientists
  'Einstein': 'Ai-xơ-tai-nơ',
  'Newton': 'Niu-tơn',
  'Darwin': 'Đác-uyn',
  'Hawking': 'Ho-king',
  'Elon Musk': 'I-lôn Mát-xcơ',
  'Steve Jobs': 'Xtiv Giốp',
  'Jeff Bezos': 'Giép Bê-dốt',
  'Warren Buffett': 'Oa-rần Ba-phít',
  'Ray Dalio': 'Rây Đa-li-ô',
  'Charlie Munger': 'Cha-li Mang-gờ',

  // Concepts / English terms commonly in Vietnamese self-help
  'mindset': 'mai-xét',
  'Stoicism': 'chủ nghĩa Khắc Kỷ',
  'stoicism': 'chủ nghĩa khắc kỷ',
  'Stoic': 'Khắc Kỷ',
  'mindfulness': 'chánh niệm',
  'feedback': 'phản hồi',
  'burnout': 'kiệt sức',
  'imposter syndrome': 'hội chứng kẻ mạo danh',
  'comfort zone': 'vùng an toàn',
  'growth mindset': 'tư duy phát triển',
  'fixed mindset': 'tư duy cố định',
  'deep work': 'đíp-uốc',
  'flow state': 'trạng thái dòng chảy',
};

/**
 * Apply static phonetic map (fast, no LLM cost)
 */
function applyPhoneticMap(text) {
  let result = text;
  // Sort by length descending to match longer phrases first (e.g., "Marcus Aurelius" before "Marcus")
  const sorted = Object.entries(PHONETIC_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [eng, vn] of sorted) {
    // Case-insensitive whole-word replacement
    const regex = new RegExp(`\\b${eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, vn);
  }
  // Fix double "chủ nghĩa chủ nghĩa" from context-aware mapping
  result = result.replace(/chủ nghĩa\s+chủ nghĩa/gi, 'chủ nghĩa');
  return result;
}

/**
 * Use GPT-4o-mini to transliterate remaining foreign words not in the static map
 */
async function transliterateForeignWords(text) {
  // Check if there are any remaining Latin/English words (not Vietnamese)
  const foreignWords = text.match(/\b[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)*\b/g);
  if (!foreignWords || foreignWords.length === 0) return text;

  // Filter out Vietnamese words (words with diacritics are already Vietnamese)
  const trueForeign = foreignWords.filter(w => !/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(w));
  if (trueForeign.length === 0) return text;

  const unique = [...new Set(trueForeign)];

  try {
    const { content } = await chat({
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt: `Bạn là chuyên gia phiên âm. Chuyển đổi tên riêng/từ tiếng Anh sang cách đọc tiếng Việt.
Quy tắc:
- Dùng dấu gạch nối giữa các âm tiết: "Schopenhauer" → "Sô-pen-hao-ơ"
- Giữ nguyên nếu đã có phiên âm quen thuộc: "Einstein" → "Ai-xơ-tai-nơ"
- Chỉ trả lời JSON object, key là từ gốc, value là phiên âm
- KHÔNG giải thích thêm`,
      userMessage: `Phiên âm các từ sau: ${JSON.stringify(unique)}`,
      temperature: 0.1,
      maxTokens: 512,
      responseFormat: 'json',
    });

    const map = JSON.parse(content);
    let result = text;
    for (const [eng, vn] of Object.entries(map)) {
      if (vn && typeof vn === 'string') {
        const regex = new RegExp(`\\b${eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        result = result.replace(regex, vn);
      }
    }
    return result;
  } catch (e) {
    console.error('[Preprocessor] LLM transliteration failed:', e.message);
    return text; // fallback: return original
  }
}

/**
 * Add natural breathing pauses for podcast pacing
 * Vietnamese TTS reads commas as short pauses and "..." as longer pauses
 */
function addBreathingPauses(text) {
  let result = text;

  // Add pause after sentences ending with . ! ?  (double space → natural breath)
  result = result.replace(/([.!?])\s+/g, '$1  ');

  // Add micro-pause before conjunctions for natural rhythm
  result = result.replace(/\s+(nhưng|tuy nhiên|thế nhưng|mặc dù|dù vậy|tuy vậy)\s+/g, ', $1 ');
  result = result.replace(/\s+(vì vậy|do đó|cho nên|bởi vì|chính vì)\s+/g, ', $1 ');

  // Add pause after long introductory phrases
  result = result.replace(/(Và hôm nay)\s+/g, '$1,  ');
  result = result.replace(/(Các bạn ơi)\s+/g, '$1,  ');
  result = result.replace(/(Bạn biết không)\s+/g, '$1,  ');

  // Add pause after rhetorical questions for dramatic effect
  result = result.replace(/(\?)\s+(?=[A-ZÀÁẢÃẠ])/g, '?...  ');

  // Add slight pause after series items (numbered lists, bullet-point style)
  result = result.replace(/(\.\s*)(Thứ\s+(nhất|hai|ba|tư|năm|sáu|bảy))/g, '.$1 $2');
  result = result.replace(/(\.\s*)(Đầu tiên|Tiếp theo|Cuối cùng|Ngoài ra)/g, '.$1 $2');

  return result;
}

/**
 * Normalize numbers, abbreviations, and special characters
 */
function normalizeText(text) {
  let result = text;

  // Numbers to Vietnamese words (common cases)
  result = result.replace(/\b(\d+)%/g, (_, n) => `${n} phần trăm`);
  result = result.replace(/\$(\d+)/g, (_, n) => `${n} đô la`);
  result = result.replace(/(\d+)\s*km\b/gi, (_, n) => `${n} ki lô mét`);
  result = result.replace(/(\d+)\s*kg\b/gi, (_, n) => `${n} ki lô gam`);

  // Common abbreviations
  result = result.replace(/\bvd\b/gi, 'ví dụ');
  result = result.replace(/\bvv\b/gi, 'vân vân');
  result = result.replace(/\bPGS\b/g, 'Phó giáo sư');
  result = result.replace(/\bGS\b/g, 'Giáo sư');
  result = result.replace(/\bTS\b/g, 'Tiến sĩ');
  result = result.replace(/\bThS\b/g, 'Thạc sĩ');

  // Remove URLs
  result = result.replace(/https?:\/\/\S+/g, '');

  // Remove emoji
  result = result.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // Clean up multiple spaces
  result = result.replace(/\s{3,}/g, '  ');

  return result.trim();
}

/**
 * Main preprocessing pipeline
 * @param {string} text - Raw script text
 * @param {object} opts
 * @param {boolean} opts.useLLM - Use GPT for unknown foreign word transliteration (default: true)
 * @returns {Promise<string>} - Preprocessed text ready for TTS
 */
export async function preprocessForTTS(text, { useLLM = true } = {}) {
  let result = text;

  // Step 1: Normalize numbers, abbreviations
  result = normalizeText(result);

  // Step 2: Apply static phonetic map (instant, free)
  result = applyPhoneticMap(result);

  // Step 3: LLM transliteration for unknown foreign words (optional, ~$0.001)
  if (useLLM) {
    result = await transliterateForeignWords(result);
  }

  // Step 4: Add breathing pauses for natural pacing
  result = addBreathingPauses(result);

  return result;
}

export { applyPhoneticMap, normalizeText, addBreathingPauses, PHONETIC_MAP };
