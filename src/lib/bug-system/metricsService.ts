/**
 * MTTR (Mean Time To Recovery) Metrics Service
 * 
 * Tracks and calculates key reliability metrics
 * "You measure what you manage." - Elon
 */

import { supabase } from '../supabase';
import { logger } from '../utils/logger';

export interface MTTRMetrics {
  mttr: number;           // Mean Time To Recovery (minutes)
  mtbf: number;           // Mean Time Between Failures (minutes)
  mttd: number;           // Mean Time To Detect (minutes)
  availability: number;   // Percentage 0-100
  errorCount: number;
  resolvedCount: number;
  pendingCount: number;
  avgResolutionTime: number;
  period: string;
}

export interface ErrorTimeline {
  id: string;
  errorType: string;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  status: 'detected' | 'acknowledged' | 'in_progress' | 'resolved';
  timeToDetect?: number;    // ms
  timeToAcknowledge?: number;
  timeToResolve?: number;
}

export interface ReliabilityTrend {
  date: string;
  mttr: number;
  errorCount: number;
  availability: number;
}

class MetricsService {
  private readonly projectName = 'longsang-admin';

  /**
   * Get MTTR metrics for a time period
   */
  async getMTTRMetrics(days: number = 7): Promise<MTTRMetrics> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get all errors in period
      const { data: errors, error: errorsError } = await supabase
        .from('error_logs')
        .select('id, created_at, severity')
        .eq('project_name', this.projectName)
        .gte('created_at', since);

      if (errorsError) throw errorsError;

      // Get resolved bugs
      const { data: bugs, error: bugsError } = await supabase
        .from('bug_reports')
        .select('id, first_seen_at, fixed_at, status')
        .gte('first_seen_at', since);

      if (bugsError) throw bugsError;

      // Get healing actions
      const { data: healings, error: healingsError } = await supabase
        .from('healing_actions')
        .select('id, created_at, action_result, execution_time_ms')
        .gte('created_at', since);

      if (healingsError) throw healingsError;

      // Calculate metrics
      const errorCount = errors?.length || 0;
      const resolvedBugs = bugs?.filter(b => b.status === 'fixed') || [];
      const resolvedCount = resolvedBugs.length;
      const pendingCount = (bugs?.filter(b => b.status !== 'fixed' && b.status !== 'closed') || []).length;

      // Calculate MTTR (Mean Time To Recovery)
      let totalResolutionTime = 0;
      resolvedBugs.forEach(bug => {
        if (bug.first_seen_at && bug.fixed_at) {
          const detectedTime = new Date(bug.first_seen_at).getTime();
          const resolvedTime = new Date(bug.fixed_at).getTime();
          totalResolutionTime += (resolvedTime - detectedTime);
        }
      });
      const mttr = resolvedCount > 0 
        ? Math.round(totalResolutionTime / resolvedCount / 60000) // in minutes
        : 0;

      // Calculate MTTD (Mean Time To Detect)
      // For now, assume instant detection (0 minutes)
      const mttd = 0;

      // Calculate MTBF (Mean Time Between Failures)
      const periodMs = days * 24 * 60 * 60 * 1000;
      const mtbf = errorCount > 1 
        ? Math.round(periodMs / (errorCount - 1) / 60000)
        : Math.round(periodMs / 60000);

      // Calculate availability
      const totalDowntimeMinutes = mttr * errorCount;
      const totalPeriodMinutes = days * 24 * 60;
      const availability = Math.max(0, Math.min(100, 
        ((totalPeriodMinutes - totalDowntimeMinutes) / totalPeriodMinutes) * 100
      ));

      // Average resolution time from healing actions
      const successfulHealings = healings?.filter(h => h.action_result === 'success') || [];
      const avgResolutionTime = successfulHealings.length > 0
        ? Math.round(
            successfulHealings.reduce((sum, h) => sum + (h.execution_time_ms || 0), 0) 
            / successfulHealings.length
          )
        : 0;

      return {
        mttr,
        mtbf,
        mttd,
        availability: Math.round(availability * 100) / 100,
        errorCount,
        resolvedCount,
        pendingCount,
        avgResolutionTime,
        period: `${days} days`,
      };
    } catch (error) {
      logger.warn('Failed to get MTTR metrics', error as Error, 'MetricsService');
      return {
        mttr: 0,
        mtbf: 0,
        mttd: 0,
        availability: 100,
        errorCount: 0,
        resolvedCount: 0,
        pendingCount: 0,
        avgResolutionTime: 0,
        period: `${days} days`,
      };
    }
  }

  /**
   * Get error timeline for tracking resolution progress
   */
  async getErrorTimeline(limit: number = 50): Promise<ErrorTimeline[]> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select(`
          id,
          error_type,
          created_at,
          bug_reports (
            status,
            fixed_at
          )
        `)
        .eq('project_name', this.projectName)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => {
        const bugReport = item.bug_reports?.[0];
        const detectedAt = item.created_at;
        const resolvedAt = bugReport?.fixed_at;

        let status: ErrorTimeline['status'] = 'detected';
        if (resolvedAt) {
          status = 'resolved';
        } else if (bugReport?.status === 'investigating') {
          status = 'in_progress';
        }

        return {
          id: item.id,
          errorType: item.error_type,
          detectedAt,
          resolvedAt,
          status,
          timeToResolve: resolvedAt 
            ? new Date(resolvedAt).getTime() - new Date(detectedAt).getTime()
            : undefined,
        };
      });
    } catch (error) {
      logger.warn('Failed to get error timeline', error as Error, 'MetricsService');
      return [];
    }
  }

  /**
   * Get reliability trends over time
   */
  async getReliabilityTrends(days: number = 30): Promise<ReliabilityTrend[]> {
    try {
      const trends: ReliabilityTrend[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // Get errors for this day
        const { count: errorCount } = await supabase
          .from('error_logs')
          .select('*', { count: 'exact', head: true })
          .eq('project_name', this.projectName)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        // Get resolved bugs for this day
        const { data: resolvedBugs } = await supabase
          .from('bug_reports')
          .select('first_seen_at, fixed_at')
          .gte('fixed_at', date.toISOString())
          .lt('fixed_at', nextDate.toISOString());

        // Calculate day's MTTR
        let dayMttr = 0;
        if (resolvedBugs && resolvedBugs.length > 0) {
          const totalTime = resolvedBugs.reduce((sum, bug) => {
            if (bug.first_seen_at && bug.fixed_at) {
              return sum + (new Date(bug.fixed_at).getTime() - new Date(bug.first_seen_at).getTime());
            }
            return sum;
          }, 0);
          dayMttr = Math.round(totalTime / resolvedBugs.length / 60000);
        }

        // Simple availability calculation
        const availability = errorCount ? Math.max(90, 100 - (errorCount || 0) * 0.5) : 100;

        trends.push({
          date: date.toISOString().split('T')[0],
          mttr: dayMttr,
          errorCount: errorCount || 0,
          availability: Math.round(availability * 100) / 100,
        });
      }

      return trends;
    } catch (error) {
      logger.warn('Failed to get reliability trends', error as Error, 'MetricsService');
      return [];
    }
  }

  /**
   * Record error acknowledgment
   */
  async acknowledgeError(errorId: string): Promise<void> {
    try {
      await supabase
        .from('error_logs')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', errorId);
    } catch (error) {
      logger.warn('Failed to acknowledge error', error as Error, 'MetricsService');
    }
  }

  /**
   * Record error resolution
   */
  async resolveError(errorId: string, fixDescription?: string): Promise<void> {
    try {
      // Update bug report if exists
      await supabase
        .from('bug_reports')
        .update({ 
          status: 'fixed',
          fixed_at: new Date().toISOString(),
          fix_description: fixDescription,
        })
        .eq('error_log_id', errorId);
    } catch (error) {
      logger.warn('Failed to resolve error', error as Error, 'MetricsService');
    }
  }

  /**
   * Get SLA compliance stats
   */
  async getSLACompliance(targetMttrMinutes: number = 60): Promise<{
    compliant: number;
    nonCompliant: number;
    complianceRate: number;
  }> {
    try {
      const { data: bugs } = await supabase
        .from('bug_reports')
        .select('first_seen_at, fixed_at')
        .eq('status', 'fixed')
        .order('fixed_at', { ascending: false })
        .limit(100);

      if (!bugs || bugs.length === 0) {
        return { compliant: 0, nonCompliant: 0, complianceRate: 100 };
      }

      let compliant = 0;
      let nonCompliant = 0;

      bugs.forEach(bug => {
        if (bug.first_seen_at && bug.fixed_at) {
          const resolutionTime = (new Date(bug.fixed_at).getTime() - new Date(bug.first_seen_at).getTime()) / 60000;
          if (resolutionTime <= targetMttrMinutes) {
            compliant++;
          } else {
            nonCompliant++;
          }
        }
      });

      const total = compliant + nonCompliant;
      const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 100;

      return { compliant, nonCompliant, complianceRate };
    } catch (error) {
      logger.warn('Failed to get SLA compliance', error as Error, 'MetricsService');
      return { compliant: 0, nonCompliant: 0, complianceRate: 100 };
    }
  }
}

export const metricsService = new MetricsService();
export default metricsService;
