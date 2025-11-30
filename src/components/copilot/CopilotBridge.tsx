/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║               COPILOT BRIDGE COMPONENT                        ║
 * ║   Send messages directly to VS Code Copilot from Web UI       ║
 * ╚═══════════════════════════════════════════════════════════════╝
 * 
 * This component provides a floating chat interface that allows
 * users to send messages directly to VS Code Copilot (Claude).
 * 
 * Flow:
 * 1. User types message in Web UI
 * 2. Message is sent to API → saved to file queue
 * 3. VS Code Copilot picks up message via MCP tool
 * 4. Copilot processes and sends response back
 * 5. Web UI polls for and displays response
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  X, 
  Loader2, 
  Bot, 
  User,
  Minimize2,
  Maximize2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'copilot' | 'system';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'processing' | 'completed' | 'error';
}

interface BridgeStats {
  pendingMessages: number;
  awaitingPickup: number;
  totalProcessed: number;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function CopilotBridge() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<BridgeStats | null>(null);
  const [pendingMessageIds, setPendingMessageIds] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch bridge stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/copilot-bridge/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch bridge stats:', error);
    }
  }, []);

  // Poll for responses
  const pollForResponses = useCallback(async () => {
    for (const messageId of pendingMessageIds) {
      try {
        const response = await fetch(`${API_BASE}/api/copilot-bridge/response/${messageId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'completed' || data.status === 'error') {
            // Add response to messages
            setMessages(prev => [
              ...prev.map(m => m.id === messageId ? { ...m, status: data.status } : m),
              {
                id: `${messageId}-response`,
                type: 'copilot' as const,
                content: data.response,
                timestamp: new Date(data.processedAt),
                status: data.status
              }
            ]);
            
            // Remove from pending
            setPendingMessageIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(messageId);
              return newSet;
            });
            
            // Delete processed message
            await fetch(`${API_BASE}/api/copilot-bridge/message/${messageId}`, {
              method: 'DELETE'
            });
          }
        }
      } catch (error) {
        console.error(`Failed to poll response for ${messageId}:`, error);
      }
    }
  }, [pendingMessageIds]);

  // Start/stop polling
  useEffect(() => {
    if (isOpen && pendingMessageIds.size > 0) {
      pollingRef.current = setInterval(pollForResponses, 2000);
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, pendingMessageIds.size, pollForResponses]);

  // Fetch stats when opened
  useEffect(() => {
    if (isOpen) {
      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchStats]);

  // Send message to Copilot Bridge
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      status: 'pending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send to queue for VS Code Copilot to process
      const response = await fetch(`${API_BASE}/api/copilot-bridge/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            source: 'web-ui',
            timestamp: userMessage.timestamp.toISOString(),
            currentPage: window.location.pathname
          },
          priority: 'normal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update message with server ID and set to processing
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id 
          ? { ...m, id: data.messageId, status: 'processing' as const }
          : m
      ));
      
      // Add to pending for polling
      setPendingMessageIds(prev => new Set(prev).add(data.messageId));
      
      // Add system message
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'system',
        content: '📤 Đã gửi đến VS Code Copilot. Đang chờ xử lý...',
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'system',
        content: '❌ Không thể gửi tin nhắn. Vui lòng thử lại.',
        timestamp: new Date(),
        status: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30"
            >
              <Sparkles className="h-6 w-6" />
            </Button>
            {stats && stats.pendingMessages > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
              >
                {stats.pendingMessages}
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col",
              isMinimized && "h-auto"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-zinc-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">VS Code Copilot</h3>
                  <p className="text-xs text-zinc-400">Claude Opus 4.5 • Direct Bridge</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-zinc-500 py-8">
                      <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Gửi tin nhắn đến VS Code Copilot</p>
                      <p className="text-xs mt-1 text-zinc-600">
                        Tin nhắn sẽ được xử lý trực tiếp trong VS Code
                      </p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Stats Bar */}
                {stats && (
                  <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending: {stats.pendingMessages}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Processed: {stats.totalProcessed}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Bridge Active
                    </Badge>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-zinc-800">
                  <div className="flex gap-2">
                    <Textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập tin nhắn cho Copilot..."
                      className="min-h-[60px] max-h-[120px] bg-zinc-800 border-zinc-700 resize-none"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex gap-2",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser 
          ? "bg-violet-600" 
          : "bg-gradient-to-r from-violet-600 to-indigo-600"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>
      
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2",
        isUser 
          ? "bg-violet-600 text-white" 
          : "bg-zinc-800 text-zinc-100"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={cn(
          "flex items-center gap-2 mt-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span className="text-[10px] opacity-60">
            {message.timestamp.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {message.status && (
            <StatusIndicator status={message.status} />
          )}
        </div>
      </div>
    </div>
  );
}

// Status Indicator
function StatusIndicator({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3 text-yellow-500" />;
    case 'processing':
      return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
}

export default CopilotBridge;
