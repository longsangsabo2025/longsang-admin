/**
 * Agent Orchestrator
 * Central hub for managing all AI Agents
 * Coordinates tasks, monitors status, handles communication between agents
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Zap,
  FileText,
  TrendingUp,
  Mail,
  BarChart3,
  Code2,
  Palette,
  Shield,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Agent Types
export type AgentType =
  | 'dev'
  | 'content'
  | 'marketing'
  | 'sales'
  | 'analytics'
  | 'design'
  | 'security'
  | 'advisor';

export interface Agent {
  id: AgentType;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'idle' | 'paused' | 'error';
  enabled: boolean;
  capabilities: string[];
  currentTask?: string;
  completedToday: number;
  successRate: number;
  lastActive: Date;
  config: AgentConfig;
}

export interface AgentConfig {
  autoMode: boolean;
  notifyOnComplete: boolean;
  maxDailyTasks: number;
  priority: 'high' | 'medium' | 'low';
}

export interface AgentTask {
  id: string;
  agentId: AgentType;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
}

export interface AgentMessage {
  id: string;
  from: AgentType | 'user' | 'system';
  to: AgentType | 'user' | 'all';
  content: string;
  timestamp: Date;
  type: 'info' | 'request' | 'response' | 'alert';
}

// Default Agents Configuration
const defaultAgents: Agent[] = [
  {
    id: 'dev',
    name: 'Dev Agent',
    description: 'Code, debug, review PRs, fix bugs automatically',
    icon: <Code2 className="h-5 w-5" />,
    status: 'active',
    enabled: true,
    capabilities: ['Code review', 'Bug fix', 'PR creation', 'Testing', 'Documentation'],
    completedToday: 12,
    successRate: 94,
    lastActive: new Date(),
    config: { autoMode: true, notifyOnComplete: true, maxDailyTasks: 50, priority: 'high' },
  },
  {
    id: 'content',
    name: 'Content Agent',
    description: 'Write blogs, social posts, emails, copy',
    icon: <FileText className="h-5 w-5" />,
    status: 'active',
    enabled: true,
    capabilities: ['Blog writing', 'Social posts', 'Email copy', 'SEO optimization'],
    completedToday: 8,
    successRate: 88,
    lastActive: new Date(),
    config: { autoMode: false, notifyOnComplete: true, maxDailyTasks: 20, priority: 'medium' },
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    description: 'Manage ads, optimize campaigns, track ROI',
    icon: <TrendingUp className="h-5 w-5" />,
    status: 'idle',
    enabled: true,
    capabilities: ['Ad optimization', 'A/B testing', 'Audience targeting', 'Budget management'],
    completedToday: 5,
    successRate: 91,
    lastActive: new Date(Date.now() - 3600000),
    config: { autoMode: true, notifyOnComplete: true, maxDailyTasks: 30, priority: 'high' },
  },
  {
    id: 'sales',
    name: 'Sales Agent',
    description: 'Outreach, follow-ups, lead qualification',
    icon: <Mail className="h-5 w-5" />,
    status: 'active',
    enabled: true,
    capabilities: ['Email outreach', 'Follow-up sequences', 'Lead scoring', 'CRM updates'],
    completedToday: 45,
    successRate: 72,
    lastActive: new Date(),
    config: { autoMode: true, notifyOnComplete: false, maxDailyTasks: 100, priority: 'medium' },
  },
  {
    id: 'analytics',
    name: 'Analytics Agent',
    description: 'Track metrics, generate reports, find insights',
    icon: <BarChart3 className="h-5 w-5" />,
    status: 'active',
    enabled: true,
    capabilities: ['Data analysis', 'Report generation', 'Trend detection', 'Anomaly alerts'],
    completedToday: 7,
    successRate: 98,
    lastActive: new Date(),
    config: { autoMode: true, notifyOnComplete: true, maxDailyTasks: 20, priority: 'low' },
  },
  {
    id: 'design',
    name: 'Design Agent',
    description: 'UI suggestions, image generation, brand consistency',
    icon: <Palette className="h-5 w-5" />,
    status: 'paused',
    enabled: false,
    capabilities: ['UI/UX suggestions', 'Image generation', 'Color schemes', 'Asset creation'],
    completedToday: 0,
    successRate: 85,
    lastActive: new Date(Date.now() - 86400000),
    config: { autoMode: false, notifyOnComplete: true, maxDailyTasks: 10, priority: 'low' },
  },
  {
    id: 'security',
    name: 'Security Agent',
    description: 'Vulnerability scanning, security audits, monitoring',
    icon: <Shield className="h-5 w-5" />,
    status: 'active',
    enabled: true,
    capabilities: [
      'Vulnerability scan',
      'Dependency audit',
      'Security monitoring',
      'Incident response',
    ],
    completedToday: 3,
    successRate: 100,
    lastActive: new Date(),
    config: { autoMode: true, notifyOnComplete: true, maxDailyTasks: 10, priority: 'high' },
  },
  {
    id: 'advisor',
    name: 'Advisor Agent',
    description: 'Strategic advice, market analysis, decision support',
    icon: <Brain className="h-5 w-5" />,
    status: 'idle',
    enabled: true,
    capabilities: [
      'Market analysis',
      'Strategy suggestions',
      'Risk assessment',
      'Competitor tracking',
    ],
    completedToday: 2,
    successRate: 90,
    lastActive: new Date(Date.now() - 7200000),
    config: { autoMode: false, notifyOnComplete: true, maxDailyTasks: 5, priority: 'medium' },
  },
];

// Mock tasks
const mockTasks: AgentTask[] = [
  {
    id: '1',
    agentId: 'dev',
    type: 'bug_fix',
    title: 'Fix authentication timeout issue',
    description: 'Users reporting random logouts after 30 minutes',
    status: 'running',
    priority: 'high',
    createdAt: new Date(),
  },
  {
    id: '2',
    agentId: 'content',
    type: 'blog_post',
    title: 'Write "AI Automation for Solo Founders"',
    description: 'Target keywords: ai automation, solo founder, productivity',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date(),
  },
  {
    id: '3',
    agentId: 'marketing',
    type: 'campaign_optimization',
    title: 'Optimize Google Ads campaign',
    description: 'Current CTR: 2.1%, Target: 3%',
    status: 'completed',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000),
    completedAt: new Date(),
    result: { ctr: 2.8, improvement: '33%' },
  },
];

export function AgentOrchestrator() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [tasks, setTasks] = useState<AgentTask[]>(mockTasks);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [userMessage, setUserMessage] = useState('');

  // Calculate stats
  const activeAgents = agents.filter((a) => a.status === 'active' && a.enabled).length;
  const totalCompleted = agents.reduce((sum, a) => sum + a.completedToday, 0);
  const avgSuccessRate = Math.round(
    agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length
  );
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'running').length;

  // Toggle agent enabled
  const toggleAgent = (agentId: AgentType) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, enabled: !a.enabled, status: a.enabled ? 'paused' : 'idle' } : a
      )
    );
  };

  // Send message to agent
  const sendMessage = () => {
    if (!userMessage.trim()) return;

    const newMessage: AgentMessage = {
      id: Date.now().toString(),
      from: 'user',
      to: selectedAgent?.id || 'all',
      content: userMessage,
      timestamp: new Date(),
      type: 'request',
    };

    setMessages((prev) => [...prev, newMessage]);
    setUserMessage('');

    // Simulate agent response
    setTimeout(() => {
      const response: AgentMessage = {
        id: (Date.now() + 1).toString(),
        from: selectedAgent?.id || 'advisor',
        to: 'user',
        content: `Đã nhận yêu cầu: "${userMessage}". Đang xử lý...`,
        timestamp: new Date(),
        type: 'response',
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  // Assign task to agent
  const assignTask = (agentId: AgentType, taskTitle: string, taskDescription: string) => {
    const newTask: AgentTask = {
      id: Date.now().toString(),
      agentId,
      type: 'manual',
      title: taskTitle,
      description: taskDescription,
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Agent Orchestrator
          </h1>
          <p className="text-muted-foreground">Quản lý và điều phối tất cả AI Agents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Run All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">
                  {activeAgents}/{agents.length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">{totalCompleted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{avgSuccessRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
                <p className="text-2xl font-bold">{pendingTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Agents List */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>AI Agents</CardTitle>
              <CardDescription>Click vào agent để xem chi tiết và gửi lệnh</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    onSelect={() => setSelectedAgent(agent)}
                    onToggle={() => toggleAgent(agent.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Detail / Communication */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {selectedAgent ? selectedAgent.name : 'Command Center'}
              </CardTitle>
              <CardDescription>
                {selectedAgent ? selectedAgent.description : 'Chọn agent hoặc gửi lệnh chung'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-[500px]">
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-3">
                  {messages
                    .filter(
                      (m) =>
                        !selectedAgent ||
                        m.from === selectedAgent.id ||
                        m.to === selectedAgent.id ||
                        m.to === 'all'
                    )
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'p-3 rounded-lg max-w-[90%]',
                          msg.from === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Gửi lệnh cho agents</p>
                      <p className="text-xs">Ví dụ: "Viết blog về AI automation"</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder={
                    selectedAgent
                      ? `Gửi lệnh cho ${selectedAgent.name}...`
                      : 'Gửi lệnh cho tất cả agents...'
                  }
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} className="h-auto">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tasks Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Task Queue</CardTitle>
          <CardDescription>Các tasks đang chờ xử lý và đang chạy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} agents={agents} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
function AgentCard({
  agent,
  isSelected,
  onSelect,
  onToggle,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    paused: 'bg-gray-500',
    error: 'bg-red-500',
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary',
        !agent.enabled && 'opacity-50'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {agent.icon}
              </div>
              <div
                className={cn(
                  'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                  statusColors[agent.status]
                )}
              />
            </div>
            <div>
              <h4 className="font-medium">{agent.name}</h4>
              <p className="text-xs text-muted-foreground">{agent.currentTask || agent.status}</p>
            </div>
          </div>
          <Switch
            checked={agent.enabled}
            onCheckedChange={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-medium">{agent.successRate}%</span>
          </div>
          <Progress value={agent.successRate} className="h-1" />

          <div className="flex justify-between text-xs text-muted-foreground pt-2">
            <span>{agent.completedToday} completed today</span>
            <span>{agent.config.autoMode ? '🤖 Auto' : '👤 Manual'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, agents }: { task: AgentTask; agents: Agent[] }) {
  const agent = agents.find((a) => a.id === task.agentId);

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    running: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <AlertCircle className="h-4 w-4 text-red-500" />,
  };

  const priorityColors = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        {statusIcons[task.status]}
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {agent?.icon}
        </div>
        <div>
          <h4 className="font-medium text-sm">{task.title}</h4>
          <p className="text-xs text-muted-foreground">
            {agent?.name} • {task.type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
          {task.priority}
        </Badge>
        {task.status === 'completed' && task.result && (
          <Badge variant="secondary" className="text-xs">
            ✓ {JSON.stringify(task.result).slice(0, 20)}...
          </Badge>
        )}
      </div>
    </div>
  );
}

export default AgentOrchestrator;
