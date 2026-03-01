/**
 * React Hook for Bulk Video Production API
 * Provides easy-to-use functions with loading/error states
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  bulkVideoApi, 
  type ProductionJob, 
  type CreateVideoRequest, 
  type BatchCreateRequest,
  type ScriptGenerateRequest,
  type StockSearchRequest,
  type StockVideo,
  type Voice,
  type VideoTemplate
} from '@/lib/api/bulk-video-service';

// ===============================
// CREATE VIDEO HOOK
// ===============================

export function useCreateVideo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVideo = useCallback(async (data: CreateVideoRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bulkVideoApi.createVideo(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create video';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createVideo, loading, error };
}

// ===============================
// BATCH CREATE HOOK
// ===============================

export function useBatchCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBatch = useCallback(async (data: BatchCreateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bulkVideoApi.createBatch(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create batch';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createBatch, loading, error };
}

// ===============================
// JOBS POLLING HOOK
// ===============================

interface UseJobsOptions {
  status?: string;
  pollInterval?: number; // in milliseconds
  autoStart?: boolean;
}

export function useJobs(options: UseJobsOptions = {}) {
  const { status, pollInterval = 3000, autoStart = true } = options;
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const result = await bulkVideoApi.getJobs(status);
      setJobs(result);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(message);
    }
  }, [status]);

  const startPolling = useCallback(() => {
    setLoading(true);
    fetchJobs().finally(() => setLoading(false));
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(fetchJobs, pollInterval);
  }, [fetchJobs, pollInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      startPolling();
    }
    return () => stopPolling();
  }, [autoStart, startPolling, stopPolling]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchJobs();
    setLoading(false);
  }, [fetchJobs]);

  return { jobs, loading, error, refresh, startPolling, stopPolling };
}

// ===============================
// SINGLE JOB HOOK
// ===============================

export function useJob(jobId: string | null) {
  const [job, setJob] = useState<ProductionJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const result = await bulkVideoApi.getJob(jobId);
      setJob(result);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch job';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const cancelJob = useCallback(async () => {
    if (!jobId) return;
    await bulkVideoApi.cancelJob(jobId);
    await fetchJob();
  }, [jobId, fetchJob]);

  const retryJob = useCallback(async () => {
    if (!jobId) return;
    const result = await bulkVideoApi.retryJob(jobId);
    return result;
  }, [jobId]);

  return { job, loading, error, refresh: fetchJob, cancelJob, retryJob };
}

// ===============================
// SCRIPT GENERATION HOOK
// ===============================

export function useGenerateScript() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);

  const generateScript = useCallback(async (data: ScriptGenerateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bulkVideoApi.generateScript(data);
      setScript(result.script);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate script';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearScript = useCallback(() => {
    setScript(null);
  }, []);

  return { generateScript, script, loading, error, clearScript };
}

// ===============================
// STOCK VIDEOS HOOK
// ===============================

export function useStockVideos() {
  const [videos, setVideos] = useState<StockVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchVideos = useCallback(async (data: StockSearchRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bulkVideoApi.searchStockVideos(data);
      setVideos(result.videos);
      setTotal(result.total);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search videos';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearVideos = useCallback(() => {
    setVideos([]);
    setTotal(0);
  }, []);

  return { searchVideos, videos, total, loading, error, clearVideos };
}

// ===============================
// VOICES HOOK
// ===============================

export function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      setLoading(true);
      try {
        const result = await bulkVideoApi.getVoices();
        setVoices(result);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch voices';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  return { voices, loading, error };
}

// ===============================
// TEMPLATES HOOK
// ===============================

export function useTemplates() {
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const result = await bulkVideoApi.getTemplates();
        setTemplates(result);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch templates';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const createTemplate = useCallback(async (data: Partial<VideoTemplate>) => {
    const result = await bulkVideoApi.createTemplate(data);
    setTemplates(prev => [...prev, result]);
    return result;
  }, []);

  return { templates, loading, error, createTemplate };
}

// ===============================
// HEALTH CHECK HOOK
// ===============================

export function useHealthCheck() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<{ node: string; python: string } | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const result = await bulkVideoApi.healthCheck();
      setHealthy(result.status === 'ok');
      setServices(result.services);
    } catch {
      setHealthy(false);
      setServices(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { healthy, loading, services, checkHealth };
}
