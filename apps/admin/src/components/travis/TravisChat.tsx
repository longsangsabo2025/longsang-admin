import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  Loader2,
  Zap,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Wrench,
  Brain,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

const TRAVIS_API = 'http://localhost:8300';
const TRAVIS_WS = 'ws://localhost:8300/ws';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: { name: string; args: Record<string, unknown>; result_preview?: string }[];
  latencyMs?: number;
  timestamp: Date;
}

interface TravisStats {
  total_conversations: number;
  total_decisions: number;
  pending_alerts: number;
  critical_alerts: number;
  success_rate: number;
}

export default function TravisChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<TravisStats | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Check Travis health on mount
  useEffect(() => {
    checkHealth();
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${TRAVIS_API}/health`);
      setIsConnected(res.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${TRAVIS_API}/stats`);
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  };

  // WebSocket connection
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setWsStatus('connecting');
    const ws = new WebSocket(TRAVIS_WS);

    ws.onopen = () => {
      setWsStatus('connected');
      console.log('[Travis WS] Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'response') {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            toolCalls: data.tool_calls,
            latencyMs: data.latency_ms,
            timestamp: new Date(),
          },
        ]);
        if (data.session_id) setSessionId(data.session_id);
        setIsLoading(false);
      } else if (data.type === 'alert') {
        setMessages((prev) => [
          ...prev,
          {
            id: `alert-${Date.now()}`,
            role: 'system',
            content: `⚠️ **Alert (${data.severity}):** ${data.title}`,
            timestamp: new Date(),
          },
        ]);
      }
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      // Auto-reconnect after 5s
      setTimeout(connectWs, 5000);
    };

    ws.onerror = () => setWsStatus('disconnected');
    wsRef.current = ws;
  }, []);

  // Send via REST (fallback) or WebSocket
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Try WebSocket first
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ message: text, session_id: sessionId, include_context: true })
      );
      return;
    }

    // Fallback to REST
    try {
      const res = await fetch(`${TRAVIS_API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId, include_context: true }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          toolCalls: data.tool_calls,
          latencyMs: data.latency_ms,
          timestamp: new Date(),
        },
      ]);
      if (data.session_id) setSessionId(data.session_id);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'system',
          content: `❌ Không thể kết nối Travis AI: ${errorMessage}\n\nĐảm bảo Travis server đang chạy ở port 8300.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: '📊 Status', msg: 'Empire status nhanh' },
    { label: '🎬 Videos', msg: 'Video Factory queue hiện tại?' },
    { label: '⚠️ Alerts', msg: 'Có alert nào pending không?' },
    { label: '💻 System', msg: 'System metrics (CPU, RAM)' },
  ];

  // ── Minimized floating button ────────────────────────────
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => {
            setIsMinimized(false);
            connectWs();
          }}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 relative"
        >
          <Brain className="h-7 w-7 text-white" />
          {stats?.pending_alerts ? (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {stats.pending_alerts}
            </span>
          ) : null}
          <span
            className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
        </Button>
      </div>
    );
  }

  // ── Full Chat Panel ──────────────────────────────────────
  return (
    <div
      className={cn(
        'fixed z-50 bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300',
        isExpanded
          ? 'inset-4'
          : 'bottom-6 right-6 w-[420px] h-[600px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-700 text-white">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <span className="font-bold text-sm">Travis AI</span>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] border-white/30',
              isConnected ? 'text-green-300' : 'text-red-300'
            )}
          >
            {isConnected ? '● Online' : '○ Offline'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => {
              checkHealth();
              fetchStats();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/50 border-b text-xs text-muted-foreground">
          <span>💬 {stats.total_conversations} today</span>
          <span>🎯 {stats.success_rate}% success</span>
          {stats.pending_alerts > 0 && (
            <span className="text-orange-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {stats.pending_alerts} alerts
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground space-y-4 mt-8">
            <Sparkles className="h-10 w-10 mx-auto text-violet-400" />
            <div>
              <p className="font-semibold text-foreground">Travis AI</p>
              <p className="text-sm">CTO ảo — LongSang AI Empire</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {quickActions.map((qa) => (
                <Button
                  key={qa.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInput(qa.msg);
                    setTimeout(() => sendMessage(), 100);
                  }}
                >
                  {qa.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'mb-3',
              msg.role === 'user' && 'flex justify-end',
              msg.role === 'system' && 'flex justify-center'
            )}
          >
            {msg.role === 'system' ? (
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2 text-xs max-w-[90%]">
                {msg.content}
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-xl px-3.5 py-2.5 max-w-[85%] text-sm',
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                )}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                {/* Tool calls badge */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.toolCalls.map((tc, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[10px] gap-1"
                      >
                        <Wrench className="h-2.5 w-2.5" />
                        {tc.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Latency */}
                {msg.latencyMs && (
                  <div className="mt-1 text-[10px] opacity-50">
                    ⚡ {msg.latencyMs}ms
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Travis đang suy nghĩ...</span>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nói gì đó với Travis..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 bg-violet-600 hover:bg-violet-500"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
