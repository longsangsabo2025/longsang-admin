import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Brain,
  FolderOpen,
  Trash2,
  Settings,
  Wrench,
  CheckCircle,
  XCircle,
  Zap,
  Eye,
  EyeOff,
  Plug,
  RefreshCw,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  tool: string;
  args: any;
  success: boolean;
}

interface StreamEvent {
  type: string;
  message?: string;
  tool?: string;
  args?: any;
  success?: boolean;
  preview?: string;
  response?: string;
  toolCalls?: ToolCall[];
  [key: string]: any;
}

interface StreamingWorkspaceChatProps {
  defaultProject?: string;
  className?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function StreamingWorkspaceChat({
  defaultProject,
  className = '',
}: StreamingWorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `stream-${Date.now()}`);
  const [project, setProject] = useState(defaultProject || '');
  const [projects, setProjects] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const [mcpStatus, setMcpStatus] = useState<{ connected: boolean; tools: string[] }>({
    connected: false,
    tools: [],
  });

  // Streaming state
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [currentThinking, setCurrentThinking] = useState<string>('');

  const [settings, setSettings] = useState({
    includeWorkspaceContext: true,
    includeBrainContext: true,
    useMCPTools: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Load projects and MCP status on mount
  useEffect(() => {
    loadProjects();
    checkMCPStatus();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamEvents]);

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workspace/projects`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects.map((p: any) => p.path));
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const checkMCPStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/workspace-chat/mcp-status`);
      const data = await res.json();
      if (data.success) {
        setMcpStatus({
          connected: data.mcp.connected,
          tools: data.mcp.tools || [],
        });
      }
    } catch (err) {
      console.error('MCP status check failed:', err);
    }
  };

  const reconnectMCP = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/workspace-chat/mcp-reconnect`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setMcpStatus({
          connected: data.connected,
          tools: data.tools || [],
        });
      }
    } catch (err) {
      console.error('MCP reconnect failed:', err);
    }
  };

  // Send message with streaming
  const sendMessageStreaming = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamEvents([]);
    setCurrentThinking('');

    try {
      const res = await fetch(`${API_BASE}/api/ai/workspace-chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          project: project || null,
          includeWorkspaceContext: settings.includeWorkspaceContext,
          includeBrainContext: settings.includeBrainContext,
          useMCPTools: settings.useMCPTools,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              handleStreamEvent(event);
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Error: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentThinking('');
      inputRef.current?.focus();
    }
  };

  const handleStreamEvent = (event: StreamEvent) => {
    setStreamEvents((prev) => [...prev, event]);

    switch (event.type) {
      case 'status':
      case 'thinking':
        setCurrentThinking(event.message || '');
        break;

      case 'tool_call':
        setCurrentThinking(`⚡ Đang gọi: ${event.tool}`);
        break;

      case 'tool_result':
        // Tool completed
        break;

      case 'complete':
        // Final response
        if (event.response) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: event.response,
              timestamp: new Date().toISOString(),
              toolCalls: event.toolCalls,
            },
          ]);
        }
        break;

      case 'error':
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `❌ Error: ${event.error}`,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageStreaming();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamEvents([]);
  };

  // Get event icon
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Zap className="w-3 h-3 text-yellow-400" />;
      case 'status':
        return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />;
      case 'thinking':
        return <Brain className="w-3 h-3 text-purple-400" />;
      case 'brain':
        return <Brain className="w-3 h-3 text-cyan-400" />;
      case 'tools':
        return <Wrench className="w-3 h-3 text-orange-400" />;
      case 'tool_start':
        return <Wrench className="w-3 h-3 text-yellow-400" />;
      case 'tool_call':
        return <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />;
      case 'tool_result':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'complete':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Loader2 className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span className="font-medium text-white">Streaming AI Chat</span>
          {mcpStatus.connected && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              <Plug className="w-3 h-3" />
              MCP ({mcpStatus.tools.length} tools)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="bg-slate-800 text-sm text-slate-300 rounded px-2 py-1 border border-slate-600"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p.split('/').pop()}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowThinking(!showThinking)}
            className={`p-1.5 rounded hover:bg-slate-700 ${showThinking ? 'bg-slate-700' : ''}`}
            title={showThinking ? 'Hide thinking process' : 'Show thinking process'}
          >
            {showThinking ? (
              <Eye className="w-4 h-4 text-cyan-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded hover:bg-slate-700 ${showSettings ? 'bg-slate-700' : ''}`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={clearChat}
            className="p-1.5 rounded hover:bg-slate-700"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 text-sm">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={settings.includeWorkspaceContext}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, includeWorkspaceContext: e.target.checked }))
                }
                className="rounded"
              />
              <FolderOpen className="w-3 h-3" /> Workspace
            </label>
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={settings.includeBrainContext}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, includeBrainContext: e.target.checked }))
                }
                className="rounded"
              />
              <Brain className="w-3 h-3" /> Brain
            </label>
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={settings.useMCPTools}
                onChange={(e) => setSettings((s) => ({ ...s, useMCPTools: e.target.checked }))}
                className="rounded"
              />
              <Wrench className="w-3 h-3" /> MCP Tools
            </label>

            {!mcpStatus.connected && (
              <button
                onClick={reconnectMCP}
                className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300"
              >
                <RefreshCw className="w-3 h-3" /> Reconnect MCP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-2">Streaming AI Assistant</h3>
              <p className="text-slate-400 text-sm mb-4">
                Xem AI suy nghĩ và làm việc realtime như Copilot!
              </p>

              {mcpStatus.connected && (
                <div className="bg-slate-800 rounded-lg p-3 max-w-md mx-auto text-left">
                  <p className="text-xs text-slate-400 mb-2">Available MCP Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    {mcpStatus.tools.slice(0, 10).map((tool) => (
                      <span
                        key={tool}
                        className="text-xs bg-slate-700 text-cyan-300 px-2 py-0.5 rounded"
                      >
                        {tool}
                      </span>
                    ))}
                    {mcpStatus.tools.length > 10 && (
                      <span className="text-xs text-slate-500">
                        +{mcpStatus.tools.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      <div
                        className="prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <p className="text-xs text-slate-400 mb-1">Tools used:</p>
                          <div className="flex flex-wrap gap-1">
                            {msg.toolCalls.map((tc, j) => (
                              <span
                                key={j}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  tc.success
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {tc.success ? '✓' : '✗'} {tc.tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading/thinking indicator */}
          {isLoading && currentThinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <div className="bg-slate-800 rounded-lg px-4 py-2">
                <span className="text-slate-400">{currentThinking}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Thinking process sidebar */}
        {showThinking && isLoading && streamEvents.length > 0 && (
          <div className="w-72 border-l border-slate-700 bg-slate-800/50 overflow-y-auto">
            <div className="p-3 border-b border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Thinking Process
              </h4>
            </div>
            <div className="p-2 space-y-1">
              {streamEvents.map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs p-2 rounded bg-slate-800/50 hover:bg-slate-700/50"
                >
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 truncate">{event.message || event.type}</p>
                    {event.tool && (
                      <p className="text-cyan-400 font-mono text-[10px]">
                        {event.tool}({event.args ? JSON.stringify(event.args).slice(0, 30) : ''})
                      </p>
                    )}
                    {event.preview && (
                      <p className="text-slate-500 text-[10px] truncate mt-0.5">{event.preview}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={eventsEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi gì đó... (VD: list projects, đọc file README.md)"
            className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-2 resize-none
                     border border-slate-600 focus:border-cyan-500 focus:outline-none
                     placeholder:text-slate-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessageStreaming}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700
                     disabled:text-slate-500 text-white rounded-lg transition-colors
                     flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>Enter để gửi</span>
          <div className="flex items-center gap-2">
            {settings.useMCPTools && mcpStatus.connected && (
              <span className="text-green-400 flex items-center gap-1">
                <Plug className="w-3 h-3" /> MCP Active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Format markdown to HTML
function formatMessage(content: string): string {
  return content
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-slate-900 p-2 rounded my-2 overflow-x-auto"><code class="text-sm">$2</code></pre>'
    )
    .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1 rounded text-cyan-300">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-cyan-400 mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-cyan-300 mt-3 mb-1">$1</h3>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/\n/g, '<br/>');
}

export default StreamingWorkspaceChat;
