import { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  MessageSquare,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  Send,
  Wrench,
  History,
  BarChart3,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';

const TRAVIS_API = 'http://localhost:8300';

interface TravisStats {
  total_conversations: number;
  total_decisions: number;
  pending_alerts: number;
  critical_alerts: number;
  success_rate: number;
}

interface HealthInfo {
  status: string;
  model: string;
  tools_count: number;
  telegram: boolean;
  proactive_monitoring: boolean;
}

interface Decision {
  description: string;
  success: boolean;
  created_at: string;
}

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  created_at: string;
}

interface ChatMessage {
  role: string;
  content: string;
  tool_calls?: unknown[];
  latency_ms?: number;
}

export default function TravisDashboardPage() {
  const [stats, setStats] = useState<TravisStats | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sessions, setSessions] = useState<{ session_id: string; created_at: string }[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [healthRes, statsRes, alertsRes, sessionsRes] = await Promise.allSettled([
        fetch(`${TRAVIS_API}/health`),
        fetch(`${TRAVIS_API}/stats`),
        fetch(`${TRAVIS_API}/alerts/pending`),
        fetch(`${TRAVIS_API}/sessions`),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        setHealth(await healthRes.value.json());
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) setStats(await statsRes.value.json());
      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const d = await alertsRes.value.json();
        setAlerts(d.alerts || []);
      }
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.ok) setSessions(await sessionsRes.value.json());
    } catch { /* ignore */ }
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || isLoading) return;

    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${TRAVIS_API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: sessionId, include_context: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response, tool_calls: data.tool_calls, latency_ms: data.latency_ms },
        ]);
        if (data.session_id) setSessionId(data.session_id);
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: 'system', content: '❌ Cannot reach Travis AI' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Travis AI</h1>
            <p className="text-sm text-muted-foreground">CTO ảo — LongSang AI Empire Brain</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <MessageSquare className="h-6 w-6 mx-auto text-violet-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.total_conversations ?? '-'}</p>
            <p className="text-xs text-muted-foreground">Conversations (24h)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Zap className="h-6 w-6 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.total_decisions ?? '-'}</p>
            <p className="text-xs text-muted-foreground">Decisions (24h)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.pending_alerts ?? '-'}</p>
            <p className="text-xs text-muted-foreground">Pending Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.success_rate ?? '-'}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Wrench className="h-6 w-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{health?.tools_count ?? '-'}</p>
            <p className="text-xs text-muted-foreground">Tools Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList>
          <TabsTrigger value="chat" className="gap-1">
            <MessageSquare className="h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1">
            <AlertTriangle className="h-4 w-4" /> Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1">
            <Activity className="h-4 w-4" /> Config
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-500" />
                Chat with Travis
                {sessionId && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {sessionId}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] border rounded-lg p-4 mb-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground mt-20">
                    <Brain className="h-12 w-12 mx-auto opacity-30 mb-3" />
                    <p>Bắt đầu chat với Travis AI</p>
                    <p className="text-xs mt-1">Hỏi về empire status, tạo video, check metrics...</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}
                  >
                    <div
                      className={`inline-block rounded-xl px-4 py-2 max-w-[80%] text-sm ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white'
                          : msg.role === 'system'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.tool_calls && (msg.tool_calls as { name: string }[]).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(msg.tool_calls as { name: string }[]).map((tc, j) => (
                            <Badge key={j} variant="secondary" className="text-[10px]">
                              🔧 {tc.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {msg.latency_ms && (
                        <p className="text-[10px] mt-1 opacity-50">⚡ {msg.latency_ms}ms</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full" />
                    Travis đang suy nghĩ...
                  </div>
                )}
              </ScrollArea>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-3">
                {['📊 Empire status', '🎬 Video queue', '⚠️ Check alerts', '💻 System metrics', '🚀 Gợi ý content'].map(
                  (label) => (
                    <Button
                      key={label}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setChatInput(label.replace(/^[^\s]+\s/, ''));
                      }}
                    >
                      {label}
                    </Button>
                  )
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                  placeholder="Nói gì đó với Travis..."
                  className="min-h-[44px] resize-none"
                  rows={1}
                />
                <Button onClick={sendChat} disabled={!chatInput.trim() || isLoading} className="bg-violet-600">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-3" />
                  <p>Không có alerts pending.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 ${
                        alert.severity === 'critical'
                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                          : alert.severity === 'warning'
                          ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge
                            variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <h4 className="font-semibold mt-1">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(alert.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Travis AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {health ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="default">{health.status}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-mono">{health.model}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tools</span>
                      <span>{health.tools_count} registered</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Telegram Bot</span>
                      <Badge variant={health.telegram ? 'default' : 'secondary'}>
                        {health.telegram ? '✅ Active' : '❌ Not configured'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Proactive Monitor</span>
                      <Badge variant={health.proactive_monitoring ? 'default' : 'secondary'}>
                        {health.proactive_monitoring ? '👁️ Active' : '⏸️ Disabled'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">API Endpoint</span>
                      <span className="font-mono text-xs">:8300</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Travis AI offline. Start server: <code>python main.py</code>
                </p>
              )}

              {/* Recent Sessions */}
              {sessions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1">
                    <History className="h-4 w-4" /> Recent Sessions
                  </h4>
                  <div className="space-y-1">
                    {sessions.slice(0, 5).map((s) => (
                      <div key={s.session_id} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                        <span className="font-mono text-xs">{s.session_id}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
