/**
 * ChatGPTChat Component
 * ChatGPT-style chat interface - Optimized Layout
 * Now with Smart Brain RAG integration
 */

import {
  ArrowUp,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  ChevronDown,
  Cpu,
  DollarSign,
  Loader2,
  Newspaper,
  Plus,
  Search,
  Settings,
  Sparkles,
  Square,
  Trash2,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAISettings } from '@/hooks/useAISettings';
import { AssistantType, useAssistant } from '@/hooks/useAssistant';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { SettingsPanel } from './SettingsPanel';

const ASSISTANTS = [
  {
    id: 'course' as AssistantType,
    name: 'Khóa học AI',
    icon: BookOpen,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-400',
    description: 'Phát triển khóa học, curriculum',
  },
  {
    id: 'financial' as AssistantType,
    name: 'Tài chính Pro',
    icon: DollarSign,
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-400',
    description: 'Tài chính, ngân sách, đầu tư',
  },
  {
    id: 'research' as AssistantType,
    name: 'Nghiên cứu',
    icon: Search,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-400',
    description: 'Research, tổng hợp thông tin',
  },
  {
    id: 'news' as AssistantType,
    name: 'Tin tức',
    icon: Newspaper,
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-400',
    description: 'Tin tức, xu hướng ngành',
  },
  {
    id: 'career' as AssistantType,
    name: 'Career',
    icon: Briefcase,
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-violet-400',
    description: 'Phát triển sự nghiệp',
  },
  {
    id: 'daily' as AssistantType,
    name: 'Planner',
    icon: Calendar,
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-400',
    description: 'Lập kế hoạch ngày',
  },
] as const;

// Quick prompts per assistant type
const QUICK_PROMPTS: Record<AssistantType, { text: string; icon: string }[]> = {
  course: [
    { text: 'Tạo outline khóa học về AI cơ bản', icon: '📚' },
    { text: 'Viết bài giảng về Machine Learning', icon: '🎓' },
    { text: 'Tạo quiz kiểm tra kiến thức', icon: '✍️' },
    { text: 'Gợi ý project thực hành', icon: '💻' },
  ],
  financial: [
    { text: 'Phân tích chi tiêu tháng này', icon: '📊' },
    { text: 'Lập kế hoạch tiết kiệm 6 tháng', icon: '💰' },
    { text: 'Tư vấn đầu tư cho người mới', icon: '📈' },
    { text: 'Tạo budget template', icon: '📋' },
  ],
  research: [
    { text: 'Tổng hợp xu hướng AI 2025', icon: '🔍' },
    { text: 'So sánh các framework JS', icon: '⚖️' },
    { text: 'Phân tích đối thủ cạnh tranh', icon: '🎯' },
    { text: 'Research về thị trường Việt Nam', icon: '🇻🇳' },
  ],
  news: [
    { text: 'Tin tức công nghệ hôm nay', icon: '📰' },
    { text: 'Cập nhật về AI/ML mới nhất', icon: '🤖' },
    { text: 'Xu hướng startup Việt Nam', icon: '🚀' },
    { text: 'Tin tức crypto thị trường', icon: '₿' },
  ],
  career: [
    { text: 'Review CV của tôi', icon: '📄' },
    { text: 'Chuẩn bị phỏng vấn kỹ thuật', icon: '🎤' },
    { text: 'Lộ trình trở thành Senior Dev', icon: '🛤️' },
    { text: 'Kỹ năng cần học năm 2025', icon: '📚' },
  ],
  daily: [
    { text: 'Lập kế hoạch ngày hôm nay', icon: '📅' },
    { text: 'Tổng hợp tasks cần làm', icon: '✅' },
    { text: 'Nhắc nhở deadline quan trọng', icon: '⏰' },
    { text: 'Review tuần vừa qua', icon: '📊' },
  ],
};

// Available AI Models
const AI_MODELS = [
  { id: 'auto', name: '🤖 Auto', description: 'Tự động chọn model phù hợp', provider: 'auto' },
  // OpenAI
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Nhanh, tiết kiệm', provider: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Thông minh, đa năng', provider: 'openai' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Mạnh mẽ', provider: 'openai' },
  // Anthropic
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude Haiku',
    description: 'Nhanh, giá rẻ',
    provider: 'anthropic',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Thông minh nhất',
    provider: 'anthropic',
  },
  // Google
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Siêu nhanh, miễn phí',
    provider: 'google',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Mạnh mẽ, 2M context',
    provider: 'google',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Nhanh, 1M context',
    provider: 'google',
  },
] as const;

type ModelId = (typeof AI_MODELS)[number]['id'];

interface ChatGPTChatProps {
  userId?: string;
  conversationId?: string;
  defaultAssistant?: AssistantType;
  className?: string;
  onConversationCreated?: (conversationId: string) => void;
  onAssistantChange?: (assistant: AssistantType) => void;
}

export function ChatGPTChat({
  userId,
  conversationId,
  defaultAssistant = 'research',
  className,
  onConversationCreated,
  onAssistantChange,
}: Readonly<ChatGPTChatProps>) {
  const [activeAssistant, setActiveAssistant] = useState<AssistantType>(defaultAssistant);
  const [selectedModel, setSelectedModel] = useState<ModelId>('auto');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [brainEnabled, setBrainEnabled] = useState(true); // Brain RAG toggle
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Sync activeAssistant with defaultAssistant prop
  useEffect(() => {
    setActiveAssistant(defaultAssistant);
  }, [defaultAssistant]);

  const { settings } = useAISettings();

  // Merge settings with brainEnabled and selectedModel
  const mergedSettings = useMemo(
    () => ({
      ...settings,
      brainEnabled: brainEnabled,
      model: selectedModel, // Override model from dropdown
    }),
    [settings, brainEnabled, selectedModel]
  );

  const {
    messages,
    input,
    handleInputChange,
    submit,
    isLoading,
    isThinking,
    error,
    stop,
    reload,
    clear,
  } = useAssistant({
    assistantType: activeAssistant,
    userId,
    conversationId,
    settings: mergedSettings,
    enableStreaming: true,
    onError: (err) => {
      toast({
        title: '❌ Lỗi',
        description: err.message || 'Không thể kết nối với AI',
        variant: 'destructive',
      });
    },
    onConversationCreated: (newConvId) => {
      onConversationCreated?.(newConvId);
    },
  });

  const activeAssistantInfo = useMemo(
    () => ASSISTANTS.find((a) => a.id === activeAssistant),
    [activeAssistant]
  );

  const quickPrompts = useMemo(
    () => QUICK_PROMPTS[activeAssistant] || QUICK_PROMPTS.research,
    [activeAssistant]
  );

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isThinking]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
    },
    [handleInputChange]
  );

  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      submit(e);
    },
    [submit, input, isLoading]
  );

  // Handle new chat
  const handleNewChat = useCallback(() => {
    clear();
  }, [clear]);

  // Handle quick prompt
  const handleQuickPrompt = useCallback(
    (prompt: string) => {
      handleInputChange(prompt);
      textareaRef.current?.focus();
    },
    [handleInputChange]
  );

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-9">
              {activeAssistantInfo && (
                <div
                  className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br',
                    activeAssistantInfo.gradient
                  )}
                >
                  <activeAssistantInfo.icon className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <span className="font-medium">{activeAssistantInfo?.name}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {ASSISTANTS.map((assistant) => {
              const Icon = assistant.icon;
              const isActive = activeAssistant === assistant.id;
              return (
                <DropdownMenuItem
                  key={assistant.id}
                  onClick={() => {
                    setActiveAssistant(assistant.id);
                    onAssistantChange?.(assistant.id);
                    clear();
                  }}
                  className={cn('gap-2 py-2', isActive && 'bg-accent')}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center bg-gradient-to-br',
                      assistant.gradient
                    )}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{assistant.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {assistant.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          {/* Brain RAG Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => setBrainEnabled(!brainEnabled)}
                  aria-label={`Brain Context: ${brainEnabled ? 'ON' : 'OFF'}`}
                >
                  <Brain
                    className={cn(
                      'h-4 w-4 transition-colors',
                      brainEnabled ? 'text-emerald-500' : 'text-muted-foreground'
                    )}
                  />
                  {brainEnabled && <Sparkles className="h-3 w-3 text-yellow-500" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Brain Context: {brainEnabled ? 'ON' : 'OFF'}</p>
                <p className="text-xs text-muted-foreground">
                  {brainEnabled
                    ? 'AI sẽ sử dụng kiến thức từ Brain khi liên quan'
                    : 'AI hoạt động bình thường'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Model Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs font-normal hidden sm:flex"
              >
                {selectedModel === 'auto' ? (
                  <>
                    <Zap className="w-3 h-3" />
                    Auto
                  </>
                ) : (
                  <>
                    <Cpu className="w-3 h-3" />
                    {AI_MODELS.find((m) => m.id === selectedModel)?.name || selectedModel}
                  </>
                )}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {AI_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={cn('gap-2 py-2', selectedModel === model.id && 'bg-accent')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {model.provider === 'openai' && <span className="text-green-500">●</span>}
                      {model.provider === 'anthropic' && <span className="text-orange-500">●</span>}
                      {model.provider === 'google' && <span className="text-blue-500">●</span>}
                      {model.provider === 'auto' && <Zap className="w-3 h-3 text-yellow-500" />}
                      <span className="font-medium text-sm">{model.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{model.description}</div>
                  </div>
                  {selectedModel === model.id && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleNewChat} className="h-8 gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleNewChat} className="h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mới</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="h-8 w-8 p-0"
            title="Cài đặt AI"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Messages Area - Flex grow with proper scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full py-8 px-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg',
                  activeAssistantInfo?.gradient || 'from-primary to-primary/60'
                )}
              >
                {activeAssistantInfo ? (
                  <activeAssistantInfo.icon className="w-7 h-7 text-white" />
                ) : (
                  <Sparkles className="w-7 h-7 text-white" />
                )}
              </div>
              <h2 className="text-xl font-semibold mb-1">{activeAssistantInfo?.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {activeAssistantInfo?.description}
              </p>

              {/* Brain Status Indicator */}
              {brainEnabled && (
                <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Brain className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    🧠 Brain Context: <strong>ACTIVE</strong> - Có thể hỏi về SABO Arena, Dream
                    Homes, AI Secretary...
                  </span>
                </div>
              )}

              {/* Quick Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {quickPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2.5 px-3 justify-start text-left"
                    onClick={() => handleQuickPrompt(prompt.text)}
                  >
                    <span className="mr-2 text-base">{prompt.icon}</span>
                    <span className="text-xs leading-tight">{prompt.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="divide-y">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isStreaming={message.isStreaming}
                  assistantName={activeAssistantInfo?.name}
                  assistantColor={activeAssistantInfo?.color}
                  onRegenerate={reload}
                  showRegenerate={
                    message.role === 'assistant' && index === messages.length - 1 && !isLoading
                  }
                  usage={message.usage}
                />
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <div className="py-4 px-4 md:px-6 bg-muted/30">
                  <div className="max-w-3xl mx-auto flex gap-3">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center bg-gradient-to-br shrink-0',
                        activeAssistantInfo?.gradient || 'from-primary to-primary/60'
                      )}
                    >
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      Đang suy nghĩ...
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="py-4 px-4 md:px-6">
                  <div className="max-w-3xl mx-auto">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                      ❌ {error.message || 'Đã xảy ra lỗi'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="shrink-0 border-t bg-background p-3">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-muted/50 rounded-xl border p-1.5">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              placeholder={`Nhắn tin cho ${activeAssistantInfo?.name || 'AI'}...`}
              className={cn(
                'min-h-[40px] max-h-[150px] resize-none border-0 bg-transparent',
                'px-3 py-2 text-sm',
                'focus-visible:ring-0 focus-visible:ring-offset-0'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
              rows={1}
            />

            {/* Submit/Stop Button */}
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="default"
                className="h-8 w-8 rounded-lg shrink-0"
                onClick={stop}
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className={cn(
                  'h-8 w-8 rounded-lg shrink-0 transition-all',
                  input.trim() ? 'bg-primary hover:bg-primary/90' : 'bg-muted'
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-1.5">
            Enter để gửi • Shift+Enter xuống dòng
          </p>
        </form>
      </div>
    </div>
  );
}
