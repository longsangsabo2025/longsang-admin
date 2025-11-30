/**
 * AI Observability & Monitoring
 * Track AI agent performance, costs, and quality
 */

import { Client, Run, RunTree } from 'langsmith';
import { logger } from '@/lib/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface AIMetrics {
  run_id: string;
  agent_name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  latency_ms: number;
  cost_usd: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface PerformanceReport {
  total_runs: number;
  success_rate: number;
  average_latency: number;
  total_cost: number;
  tokens_used: number;
  error_count: number;
  top_errors: Array<{ error: string; count: number }>;
}

/**
 * LangSmith integration for tracing
 */
export class AIObservability {
  private langsmith?: Client;
  private enabled: boolean;

  constructor() {
    const apiKey = import.meta.env.VITE_LANGSMITH_API_KEY;
    this.enabled = !!apiKey;

    if (this.enabled) {
      this.langsmith = new Client({
        apiKey,
        apiUrl: import.meta.env.VITE_LANGSMITH_API_URL || 'https://api.smith.langchain.com',
      });
      logger.info('LangSmith observability enabled');
    } else {
      logger.warn('LangSmith API key not found - observability disabled');
    }
  }

  /**
   * Trace AI operation
   */
  async traceOperation<T>(
    name: string,
    operation: () => Promise<T>,
    metadata: {
      agent?: string;
      model?: string;
      tags?: string[];
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Execute operation
      const result = await operation();
      const latency = Date.now() - startTime;

      // Log metrics
      await this.logMetrics({
        run_id: runId,
        agent_name: metadata.agent || 'unknown',
        model: metadata.model || 'gpt-4o',
        input_tokens: 0, // Will be populated by actual usage
        output_tokens: 0,
        total_tokens: 0,
        latency_ms: latency,
        cost_usd: 0,
        success: true,
        timestamp: new Date().toISOString(),
      });

      // Trace to LangSmith
      if (this.enabled && this.langsmith) {
        await this.langsmith.createRun({
          name,
          run_type: 'llm',
          inputs: { operation: name },
          outputs: { success: true },
          start_time: startTime,
          end_time: Date.now(),
          tags: metadata.tags,
        });
      }

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      // Log error metrics
      await this.logMetrics({
        run_id: runId,
        agent_name: metadata.agent || 'unknown',
        model: metadata.model || 'gpt-4o',
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        latency_ms: latency,
        cost_usd: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      // Trace error to LangSmith
      if (this.enabled && this.langsmith) {
        await this.langsmith.createRun({
          name,
          run_type: 'llm',
          inputs: { operation: name },
          error: error instanceof Error ? error.message : 'Unknown error',
          start_time: startTime,
          end_time: Date.now(),
          tags: metadata.tags,
        });
      }

      throw error;
    }
  }

  /**
   * Log AI metrics to database
   */
  private async logMetrics(metrics: AIMetrics): Promise<void> {
    try {
      const { error } = await supabase.from('ai_metrics').insert(metrics);

      if (error) {
        logger.error('Failed to log AI metrics', error);
      }
    } catch (error) {
      logger.error('Metrics logging error', error);
    }
  }

  /**
   * Calculate token costs
   */
  static calculateCost(tokens: { input: number; output: number }, model: string = 'gpt-4o'): number {
    // Pricing per 1K tokens (as of 2025)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    };

    const rates = pricing[model] || pricing['gpt-4o'];
    const inputCost = (tokens.input / 1000) * rates.input;
    const outputCost = (tokens.output / 1000) * rates.output;

    return inputCost + outputCost;
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(timeRange: {
    start: string;
    end: string;
  }): Promise<PerformanceReport> {
    try {
      const { data: metrics, error } = await supabase
        .from('ai_metrics')
        .select('*')
        .gte('timestamp', timeRange.start)
        .lte('timestamp', timeRange.end);

      if (error) throw error;

      if (!metrics || metrics.length === 0) {
        return {
          total_runs: 0,
          success_rate: 0,
          average_latency: 0,
          total_cost: 0,
          tokens_used: 0,
          error_count: 0,
          top_errors: [],
        };
      }

      const successful = metrics.filter((m) => m.success).length;
      const failed = metrics.filter((m) => !m.success);

      // Count errors
      const errorCounts = new Map<string, number>();
      failed.forEach((m) => {
        if (m.error) {
          errorCounts.set(m.error, (errorCounts.get(m.error) || 0) + 1);
        }
      });

      const top_errors = Array.from(errorCounts.entries())
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        total_runs: metrics.length,
        success_rate: (successful / metrics.length) * 100,
        average_latency: metrics.reduce((sum, m) => sum + m.latency_ms, 0) / metrics.length,
        total_cost: metrics.reduce((sum, m) => sum + m.cost_usd, 0),
        tokens_used: metrics.reduce((sum, m) => sum + m.total_tokens, 0),
        error_count: failed.length,
        top_errors,
      };
    } catch (error) {
      logger.error('Failed to generate performance report', error);
      throw error;
    }
  }

  /**
   * Get agent-specific metrics
   */
  async getAgentMetrics(agentName: string, timeRange: { start: string; end: string }) {
    try {
      const { data: metrics, error } = await supabase
        .from('ai_metrics')
        .select('*')
        .eq('agent_name', agentName)
        .gte('timestamp', timeRange.start)
        .lte('timestamp', timeRange.end);

      if (error) throw error;

      return metrics;
    } catch (error) {
      logger.error('Failed to get agent metrics', error);
      return [];
    }
  }

  /**
   * Real-time monitoring dashboard data
   */
  async getDashboardMetrics(): Promise<{
    current_runs: number;
    success_rate_24h: number;
    average_latency_24h: number;
    cost_today: number;
    active_agents: string[];
    recent_errors: Array<{ agent: string; error: string; timestamp: string }>;
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
      // Get 24h metrics
      const { data: metrics24h } = await supabase
        .from('ai_metrics')
        .select('*')
        .gte('timestamp', yesterday.toISOString());

      // Get today's cost
      const { data: metricsToday } = await supabase
        .from('ai_metrics')
        .select('cost_usd')
        .gte('timestamp', today.toISOString());

      // Get recent errors
      const { data: recentErrors } = await supabase
        .from('ai_metrics')
        .select('agent_name, error, timestamp')
        .eq('success', false)
        .order('timestamp', { ascending: false })
        .limit(10);

      const successful = metrics24h?.filter((m) => m.success).length || 0;
      const total = metrics24h?.length || 1;

      const active_agents = Array.from(new Set(metrics24h?.map((m) => m.agent_name) || []));

      return {
        current_runs: total,
        success_rate_24h: (successful / total) * 100,
        average_latency_24h:
          (metrics24h?.reduce((sum, m) => sum + m.latency_ms, 0) || 0) / total,
        cost_today: metricsToday?.reduce((sum, m) => sum + m.cost_usd, 0) || 0,
        active_agents,
        recent_errors:
          recentErrors?.map((e) => ({
            agent: e.agent_name,
            error: e.error || 'Unknown error',
            timestamp: e.timestamp,
          })) || [],
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics', error);
      return {
        current_runs: 0,
        success_rate_24h: 0,
        average_latency_24h: 0,
        cost_today: 0,
        active_agents: [],
        recent_errors: [],
      };
    }
  }

  /**
   * Alert on anomalies
   */
  async checkAnomalies(): Promise<
    Array<{
      type: 'high_error_rate' | 'high_latency' | 'high_cost' | 'low_success_rate';
      severity: 'warning' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }>
  > {
    const alerts: Array<{
      type: 'high_error_rate' | 'high_latency' | 'high_cost' | 'low_success_rate';
      severity: 'warning' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }> = [];

    const metrics = await this.getDashboardMetrics();

    // Check error rate
    if (metrics.success_rate_24h < 90) {
      alerts.push({
        type: 'low_success_rate',
        severity: metrics.success_rate_24h < 80 ? 'critical' : 'warning',
        message: `Success rate below threshold: ${metrics.success_rate_24h.toFixed(1)}%`,
        value: metrics.success_rate_24h,
        threshold: 90,
      });
    }

    // Check latency
    if (metrics.average_latency_24h > 5000) {
      alerts.push({
        type: 'high_latency',
        severity: metrics.average_latency_24h > 10000 ? 'critical' : 'warning',
        message: `Average latency too high: ${metrics.average_latency_24h.toFixed(0)}ms`,
        value: metrics.average_latency_24h,
        threshold: 5000,
      });
    }

    // Check cost
    if (metrics.cost_today > 50) {
      alerts.push({
        type: 'high_cost',
        severity: metrics.cost_today > 100 ? 'critical' : 'warning',
        message: `Daily cost exceeded budget: $${metrics.cost_today.toFixed(2)}`,
        value: metrics.cost_today,
        threshold: 50,
      });
    }

    return alerts;
  }
}

// Export singleton
export const aiObservability = new AIObservability();

/**
 * Decorator for tracing functions
 */
export function trace(agentName: string, model: string = 'gpt-4o') {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return aiObservability.traceOperation(
        propertyKey,
        () => originalMethod.apply(this, args),
        { agent: agentName, model }
      );
    };

    return descriptor;
  };
}
