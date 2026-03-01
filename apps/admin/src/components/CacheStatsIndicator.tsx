/**
 * 📊 Cache Stats Indicator
 * Shows AI prompt cache performance
 * 
 * Phase 3: Quality & Insights UI
 * @author LongSang (Elon Mode)
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Database, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: string;
}

interface CacheStatsIndicatorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
}

export function CacheStatsIndicator({ 
  autoRefresh = true,
  refreshInterval = 10000, // 10 seconds
  showDetails = true
}: CacheStatsIndicatorProps) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/cache/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('[Cache Stats] Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (!stats) {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Activity className="h-3 w-3 animate-pulse" />
        Loading cache...
      </Badge>
    );
  }

  const hitRateNum = parseFloat(stats.hitRate);
  const getColor = (rate: number) => {
    if (rate >= 50) return 'text-green-700 bg-green-50 border-green-200 dark:bg-green-950 dark:text-green-400';
    if (rate >= 30) return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400';
    return 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:text-orange-400';
  };

  const indicator = (
    <Badge 
      variant="outline" 
      className={cn('text-xs gap-1.5 font-medium', getColor(hitRateNum))}
    >
      <Zap className="h-3 w-3" />
      {showDetails ? (
        <>
          <span>Cache: {stats.hitRate}</span>
          <span className="opacity-60">({stats.size}/100)</span>
        </>
      ) : (
        <span>{stats.hitRate}</span>
      )}
    </Badge>
  );

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p><strong>Hit Rate:</strong> {stats.hitRate}</p>
              <p><strong>Hits:</strong> {stats.hits} | <strong>Misses:</strong> {stats.misses}</p>
              <p><strong>Cached:</strong> {stats.size}/100 entries</p>
              <p className="text-muted-foreground pt-1">
                {hitRateNum >= 50 ? '🚀 Great performance!' : 
                 hitRateNum >= 30 ? '⚡ Warming up...' : 
                 '🔥 Building cache...'}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return indicator;
}

// Inline cache indicator for AI enhancement buttons
export function CacheHitBadge({ cached }: { cached?: boolean }) {
  if (!cached) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="text-xs gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400"
          >
            <Database className="h-3 w-3" />
            Cached
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">This result was retrieved from cache<br/>(instant, no API cost)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
