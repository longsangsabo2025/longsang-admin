/**
 * Chat Panel Component for Visual Workspace
 * Lovable-style dark theme chat interface
 * NOW WITH PERSISTENT CHAT HISTORY
 */

import {
  ArrowUp,
  History,
  Loader2,
  MessageSquarePlus,
  Mic,
  MicOff,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useChatHistory } from '@/hooks/useChatHistory';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  onSendMessage: (message: string) => Promise<void>;
  isGenerating?: boolean;
  className?: string;
}

export function ChatPanel({ onSendMessage, isGenerating = false, className = '' }: ChatPanelProps) {
  // Use persistent chat history hook
  const {
    messages,
    sessions,
    currentSession,
    isLoading: isLoadingHistory,
    addMessage,
    updateLastAssistantMessage,
    createSession,
    switchSession,
    deleteSession,
    clearCurrentSession,
  } = useChatHistory();

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [visualEdits, setVisualEdits] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

    const messageContent = input.trim();
    setInput('');

    // Add user message to persistent history
    await addMessage('user', messageContent);

    // Add loading assistant message
    await addMessage('assistant', '');

    try {
      await onSendMessage(messageContent);

      // Update last assistant message with response
      updateLastAssistantMessage('✨ Đã xử lý xong! Kiểm tra preview bên phải.');
    } catch (error) {
      updateLastAssistantMessage('❌ Có lỗi xảy ra. Vui lòng thử lại.');
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
      {/* Header with session controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
                <History className="h-4 w-4" />
                <span className="text-xs truncate max-w-[120px]">
                  {currentSession?.name || 'New Chat'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[#2a2a2a] border-[#444]">
              <DropdownMenuLabel className="text-gray-400">Chat Sessions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#444]" />
              <DropdownMenuItem
                className="text-green-400 hover:bg-[#333] cursor-pointer"
                onClick={() => createSession()}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                New Session
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#444]" />
              {sessions.slice(0, 10).map((session) => (
                <DropdownMenuItem
                  key={session.id}
                  className={cn(
                    'cursor-pointer hover:bg-[#333]',
                    session.id === currentSession?.id
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-gray-300'
                  )}
                  onClick={() => switchSession(session.id)}
                >
                  <span className="truncate flex-1">{session.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{session.messages.length} msgs</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={() => {
              clearCurrentSession();
              toast({ title: '🗑️ Session cleared' });
            }}
            title="Clear current session"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-400 hover:text-green-300"
            onClick={() => createSession()}
            title="New session"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          ) : messages.length === 0 ? (
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
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              toast({
                title: '📎 File đã chọn',
                description: file.name,
              });
              // TODO: Handle file upload
            }
          }}
        />

        <div className="relative">
          {/* Input container */}
          <div className="flex items-end gap-2 bg-[#2a2a2a] rounded-2xl p-2">
            {/* Add/Attach button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#333] rounded-xl shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Đính kèm file"
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
              className={cn(
                'h-9 w-9 rounded-xl shrink-0 transition-colors',
                isRecording
                  ? 'text-red-400 bg-red-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#333]'
              )}
              onClick={() => {
                if (isRecording) {
                  setIsRecording(false);
                  toast({ title: '🎤 Đã dừng ghi âm' });
                } else {
                  setIsRecording(true);
                  toast({
                    title: '🎤 Đang ghi âm...',
                    description: 'Click lần nữa để dừng',
                  });
                  // TODO: Implement actual voice recording
                }
              }}
              title={isRecording ? 'Dừng ghi âm' : 'Ghi âm giọng nói'}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
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
            <button
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                setVisualEdits(!visualEdits);
                toast({
                  title: visualEdits ? '🔲 Visual edits OFF' : '✅ Visual edits ON',
                  description: visualEdits
                    ? 'Chỉ chat, không tạo components'
                    : 'Tự động tạo components trên canvas',
                });
              }}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded border transition-colors flex items-center justify-center',
                  visualEdits ? 'bg-purple-600 border-purple-600' : 'border-gray-600'
                )}
              >
                {visualEdits && <span className="text-[10px] text-white">✓</span>}
              </div>
              Visual edits
            </button>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 text-xs text-purple-400 transition-colors px-2 py-1 rounded bg-purple-500/20"
                onClick={() => toast({ title: '💬 Chat mode active' })}
              >
                💬 Chat
              </button>
              <button
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#333]"
                onClick={() => {
                  setIsRecording(!isRecording);
                  toast({ title: isRecording ? '🔇 Voice OFF' : '🔊 Voice ON' });
                }}
              >
                {isRecording ? '🔴' : '🔊'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
