/**
 * Predictive Error Detection Service
 * 
 * Uses pattern analysis to predict errors BEFORE they happen
 * "You're reactive, not proactive. This fixes that." - Elon
 */

import { supabase } from '../supabase';
import { logger } from '../utils/logger';
import { alertService } from './alertService';

export interface SystemMetrics {
  memoryUsage: number;      // Percentage 0-100
  apiLatency: number;       // Average ms
  errorRate: number;        // Errors per minute
  requestRate: number;      // Requests per minute
  activeUsers: number;
  failedRequests: number;
  timestamp: string;
}

export interface PredictionResult {
  riskScore: number;        // 0-1, higher = more risk
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictions: ErrorPrediction[];
  recommendations: string[];
  timestamp: string;
}

export interface ErrorPrediction {
  type: string;
  probability: number;      // 0-1
  estimatedTime: string;    // When it might occur
  affectedComponents: string[];
  preventiveActions: string[];
}

export interface ErrorPattern {
  patternId: string;
  errorType: string;
  frequency: number;
  timePattern: string;      // 'hourly', 'daily', 'weekly', 'random'
  lastOccurrence: string;
  nextPredicted: string;
  confidence: number;
}

class PredictiveService {
  private metricsHistory: SystemMetrics[] = [];
  private readonly maxHistorySize = 100;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private readonly thresholds = {
    memoryWarning: 80,
    memoryCritical: 90,
    latencyWarning: 2000,
    latencyCritical: 5000,
    errorRateWarning: 5,
    errorRateCritical: 10,
  };

  /**
   * Start predictive monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.collectAndAnalyze();
    }, intervalMs);

    // Initial collection
    this.collectAndAnalyze();

    logger.info('Predictive monitoring started', { interval: intervalMs });
  }

  /**
   * Stop predictive monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Predictive monitoring stopped');
    }
  }

  /**
   * Collect metrics and analyze for predictions
   */
  private async collectAndAnalyze(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      this.addToHistory(metrics);

      const prediction = await this.analyzeTrends();

      // Send alert if risk is high
      if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
        await this.sendPredictiveAlert(prediction);
      }

      // Log prediction to database
      await this.logPrediction(prediction);
    } catch (error) {
      logger.warn('Predictive analysis failed', error as Error, 'PredictiveService');
    }
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    // Get memory info (browser)
    const memoryUsage = this.getMemoryUsage();

    // Get error rate from last 5 minutes
    const errorRate = await this.getRecentErrorRate(5);

    // Get API latency average
    const apiLatency = await this.getAverageLatency();

    // Get request rate
    const requestRate = await this.getRequestRate();

    // Get active users (simplified - from session count)
    const activeUsers = await this.getActiveUserCount();

    // Get failed request count
    const failedRequests = await this.getFailedRequestCount();

    return {
      memoryUsage,
      apiLatency,
      errorRate,
      requestRate,
      activeUsers,
      failedRequests,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get browser memory usage
   */
  private getMemoryUsage(): number {
    // @ts-ignore - performance.memory is non-standard but available in Chrome
    if (performance.memory) {
      // @ts-ignore
      const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
      return Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100);
    }
    return 0;
  }

  /**
   * Get recent error rate from database
   */
  private async getRecentErrorRate(minutes: number): Promise<number> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('project_name', 'longsang-admin')
        .gte('created_at', since);

      if (error) return 0;
      return Math.round((count || 0) / minutes);
    } catch {
      return 0;
    }
  }

  /**
   * Get average API latency
   */
  private async getAverageLatency(): Promise<number> {
    // Measure a simple ping to API
    const start = performance.now();
    try {
      await fetch('/api/bug-system/status', { method: 'HEAD' });
      return Math.round(performance.now() - start);
    } catch {
      return 5000; // Assume high latency if failed
    }
  }

  /**
   * Get request rate (simplified)
   */
  private async getRequestRate(): Promise<number> {
    // This would ideally come from a proper metrics system
    // For now, estimate from navigation timing
    return 10; // Placeholder
  }

  /**
   * Get active user count
   */
  private async getActiveUserCount(): Promise<number> {
    // Simplified - would need proper session tracking
    return 1;
  }

  /**
   * Get failed request count
   */
  private async getFailedRequestCount(): Promise<number> {
    try {
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('healing_actions')
        .select('*', { count: 'exact', head: true })
        .eq('action_result', 'failed')
        .gte('created_at', since);

      return count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Add metrics to history
   */
  private addToHistory(metrics: SystemMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Keep only recent history
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Analyze trends and make predictions
   */
  private async analyzeTrends(): Promise<PredictionResult> {
    const predictions: ErrorPrediction[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    if (this.metricsHistory.length < 3) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        predictions: [],
        recommendations: ['Collecting baseline metrics...'],
        timestamp: new Date().toISOString(),
      };
    }

    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    const previous = this.metricsHistory[this.metricsHistory.length - 2];

    // Memory analysis
    if (latest.memoryUsage > this.thresholds.memoryCritical) {
      riskScore += 0.4;
      predictions.push({
        type: 'OutOfMemory',
        probability: 0.8,
        estimatedTime: '5-15 minutes',
        affectedComponents: ['All components'],
        preventiveActions: [
          'Reduce data in memory',
          'Clear unused caches',
          'Consider page refresh',
        ],
      });
      recommendations.push('🔴 Critical memory usage! Consider refreshing the page.');
    } else if (latest.memoryUsage > this.thresholds.memoryWarning) {
      riskScore += 0.2;
      recommendations.push('🟡 High memory usage detected. Monitor closely.');
    }

    // Memory trend analysis
    const memoryTrend = this.calculateTrend('memoryUsage');
    if (memoryTrend > 5) {
      riskScore += 0.1;
      predictions.push({
        type: 'MemoryLeak',
        probability: 0.6,
        estimatedTime: '30-60 minutes',
        affectedComponents: ['Unknown - requires investigation'],
        preventiveActions: [
          'Check for event listener cleanup',
          'Review useEffect dependencies',
          'Look for growing arrays/objects',
        ],
      });
      recommendations.push('📈 Memory usage increasing steadily. Possible memory leak.');
    }

    // Error rate analysis
    if (latest.errorRate > this.thresholds.errorRateCritical) {
      riskScore += 0.3;
      predictions.push({
        type: 'ServiceDegradation',
        probability: 0.9,
        estimatedTime: 'Immediate',
        affectedComponents: ['API', 'Database'],
        preventiveActions: [
          'Check server health',
          'Review recent deployments',
          'Check database connections',
        ],
      });
      recommendations.push('🔴 High error rate! System may be degraded.');
    } else if (latest.errorRate > this.thresholds.errorRateWarning) {
      riskScore += 0.15;
      recommendations.push('🟡 Elevated error rate detected.');
    }

    // Error rate trend
    const errorTrend = this.calculateTrend('errorRate');
    if (errorTrend > 2) {
      riskScore += 0.15;
      predictions.push({
        type: 'ErrorSpike',
        probability: 0.7,
        estimatedTime: '10-30 minutes',
        affectedComponents: ['Various'],
        preventiveActions: [
          'Investigate recent errors',
          'Check external dependencies',
          'Prepare rollback if needed',
        ],
      });
    }

    // Latency analysis
    if (latest.apiLatency > this.thresholds.latencyCritical) {
      riskScore += 0.2;
      predictions.push({
        type: 'TimeoutErrors',
        probability: 0.8,
        estimatedTime: 'Immediate',
        affectedComponents: ['API calls', 'Data loading'],
        preventiveActions: [
          'Check server load',
          'Review database queries',
          'Check network connectivity',
        ],
      });
      recommendations.push('🔴 API latency critical! Expect timeout errors.');
    } else if (latest.apiLatency > this.thresholds.latencyWarning) {
      riskScore += 0.1;
      recommendations.push('🟡 API responding slowly.');
    }

    // Get historical patterns
    const patterns = await this.detectPatterns();
    patterns.forEach(pattern => {
      if (pattern.confidence > 0.7) {
        predictions.push({
          type: pattern.errorType,
          probability: pattern.confidence,
          estimatedTime: pattern.nextPredicted,
          affectedComponents: ['Based on historical pattern'],
          preventiveActions: ['Apply fix before predicted occurrence'],
        });
      }
    });

    // Normalize risk score
    riskScore = Math.min(riskScore, 1);

    // Determine risk level
    const riskLevel = 
      riskScore >= 0.7 ? 'critical' :
      riskScore >= 0.5 ? 'high' :
      riskScore >= 0.3 ? 'medium' : 'low';

    return {
      riskScore,
      riskLevel,
      predictions,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(metric: keyof SystemMetrics): number {
    if (this.metricsHistory.length < 5) return 0;

    const recent = this.metricsHistory.slice(-5);
    const values = recent.map(m => m[metric] as number);

    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Detect error patterns from historical data
   */
  private async detectPatterns(): Promise<ErrorPattern[]> {
    try {
      const { data, error } = await supabase.rpc('detect_error_patterns', {
        p_min_occurrences: 3,
        p_time_window_hours: 24,
      });

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  /**
   * Send predictive alert
   */
  private async sendPredictiveAlert(prediction: PredictionResult): Promise<void> {
    const topPrediction = prediction.predictions[0];
    
    await alertService.sendAlert({
      title: `⚠️ Predictive Alert: ${topPrediction?.type || 'System Risk'}`,
      message: `Risk Level: ${prediction.riskLevel.toUpperCase()}\n\nPredictions:\n${prediction.predictions.map(p => 
        `• ${p.type} (${Math.round(p.probability * 100)}% probability) - ${p.estimatedTime}`
      ).join('\n')}\n\nRecommendations:\n${prediction.recommendations.join('\n')}`,
      severity: prediction.riskLevel === 'critical' ? 'critical' : 'high',
      timestamp: prediction.timestamp,
      projectName: 'longsang-admin',
      pageUrl: window.location.href,
    });
  }

  /**
   * Log prediction to database
   */
  private async logPrediction(prediction: PredictionResult): Promise<void> {
    try {
      await supabase.from('predictions_log').insert({
        risk_score: prediction.riskScore,
        risk_level: prediction.riskLevel,
        predictions: prediction.predictions,
        recommendations: prediction.recommendations,
        created_at: prediction.timestamp,
      });
    } catch (error) {
      // Silently fail
      logger.debug('Failed to log prediction', error as Error, 'PredictiveService');
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): SystemMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Manually trigger prediction analysis
   */
  async runPrediction(): Promise<PredictionResult> {
    const metrics = await this.collectMetrics();
    this.addToHistory(metrics);
    return this.analyzeTrends();
  }
}

export const predictiveService = new PredictiveService();
export default predictiveService;
