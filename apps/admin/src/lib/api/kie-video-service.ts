/**
 * 🎬 Kie.AI Direct Video Service
 * Gọi trực tiếp Kie.AI API - không qua n8n
 * Flow: User Input → OpenAI (tạo prompt) → Kie.AI → Video
 * Simple is better!
 */

import OpenAI from 'openai';

const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY || '';
const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

// OpenAI client for prompt generation
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export type VideoModel = 'veo3' | 'sora2';

// Input từ user
export interface UGCVideoInput {
  product: string;
  productPhoto: string;
  icp: string;
  productFeatures?: string;
  videoSetting?: string;
  model: VideoModel;
}

export interface VideoRequest {
  prompt: string;
  imageUrl: string;
  model: VideoModel;
}

export interface VideoResponse {
  success: boolean;
  taskId?: string;
  videoUrl?: string;
  prompt?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
}

// AI Settings interface
export interface AISettings {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

// System prompts từ n8n workflow
const VEO3_SYSTEM_PROMPT = `You are an expert UGC video creator for Veo 3.
Generate a detailed video prompt for a realistic, selfie-style video (8 seconds).

Requirements:
- Selfie-style, vertical (9:16) format
- Subject represents the ICP persona
- Natural lighting, realistic environment
- Subtle camera shake for authenticity
- 1-2 casual sentences about the product
- No phone visible in shot

Output ONLY the video prompt, nothing else.`;

const SORA2_SYSTEM_PROMPT = `You are an advanced UGC video creator for Sora 2.
Generate a detailed video prompt for a realistic, selfie-style video (10 seconds).

Requirements:
- Selfie-style, vertical (9:16) format  
- Subject represents the ICP persona
- Natural lighting, authentic setting
- 1-2 casual sentences about the product
- Duration: 10 seconds

Output ONLY the video prompt, nothing else.`;

/**
 * 🧠 AI Generate Video Prompt
 * Giống như node "Veo Video Prompt" trong n8n
 * Hỗ trợ custom AI settings
 */
export async function generateVideoPrompt(input: UGCVideoInput, aiSettings?: AISettings): Promise<string> {
  // Sử dụng custom system prompt nếu có, không thì dùng default theo model
  const defaultSystemPrompt = input.model === 'veo3' ? VEO3_SYSTEM_PROMPT : SORA2_SYSTEM_PROMPT;
  const systemPrompt = aiSettings?.systemPrompt || defaultSystemPrompt;
  
  const userMessage = `
Product: ${input.product}
Product ICP: ${input.icp}
Product Features: ${input.productFeatures || 'N/A'}
Video Setting: ${input.videoSetting || 'Natural environment'}
`;

  const response = await openai.chat.completions.create({
    model: aiSettings?.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: aiSettings?.temperature ?? 0.7,
    max_tokens: aiSettings?.maxTokens || 500,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * 🚀 Generate video với Veo 3.1
 */
export async function generateVeo3Video(prompt: string, imageUrl: string): Promise<VideoResponse> {
  try {
    const response = await fetch(`${KIE_BASE_URL}/veo/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt.replace(/[\r\n]+/g, ' ').replace(/["'"]/g, ''),
        imageUrls: [imageUrl],
        model: 'veo3_fast',
        aspectRatio: '9:16',
        enableTranslation: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      taskId: data.data?.taskId,
      status: 'processing',
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 🔍 Check Veo 3 video status
 * Kie.ai uses successFlag: 1 = success, 0 = processing, -1 = failed
 */
export async function checkVeo3Status(taskId: string): Promise<VideoResponse> {
  try {
    const response = await fetch(`${KIE_BASE_URL}/veo/record-info?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    const data = await response.json();
    console.log('[Veo3] Status check:', { taskId, successFlag: data.data?.successFlag });
    
    // Kie.ai uses successFlag instead of state
    const successFlag = data.data?.successFlag;
    
    if (successFlag === 1) {
      // Video URL is in data.response.resultUrls[0]
      const videoUrl = data.data?.response?.resultUrls?.[0];
      console.log('[Veo3] ✅ Video ready:', videoUrl);
      return {
        success: true,
        taskId,
        videoUrl,
        status: 'success',
      };
    }
    
    if (successFlag === -1) {
      return {
        success: false,
        taskId,
        status: 'failed',
        error: data.data?.errorMessage || 'Video generation failed',
      };
    }

    // Still processing (successFlag === 0 or undefined)
    return {
      success: true,
      taskId,
      status: 'processing',
    };
  } catch (error) {
    return {
      success: false,
      taskId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 🎥 Generate video với Sora 2
 */
export async function generateSora2Video(prompt: string, imageUrl: string): Promise<VideoResponse> {
  try {
    const response = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sora-2-image-to-video',
        input: {
          prompt: prompt.replace(/[\r\n]+/g, ' ').replace(/["'"]/g, ''),
          image_urls: [imageUrl],
          aspect_ratio: 'portrait',
          n_frames: '10',
          remove_watermark: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      taskId: data.data?.taskId,
      status: 'processing',
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 🔍 Check Sora 2 video status
 */
export async function checkSora2Status(taskId: string): Promise<VideoResponse> {
  try {
    const response = await fetch(`${KIE_BASE_URL}/jobs/recordInfo?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    const data = await response.json();
    
    if (data.data?.state === 'success') {
      const resultJson = JSON.parse(data.data.resultJson || '{}');
      return {
        success: true,
        taskId,
        videoUrl: resultJson.resultUrls?.[0],
        status: 'success',
      };
    }

    return {
      success: true,
      taskId,
      status: data.data?.state === 'failed' ? 'failed' : 'processing',
    };
  } catch (error) {
    return {
      success: false,
      taskId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 🔄 Poll until video is ready
 */
export async function waitForVideo(
  taskId: string,
  model: VideoModel,
  onProgress?: (status: string) => void,
  maxAttempts = 30,
  intervalMs = 5000
): Promise<VideoResponse> {
  const checkFn = model === 'veo3' ? checkVeo3Status : checkSora2Status;
  
  for (let i = 0; i < maxAttempts; i++) {
    onProgress?.(`Checking... (${i + 1}/${maxAttempts})`);
    
    const result = await checkFn(taskId);
    
    if (result.status === 'success' || result.status === 'failed') {
      return result;
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return {
    success: false,
    taskId,
    status: 'failed',
    error: 'Timeout - video generation took too long',
  };
}

/**
 * 🎯 Main function - Generate UGC Video (với prompt có sẵn)
 */
export async function generateUGCVideo(
  prompt: string,
  imageUrl: string,
  model: VideoModel = 'veo3',
  onProgress?: (status: string) => void
): Promise<VideoResponse> {
  // Step 1: Start generation
  onProgress?.('Starting video generation...');
  
  const startResult = model === 'veo3'
    ? await generateVeo3Video(prompt, imageUrl)
    : await generateSora2Video(prompt, imageUrl);

  if (!startResult.success || !startResult.taskId) {
    return startResult;
  }

  // Step 2: Wait for completion
  onProgress?.('Video is being generated...');
  return waitForVideo(startResult.taskId, model, onProgress);
}

/**
 * 🎬 FULL FLOW: User Input → AI Prompt → Video
 * Giống workflow n8n nhưng gọi trực tiếp!
 * Hỗ trợ custom AI settings
 */
export async function createUGCVideoAd(
  input: UGCVideoInput,
  onProgress?: (status: string) => void,
  aiSettings?: AISettings
): Promise<VideoResponse> {
  try {
    // Step 1: AI tạo video prompt
    onProgress?.('🧠 AI đang tạo video prompt...');
    const prompt = await generateVideoPrompt(input, aiSettings);
    
    if (!prompt) {
      return { success: false, status: 'failed', error: 'Failed to generate prompt' };
    }
    
    console.log('[UGC] Generated prompt:', prompt);

    // Step 2: Gọi Kie.AI tạo video
    onProgress?.('🎬 Đang tạo video...');
    const startResult = input.model === 'veo3'
      ? await generateVeo3Video(prompt, input.productPhoto)
      : await generateSora2Video(prompt, input.productPhoto);

    if (!startResult.success || !startResult.taskId) {
      return { ...startResult, prompt };
    }

    // Step 3: Chờ video hoàn thành
    onProgress?.('⏳ Video đang được xử lý...');
    const result = await waitForVideo(startResult.taskId, input.model, onProgress);
    
    return { ...result, prompt };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
