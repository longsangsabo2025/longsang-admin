/**
 * Custom hook for Model Intelligence — All queries, mutations, computed values, and state.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  videoFactoryService,
  type VideoModel,
} from '@/services/video-factory.service';
import { MODEL_INTELLIGENCE } from '../../shared-data';
import type { ModelPerfStats, UseModelIntelligenceReturn } from './types';

export function useModelIntelligence(): UseModelIntelligenceReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Local state ─────────────────────────────────────────────────────────────
  const [compareModels, setCompareModels] = useState<string[]>([]);
  const [abTestPrompt, setAbTestPrompt] = useState('');
  const [abTestModels, setAbTestModels] = useState<string[]>(['minimax-hailuo', 'kling3']);
  const [abTestId, setAbTestId] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: perfData, isLoading: loadingPerf } = useQuery({
    queryKey: ['video-factory', 'models-performance'],
    queryFn: () => videoFactoryService.getModelPerformance(30),
    refetchInterval: 30000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['video-factory', 'models-alerts'],
    queryFn: () => videoFactoryService.getModelAlerts(),
    refetchInterval: 60000,
  });

  const { data: completedData } = useQuery({
    queryKey: ['video-factory', 'queue', 'completed-all'],
    queryFn: () => videoFactoryService.listQueue({ status: 'completed', limit: 500 }),
    refetchInterval: 30000,
  });

  const { data: failedData } = useQuery({
    queryKey: ['video-factory', 'queue', 'failed-all'],
    queryFn: () => videoFactoryService.listQueue({ status: 'failed', limit: 500 }),
    refetchInterval: 30000,
  });

  const { data: channelsData } = useQuery({
    queryKey: ['video-factory', 'channels'],
    queryFn: () => videoFactoryService.listChannels(),
  });

  const { data: capacityData } = useQuery({
    queryKey: ['video-factory', 'capacity'],
    queryFn: () => videoFactoryService.getCapacity(),
    refetchInterval: 15000,
  });

  const { data: abTestData } = useQuery({
    queryKey: ['video-factory', 'ab-test', abTestId],
    queryFn: () => abTestId ? videoFactoryService.getABTestResults(abTestId) : null,
    enabled: !!abTestId,
    refetchInterval: 5000,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────

  const abTestMutation = useMutation({
    mutationFn: (req: { prompt: string; models: string[] }) => videoFactoryService.createABTest(req),
    onSuccess: (data) => {
      setAbTestId(data.test_id);
      toast({ title: '🧪 A/B Test Started', description: `Testing ${data.count} models: ${data.models.join(', ')}` });
    },
    onError: (err: Error) => toast({ title: 'A/B Test Failed', description: err.message, variant: 'destructive' }),
  });

  const switchModelMutation = useMutation({
    mutationFn: ({ channelId, model }: { channelId: string; model: string }) =>
      videoFactoryService.switchChannelModel(channelId, model),
    onSuccess: (data) => {
      toast({ title: '✅ Model Switched', description: data.message });
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'channels'] });
    },
    onError: (err: Error) => toast({ title: 'Switch Failed', description: err.message, variant: 'destructive' }),
  });

  // ── Computed: per-model performance ─────────────────────────────────────────

  const modelPerf = useMemo<ModelPerfStats[]>(() => {
    // Prefer backend aggregated data
    if (perfData?.models) {
      const result: ModelPerfStats[] = perfData.models.map(m => ({
        model: m.model,
        totalJobs: m.total_jobs,
        completed: m.completed,
        failed: m.failed,
        avgGenTime: m.avg_gen_time,
        successRate: m.success_rate,
        lastUsed: m.daily_trend.length > 0 ? m.daily_trend[m.daily_trend.length - 1].date : null,
      }));
      for (const modelId of Object.keys(MODEL_INTELLIGENCE)) {
        if (!result.find(r => r.model === modelId)) {
          result.push({ model: modelId, totalJobs: 0, completed: 0, failed: 0, avgGenTime: 0, successRate: 0, lastUsed: null });
        }
      }
      return result.sort((a, b) => b.totalJobs - a.totalJobs || b.successRate - a.successRate);
    }

    // Fallback: compute from raw queue data
    const completedJobs = completedData?.items || [];
    const failedJobs = failedData?.items || [];
    const allJobs = [...completedJobs, ...failedJobs];
    const map = new Map<string, { total: number; completed: number; failed: number; genTimes: number[]; lastUsed: string | null }>();

    for (const job of allJobs) {
      const model = job.model;
      if (!map.has(model)) map.set(model, { total: 0, completed: 0, failed: 0, genTimes: [], lastUsed: null });
      const m = map.get(model)!;
      m.total++;
      if (job.status === 'completed') {
        m.completed++;
        if (job.generation_time_seconds) m.genTimes.push(job.generation_time_seconds);
      } else {
        m.failed++;
      }
      const jobDate = job.completed_at || job.created_at;
      if (!m.lastUsed || jobDate > m.lastUsed) m.lastUsed = jobDate;
    }

    for (const modelId of Object.keys(MODEL_INTELLIGENCE)) {
      if (!map.has(modelId)) map.set(modelId, { total: 0, completed: 0, failed: 0, genTimes: [], lastUsed: null });
    }

    return Array.from(map.entries())
      .map(([model, data]) => ({
        model,
        totalJobs: data.total,
        completed: data.completed,
        failed: data.failed,
        avgGenTime: data.genTimes.length > 0 ? Math.round(data.genTimes.reduce((a, b) => a + b, 0) / data.genTimes.length * 10) / 10 : 0,
        successRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        lastUsed: data.lastUsed,
      }))
      .sort((a, b) => b.totalJobs - a.totalJobs || b.successRate - a.successRate);
  }, [perfData, completedData, failedData]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const channels = channelsData?.channels || [];
  const alerts = alertsData?.alerts || perfData?.alerts || [];
  const totalProduction = modelPerf.reduce((s, m) => s + m.completed, 0);
  const topModel = modelPerf[0];
  const avgTime = modelPerf.filter(m => m.avgGenTime > 0).reduce((s, m) => s + m.avgGenTime, 0) / Math.max(modelPerf.filter(m => m.avgGenTime > 0).length, 1);
  const activeModels = modelPerf.filter(m => m.totalJobs > 0).length;
  const allModelIds = Object.keys(MODEL_INTELLIGENCE);

  return {
    loadingPerf,
    modelPerf,
    channels,
    alerts,
    capacityData,
    allModelIds,
    totalProduction,
    topModel,
    avgTime,
    activeModels,
    compareModels,
    setCompareModels,
    abTestPrompt,
    setAbTestPrompt,
    abTestModels,
    setAbTestModels,
    abTestId,
    abTestData,
    abTestMutation,
    switchModelMutation,
  };
}
