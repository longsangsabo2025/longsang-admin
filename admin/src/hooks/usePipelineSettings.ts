import { useCallback, useEffect, useState } from 'react';
import type { PipelineSettings, PipelineStepId, StepConfig } from '@/types/pipeline-settings';

const STORAGE_KEY = 'longsang_pipeline_settings';

// ── Default system prompts extracted from pipeline v3 ──────────

const DEFAULT_SCRIPT_SYSTEM = `Bạn là Script Writer của kênh YouTube Shorts "ĐỨNG DẬY ĐI".

## IDENTITY — Voice DNA
- Giọng: Triết gia bóng tối với trái tim chiến binh
- Tagline: "Nơi có những sự thật mà cuộc sống đã giấu bạn, và sức mạnh mà bạn quên mình đang có."
- Sign-off: "Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."

## VOICE RULES
- Viết cho TAI nghe, không cho MẮT đọc. Mỗi câu < 25 từ.
- Nhịp "The Wave": Câu dài cuốn hút → Câu ngắn đóng đinh → Chuyển tiếp
- Pattern "Long build → Short kill": "[Câu dài 30+ từ xây bối cảnh]... [5 từ đập.]"
- Xen English terms gốc khi cần (FOMO, GDP, ETF...)
- Dùng ẩn dụ: cơ thể/sinh học, chiến tranh, thiên nhiên/động vật, đời thường → giải mã hệ thống

## TỪ VỰNG DNA (dùng tự nhiên, xen kẽ):
🗡️ tín hiệu báo tử, cuộc đại thanh lọc, lò xay thịt, chiến lược sinh tồn, bản cáo trạng đẫm máu
💰 dòng tiền, nợ công phình to, rào cản gia nhập bằng không, cảnh báo đỏ
🧠 mã lệnh cốt lõi, hệ điều hành của loài người, FOMO, bẫy cảm xúc, ảo tưởng về sức mạnh, vùng an toàn giả tạo
📚 bản chất, quy luật kinh tế không bao giờ sai, sự thật tàn nhẫn, chân lý lạnh người

## CÂU SIGNATURE (dùng rải rác):
- "Và đó mới chỉ là phần nổi của tảng băng."
- "Sự thật phũ phàng là..."
- "Đừng nhìn vào bề mặt — hãy nhìn xuyên qua."
- "Đây không phải ý kiến cá nhân — đây là dữ liệu."

## CẤM KỴ TUYỆT ĐỐI:
❌ Giọng sách giáo khoa: "Theo định nghĩa..."
❌ YouTuber hype: "SIÊU ĐỈNH! CỰC SỐC!"
❌ Motivational sáo rỗng: "Bạn là người đặc biệt!", "Tin vào chính mình!"
❌ Gen Z fake: "Yo...", "Nha!", "Ê ê..."
❌ Kết yếu: "Vậy thôi nhé, bye bye"

## ĐỐI TƯỢNG: Người Việt 20-35 tuổi, đang cố gắng vươn lên, cần sự thật phũ phàng + hướng đi cụ thể.`;

const DEFAULT_SCRIPT_USER = `Viết script YouTube Shorts (50-60 giây) cho chủ đề: "{{TOPIC}}"

## CẤU TRÚC BẮT BUỘC — "Dark Arc" cho Shorts:

SCENE 1 — HOOK (8-10s): Gây sốc ngay giây đầu. Dùng 1 trong 5 pattern:
  A) Tuyên bố chấn động: "[Niềm tin sai] — [đập tan]. [Câu ngắn đóng đinh]."
  B) Câu hỏi tu từ: "Bạn đã bao giờ [trải nghiệm đau đớn cụ thể] chưa?"
  C) Vĩ mô → Vi mô: "Trong [bối cảnh lớn], [hiện tượng]. Nhưng [sự thật đằng sau]."
  D) Kể chuyện giả định: "Hãy tưởng tượng thế này nhé... [setup]... Nhưng [twist]."
  E) Danh sách tương phản: "Có những [phổ biến], có những [phổ biến khác], nhưng chỉ có [đặc biệt]..."

SCENE 2 — BỐI CẢNH (8-10s): Tại sao chủ đề này quan trọng NGAY BÂY GIỜ. Data thực tế, con số cụ thể.

SCENE 3 — GIẢI PHẪU (10-12s): Bóc 1 lớp sâu nhất. Claim mạnh → Bằng chứng → Ẩn dụ DNA.

SCENE 4 — TWIST (8-10s): Góc nhìn không ai nói. "Nhưng đây là điều thú vị nhất..."

SCENE 5 — ĐỨNG DẬY + KẾT (10-12s): Tough love + 1 hành động cụ thể + "Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."

## OUTPUT FORMAT — JSON array:
[{
  "scene": 1,
  "section": "HOOK | BOI_CANH | GIAI_PHAU | TWIST | DUNG_DAY",
  "narration": "(tiếng Việt, voice DNA, viết cho tai nghe, nhịp The Wave)",
  "visual_mood": "(mô tả mood/atmosphere cho visual director — tiếng Việt)",
  "text_overlay": "(1 câu ngắn 3-6 từ hiện trên màn hình — gây impact)",
  "duration_sec": 8-12
}]

QUAN TRỌNG: Narration phải SÂU, CÓ INSIGHT, CÓ DATA. Không surface-level. Viết như thể bạn đang giải phẫu xã hội.`;

const DEFAULT_VISUAL_SYSTEM = `You are a Visual Director for the YouTube channel "ĐỨNG DẬY ĐI" — a Vietnamese self-development/finance channel.

## YOUR VISUAL IDENTITY
- Style: Dark, cinematic, moody — like a documentary about hidden truths
- Color palette: Deep blacks, dark navy (#0a0a1a), with accents of amber/gold (#d4a843) and blood red (#8b1a1a)
- Mood: Atmospheric, thought-provoking, slightly unsettling — NOT generic tech/neon
- Think: Netflix documentary meets financial thriller visual language
- NO cartoon, NO cute, NO generic stock photo feel, NO cyberpunk neon

## IMAGE GENERATION RULES
- Each image should feel like a FRAME from a cinematic documentary
- Use dramatic lighting: chiaroscuro, rim lighting, golden hour, spotlight
- Compositions: rule of thirds, leading lines, negative space for text
- Human elements: silhouettes, hands, eyes, crowds — NOT face close-ups
- Symbolic objects: chains, hourglasses, scales, mirrors, chess pieces, clocks
- Vietnamese visual elements where appropriate: đường phố, quán cà phê, xe máy
- ALWAYS leave space on one side or top for text overlay
- Aspect ratio: 9:16 (vertical, 1080x1920)
- NO text, NO watermarks, NO UI elements in the image`;

const DEFAULT_VISUAL_USER = `Create a single cinematic image for a YouTube Shorts video scene.

SCENE CONTEXT:
- Section: {{SECTION}}
- Narration mood: {{VISUAL_MOOD}}
- Text that will overlay: "{{TEXT_OVERLAY}}"
- Vietnamese audience, topic: "{{TOPIC}}"

REQUIREMENTS:
- Photorealistic cinematic style, NOT illustration
- Dark moody atmosphere with dramatic lighting
- Color: deep blacks and navy with amber/gold or blood-red accents
- Leave negative space on the right or bottom for text overlay
- 9:16 vertical composition
- Evoke emotion: tension, revelation, determination
- NO text in image, NO faces directly toward camera
- Think: still frame from a Netflix financial thriller documentary

Generate the image now.`;

// ── Default step configs ────────────────────────────────────────

function createDefaultSteps(): StepConfig[] {
  return [
    {
      id: 'script',
      label: 'Script Writer',
      icon: '📝',
      enabled: true,
      model: 'gemini-2.5-flash',
      systemPrompt: DEFAULT_SCRIPT_SYSTEM,
      userPromptTemplate: DEFAULT_SCRIPT_USER,
      temperature: 0.85,
      params: {},
    },
    {
      id: 'visual',
      label: 'Visual Director',
      icon: '🎨',
      enabled: true,
      model: 'gemini-2.5-flash-image',
      systemPrompt: DEFAULT_VISUAL_SYSTEM,
      userPromptTemplate: DEFAULT_VISUAL_USER,
      temperature: 0.7,
      params: {
        aspectRatio: '9:16',
        fallbackModel: 'imagen-4.0-fast-generate-001',
        delayBetweenImages: 5000,
      },
    },
    {
      id: 'tts',
      label: 'TTS / Voice',
      icon: '🎤',
      enabled: true,
      model: 'vi-VN-HoaiMyNeural',
      systemPrompt: '',
      userPromptTemplate: '',
      temperature: 0,
      params: {
        rate_HOOK: '+5%',
        rate_BOI_CANH: '-5%',
        rate_GIAI_PHAU: '+0%',
        rate_TWIST: '-10%',
        rate_DUNG_DAY: '+5%',
      },
    },
    {
      id: 'video',
      label: 'Video Composer',
      icon: '🎬',
      enabled: true,
      model: 'ffmpeg-kenburns',
      systemPrompt: '',
      userPromptTemplate: '',
      temperature: 0,
      params: {
        resolution: '1080x1920',
        fps: 30,
        kenBurnsZoom: 1.15,
        fontFamily: 'Arial',
        fontSize: 56,
        overlayColor: 'white',
        overlayBorderColor: 'black',
        crossfadeDuration: 0.3,
      },
    },
    {
      id: 'post',
      label: 'Publisher',
      icon: '📤',
      enabled: true,
      model: 'telegram',
      systemPrompt: '',
      userPromptTemplate: '',
      temperature: 0,
      params: {
        captionTemplate:
          '🎬 {{TITLE}}\n\n🔑 {{TOPIC}}\n⏱️ {{DURATION}}s | 🧠 Voice DNA: Dark Philosopher',
      },
    },
  ];
}

function createDefaultSettings(): PipelineSettings {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    steps: createDefaultSteps(),
  };
}

// ── Hook ────────────────────────────────────────────────────────

export function usePipelineSettings() {
  const [settings, setSettings] = useState<PipelineSettings>(createDefaultSettings);
  const [isDirty, setIsDirty] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PipelineSettings = JSON.parse(raw);
        // Merge with defaults to handle new fields added later
        const merged = createDefaultSettings();
        for (const step of merged.steps) {
          const saved = parsed.steps.find((s) => s.id === step.id);
          if (saved) {
            Object.assign(step, saved);
          }
        }
        merged.version = parsed.version;
        merged.updatedAt = parsed.updatedAt;
        setSettings(merged);
      }
    } catch {
      // Corrupted data — use defaults
    }
  }, []);

  const updateStep = useCallback((stepId: PipelineStepId, patch: Partial<StepConfig>) => {
    setSettings((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    }));
    setIsDirty(true);
  }, []);

  const save = useCallback(() => {
    const updated: PipelineSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSettings(updated);
    setIsDirty(false);
    return updated;
  }, [settings]);

  const resetToDefaults = useCallback(() => {
    const defaults = createDefaultSettings();
    setSettings(defaults);
    setIsDirty(true);
  }, []);

  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const importSettings = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed: PipelineSettings = JSON.parse(e.target?.result as string);
        if (parsed.steps && Array.isArray(parsed.steps)) {
          setSettings(parsed);
          setIsDirty(true);
        }
      } catch {
        // Invalid file
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    settings,
    isDirty,
    updateStep,
    save,
    resetToDefaults,
    exportSettings,
    importSettings,
  };
}
