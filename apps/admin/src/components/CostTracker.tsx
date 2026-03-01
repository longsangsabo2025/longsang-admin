/**
 * 💰 Cost Tracker Widget
 * Real-time production cost monitoring
 * 
 * Phase 3: Quality & Insights UI
 * @author LongSang (Elon Mode)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostTrackerProps {
  productionId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface CostData {
  total: number;
  byProvider: {
    veo: number;
    kie: number;
  };
  totalGenerations: number;
  successRate: string;
}

export function CostTracker({ 
  productionId, 
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: CostTrackerProps) {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchCostData = async () => {
    try {
      setIsLoading(true);
      const endpoint = productionId 
        ? `/api/analytics/productions/${productionId}`
        : '/api/analytics/dashboard';
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch cost data');
      
      const data = await response.json();
      
      if (productionId) {
        // Production-specific
        setCostData({
          total: data.metrics?.totalCost || 0,
          byProvider: { veo: 0, kie: data.metrics?.totalCost || 0 },
          totalGenerations: data.metrics?.totalGenerations || 0,
          successRate: '100%'
        });
      } else {
        // Dashboard summary
        setCostData({
          total: data.dashboard?.summary?.totalCost || 0,
          byProvider: data.dashboard?.cost?.byProvider || { veo: 0, kie: 0 },
          totalGenerations: data.dashboard?.summary?.totalRequests || 0,
          successRate: data.dashboard?.summary?.successRate || '0%'
        });
      }
      
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('[Cost Tracker] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchCostData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [productionId, autoRefresh, refreshInterval]);

  if (isLoading && !costData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            Loading costs...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load cost data
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!costData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCostIndicator = (total: number) => {
    if (total < 1) return { icon: TrendingDown, color: 'text-green-600', label: 'Low' };
    if (total < 5) return { icon: Activity, color: 'text-yellow-600', label: 'Medium' };
    return { icon: TrendingUp, color: 'text-red-600', label: 'High' };
  };

  const indicator = getCostIndicator(costData.total);
  const CostIcon = indicator.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {productionId ? 'Production Cost' : 'Total Cost'}
          </span>
          <Badge variant="outline" className={cn('text-xs', indicator.color)}>
            <CostIcon className="h-3 w-3 mr-1" />
            {indicator.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Cost */}
        <div>
          <div className="text-2xl font-bold tracking-tight">
            {formatCurrency(costData.total)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {costData.totalGenerations} generations • {costData.successRate} success
          </p>
        </div>

        {/* Provider Breakdown */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Kie.ai</span>
            <span className="font-medium">{formatCurrency(costData.byProvider.kie)}</span>
          </div>
          {costData.byProvider.veo > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Google VEO</span>
              <span className="font-medium">{formatCurrency(costData.byProvider.veo)}</span>
            </div>
          )}
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Updated {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
              Math.round((lastUpdate.getTime() - Date.now()) / 1000 / 60),
              'minute'
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for inline display
export function CostBadge({ amount, label }: { amount: number; label?: string }) {
  const formatCurrency = (amt: number) => {
    if (amt < 1) return `$${amt.toFixed(3)}`;
    return `$${amt.toFixed(2)}`;
  };

  const getColor = (amt: number) => {
    if (amt < 0.5) return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400';
    if (amt < 2) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400';
  };

  return (
    <Badge className={cn('font-mono text-xs', getColor(amount))}>
      {label && <span className="mr-1">{label}:</span>}
      {formatCurrency(amount)}
    </Badge>
  );
}
