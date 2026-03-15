/**
 * 🧠 IntelligentChat - Copilot-Level AI Chat
 *
 * Ultimate chat component with:
 * - Intelligent Memory Management (like GitHub Copilot)
 * - Token counting & budget visualization
 * - Auto-summarization when context gets long
 * - Voice input support
 * - Streaming responses with Markdown
 * - Code syntax highlighting
 */

import {
  AlertCircle,
  BarChart3,
  Brain,
  Check,
  ChevronDown,
  Clock,
  Copy,
  History,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AssistantType } from '@/hooks/useAssistant';
import useIntelligentMemory from '@/hooks/useIntelligentMemory';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';
import { AI_MODELS, ModelSelector } from './ModelSelector';
import { DEFAULT_SETTINGS, PromptConfig, PromptSettings } from './PromptConfig';

// =============================================================================
// TYPES
// =============================================================================

interface IntelligentChatProps {
  assistantType?: AssistantType;
  userId?: string;
  placeholder?: string;
  className?: string;
  showHeader?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

// =============================================================================
// ASSISTANT CONFIGS
// =============================================================================

const ASSISTANT_CONFIGS: Record<
  AssistantType,
  {
    name: string;
    icon: string;
    color: string;
    gradient: string;
    description: string;
  }
> = {
  research: {
    name: 'Nghiên cứu',
    icon: '🔬',
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    description: 'Nghiên cứu chuyên sâu & phân tích',
  },
  course: {
    name: 'Khóa học',
    icon: '📚',
    color: 'text-green-500',
    gradient: 'from-green-500/20 to-emerald-500/20',
    description: 'Phát triển khóa học & nội dung',
  },
  financial: {
    name: 'Tài chính',
    icon: '💰',
    color: 'text-yellow-500',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    description: 'Phân tích tài chính & đầu tư',
  },
  news: {
    name: 'Tin tức',
    icon: '📰',
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-violet-500/20',
    description: 'Tổng hợp tin tức & xu hướng',
  },
  career: {
    name: 'Sự nghiệp',
    icon: '🚀',
    color: 'text-orange-500',
    gradient: 'from-orange-500/20 to-red-500/20',
    description: 'Phát triển sự nghiệp & CV',
  },
  daily: {
    name: 'Hàng ngày',
    icon: '📅',
    color: 'text-pink-500',
    gradient: 'from-pink-500/20 to-rose-500/20',
    description: 'Lập kế hoạch & năng suất',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function IntelligentChat({
  assistantType = 'research',
  userId = 'default-user',
  placeholder = 'Hỏi bất cứ điều gì... (Shift+Enter để xuống dòng)',
  className,
  showHeader = true,
}: IntelligentChatProps) {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantType>(assistantType);

  // Model & Prompt Config State
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [promptSettings, setPromptSettings] = useState<PromptSettings>(DEFAULT_SETTINGS);

  // Intelligent Memory Hook
  const memory = useIntelligentMemory({
    userId,
    assistantType: selectedAssistant,
  });

  // Voice Input Hook
  const voice = useVoiceInput({
    onResult: (text) => {
      setInput((prev) => (prev + ' ' + text).trim());
    },
    continuous: true,
    language: 'vi-VN',
  });

  // Sync memory messages to display
  useEffect(() => {
    if (memory.messages.length > 0) {
      setDisplayMessages(
        memory.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.timestamp,
        }))
      );
    } else {
      setDisplayMessages([]);
    }
  }, [memory.messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, [selectedAssistant]);

  // Get current stats
  const stats = memory.getStats();
  const config = ASSISTANT_CONFIGS[selectedAssistant];

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const message = input.trim();
      if (!message || isLoading) return;

      setIsLoading(true);
      setInput('');

      // Add user message to memory & display
      const userMsg = memory.addMessage('user', message);
      const userDisplay: ChatMessage = {
        id: userMsg.id,
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };
      setDisplayMessages((prev) => [...prev, userDisplay]);

      // Create streaming placeholder for assistant
      const assistantId = `msg_${Date.now()}_assistant`;
      const assistantDisplay: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      setDisplayMessages((prev) => [...prev, assistantDisplay]);

      try {
        // Get optimized context from memory
        const apiMessages = memory.getAPIMessages(
          promptSettings.systemPrompt || config.description
        );

        // Get current model config
        const modelConfig = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

        // Call API with streaming and model/prompt config
        const response = await fetch(`/api/assistants/${selectedAssistant}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            userId,
            conversationHistory: apiMessages,
            stream: promptSettings.enableStreaming,
            // Model & Prompt Config
            model: selectedModel,
            modelProvider: modelConfig.provider,
            temperature: promptSettings.temperature,
            maxTokens: promptSettings.maxTokens,
            topP: promptSettings.topP,
            presencePenalty: promptSettings.presencePenalty,
            frequencyPenalty: promptSettings.frequencyPenalty,
            systemPrompt: promptSettings.systemPrompt,
            responseFormat: promptSettings.responseFormat,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;

                    // Update display in real-time
                    setDisplayMessages((prev) =>
                      prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
                    );
                  }
                } catch {
                  // Ignore parse errors for non-JSON lines
                }
              }
            }
          }
        }

        // Save assistant response to memory
        if (fullContent) {
          memory.addMessage('assistant', fullContent);
        }

        // Mark streaming as complete
        setDisplayMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );
      } catch (error: any) {
        console.error('[IntelligentChat] Error:', error);

        // Show error in chat
        setDisplayMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `❌ Lỗi: ${error.message}`, isStreaming: false }
              : m
          )
        );

        toast({
          title: 'Lỗi kết nối',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, memory, selectedAssistant, userId, config.description, toast]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({ title: 'Đã copy!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    memory.startNewConversation();
    setDisplayMessages([]);
    toast({
      title: '💬 Bắt đầu cuộc trò chuyện mới',
      description: 'Cuộc trò chuyện cũ đã được lưu',
    });
  };

  const handleSummarize = async () => {
    const request = memory.triggerSummarization();
    if (!request) {
      toast({
        title: 'Không cần tóm tắt',
        description: 'Cuộc trò chuyện chưa đủ dài (cần > 30 tin nhắn)',
      });
      return;
    }

    toast({ title: 'Đang tóm tắt...', description: 'Vui lòng đợi' });

    try {
      const response = await fetch('/api/memory/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: memory.messages.slice(0, -20),
        }),
      });

      const data = await response.json();
      if (data.success) {
        memory.applySummary(data.summary);
        toast({
          title: '✨ Đã tóm tắt thành công',
          description: `Tiết kiệm ${Math.round(((memory.messages.length - 20) / memory.messages.length) * 100)}% tokens`,
        });
      }
    } catch (error: any) {
      console.error('[IntelligentChat] Summarization error:', error);
      toast({
        title: 'Lỗi tóm tắt',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Card className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header */}
      {showHeader && (
        <CardHeader className="pb-3 border-b bg-gradient-to-r ${config.gradient}">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Assistant Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-white/50">
                    <span className="text-2xl">{config.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">{config.name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {stats.messageCount} tin nhắn
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {Object.entries(ASSISTANT_CONFIGS).map(([key, value]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setSelectedAssistant(key as AssistantType)}
                      className="gap-3"
                    >
                      <span className="text-xl">{value.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{value.name}</div>
                        <div className="text-xs text-muted-foreground">{value.description}</div>
                      </div>
                      {key === selectedAssistant && <Check className="h-4 w-4 text-green-500" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Memory Badge */}
              {stats.hasSummary && (
                <Badge variant="secondary" className="gap-1">
                  <Brain className="h-3 w-3" />
                  <span className="hidden sm:inline">Memory Active</span>
                </Badge>
              )}

              {/* Model Selector - Compact */}
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                compact
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Prompt Config */}
              <PromptConfig
                settings={promptSettings}
                onSettingsChange={setPromptSettings}
                compact
              />

              {/* Token Stats Toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowStats(!showStats)}
                      className={cn(
                        'h-8 w-8',
                        memory.isNearLimit && 'text-yellow-500',
                        showStats && 'bg-muted'
                      )}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Token: {stats.percentUsed}% đã dùng</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Summarize Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSummarize}
                      disabled={stats.messageCount < 30}
                      className="h-8 w-8"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Tóm tắt để tiết kiệm tokens</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* New Chat Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearChat}
                      className="h-8 w-8 hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chat mới</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Conversation History */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <History className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-auto">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    Lịch sử cuộc trò chuyện
                  </div>
                  {memory.conversations.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      Chưa có cuộc trò chuyện nào
                    </div>
                  ) : (
                    memory.conversations.map((conv) => (
                      <DropdownMenuItem
                        key={conv.id}
                        onClick={() => {
                          memory.switchConversation(conv.id);
                          setDisplayMessages(
                            conv.messages.map((m) => ({
                              id: m.id,
                              role: m.role as 'user' | 'assistant',
                              content: m.content,
                              timestamp: m.timestamp,
                            }))
                          );
                        }}
                        className="flex flex-col items-start gap-0.5"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="flex-1 truncate text-sm font-medium">{conv.title}</span>
                          {conv.id === memory.activeConversationId && (
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                          <span>·</span>
                          <MessageSquare className="h-3 w-3" />
                          {conv.messages.length}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delete Current Chat */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (memory.activeConversationId) {
                          memory.deleteConversation(memory.activeConversationId);
                          setDisplayMessages([]);
                          toast({
                            title: 'Đã xóa cuộc trò chuyện',
                            description: 'Bộ nhớ đã được làm mới',
                          });
                        }
                      }}
                      className="h-8 w-8 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Xóa cuộc trò chuyện</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Token Stats Bar */}
          {showStats && (
            <div className="mt-3 p-3 bg-background/80 backdrop-blur rounded-lg border">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Token Budget
                </span>
                <span className="font-mono text-xs">
                  {stats.totalTokens.toLocaleString()} / 128,000
                </span>
              </div>
              <Progress
                value={stats.percentUsed}
                className={cn(
                  'h-2',
                  stats.percentUsed > 80 && '[&>div]:bg-yellow-500',
                  stats.percentUsed > 95 && '[&>div]:bg-red-500'
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {stats.messageCount} tin nhắn
                </span>
                <span>{stats.availableTokens.toLocaleString()} còn lại</span>
              </div>
            </div>
          )}
        </CardHeader>
      )}

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea ref={scrollRef} className="h-full">
          <div className="p-4">
            {displayMessages.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div
                  className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center mb-4',
                    'bg-gradient-to-br',
                    config.gradient
                  )}
                >
                  <span className="text-4xl">{config.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{config.name} Assistant</h3>
                <p className="text-muted-foreground max-w-md mb-4">{config.description}</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {['Phân tích dữ liệu', 'Tạo báo cáo', 'Giải thích khái niệm'].map((prompt) => (
                    <Badge
                      key={prompt}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              // Messages List
              <div className="space-y-4">
                {displayMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                          >
                            {message.content || (message.isStreaming ? '●●●' : '')}
                          </ReactMarkdown>

                          {/* Streaming cursor */}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1 rounded" />
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      {/* Copy button */}
                      {message.role === 'assistant' && !message.isStreaming && message.content && (
                        <div className="flex justify-end mt-2 -mb-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopy(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[56px] max-h-[200px] resize-none pr-12 rounded-xl"
              disabled={isLoading}
            />

            {/* Voice Input */}
            {voice.isSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8',
                  voice.isListening && 'text-red-500 animate-pulse bg-red-50'
                )}
                onClick={() => (voice.isListening ? voice.stop() : voice.start())}
              >
                {voice.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-14 w-14 rounded-xl shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>

        {/* Voice transcript preview */}
        {voice.interimTranscript && (
          <p className="text-xs text-muted-foreground mt-2 italic px-1">
            🎤 {voice.interimTranscript}
          </p>
        )}

        {/* Near limit warning */}
        {memory.isNearLimit && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Gần hết token budget. Nhấn ✨ để tóm tắt và tiếp tục.</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default IntelligentChat;
