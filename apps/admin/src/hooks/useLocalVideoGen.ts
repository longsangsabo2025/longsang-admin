/**
 * React Hook for Local AI Video Generation (ComfyUI)
 * Provides functions for generating videos using local Wan2.1 model
 */

import { useState, useCallback, useRef } from 'react';

// ===============================
// TYPES
// ===============================

export interface VideoGenerationRequest {
  prompt: string;
  frames?: number;
  fps?: number;
  resolution?: '720p' | '640x640';
  negative_prompt?: string;
}

export interface VideoJob {
  job_id: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  eta?: number;
  video_url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

// API Base URL
const API_BASE = 'http://localhost:8203';

// ===============================
// LOCAL VIDEO GENERATION HOOK
// ===============================

export function useLocalVideoGen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<VideoJob | null>(null);
  const [progress, setProgress] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate video
  const generateVideo = useCallback(async (request: VideoGenerationRequest) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      const response = await fetch(`${API_BASE}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          frames: request.frames ?? 81,
          fps: request.fps ?? 16,
          resolution: request.resolution ?? '720p',
          negative_prompt: request.negative_prompt ?? 'blurry, low quality, distorted, ugly',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const newJob: VideoJob = {
        job_id: data.job_id,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      
      setJob(newJob);
      return newJob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start video generation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check job status
  const checkStatus = useCallback(async (jobId: string): Promise<VideoJob> => {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Status check failed: ${response.status}`);
    }

    const data = await response.json();
    const updatedJob: VideoJob = {
      job_id: jobId,
      status: data.status,
      progress: data.progress,
      eta: data.eta,
      video_url: data.video_url,
      error: data.error,
      created_at: job?.created_at || new Date().toISOString(),
      completed_at: data.completed_at,
    };
    
    setJob(updatedJob);
    setProgress(data.progress || 0);
    
    return updatedJob;
  }, [job?.created_at]);

  // Start polling for job status
  const startPolling = useCallback((jobId: string, interval = 2000) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        const status = await checkStatus(jobId);
        
        if (status.status === 'completed' || status.status === 'failed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Initial check
    poll();
    
    // Start interval polling
    pollIntervalRef.current = setInterval(poll, interval);
  }, [checkStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Get download URL
  const getDownloadUrl = useCallback((jobId: string): string => {
    return `${API_BASE}/download/${jobId}`;
  }, []);

  // Download video
  const downloadVideo = useCallback(async (jobId: string, filename?: string) => {
    try {
      const response = await fetch(`${API_BASE}/download/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `local-video-${jobId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError(message);
      throw err;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setProgress(0);
    setError(null);
    setLoading(false);
  }, [stopPolling]);

  return {
    generateVideo,
    checkStatus,
    startPolling,
    stopPolling,
    downloadVideo,
    getDownloadUrl,
    reset,
    job,
    progress,
    loading,
    error,
    isPolling: !!pollIntervalRef.current,
  };
}

// ===============================
// HELPER HOOKS
// ===============================

export function useVideoJobStatus(jobId: string | null) {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      setJob({
        job_id: jobId,
        status: data.status,
        progress: data.progress,
        eta: data.eta,
        video_url: data.video_url,
        error: data.error,
        created_at: data.created_at || new Date().toISOString(),
        completed_at: data.completed_at,
      });
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch job status';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  return { job, loading, error, refresh: fetchStatus };
}
