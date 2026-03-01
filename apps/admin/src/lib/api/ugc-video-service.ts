/**
 * UGC Video Ads Service
 * Service để gọi n8n workflow UGC Ads Veo & Sora
 * Tạo video quảng cáo UGC từ ảnh sản phẩm
 */

const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY || '';
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678';
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

// UGC Model types
export type UGCModel = 'Veo 3.1' | 'Nano + Veo 3.1' | 'Sora 2';

// Request types
export interface UGCVideoRequest {
  product: string;
  productPhoto: string;
  icp: string; // Ideal Customer Profile
  productFeatures: string;
  videoSetting: string;
  model: UGCModel;
}

// Response types
export interface UGCVideoResponse {
  success: boolean;
  message: string;
  data?: {
    executionId?: string;
    taskId?: string;
    status: 'queued' | 'running' | 'success' | 'failed';
    videoUrl?: string;
    imageUrl?: string; // For Nano+Veo flow
    prompt?: {
      imagePrompt?: string;
      videoPrompt?: string;
    };
  };
  error?: string;
}

export interface UGCExecutionStatus {
  id: string;
  finished: boolean;
  mode: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt: string;
  stoppedAt?: string;
  data?: {
    resultData?: {
      runData?: Record<string, unknown>;
    };
  };
}

// Workflow info
export interface UGCWorkflowInfo {
  id: string;
  name: string;
  active: boolean;
  nodes: Array<{
    name: string;
    type: string;
  }>;
}

class UGCVideoService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly webhookUrl: string;

  constructor() {
    this.apiKey = N8N_API_KEY;
    this.baseUrl = N8N_BASE_URL;
    this.webhookUrl = N8N_WEBHOOK_URL;
  }

  /**
   * Get headers for n8n API calls
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': this.apiKey,
    };
  }

  /**
   * 🎬 Generate UGC Video Ad via Webhook
   * Triggers the n8n workflow to create UGC video
   */
  async generateVideo(request: UGCVideoRequest): Promise<UGCVideoResponse> {
    try {
      const webhookPath = '/ugc-ads-generate';
      const url = `${this.webhookUrl}${webhookPath}`;

      console.log('[UGC] Sending request to:', url);
      console.log('[UGC] Request payload:', request);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'longsang-admin',
        },
        body: JSON.stringify({
          product: request.product,
          product_photo: request.productPhoto,
          icp: request.icp,
          product_features: request.productFeatures,
          video_setting: request.videoSetting,
          model: request.model,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[UGC] Response:', result);

      return {
        success: true,
        message: 'Video generation started',
        data: {
          executionId: result.executionId,
          taskId: result.taskId,
          status: 'running',
          videoUrl: result.videoUrl,
          imageUrl: result.imageUrl,
          prompt: result.prompt,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[UGC] Generation error:', error);
      return {
        success: false,
        message: 'Failed to generate video',
        error: errorMessage,
      };
    }
  }

  /**
   * 📊 Check execution status
   * Poll n8n API to get execution status
   */
  async getExecutionStatus(executionId: string): Promise<UGCExecutionStatus | null> {
    try {
      const url = `${this.baseUrl}/api/v1/executions/${executionId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[UGC] Status check error:', error);
      return null;
    }
  }

  /**
   * 🔄 Poll execution until complete
   * Returns final result when done
   */
  async pollExecution(
    executionId: string,
    onProgress?: (status: UGCExecutionStatus) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<UGCExecutionStatus | null> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getExecutionStatus(executionId);
      
      if (status) {
        onProgress?.(status);
        
        if (status.finished || status.status === 'success' || status.status === 'error') {
          return status;
        }
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    console.error('[UGC] Polling timeout after', maxAttempts, 'attempts');
    return null;
  }

  /**
   * 📋 Get workflow info
   */
  async getWorkflowInfo(workflowId: string = 'aYRs8P6vDIgTOtEu'): Promise<UGCWorkflowInfo | null> {
    try {
      const url = `${this.baseUrl}/api/v1/workflows/${workflowId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        active: data.active,
        nodes: data.nodes?.map((n: { name: string; type: string }) => ({
          name: n.name,
          type: n.type,
        })) || [],
      };
    } catch (error) {
      console.error('[UGC] Get workflow error:', error);
      return null;
    }
  }

  /**
   * ▶️ Activate workflow
   */
  async activateWorkflow(workflowId: string = 'aYRs8P6vDIgTOtEu'): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/v1/workflows/${workflowId}/activate`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('[UGC] Activate workflow error:', error);
      return false;
    }
  }

  /**
   * 📜 Get recent executions
   */
  async getRecentExecutions(workflowId: string = 'aYRs8P6vDIgTOtEu', limit: number = 10): Promise<UGCExecutionStatus[]> {
    try {
      const url = `${this.baseUrl}/api/v1/executions?workflowId=${workflowId}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[UGC] Get executions error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const ugcVideoService = new UGCVideoService();
