/**
 * 💡 Topic Suggestion Agent — AI-powered topic generation for batch pipelines
 *
 * Uses Gemini 2.0 Flash to suggest 30-50 unique video topics
 * based on channel niche, style, categories, and existing runs.
 */

import { getNextKey } from './api-key-pool';

export interface TopicSuggestion {
  id: string;
  topic: string;
  category: string;
  hook: string; // 1-line hook to grab attention
  estimatedMinutes: number; // estimated script read time
}

export interface SuggestTopicsRequest {
  channelId: string;
  channelName: string;
  categories: string[];
  tone?: string;
  style?: string;
  sampleTopics?: string[];
  existingTopics?: string[]; // topics already produced — avoid duplicates
  count?: number; // 30-50, default 40
  customContext?: string; // user can add extra direction
  playlist?: string; // target playlist theme
}

export interface SuggestTopicsResult {
  topics: TopicSuggestion[];
  model: string;
  generatedAt: string;
}

/** Channel niche descriptions for better AI context */
const CHANNEL_NICHE_MAP: Record<string, string> = {
  'dung-day-di':
    'Kênh triết học tối, dark psychology, kỷ luật bản thân, stoicism, tâm lý chiều sâu. ' +
    'Giọng điệu mạnh mẽ, uy lực, ẩn dụ chiến binh/bóng tối. Target: nam 18-35 muốn tự cải thiện.',
  'sach-15-phut':
    'Kênh tóm tắt sách self-help, tâm lý, kinh doanh, kỹ năng sống. ' +
    'Giọng storytelling ấm áp, mentor chia sẻ. Target: người đi làm muốn đọc sách nhưng bận.',
  'ai-builder-vn':
    'Kênh hướng dẫn AI, automation, no-code tools, AI agents cho developer và creator Việt. ' +
    'Giọng thực chiến, build-in-public. Target: dev và creator muốn leverage AI.',
  'tien-thong-minh':
    'Kênh tài chính cá nhân, đầu tư, bẫy tài chính, quản lý tiền cho người trẻ VN. ' +
    'Giọng financial mentor thẳng thắn. Target: 22-35 muốn quản lý tiền thông minh.',
  'ly-black':
    'AI virtual influencer, triết học số, AI consciousness, nghệ thuật số, digital existence. ' +
    'Giọng poetic noir, bilingual VN/EN. Target: gen-Z quan tâm AI và triết học.',
};

export async function suggestTopics(
  req: SuggestTopicsRequest
): Promise<SuggestTopicsResult> {
  const apiKey = getNextKey('gemini');
  if (!apiKey) {
    throw new Error('No Gemini key available — add keys to Key Pool');
  }

  const count = Math.min(Math.max(req.count || 40, 10), 60);
  const niche = CHANNEL_NICHE_MAP[req.channelId] || `YouTube channel: ${req.channelName}`;

  const existingStr =
    req.existingTopics && req.existingTopics.length > 0
      ? `\n\n⚠️ TRÁNH trùng với ${req.existingTopics.length} topic đã có:\n${req.existingTopics.slice(0, 50).map((t) => `- ${t}`).join('\n')}`
      : '';

  const playlistStr = req.playlist ? `\n🎯 Target playlist: "${req.playlist}"` : '';
  const customStr = req.customContext ? `\n📌 Yêu cầu thêm: ${req.customContext}` : '';

  const sampleStr =
    req.sampleTopics && req.sampleTopics.length > 0
      ? `\n\nVí dụ topic hay cho kênh này:\n${req.sampleTopics.map((t) => `- ${t}`).join('\n')}`
      : '';

  const systemPrompt = `Bạn là chuyên gia content strategy cho YouTube Vietnam. Nhiệm vụ: đề xuất ${count} video topics ĐỘC ĐÁO, VIRAL POTENTIAL cho kênh YouTube.

Mỗi topic phải:
1. Có sức hút cao (curiosity gap, emotional trigger, or practical value)
2. Phù hợp niche và tone của kênh
3. Dài đủ để viết script 8 phút (~1500-1800 từ VN)
4. Title hấp dẫn, viết theo kiểu YouTube VN (thêm dash, emoji concept, power words)
5. KHÔNG trùng với topic đã có

Phân loại mỗi topic vào 1 category phù hợp.
Viết 1 câu hook ngắn (sẽ dùng cho 3 giây đầu video).
Ước lượng thời gian audio (phút) cho script topic này.`;

  const userPrompt = `📺 Kênh: ${req.channelName} (${req.channelId})
🎯 Niche: ${niche}
📂 Categories: ${req.categories.join(', ') || 'Chưa xác định'}
🎵 Tone: ${req.tone || 'default'}
🎨 Style: ${req.style || 'default'}${playlistStr}${customStr}${sampleStr}${existingStr}

Đề xuất ĐÚNG ${count} topics. Trả về JSON array:
[
  {
    "topic": "Tiêu đề video hấp dẫn",
    "category": "category_name",
    "hook": "Câu hook 3 giây đầu",
    "estimatedMinutes": 8
  }
]

CHỈ trả về JSON array, không text nào khác.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.9, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        `Gemini error ${res.status}`
    );
  }

  const data = await res.json();
  const rawText = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

  let parsed: Array<{
    topic: string;
    category?: string;
    hook?: string;
    estimatedMinutes?: number;
  }>;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Try to extract JSON array from markdown code block
    const match = rawText.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('AI response is not valid JSON');
    }
  }

  if (!Array.isArray(parsed)) throw new Error('AI response is not an array');

  const topics: TopicSuggestion[] = parsed
    .filter((t) => t.topic?.trim())
    .map((t, i) => ({
      id: `topic_${Date.now()}_${i}`,
      topic: t.topic.trim(),
      category: t.category || 'Uncategorized',
      hook: t.hook || '',
      estimatedMinutes: t.estimatedMinutes || 8,
    }));

  return {
    topics,
    model: 'gemini-2.5-flash',
    generatedAt: new Date().toISOString(),
  };
}
