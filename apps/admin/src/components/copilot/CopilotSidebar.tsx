/**
 * 🤖 Copilot Sidebar Component
 *
 * Main sidebar for AI Copilot with chat, suggestions, and command input
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Bot, MessageSquare, Sparkles, X, Loader2, Send, Lightbulb, History } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCopilot } from './useCopilot';
import { SuggestionCard } from './SuggestionCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface CopilotSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  projectId?: string | null;
}

export function CopilotSidebar({
  open: controlledOpen,
  onOpenChange,
  projectId,
}: CopilotSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'suggestions'>('chat');

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  const {
    messages,
    suggestions,
    loading,
    streaming,
    sendMessage,
    loadSuggestions,
    executeSuggestion,
    dismissSuggestion,
  } = useCopilot({ projectId });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadSuggestions();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <Bot className="h-6 w-6" />
          <span className="sr-only">Open Copilot</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <SheetTitle>AI Copilot</SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>Hỗ trợ bạn với AI-powered suggestions và commands</SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'chat' | 'suggestions')}
          className="flex-1 flex flex-col"
        >
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggestions
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0 mt-4">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 pb-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Chào mừng đến với AI Copilot</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Hỏi bất kỳ câu hỏi nào hoặc yêu cầu AI giúp bạn với công việc
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card
                      className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            {message.streaming && <Loader2 className="h-3 w-3 animate-spin mt-2" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Đang suy nghĩ...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator />

            <div className="p-6">
              <CommandComposer
                onSend={sendMessage}
                disabled={loading || streaming}
                projectId={projectId}
              />
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="flex-1 m-0 mt-4">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 pb-4">
                {suggestions.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Chưa có suggestions</h3>
                    <p className="text-sm text-muted-foreground">
                      AI sẽ tạo suggestions dựa trên context của bạn
                    </p>
                  </div>
                )}

                {suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onExecute={() => executeSuggestion(suggestion.id)}
                    onDismiss={() => dismissSuggestion(suggestion.id)}
                  />
                ))}

                {loading && suggestions.length === 0 && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator />

            <div className="p-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={loadSuggestions}
                disabled={loading}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Refresh Suggestions
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

interface CommandComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  projectId?: string | null;
}

function CommandComposer({ onSend, disabled, projectId }: CommandComposerProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập message hoặc command..."
          disabled={disabled}
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="h-auto"
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Nhấn Enter để gửi, Shift+Enter để xuống dòng</p>
    </div>
  );
}
