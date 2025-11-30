/**
 * Chat Panel Component for Visual Workspace
 * Lovable-style dark theme chat interface
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2, Sparkles, Plus, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  onSendMessage: (message: string) => Promise<void>;
  isGenerating?: boolean;
  className?: string;
}

export function ChatPanel({ onSendMessage, isGenerating = false, className = '' }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Add loading message
    const loadingMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ]);

    try {
      await onSendMessage(userMessage.content);

      // Update loading message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: '✨ Đã xử lý xong! Kiểm tra preview bên phải.',
              }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: '❌ Có lỗi xảy ra. Vui lòng thử lại.',
              }
            : msg
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('flex flex-col h-full bg-[#1a1a1a]', className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            // Empty state - Lovable style
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Solo Hub AI</h3>
              <p className="text-gray-400 text-sm max-w-[250px]">
                Describe what you want to build and I'll help you create it.
              </p>

              {/* Quick Actions */}
              <div className="mt-6 space-y-2 w-full max-w-[280px]">
                <button
                  onClick={() => setInput('Tạo bài post Facebook về bất động sản')}
                  className="w-full text-left px-4 py-3 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm text-gray-300 transition-colors"
                >
                  📝 Tạo bài post Facebook
                </button>
                <button
                  onClick={() => setInput('Lên lịch content cả tuần')}
                  className="w-full text-left px-4 py-3 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm text-gray-300 transition-colors"
                >
                  📅 Lên lịch content tuần
                </button>
                <button
                  onClick={() => setInput('Phân tích đối thủ cạnh tranh')}
                  className="w-full text-left px-4 py-3 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm text-gray-300 transition-colors"
                >
                  🔍 Phân tích đối thủ
                </button>
              </div>
            </div>
          ) : (
            // Messages list
            messages.map((message) => (
              <div key={message.id} className="space-y-1">
                {/* Timestamp */}
                {message.role === 'user' && (
                  <div className="text-right text-xs text-gray-500 mb-1">
                    {formatTime(message.timestamp)}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 max-w-[85%] text-sm',
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-[#2a2a2a] text-gray-200 rounded-bl-md'
                    )}
                  >
                    {message.content ||
                      (isGenerating && message.id === messages[messages.length - 1]?.id && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-gray-400">Thinking...</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Area - Lovable style */}
      <div className="p-4 border-t border-[#333]">
        <div className="relative">
          {/* Input container */}
          <div className="flex items-end gap-2 bg-[#2a2a2a] rounded-2xl p-2">
            {/* Add button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#333] rounded-xl shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Solo Hub..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none outline-none min-h-[36px] max-h-[150px] py-2"
              rows={1}
              disabled={isGenerating}
            />

            {/* Voice button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#333] rounded-xl shrink-0"
            >
              <Mic className="h-5 w-5" />
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              size="icon"
              className={cn(
                'h-9 w-9 rounded-xl shrink-0 transition-colors',
                input.trim()
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-[#333] text-gray-500'
              )}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Visual edits toggle */}
          <div className="flex items-center justify-between mt-3">
            <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
              <div className="w-4 h-4 rounded border border-gray-600"></div>
              Visual edits
            </button>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#333]">
                💬 Chat
              </button>
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#333]">
                🔊
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
