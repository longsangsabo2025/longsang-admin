import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Brain, 
  FolderOpen,
  RefreshCw,
  Trash2,
  Settings,
  ChevronDown,
  FileText,
  Search,
  Bug
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface WorkspaceChatProps {
  defaultProject?: string;
  className?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function WorkspaceChat({ defaultProject, className = '' }: WorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [project, setProject] = useState(defaultProject || '');
  const [projects, setProjects] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    includeWorkspaceContext: true,
    includeBrainContext: true
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load available projects
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

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/workspace-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          project: project || null,
          includeWorkspaceContext: settings.includeWorkspaceContext,
          includeBrainContext: settings.includeBrainContext
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick actions
  const quickActions = [
    { icon: Bug, label: 'Check Errors', action: 'Có lỗi gì trong hệ thống hôm nay?' },
    { icon: FolderOpen, label: 'List Projects', action: 'Liệt kê các projects trong workspace' },
    { icon: Brain, label: 'Brain Status', action: 'Status của AI Second Brain?' },
    { icon: Search, label: 'Search Code', action: 'Tìm kiếm function' }
  ];

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span className="font-medium text-white">Workspace AI Chat</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Project selector */}
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="bg-slate-800 text-sm text-slate-300 rounded px-2 py-1 border border-slate-600"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p} value={p}>{p.split('/').pop()}</option>
            ))}
          </select>

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded hover:bg-slate-700 ${showSettings ? 'bg-slate-700' : ''}`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </button>

          {/* Clear chat */}
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
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={settings.includeWorkspaceContext}
                onChange={(e) => setSettings(s => ({ ...s, includeWorkspaceContext: e.target.checked }))}
                className="rounded"
              />
              <FolderOpen className="w-3 h-3" />
              Workspace Context
            </label>
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={settings.includeBrainContext}
                onChange={(e) => setSettings(s => ({ ...s, includeBrainContext: e.target.checked }))}
                className="rounded"
              />
              <Brain className="w-3 h-3" />
              Brain Knowledge
            </label>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">
              Workspace AI Assistant
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Hỏi bất kỳ điều gì về workspace, code, hoặc projects của bạn.
            </p>
            
            {/* Quick actions */}
            <div className="flex flex-wrap justify-center gap-2">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(qa.action);
                    inputRef.current?.focus();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 
                           text-slate-300 text-sm rounded-full transition-colors"
                >
                  <qa.icon className="w-3 h-3" />
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div 
                    className="prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessage(msg.content) 
                    }}
                  />
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

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
            <div className="bg-slate-800 rounded-lg px-4 py-2">
              <span className="text-slate-400">Đang suy nghĩ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về workspace, code, hoặc nhờ AI hỗ trợ..."
            className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-2 resize-none
                     border border-slate-600 focus:border-cyan-500 focus:outline-none
                     placeholder:text-slate-500"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
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
          <span>Enter để gửi, Shift+Enter để xuống dòng</span>
          <div className="flex items-center gap-2">
            {settings.includeWorkspaceContext && (
              <span className="flex items-center gap-1">
                <FolderOpen className="w-3 h-3" /> Workspace
              </span>
            )}
            {settings.includeBrainContext && (
              <span className="flex items-center gap-1">
                <Brain className="w-3 h-3" /> Brain
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: Format markdown-like message to HTML
function formatMessage(content: string): string {
  return content
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-slate-900 p-2 rounded my-2 overflow-x-auto"><code class="text-sm">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1 rounded text-cyan-300">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-cyan-400 mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-cyan-300 mt-3 mb-1">$1</h3>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$1. $2</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

export default WorkspaceChat;
