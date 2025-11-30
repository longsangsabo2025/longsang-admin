/**
 * Sora Video Generation Service
 * Service để Admin UI gọi n8n workflow tạo video Sora
 */

interface SoraVideoRequest {
  prompt: string;
  use_ai_enhance?: boolean;
  model?: 'sora-2-text-to-video' | 'sora-2-image-to-video' | 'sora-2-pro-storyboard';
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  duration?: number;
  folder_id?: string;
  video_name?: string;
}

interface SoraVideoResponse {
  success: boolean;
  message: string;
  data?: {
    task_id: string;
    video_url?: string;
    google_drive?: {
      file_id: string;
      file_name: string;
      view_link: string;
      download_link: string;
    };
    prompt?: {
      original: string;
      enhanced: string;
      used: string;
    };
    settings?: {
      model: string;
      aspect_ratio: string;
      duration: number;
    };
    processing?: {
      poll_count: number;
      total_time_seconds: number;
    };
  };
  error?: string;
  timestamp?: string;
}

interface VideoGenerationStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  video_url?: string;
  google_drive_id?: string;
}

class SoraVideoService {
  private readonly webhookUrl: string;
  private readonly webhookSecret: string;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
    this.webhookSecret = import.meta.env.VITE_N8N_WEBHOOK_SECRET || 'your-webhook-secret';
  }

  /**
   * 🎬 Generate Video with Sora
   * Main method to create video from text prompt
   */
  async generateVideo(request: SoraVideoRequest): Promise<SoraVideoResponse> {
    try {
      const url = `${this.webhookUrl}/sora-generate-video`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookSecret}`,
          'X-Webhook-Source': 'longsang-admin'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          use_ai_enhance: request.use_ai_enhance ?? true,
          model: request.model || 'sora-2-text-to-video',
          aspect_ratio: request.aspect_ratio || '16:9',
          duration: request.duration || 5,
          folder_id: request.folder_id || 'root',
          video_name: request.video_name || `sora_video_${Date.now()}`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sora video generation error:', error);
      return {
        success: false,
        message: 'Failed to generate video',
        error: errorMessage
      };
    }
  }

  /**
   * 🚀 Quick Generate
   * Simple method with just prompt - uses AI enhancement by default
   */
  async quickGenerate(prompt: string): Promise<SoraVideoResponse> {
    return this.generateVideo({
      prompt,
      use_ai_enhance: true,
      model: 'sora-2-text-to-video',
      aspect_ratio: '16:9',
      duration: 5
    });
  }

  /**
   * 📱 Generate for Social Media (Vertical)
   * Optimized for TikTok, Instagram Reels
   */
  async generateForSocial(prompt: string, duration: number = 5): Promise<SoraVideoResponse> {
    return this.generateVideo({
      prompt,
      use_ai_enhance: true,
      model: 'sora-2-text-to-video',
      aspect_ratio: '9:16',
      duration
    });
  }

  /**
   * 🖥️ Generate Cinematic (Wide)
   * Optimized for YouTube, website
   */
  async generateCinematic(prompt: string, duration: number = 10): Promise<SoraVideoResponse> {
    return this.generateVideo({
      prompt,
      use_ai_enhance: true,
      model: 'sora-2-text-to-video',
      aspect_ratio: '16:9',
      duration
    });
  }

  /**
   * 🎯 Generate with Custom Settings
   * Full control over all parameters
   */
  async generateCustom(
    prompt: string,
    options: {
      useAI?: boolean;
      aspectRatio?: '16:9' | '9:16' | '1:1';
      duration?: number;
      folderId?: string;
      videoName?: string;
    }
  ): Promise<SoraVideoResponse> {
    return this.generateVideo({
      prompt,
      use_ai_enhance: options.useAI ?? true,
      model: 'sora-2-text-to-video',
      aspect_ratio: options.aspectRatio || '16:9',
      duration: options.duration || 5,
      folder_id: options.folderId,
      video_name: options.videoName
    });
  }

  /**
   * 📊 Check Generation Status
   * Poll for video generation status (if using async mode)
   */
  async checkStatus(taskId: string): Promise<VideoGenerationStatus> {
    try {
      const response = await fetch(`${this.webhookUrl}/sora-check-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookSecret}`
        },
        body: JSON.stringify({ task_id: taskId })
      });

      if (!response.ok) {
        throw new Error(`Failed to check status: ${response.status}`);
      }

      return await response.json();
    } catch {
      console.error('Failed to check task status');
      return {
        task_id: taskId,
        status: 'failed'
      };
    }
  }
}

// Export singleton instance
export const soraVideoService = new SoraVideoService();

// Export types
export type { SoraVideoRequest, SoraVideoResponse, VideoGenerationStatus };
