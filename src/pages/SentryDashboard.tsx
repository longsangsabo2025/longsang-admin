/**
 * 🚨 SENTRY ERROR DASHBOARD
 * 
 * Hiển thị errors từ production và đề xuất fix từ AI
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Bug, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Zap,
  Code,
  GitBranch,
  ExternalLink,
  Loader2,
  Rocket,
  Terminal
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SentryError {
  id: string;
  shortId?: string;
  title: string;
  message?: string;
  level: string;
  platform: string;
  culprit: string;
  project: string;
  environment: string;
  timestamp: string;
  count?: number;
  userCount?: number;
  permalink?: string;
  analysis?: string;
  suggestedFix?: string;
  stacktrace?: Array<{
    filename: string;
    function: string;
    lineno: number;
    context_line?: string;
  }>;
}

interface PollerStats {
  running: boolean;
  processedCount: number;
  pollInterval: number;
  org: string;
  project: string;
}

interface Stats {
  totalErrors: number;
  byLevel: Record<string, number>;
  byProject: Record<string, number>;
  byEnvironment: Record<string, number>;
  last24h: number;
  lastHour: number;
}

export default function SentryDashboard() {
  const [errors, setErrors] = useState<SentryError[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pollerStats, setPollerStats] = useState<PollerStats | null>(null);
  const [selectedError, setSelectedError] = useState<SentryError | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fixingSending, setFixingSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const { toast } = useToast();

  // Fetch initial data
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3003');
    
    ws.onopen = () => {
      console.log('🔗 Connected to WebSocket Bridge');
      setWsConnected(true);
      // Register as web UI
      ws.send(JSON.stringify({ type: 'register', clientType: 'webui' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'error_alert' || data.type === 'sentry_error') {
          console.log('🚨 New error received:', data);
          // Add to errors list
          setErrors(prev => [data.error || data, ...prev].slice(0, 50));
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setWsConnected(false);
    };

    return () => ws.close();
  }, []);

  const fetchData = async () => {
    try {
      const [errorsRes, statsRes, pollerRes] = await Promise.all([
        fetch(`${API_URL}/api/sentry/errors?limit=50`),
        fetch(`${API_URL}/api/sentry/stats`),
        fetch(`${API_URL}/api/sentry/poller`)
      ]);

      if (errorsRes.ok) {
        const data = await errorsRes.json();
        setErrors(data.errors || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (pollerRes.ok) {
        const data = await pollerRes.json();
        setPollerStats(data.poller);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestError = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/sentry/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Error - ' + new Date().toLocaleTimeString(),
          message: 'This is a test error from the dashboard',
          level: 'error'
        })
      });
      
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Send test error failed:', error);
    } finally {
      setSending(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'warning';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  // 🚀 FIX WITH COPILOT - Send to file watcher → opens VS Code + Copilot
  const fixWithCopilot = async (error: SentryError) => {
    setFixingSending(true);
    try {
      // Extract file path from culprit or stacktrace
      let file = error.culprit || '';
      let line = 1;
      
      // Try to parse file:line from stacktrace
      if (error.stacktrace && error.stacktrace.length > 0) {
        const lastFrame = error.stacktrace[error.stacktrace.length - 1];
        file = lastFrame.filename || file;
        line = lastFrame.lineno || 1;
      }

      // Build full path if relative
      if (file && !file.includes(':')) {
        file = `D:/0.PROJECTS/00-MASTER-ADMIN/longsang-admin/src/${file}`;
      }

      const payload = {
        file,
        line,
        error: error.title,
        context: error.message || error.culprit,
        stacktrace: error.stacktrace?.map(f => 
          `  at ${f.function || 'anonymous'} (${f.filename}:${f.lineno})`
        ).join('\n'),
        project: error.project,
        environment: error.environment,
        count: error.count,
        userCount: error.userCount,
        sentryId: error.shortId,
        permalink: error.permalink
      };

      const res = await fetch(`${API_URL}/api/fix-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({
          title: "🚀 Sent to VS Code!",
          description: "Check VS Code - COPILOT_TASK.md will open automatically. Press Ctrl+I to chat with Copilot.",
        });
      } else {
        throw new Error('Failed to send fix request');
      }
    } catch (err) {
      console.error('Fix with Copilot error:', err);
      toast({
        title: "❌ Error",
        description: "Failed to send to Copilot. Make sure local-watcher.js is running.",
        variant: "destructive"
      });
    } finally {
      setFixingSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="w-8 h-8 text-red-500" />
            Sentry Error Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Production error monitoring & auto-fix suggestions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={wsConnected ? 'default' : 'destructive'} className="gap-1">
            <Zap className="w-3 h-3" />
            {wsConnected ? 'Real-time' : 'Disconnected'}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={sendTestError} disabled={sending}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
            Test Error
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalErrors || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{stats?.lastHour || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{stats?.last24h || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Poller Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {pollerStats?.running ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-500 font-medium">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-medium">Stopped</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pollerStats?.org}/{pollerStats?.project}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recent Errors
            </CardTitle>
            <CardDescription>
              Click an error to see AI analysis & suggested fix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {errors.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No errors! 🎉</p>
                  <p className="text-sm">Your app is running smoothly</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                        selectedError?.id === error.id ? 'bg-accent border-primary' : ''
                      }`}
                      onClick={() => setSelectedError(error)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getLevelColor(error.level) as any} className="text-xs">
                              {error.level}
                            </Badge>
                            {error.shortId && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {error.shortId}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-sm truncate">{error.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {error.culprit}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(error.timestamp)}
                            </div>
                            {error.count && (
                              <div className="mt-1">
                                {error.count}x | {error.userCount} users
                              </div>
                            )}
                          </div>
                          {/* 🚀 FIX WITH COPILOT BUTTON */}
                          <Button 
                            size="sm" 
                            variant="default"
                            className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              fixWithCopilot(error);
                            }}
                            disabled={fixingSending}
                          >
                            {fixingSending ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Rocket className="w-3 h-3 mr-1" />
                            )}
                            Fix
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Error Details & AI Analysis */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Error Details & AI Fix
            </CardTitle>
            <CardDescription>
              AI-powered analysis and suggested code fix
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedError ? (
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                  <TabsTrigger value="fix">Suggested Fix</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-1">Title</h4>
                        <p className="text-sm">{selectedError.title}</p>
                      </div>
                      
                      {selectedError.message && (
                        <div>
                          <h4 className="font-semibold mb-1">Message</h4>
                          <p className="text-sm text-muted-foreground">{selectedError.message}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-1">Level</h4>
                          <Badge variant={getLevelColor(selectedError.level) as any}>
                            {selectedError.level}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Platform</h4>
                          <p className="text-sm">{selectedError.platform}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Environment</h4>
                          <p className="text-sm">{selectedError.environment}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Project</h4>
                          <p className="text-sm">{selectedError.project}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">Location</h4>
                        <p className="text-sm font-mono bg-muted p-2 rounded">
                          {selectedError.culprit}
                        </p>
                      </div>

                      {selectedError.stacktrace && selectedError.stacktrace.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1">Stack Trace</h4>
                          <div className="bg-muted rounded p-3 font-mono text-xs space-y-1">
                            {selectedError.stacktrace.map((frame, i) => (
                              <div key={i} className="text-muted-foreground">
                                <span className="text-foreground">{frame.function || 'anonymous'}</span>
                                <span className="mx-2">@</span>
                                <span>{frame.filename}:{frame.lineno}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedError.permalink && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedError.permalink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View in Sentry
                          </a>
                        </Button>
                      )}

                      {/* 🚀 MAIN FIX WITH COPILOT BUTTON */}
                      <div className="pt-4 border-t">
                        <Button 
                          size="lg" 
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                          onClick={() => fixWithCopilot(selectedError)}
                          disabled={fixingSending}
                        >
                          {fixingSending ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <Rocket className="w-5 h-5 mr-2" />
                          )}
                          🚀 Fix with VS Code Copilot
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Opens file in VS Code + COPILOT_TASK.md for AI assistance
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="analysis" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    {selectedError.analysis ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>AI Analysis</AlertTitle>
                          <AlertDescription className="mt-2 whitespace-pre-wrap">
                            {selectedError.analysis}
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
                        <p>Analysis will appear when VS Code Listener processes this error</p>
                        <p className="text-sm mt-2">
                          Make sure VS Code Listener is running
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="fix" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    {selectedError.suggestedFix ? (
                      <div className="space-y-4">
                        <Alert className="border-green-500/50 bg-green-500/10">
                          <GitBranch className="h-4 w-4 text-green-500" />
                          <AlertTitle className="text-green-500">Suggested Fix</AlertTitle>
                          <AlertDescription className="mt-2">
                            <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-3 rounded mt-2 overflow-x-auto">
                              {selectedError.suggestedFix}
                            </pre>
                          </AlertDescription>
                        </Alert>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Code className="w-4 h-4 mr-2" />
                            Copy Code
                          </Button>
                          <Button size="sm">
                            <GitBranch className="w-4 h-4 mr-2" />
                            Create PR
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <Code className="w-8 h-8 mx-auto mb-3" />
                        <p>No suggested fix yet</p>
                        <p className="text-sm mt-2">
                          AI will analyze and suggest a fix when available
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Bug className="w-12 h-12 mx-auto mb-3" />
                <p>Select an error to view details</p>
                <p className="text-sm mt-2">
                  Click on any error from the list
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
