import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Database } from 'lucide-react';
import { checkConnectionHealth } from '@/lib/supabase-stable';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function DatabaseConnectionStatus({
  showDetails = false,
  className = '',
}: ConnectionStatusProps) {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const isHealthy = await checkConnectionHealth();
      setHealthy(isHealthy);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthy(false);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!showDetails) {
    // Compact view - just badge
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {loading ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Checking...</span>
          </Badge>
        ) : healthy ? (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-xs">Connected</span>
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span className="text-xs">Disconnected</span>
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkHealth}
          disabled={loading}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  // Detailed view
  return (
    <div className={`p-3 border rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="text-sm font-medium">Database Connection</span>
        </div>
        {loading ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Checking...</span>
          </Badge>
        ) : healthy ? (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-xs">Connected</span>
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span className="text-xs">Disconnected</span>
          </Badge>
        )}
      </div>
      {lastChecked && (
        <div className="text-xs text-muted-foreground">
          Last checked: {lastChecked.toLocaleTimeString('vi-VN')}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={checkHealth}
        disabled={loading}
        className="mt-2 w-full"
      >
        <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Refresh Status
      </Button>
    </div>
  );
}
