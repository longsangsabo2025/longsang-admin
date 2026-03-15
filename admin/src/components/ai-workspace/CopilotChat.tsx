/**
 * CopilotChat Component
 * Chat interface cho AI Workspace với 6 assistants
 */

import {
  BookOpen,
  Briefcase,
  Calendar,
  DollarSign,
  Loader2,
  Newspaper,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAISettings } from '@/hooks/useAISettings';
import { AssistantType, useAssistant } from '@/hooks/useAssistant';
import { cn } from '@/lib/utils';
import { QuickPrompts } from './QuickPrompts';

const ASSISTANTS = [
  {
    id: 'course' as AssistantType,
    name: 'Khóa học',
    icon: BookOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Phát triển khóa học, curriculum, bài giảng',
  },
  {
    id: 'financial' as AssistantType,
    name: 'Tài chính',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Tài chính cá nhân, ngân sách, phân tích chi tiêu',
  },
  {
    id: 'research' as AssistantType,
    name: 'Nghiên cứu',
    icon: Search,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Nghiên cứu, tìm kiếm thông tin, tổng hợp',
  },
  {
    id: 'news' as AssistantType,
    name: 'Tin tức',
    icon: Newspaper,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Tin tức, xu hướng, cập nhật ngành',
  },
  {
    id: 'career' as AssistantType,
    name: 'Sự nghiệp',
    icon: Briefcase,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    description: 'Phát triển sự nghiệp, skills, networking',
  },
  {
    id: 'daily' as AssistantType,
    name: 'Kế hoạch',
    icon: Calendar,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    description: 'Lập kế hoạch ngày, task management, calendar',
  },
] as const;

interface CopilotChatProps {
  userId?: string;
  conversationId?: string;
  defaultAssistant?: AssistantType;
  className?: string;
  onConversationCreated?: (conversationId: string) => void;
}

export function CopilotChat({
  userId,
  conversationId,
  defaultAssistant = 'research',
  className,
  onConversationCreated,
}: CopilotChatProps) {
  const [activeAssistant, setActiveAssistant] = useState<AssistantType>(defaultAssistant);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { settings } = useAISettings();
  const {
    messages,
    input,
    handleInputChange,
    submit,
    isLoading,
    isThinking,
    error,
    stop,
    clear,
    conversationId: currentConvId,
  } = useAssistant({
    assistantType: activeAssistant,
    userId,
    conversationId,
    settings,
    onError: (error) => {
      toast({
        title: '❌ Lỗi',
        description: error.message || 'Không thể kết nối với AI',
        variant: 'destructive',
      });
    },
    onConversationCreated: (newConvId) => {
      onConversationCreated?.(newConvId);
      toast({
        title: '💬 Cuộc trò chuyện mới',
        description: 'Đã lưu vào lịch sử',
      });
    },
  });

  // Clear conversation when assistant changes
  useEffect(() => {
    if (conversationId) {
      // Don't clear if we have a conversation loaded
      return;
    }
    // Clear when switching assistants without conversation
    if (messages.length > 0 && !conversationId) {
      // Only clear if user explicitly switches assistant
    }
  }, [activeAssistant, conversationId, messages.length]);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const activeAssistantInfo = ASSISTANTS.find((a) => a.id === activeAssistant);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Assistant Selector */}
      <Card className="border-b rounded-b-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Workspace - {activeAssistantInfo?.name} Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {ASSISTANTS.map((assistant) => {
              const Icon = assistant.icon;
              const isActive = activeAssistant === assistant.id;
              return (
                <Button
                  key={assistant.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveAssistant(assistant.id);
                    clear();
                  }}
                  className={cn('flex items-center gap-2 shrink-0', isActive && assistant.bgColor)}
                >
                  <Icon className={cn('w-4 h-4', assistant.color)} />
                  {assistant.name}
                </Button>
              );
            })}
          </div>
          {activeAssistantInfo && (
            <p className="text-sm text-muted-foreground mt-2">{activeAssistantInfo.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Prompts */}
      <QuickPrompts
        assistantType={activeAssistant}
        onPromptSelect={(prompt) => {
          // Fill input with prompt
          handleInputChange(prompt);
          // Optionally auto-submit
          // submit(undefined, prompt);
        }}
      />

      {/* Messages */}
      <Card className="flex-1 rounded-t-none border-t-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Chào mừng đến với {activeAssistantInfo?.name} Assistant
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {activeAssistantInfo?.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Hãy đặt câu hỏi để bắt đầu cuộc trò chuyện
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && activeAssistantInfo && (
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          activeAssistantInfo.bgColor
                        )}
                      >
                        <activeAssistantInfo.icon
                          className={cn('w-4 h-4', activeAssistantInfo.color)}
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        'rounded-lg p-3 max-w-[80%]',
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      {message.content === '' && message.role === 'assistant' && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Đang suy nghĩ...</span>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold">Bạn</span>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isThinking && messages.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Đang suy nghĩ...</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">❌ {error.message || 'Đã xảy ra lỗi'}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-4">
          <form onSubmit={submit} className="space-y-2">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={`Hỏi ${activeAssistantInfo?.name} Assistant...`}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit(e);
                  }
                }}
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                {isLoading && (
                  <Button type="button" variant="outline" size="icon" onClick={stop}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Nhấn Enter để gửi, Shift+Enter để xuống dòng</span>
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="h-6 text-xs"
                >
                  Xóa lịch sử
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
