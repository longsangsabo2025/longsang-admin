/**
 * 🤖 Agent Chat Dialog — Chat with any AI agent via agent-runner Edge Function
 * Opens when clicking "Run" on an agent card in AgentRegistry.
 *
 * @version 1.0.0
 */

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Bot, User, Clock, Cpu, Zap } from 'lucide-react';
import { useExecuteAgentRunner } from '@/hooks/use-agent-company';
import type { RegistryAgent } from '@/services/agent-company.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  execution_time_ms?: number;
}

interface AgentChatDialogProps {
  agent: RegistryAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Suggested prompts per department ────────────────────────────────────────

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  'marketing-seo-specialist': [
    'Audit the SEO of my landing page: https://longsang.com',
    'Research keywords for "AI tools for small business"',
    'Create a meta description for our pricing page',
  ],
  'marketing-copywriter': [
    'Write a compelling headline for our AI marketplace launch',
    'Create 3 LinkedIn post variations about AI automation',
    'Rewrite this boring CTA: "Submit your information"',
  ],
  'marketing-email-wizard': [
    'Design a 5-email welcome series for new SaaS trial users',
    'Write a cart abandonment email sequence',
    'Create a re-engagement email for inactive users (30+ days)',
  ],
  'marketing-lead-qualifier': [
    'Design a lead scoring model for a B2B SaaS selling to SMBs',
    'Score this lead: CEO, 50-person company, visited pricing 3x, downloaded whitepaper',
    'Create qualification criteria for our AI marketplace leads',
  ],
  'marketing-cro-optimizer': [
    'Audit this landing page copy for conversion optimization',
    'Suggest A/B tests for our pricing page',
    'Review our signup flow for friction points',
  ],
  'marketing-brand-guardian': [
    'Review this copy for brand voice consistency: "Leverage our synergistic platform..."',
    'Create brand voice guidelines for social media',
    'Check if this email matches our conversational tone',
  ],
  'marketing-persona-builder': [
    'Build a persona for SaaS founders looking for AI automation tools',
    'Create a customer persona for Vietnamese real estate buyers',
    'Design personas for an AI education platform targeting GenZ',
  ],
  'marketing-growth-hacker': [
    'Create a content distribution plan for our blog launch',
    'Design a lead magnet strategy for AI marketplace',
    'Plan a TOFU content calendar for Q3',
  ],
  'sales-blog-writer': [
    'Write a blog post: "How AI Agents Will Replace 80% of Repetitive Tasks in 2026"',
    'Create a comparison article: AI marketplace vs building custom agents',
    'Write a case study template for our AI automation platform',
  ],
  'sales-email-followup': [
    'Write a follow-up email after a demo call where they said "we need to think about it"',
    'Create a 3-email follow-up sequence after a trade show meeting',
    'Write a personalized re-engagement email referencing their AI automation needs',
  ],
  'sales-social-manager': [
    'Create posts for all 5 platforms announcing our AI marketplace launch',
    'Write a Twitter thread about the future of AI agents',
    'Create Instagram captions for behind-the-scenes AI development content',
  ],
  'sales-data-analyzer': [
    'Analyze this monthly report: 1200 visitors, 45 signups, 8 paid, $3200 MRR',
    'What metrics should I track for an AI marketplace launch?',
    'Compare Q1 vs Q2: signups up 30%, revenue flat, churn up 5%',
  ],
  'ent-lyblack': [
    'Viết một bài thơ về việc họp online lúc 8h sáng thứ 2',
    'React kiểu tiên nhân về trend "quiet quitting"',
    'Cho một lời khuyên về chuyện deadline dồn cuối tháng',
  ],
};

const DEFAULT_PROMPTS = [
  'Hello! What can you help me with?',
  'Explain your capabilities',
  'Give me a quick demo of your skills',
];

export function AgentChatDialog({ agent, open, onOpenChange }: AgentChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const executeAgent = useExecuteAgentRunner();

  // Reset chat when agent changes
  useEffect(() => {
    if (agent && open) {
      setMessages([]);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [agent?.codename, open]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !agent || executeAgent.isPending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Build context from previous messages (last 6 exchanges)
    const recentHistory = messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    try {
      const result = await executeAgent.mutateAsync({
        codename: agent.codename,
        message: userMessage.content,
        context: recentHistory || undefined,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        model: result.model,
        execution_time_ms: result.execution_time_ms,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = agent ? (SUGGESTED_PROMPTS[agent.codename] || DEFAULT_PROMPTS) : DEFAULT_PROMPTS;

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/50 text-lg">
              {agent.emoji || '🤖'}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base">{agent.name}</DialogTitle>
              <DialogDescription className="text-xs line-clamp-1">
                {agent.description || agent.codename} • {agent.model}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              <Cpu className="mr-1 h-3 w-3" />
              {agent.model}
            </Badge>
          </div>
        </DialogHeader>

        {/* Messages area */}
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                  {agent.emoji || '🤖'}
                </div>
                <div>
                  <p className="text-sm font-medium">Chat with {agent.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Powered by {agent.model} • Each message costs ~{agent.model?.includes('gpt-4o') ? '$0.01' : '$0.001'}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {suggestions.map((s, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="h-auto py-1.5 px-3 text-xs text-left whitespace-normal max-w-[250px]"
                      onClick={() => {
                        setInput(s);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm">
                    {agent.emoji || <Bot className="h-4 w-4" />}
                  </div>
                )}
                <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 border border-border/50'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.role === 'assistant' && (msg.model || msg.execution_time_ms) && (
                    <div className="flex gap-3 mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
                      {msg.model && (
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />{msg.model}
                        </span>
                      )}
                      {msg.execution_time_ms && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{(msg.execution_time_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-sm">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {executeAgent.isPending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm">
                  {agent.emoji || <Bot className="h-4 w-4" />}
                </div>
                <div className="bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{agent.name} is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border/50 px-6 py-4 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}...`}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              rows={1}
              disabled={executeAgent.isPending}
            />
            <Button
              size="sm"
              className="h-10 w-10 shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || executeAgent.isPending}
            >
              {executeAgent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Enter to send • Shift+Enter for new line • Conversation context is preserved</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AgentChatDialog;
