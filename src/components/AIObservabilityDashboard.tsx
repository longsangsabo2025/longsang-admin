/**
 * AI Observability Dashboard
 * Real-time monitoring for AI agents
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { aiObservability } from '@/lib/ai/observability';
import { Activity, TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface DashboardMetrics {
  current_runs: number;
  success_rate_24h: number;
  average_latency_24h: number;
  cost_today: number;
  active_agents: string[];
  recent_errors: Array<{ agent: string; error: string; timestamp: string }>;
}

interface Anomaly {
  type: 'high_error_rate' | 'high_latency' | 'high_cost' | 'low_success_rate';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
}

export function AIObservabilityDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const [dashboardData, alertData] = await Promise.all([
        aiObservability.getDashboardMetrics(),
        aiObservability.checkAnomalies(),
      ]);

      setMetrics(dashboardData);
      setAnomalies(alertData);
    } catch (error) {
      logger.error('Failed to load dashboard metrics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unable to load metrics</AlertTitle>
        <AlertDescription>Please check your configuration and try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Observability</h2>
        <p className="text-muted-foreground">Real-time monitoring of AI agents and operations</p>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          {anomalies.map((anomaly, index) => (
            <Alert
              key={index}
              variant={anomaly.severity === 'critical' ? 'destructive' : 'default'}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{anomaly.severity.toUpperCase()}</AlertTitle>
              <AlertDescription>
                {anomaly.message} (Threshold: {anomaly.threshold})
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Runs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.current_runs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">AI operations executed</p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.success_rate_24h.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.success_rate_24h >= 95 ? (
                <span className="text-green-600">Excellent performance</span>
              ) : metrics.success_rate_24h >= 90 ? (
                <span className="text-yellow-600">Good performance</span>
              ) : (
                <span className="text-red-600">Needs attention</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Average Latency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.average_latency_24h / 1000).toFixed(2)}s
            </div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        {/* Cost Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.cost_today.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">API spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Active Agents</CardTitle>
          <CardDescription>AI agents that have run in the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {metrics.active_agents.length > 0 ? (
              metrics.active_agents.map((agent) => (
                <Badge key={agent} variant="secondary">
                  {agent}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No active agents</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>Last 10 errors across all agents</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recent_errors.length > 0 ? (
            <div className="space-y-4">
              {metrics.recent_errors.map((error, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{error.agent}</p>
                    <p className="text-sm text-muted-foreground">{error.error}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No errors in the last 24 hours 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Agent-specific metrics component
 */
interface AgentMetricsProps {
  agentName: string;
}

export function AgentMetrics({ agentName }: AgentMetricsProps) {
  const [metrics, setMetrics] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentMetrics();
  }, [agentName]);

  const loadAgentMetrics = async () => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const data = await aiObservability.getAgentMetrics(agentName, {
        start: yesterday.toISOString(),
        end: now.toISOString(),
      });

      setMetrics(data);
    } catch (error) {
      logger.error(`Failed to load metrics for agent ${agentName}`, error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading agent metrics...</div>;
  }

  const successful = metrics.filter((m: { success: boolean }) => m.success).length;
  const total = metrics.length;
  const avgLatency =
    metrics.reduce((sum: number, m: { latency_ms: number }) => sum + m.latency_ms, 0) / total ||
    0;
  const totalCost =
    metrics.reduce((sum: number, m: { cost_usd: number }) => sum + m.cost_usd, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{agentName}</CardTitle>
        <CardDescription>Performance metrics (24h)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium">Total Runs</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Success Rate</p>
            <p className="text-2xl font-bold">{((successful / total) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm font-medium">Avg Latency</p>
            <p className="text-2xl font-bold">{(avgLatency / 1000).toFixed(2)}s</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Cost</p>
            <p className="text-2xl font-bold">${totalCost.toFixed(4)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
