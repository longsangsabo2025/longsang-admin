/**
 * AI Chat Panel Component
 * Real-time chat interface with AI Agents
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  Send,
  Loader2,
  Copy,
  RefreshCw,
  Trash2,
  Sparkles,
  DollarSign,
  MessageSquare,
  Code2,
  FileText,
  TrendingUp,
  Mail,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentChat, useStreamingChat, type ChatMessage } from '@/hooks/use-ai-chat';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Agent display config
const AGENT_CONFIG: Record<string, { 
  name: string; 
  icon: React.ReactNode; 
  color: string;
  description: string;
}> = {
  dev: {
    name: 'Dev Agent',
    icon: <Code2 className="h-4 w-4" />,
    color: 'text-blue-500',
    description: 'Code, debug, review PRs',
  },
  content: {
    name: 'Content Agent',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-purple-500',
    description: 'Write blogs, social, emails',
  },
  marketing: {
    name: 'Marketing Agent',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-green-500',
    description: 'Campaigns, analytics, SEO',
  },
  sales: {
    name: 'Sales Agent',
    icon: <Mail className="h-4 w-4" />,
    color: 'text-orange-500',
    description: 'Outreach, follow-ups, leads',
  },
  admin: {
    name: 'Admin Agent',
    icon: <Brain className="h-4 w-4" />,
    color: 'text-gray-500',
    description: 'Scheduling, emails, tasks',
  },
  advisor: {
    name: 'Advisor Agent',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'text-cyan-500',
    description: 'Strategy, decisions, analysis',
  },
};

interface AIChatPanelProps {
  agentRole?: string;
  height?: string;
  showStats?: boolean;
  onMessageSent?: (message: string) => void;
}

export function AIChatPanel({
  agentRole = 'advisor',
  height = 'h-[500px]',
  showStats = true,
  onMessageSent,
}: AIChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    isLoading,
    error,
    usage,
    sendMessage,
    clearChat,
    regenerateLastResponse,
  } = useAgentChat({
    agentRole,
    includeMemories: true,
  });
  
  const agentConfig = AGENT_CONFIG[agentRole] || AGENT_CONFIG.advisor;
  
  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    
    onMessageSent?.(message);
    await sendMessage(message);
    
    inputRef.current?.focus();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full bg-muted", agentConfig.color)}>
              {agentConfig.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{agentConfig.name}</CardTitle>
              <CardDescription className="text-xs">
                {agentConfig.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showStats && usage.totalTokens > 0 && (
              <Badge variant="secondary" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                ${usage.totalCost.toFixed(4)}
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn("flex-1 flex flex-col p-0", height)}>
        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Start a conversation</p>
                <p className="text-sm">Ask {agentConfig.name} anything</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {agentRole === 'dev' && (
                    <>
                      <SuggestedPrompt onClick={setInputValue} text="Review this code" />
                      <SuggestedPrompt onClick={setInputValue} text="Debug this error" />
                    </>
                  )}
                  {agentRole === 'content' && (
                    <>
                      <SuggestedPrompt onClick={setInputValue} text="Write a blog outline" />
                      <SuggestedPrompt onClick={setInputValue} text="Create social post" />
                    </>
                  )}
                  {agentRole === 'marketing' && (
                    <>
                      <SuggestedPrompt onClick={setInputValue} text="Analyze my metrics" />
                      <SuggestedPrompt onClick={setInputValue} text="Campaign ideas" />
                    </>
                  )}
                  {agentRole === 'advisor' && (
                    <>
                      <SuggestedPrompt onClick={setInputValue} text="Help me decide" />
                      <SuggestedPrompt onClick={setInputValue} text="Strategy advice" />
                    </>
                  )}
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                agentConfig={agentConfig}
                onCopy={() => copyToClipboard(message.content)}
              />
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-full bg-muted", agentConfig.color)}>
                  {agentConfig.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                Error: {error}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              placeholder={`Message ${agentConfig.name}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleSend} 
                disabled={!inputValue.trim() || isLoading}
                className="h-[60px]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={regenerateLastResponse}
                  disabled={isLoading}
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  agentConfig,
  onCopy,
}: {
  message: ChatMessage;
  agentConfig: typeof AGENT_CONFIG[string];
  onCopy: () => void;
}) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "p-2 rounded-full h-fit",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? (
          <MessageSquare className="h-4 w-4" />
        ) : (
          <span className={agentConfig.color}>{agentConfig.icon}</span>
        )}
      </div>
      
      <div className={cn(
        "flex-1 max-w-[85%] group",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-lg p-3",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
        
        {!isUser && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            onClick={onCopy}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
        )}
      </div>
    </div>
  );
}

// Markdown renderer with syntax highlighting
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-md text-sm"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={cn("bg-muted px-1 py-0.5 rounded", className)} {...props}>
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-4 mb-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-4 mb-2">{children}</ol>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Suggested Prompt Button
function SuggestedPrompt({ 
  text, 
  onClick 
}: { 
  text: string; 
  onClick: (text: string) => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-xs"
      onClick={() => onClick(text)}
    >
      {text}
    </Button>
  );
}

export default AIChatPanel;
