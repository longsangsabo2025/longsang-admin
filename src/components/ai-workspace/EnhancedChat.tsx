/**
 * 🚀 EnhancedChat Component - Elon Musk Edition
 * 
 * Ultimate AI Chat Experience with:
 * - 🎤 Voice Input
 * - ⚡ Real-time Streaming
 * - 🧠 Conversation Memory
 * - 📝 Markdown + Code Highlighting
 * - 🎨 Beautiful UI
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAISettings } from '@/hooks/useAISettings';
import { AssistantType } from '@/hooks/useAssistant';
import { useStreamingChat, Message } from '@/hooks/useStreamingChat';
import { useConversationMemory } from '@/hooks/useConversationMemory';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { VoiceInputButton } from './VoiceInputButton';
import { ChatMessage } from './ChatMessage';
import { cn } from '@/lib/utils';
import {
  ArrowUp,
  BookOpen,
  Briefcase,
  Calendar,
  ChevronDown,
  DollarSign,
  History,
  Loader2,
  MessageSquare,
  Mic,
  Newspaper,
  Plus,
  Search,
  Settings,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

const ASSISTANTS = [
  {
    id: 'course' as AssistantType,
    name: 'Khóa học AI',
    icon: BookOpen,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-400',
    description: 'Phát triển khóa học, curriculum, bài giảng',
  },
  {
    id: 'financial' as AssistantType,
    name: 'Tài chính Pro',
    icon: DollarSign,
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-400',
    description: 'Tài chính cá nhân, ngân sách, đầu tư',
  },
  {
    id: 'research' as AssistantType,
    name: 'Nghiên cứu',
    icon: Search,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-400',
    description: 'Nghiên cứu, tìm kiếm, tổng hợp thông tin',
  },
  {
    id: 'news' as AssistantType,
    name: 'Tin tức 24/7',
    icon: Newspaper,
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-400',
    description: 'Tin tức, xu hướng, cập nhật ngành',
  },
  {
    id: 'career' as AssistantType,
    name: 'Career Coach',
    icon: Briefcase,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-violet-400',
    description: 'Phát triển sự nghiệp, skills, networking',
  },
  {
    id: 'daily' as AssistantType,
    name: 'Daily Planner',
    icon: Calendar,
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-400',
    description: 'Lập kế hoạch ngày, task management',
  },
];

interface EnhancedChatProps {
  userId: string;
  defaultAssistant?: AssistantType;
  className?: string;
}

export function EnhancedChat({
  userId,
  defaultAssistant = 'research',
  className,
}: EnhancedChatProps) {
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantType>(defaultAssistant);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { settings } = useAISettings(userId);

  // Get current assistant info
  const currentAssistant = ASSISTANTS.find(a => a.id === selectedAssistant) || ASSISTANTS[0];
  const AssistantIcon = currentAssistant.icon;

  // Streaming chat hook
  const {
    messages,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useStreamingChat({
    assistantType: selectedAssistant,
    userId,
    onError: (err) => {
      toast({
        title: '❌ Lỗi',
        description: err,
        variant: 'destructive',
      });
    },
  });

  // Conversation memory hook
  const {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    addMessage,
    deleteConversation,
    clearCurrentConversation,
  } = useConversationMemory({
    userId,
    assistantType: selectedAssistant,
    maxMessages: 20,
  });

  // Voice input handler
  const handleVoiceTranscript = useCallback((text: string) => {
    setInputValue(prev => prev + (prev ? ' ' : '') + text);
    textareaRef.current?.focus();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || isStreaming) return;

    setInputValue('');
    
    // Save to memory
    addMessage('user', message);
    
    // Send with streaming
    await sendMessage(message);
  }, [inputValue, isStreaming, addMessage, sendMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle assistant change
  const handleAssistantChange = useCallback((assistantId: AssistantType) => {
    setSelectedAssistant(assistantId);
    clearMessages();
  }, [clearMessages]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    createConversation();
    clearMessages();
    setInputValue('');
  }, [createConversation, clearMessages]);

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          {/* Assistant selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                  currentAssistant.gradient
                )}>
                  <AssistantIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">{currentAssistant.name}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {ASSISTANTS.map(assistant => {
                const Icon = assistant.icon;
                return (
                  <DropdownMenuItem
                    key={assistant.id}
                    onClick={() => handleAssistantChange(assistant.id)}
                    className="gap-3 py-3"
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                      assistant.gradient
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{assistant.name}</p>
                      <p className="text-xs text-muted-foreground">{assistant.description}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* History button */}
          <Sheet open={showHistory} onOpenChange={setShowHistory}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <History className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Lịch sử hội thoại</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Chưa có hội thoại nào
                    </p>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.id}
                        className={cn(
                          'p-3 rounded-lg cursor-pointer transition-colors',
                          'hover:bg-muted/50',
                          currentConversation?.id === conv.id && 'bg-muted'
                        )}
                        onClick={() => {
                          selectConversation(conv.id);
                          setShowHistory(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate flex-1">
                            {conv.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {conv.messages.length} tin nhắn • {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* New chat button */}
          <Button variant="outline" size="sm" onClick={handleNewChat}>
            <Plus className="h-4 w-4 mr-1" />
            Chat mới
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br mb-4',
              currentAssistant.gradient
            )}>
              <AssistantIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Xin chào! Tôi là {currentAssistant.name}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {currentAssistant.description}. Hãy hỏi tôi bất cứ điều gì!
            </p>
            
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 mt-6 max-w-lg justify-center">
              {getQuickPrompts(selectedAssistant).map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInputValue(prompt);
                    textareaRef.current?.focus();
                  }}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map(message => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={message.isStreaming}
                assistantType={selectedAssistant}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Nhắn tin cho ${currentAssistant.name}...`}
                className="min-h-[52px] max-h-[200px] pr-24 resize-none"
                disabled={isStreaming}
              />
              
              {/* Action buttons inside textarea */}
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                {/* Voice input */}
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  language="vi-VN"
                  disabled={isStreaming}
                />
                
                {/* Send/Stop button */}
                {isStreaming ? (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={stopStreaming}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className={cn(
                      'h-8 w-8 transition-all',
                      inputValue.trim() 
                        ? 'bg-gradient-to-br ' + currentAssistant.gradient 
                        : ''
                    )}
                    disabled={!inputValue.trim() || isLoading}
                    onClick={handleSend}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer info */}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {isStreaming ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Đang trả lời...
                </span>
              ) : (
                'Enter để gửi, Shift+Enter để xuống dòng'
              )}
            </span>
            <span className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              Voice Input hỗ trợ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick prompts for each assistant type
function getQuickPrompts(type: AssistantType): string[] {
  const prompts: Record<AssistantType, string[]> = {
    course: [
      'Tạo outline khóa học AI cho người mới',
      'Ý tưởng bài giảng về Machine Learning',
      'Cách làm video tutorial hiệu quả',
    ],
    financial: [
      'Lập ngân sách tháng cho sinh viên',
      'Chiến lược tiết kiệm 6 tháng',
      'Đầu tư cổ phiếu cho người mới',
    ],
    research: [
      'Tổng quan về AI trong y tế',
      'So sánh các framework AI phổ biến',
      'Xu hướng công nghệ 2025',
    ],
    news: [
      'Tin tức AI mới nhất hôm nay',
      'Cập nhật thị trường chứng khoán',
      'Sự kiện tech đáng chú ý',
    ],
    career: [
      'Cách viết CV cho vị trí AI Engineer',
      'Kỹ năng cần có để làm Data Scientist',
      'Chuẩn bị phỏng vấn tech',
    ],
    daily: [
      'Lập kế hoạch ngày hiệu quả',
      'Sắp xếp task theo độ ưu tiên',
      'Cân bằng công việc và cuộc sống',
    ],
  };
  return prompts[type] || prompts.research;
}

export default EnhancedChat;
