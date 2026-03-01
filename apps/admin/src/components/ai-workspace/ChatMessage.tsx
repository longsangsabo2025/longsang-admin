/**
 * ChatMessage Component
 * ChatGPT-style message với Markdown rendering, code highlighting, copy button
 */

import { cn } from '@/lib/utils';
import { Check, Copy, RefreshCw, User, Bot, Sparkles, Zap, Clock, DollarSign } from 'lucide-react';
import { useState, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import 'highlight.js/styles/github-dark.css';
import type { TokenUsage } from '@/hooks/useAssistant';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  assistantName?: string;
  assistantColor?: string;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
  usage?: TokenUsage;
}

// Memoized code block with copy button
const CodeBlock = memo(({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = useCallback(async () => {
    const code = String(children).replace(/\n$/, '');
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  if (!className) {
    // Inline code
    return (
      <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      {/* Language badge & copy button */}
      <div className="flex items-center justify-between bg-zinc-800 text-zinc-400 text-xs px-4 py-2 rounded-t-lg">
        <span>{language || 'code'}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 hover:bg-zinc-700"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="!mt-0 !rounded-t-none overflow-x-auto">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  isStreaming,
  assistantName = 'AI',
  assistantColor = 'text-primary',
  onRegenerate,
  showRegenerate,
  usage,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const isUser = role === 'user';

  return (
    <div
      className={cn('group relative py-6 px-4 md:px-8', isUser ? 'bg-background' : 'bg-muted/30')}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
            isUser ? 'bg-primary' : 'bg-gradient-to-br from-green-400 to-blue-500'
          )}
        >
          {isUser ? (
            <User className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Role label */}
          <div className="font-semibold mb-1 text-sm">{isUser ? 'Bạn' : assistantName}</div>

          {/* Message content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: CodeBlock,
                  // Better link handling
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  // Better list styling
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1">{children}</ol>
                  ),
                  // Better paragraph spacing
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                }}
              >
                {content}
              </ReactMarkdown>
            ) : isStreaming ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </span>
              </div>
            ) : null}

            {/* Streaming cursor */}
            {isStreaming && content && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
            )}
          </div>

          {/* Action buttons for assistant messages */}
          {!isUser && content && !isStreaming && (
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleCopyMessage}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              {showRegenerate && onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              )}

              {/* Token Usage Display */}
              {usage && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {usage.totalTokens.toLocaleString()} tokens
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {(usage.responseTime / 1000).toFixed(1)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${usage.cost.toFixed(5)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-1">
                      <div>Input: {usage.inputTokens.toLocaleString()} tokens</div>
                      <div>Output: {usage.outputTokens.toLocaleString()} tokens</div>
                      <div>Total: {usage.totalTokens.toLocaleString()} tokens</div>
                      <div>Time: {(usage.responseTime / 1000).toFixed(2)}s</div>
                      <div>Cost: ${usage.cost.toFixed(6)}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
