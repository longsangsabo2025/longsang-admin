/**
 * AI Cost Dashboard Component
 * Real-time monitoring of AI usage and costs
 * Connected to /api/ai-usage endpoints
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  Zap,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Calendar,
  Brain,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UsageSummary {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, { calls: number; tokens: number; cost: number }>;
  byActionType: Record<string, { calls: number; tokens: number; cost: number }>;
  byDay: Record<string, { calls: number; tokens: number; cost: number }>;
  byPage: Record<string, { calls: number; tokens: number; cost: number }>;
}

interface Projection {
  currentMonth: {
    spent: number;
    projected: number;
    daysRemaining: number;
  };
  trends: {
    dailyAverage: number;
    weeklyGrowth: number;
  };
}

// Budget limits (configurable)
const MONTHLY_BUDGET = 50; // $50/month default
const WARNING_THRESHOLD = 0.8; // 80% warning

export function AICostDashboard() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, projectionRes] = await Promise.all([
        fetch(`${API_BASE}/api/ai-usage/summary`),
        fetch(`${API_BASE}/api/ai-usage/projection`),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);
      }

      if (projectionRes.ok) {
        const projectionData = await projectionRes.json();
        setProjection(projectionData);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI usage data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const budgetUsagePercent = summary ? (summary.totalCost / MONTHLY_BUDGET) * 100 : 0;
  const isOverBudget = budgetUsagePercent > 100;
  const isWarning = budgetUsagePercent > WARNING_THRESHOLD * 100;

  const formatCurrency = (value: number) => `$${value.toFixed(4)}`;
  const formatNumber = (value: number) => value.toLocaleString();

  if (loading && !summary) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI Usage Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring • Last updated:{' '}
            {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <Card className={isOverBudget ? 'border-red-500' : isWarning ? 'border-yellow-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Total Cost (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalCost || 0)}</div>
            <div className="mt-2">
              <Progress
                value={Math.min(budgetUsagePercent, 100)}
                className={isOverBudget ? 'bg-red-200' : isWarning ? 'bg-yellow-200' : ''}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {budgetUsagePercent.toFixed(1)}% of ${MONTHLY_BUDGET} budget
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Calls */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary?.totalCalls || 0)}</div>
            <p className="text-xs text-muted-foreground">
              ~{((summary?.totalCalls || 0) / 30).toFixed(1)} calls/day avg
            </p>
          </CardContent>
        </Card>

        {/* Total Tokens */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Tokens Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalTokens ? (summary.totalTokens / 1000).toFixed(1) + 'K' : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              ~${((summary?.totalTokens || 0) * 0.00001).toFixed(4)}/1K tokens
            </p>
          </CardContent>
        </Card>

        {/* Projection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Monthly Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(projection?.currentMonth?.projected || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {projection?.currentMonth?.daysRemaining || 0} days remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="models" className="w-full">
        <TabsList>
          <TabsTrigger value="models">By Model</TabsTrigger>
          <TabsTrigger value="actions">By Action</TabsTrigger>
          <TabsTrigger value="pages">By Page</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Usage by AI Model</CardTitle>
              <CardDescription>Breakdown of costs per AI model</CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.byModel && Object.keys(summary.byModel).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(summary.byModel).map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{model}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(data.calls)} calls
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(data.cost)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(data.tokens)} tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No model usage data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Action Type</CardTitle>
              <CardDescription>Which features use the most AI</CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.byActionType && Object.keys(summary.byActionType).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(summary.byActionType).map(([action, data]) => (
                    <div key={action} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge>{action}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(data.calls)} calls
                        </span>
                      </div>
                      <div className="font-medium">{formatCurrency(data.cost)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No action data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Page/Feature</CardTitle>
              <CardDescription>AI usage across different parts of the app</CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.byPage && Object.keys(summary.byPage).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(summary.byPage).map(([page, data]) => (
                    <div key={page} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{page}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(data.calls)} calls
                        </span>
                      </div>
                      <div className="font-medium">{formatCurrency(data.cost)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No page data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Budget Alert */}
      {isWarning && (
        <Card
          className={isOverBudget ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={`h-5 w-5 ${isOverBudget ? 'text-red-500' : 'text-yellow-500'}`}
              />
              <div>
                <p className={`font-medium ${isOverBudget ? 'text-red-700' : 'text-yellow-700'}`}>
                  {isOverBudget ? '🚨 Budget Exceeded!' : '⚠️ Approaching Budget Limit'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOverBudget
                    ? `You've exceeded your $${MONTHLY_BUDGET} monthly budget. Consider optimizing API usage.`
                    : `You've used ${budgetUsagePercent.toFixed(1)}% of your monthly budget.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AICostDashboard;
