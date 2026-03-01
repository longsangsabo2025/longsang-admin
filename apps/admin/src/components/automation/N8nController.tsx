import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  RefreshCw,
  Square,
  Terminal,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface N8nStatus {
  running: boolean;
  pid: number | null;
  startedAt: string | null;
  url: string;
  uptime: number;
  logs: Array<{
    type: 'info' | 'error';
    message: string;
    timestamp: string;
  }>;
}

export const N8nController = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<N8nStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch status
  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/n8n/status');
      const data = await response.json();

      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch n8n status:', error);
    }
  };

  // Auto refresh status every 5 seconds
  useEffect(() => {
    fetchStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Start n8n
  const handleStart = async (openBrowser = false) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/n8n/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ openBrowser }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ n8n Started',
          description: openBrowser
            ? 'n8n server started and browser opened'
            : 'n8n server started successfully',
        });
        fetchStatus();
      } else {
        throw new Error(data.message || 'Failed to start n8n');
      }
    } catch (error) {
      toast({
        title: '❌ Start Failed',
        description: error instanceof Error ? error.message : 'Could not start n8n server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Stop n8n
  const handleStop = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/n8n/stop', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '⏹️ n8n Stopped',
          description: 'n8n server stopped successfully',
        });
        fetchStatus();
      } else {
        throw new Error(data.message || 'Failed to stop n8n');
      }
    } catch (error) {
      toast({
        title: '❌ Stop Failed',
        description: error instanceof Error ? error.message : 'Could not stop n8n server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Restart n8n
  const handleRestart = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/n8n/restart', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '🔄 n8n Restarted',
          description: 'n8n server restarted successfully',
        });
        setTimeout(fetchStatus, 2000);
      } else {
        throw new Error(data.message || 'Failed to restart n8n');
      }
    } catch (error) {
      toast({
        title: '❌ Restart Failed',
        description: error instanceof Error ? error.message : 'Could not restart n8n server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Open n8n in browser
  const openN8n = () => {
    window.open(status?.url || 'http://localhost:5678', '_blank');
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              n8n Workflow Server
            </CardTitle>
            <CardDescription>Start/stop n8n server and manage workflows</CardDescription>
          </div>
          <Badge variant={status?.running ? 'default' : 'secondary'} className="gap-1">
            {status?.running ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Running
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Stopped
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {!status?.running ? (
            <>
              <Button onClick={() => handleStart(false)} disabled={loading} className="gap-2">
                <Play className="h-4 w-4" />
                Start Server
              </Button>
              <Button
                onClick={() => handleStart(true)}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Start & Open
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleStop}
                disabled={loading}
                variant="destructive"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
              <Button
                onClick={handleRestart}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Restart
              </Button>
              <Button onClick={openN8n} variant="default" className="gap-2 col-span-2">
                <ExternalLink className="h-4 w-4" />
                Open n8n Editor
              </Button>
            </>
          )}
        </div>

        {/* Status Info */}
        {status?.running && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Uptime
                </div>
                <div className="font-mono">{formatUptime(status.uptime)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Terminal className="h-3 w-3" />
                  Process ID
                </div>
                <div className="font-mono">{status.pid}</div>
              </div>
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  URL
                </div>
                <a
                  href={status.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-500 hover:underline"
                >
                  {status.url}
                </a>
              </div>
            </div>
          </>
        )}

        {/* Logs */}
        {status?.logs && status.logs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Recent Logs</h4>
                <Button size="sm" variant="ghost" onClick={fetchStatus} className="h-6 text-xs">
                  Refresh
                </Button>
              </div>
              <ScrollArea className="h-[200px] w-full rounded-md border p-3 bg-slate-950 text-slate-50">
                <div className="space-y-1 font-mono text-xs">
                  {status.logs.map((log, index) => (
                    <div
                      key={index}
                      className={log.type === 'error' ? 'text-red-400' : 'text-green-400'}
                    >
                      <span className="text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>{' '}
                      {log.message}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="h-6 text-xs"
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default N8nController;
