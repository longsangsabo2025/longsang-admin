/**
 * Morning Briefing Component
 * AI-powered daily briefing for Solo Founders
 * Shows: Priority tasks, Content drafts, Agent updates, Decisions needed
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sun,
  Coffee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  MessageSquare,
  Zap,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Brain,
  Target,
  Calendar,
  Mail,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useTodayBriefing,
  useTriggerBriefing,
  useMarkBriefingRead,
  useAgents,
  usePendingDecisions,
} from '@/hooks/use-solo-hub';
import type { MorningBriefing as MorningBriefingType } from '@/types/solo-hub.types';

interface BriefingItem {
  id: string;
  type: 'task' | 'content' | 'decision' | 'insight' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  action?: {
    approve?: () => void;
    reject?: () => void;
    defer?: () => void;
  };
  metadata?: Record<string, any>;
}

interface AgentStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'idle' | 'error';
  lastAction: string;
  completedTasks: number;
  pendingTasks: number;
}

// Mock data - will be replaced with real API calls
const mockBriefingItems: BriefingItem[] = [
  {
    id: '1',
    type: 'task',
    priority: 'high',
    title: 'Review PR #42: Bug fix for auth flow',
    description: 'Dev Agent đã tạo PR fix lỗi authentication. Cần review và merge.',
    source: 'Dev Agent',
    timestamp: new Date(),
  },
  {
    id: '2',
    type: 'content',
    priority: 'medium',
    title: 'Draft: "5 Tips for Solo Founders"',
    description: 'Content Agent đã draft bài blog mới. Đọc và approve để publish.',
    source: 'Content Agent',
    timestamp: new Date(),
  },
  {
    id: '3',
    type: 'decision',
    priority: 'high',
    title: 'Tăng budget Google Ads?',
    description: 'Marketing Agent đề xuất tăng budget từ $50 lên $100/ngày. CTR tăng 25%.',
    source: 'Marketing Agent',
    timestamp: new Date(),
  },
  {
    id: '4',
    type: 'insight',
    priority: 'low',
    title: 'Traffic tăng 15% tuần này',
    description: 'Chủ yếu từ organic search. Top keywords: "ai automation", "solo founder tools"',
    source: 'Analytics Agent',
    timestamp: new Date(),
  },
  {
    id: '5',
    type: 'alert',
    priority: 'high',
    title: 'Server response time tăng',
    description: 'API response time tăng từ 200ms lên 800ms. Cần check.',
    source: 'DevOps Agent',
    timestamp: new Date(),
  },
];

const mockAgentStatuses: AgentStatus[] = [
  {
    id: 'dev',
    name: 'Dev Agent',
    icon: <Zap className="h-4 w-4" />,
    status: 'active',
    lastAction: 'Fixed auth bug',
    completedTasks: 12,
    pendingTasks: 3,
  },
  {
    id: 'content',
    name: 'Content Agent',
    icon: <FileText className="h-4 w-4" />,
    status: 'active',
    lastAction: 'Drafted blog post',
    completedTasks: 8,
    pendingTasks: 2,
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    icon: <TrendingUp className="h-4 w-4" />,
    status: 'idle',
    lastAction: 'Optimized ad campaign',
    completedTasks: 5,
    pendingTasks: 1,
  },
  {
    id: 'sales',
    name: 'Sales Agent',
    icon: <Mail className="h-4 w-4" />,
    status: 'active',
    lastAction: 'Sent 15 outreach emails',
    completedTasks: 45,
    pendingTasks: 10,
  },
  {
    id: 'analytics',
    name: 'Analytics Agent',
    icon: <BarChart3 className="h-4 w-4" />,
    status: 'active',
    lastAction: 'Generated weekly report',
    completedTasks: 7,
    pendingTasks: 0,
  },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12)
    return { text: 'Chào buổi sáng', icon: <Sun className="h-6 w-6 text-yellow-500" /> };
  if (hour < 18)
    return { text: 'Chào buổi chiều', icon: <Coffee className="h-6 w-6 text-orange-500" /> };
  return { text: 'Chào buổi tối', icon: <Coffee className="h-6 w-6 text-purple-500" /> };
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'low':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'task':
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    case 'content':
      return <FileText className="h-4 w-4 text-purple-500" />;
    case 'decision':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'insight':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'alert':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

export function MorningBriefing() {
  // Real data hooks
  const {
    data: briefing,
    isLoading: briefingLoading,
    refetch: refetchBriefing,
  } = useTodayBriefing();
  const { data: agentsData, isLoading: agentsLoading } = useAgents();
  const { data: decisions, isLoading: decisionsLoading } = usePendingDecisions();
  const triggerBriefing = useTriggerBriefing();
  const markAsRead = useMarkBriefingRead();

  // Fallback to mock data if no real data
  const [items, setItems] = useState<BriefingItem[]>(mockBriefingItems);
  const [agents, setAgents] = useState<AgentStatus[]>(mockAgentStatuses);

  const isLoading = briefingLoading || agentsLoading || decisionsLoading;
  const greeting = getGreeting();

  // Transform real data to display format
  const highPriorityCount =
    briefing?.priorities?.filter((p) => p.urgency === 'high').length ||
    items.filter((i) => i.priority === 'high').length;
  const decisionsCount = decisions?.length || items.filter((i) => i.type === 'decision').length;
  const totalAgentTasks =
    agentsData?.reduce((sum, a) => sum + a.tasks_completed, 0) ||
    agents.reduce((sum, a) => sum + a.completedTasks, 0);

  const handleApprove = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    // TODO: Trigger actual approval action via API
  };

  const handleReject = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    // TODO: Trigger actual rejection action via API
  };

  const handleDefer = (itemId: string) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, priority: 'low' as const } : i)));
  };

  const refreshBriefing = async () => {
    await refetchBriefing();
  };

  const generateNewBriefing = async () => {
    await triggerBriefing.mutateAsync();
  };

  // Mark as read when viewed
  if (briefing && !briefing.is_read) {
    markAsRead.mutate(briefing.id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {greeting.icon}
          <div>
            <h1 className="text-2xl font-bold">{greeting.text}, Boss!</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateNewBriefing}
            disabled={triggerBriefing.isPending}
          >
            <Brain className={cn('h-4 w-4 mr-2', triggerBriefing.isPending && 'animate-pulse')} />
            Generate
          </Button>
          <Button variant="outline" onClick={refreshBriefing} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      {briefing?.ai_insights && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <p className="font-medium text-purple-500 mb-1">AI Insight</p>
                <p className="text-sm text-muted-foreground">{briefing.ai_insights}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cần xử lý ngay</p>
                  <p className="text-2xl font-bold text-red-500">{highPriorityCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quyết định chờ</p>
                  <p className="text-2xl font-bold text-orange-500">{decisionsCount}</p>
                </div>
                <Target className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agents đã làm</p>
                  <p className="text-2xl font-bold text-green-500">{totalAgentTasks}</p>
                </div>
                <Zap className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agents active</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {agents.filter((a) => a.status === 'active').length}/{agents.length}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Briefing Items */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Briefing
              </CardTitle>
              <CardDescription>Những việc cần attention của bạn hôm nay</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Tất cả ({items.length})</TabsTrigger>
                  <TabsTrigger value="decisions">Quyết định ({decisionsCount})</TabsTrigger>
                  <TabsTrigger value="tasks">
                    Tasks ({items.filter((i) => i.type === 'task').length})
                  </TabsTrigger>
                  <TabsTrigger value="content">
                    Content ({items.filter((i) => i.type === 'content').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {items.map((item) => (
                        <BriefingCard
                          key={item.id}
                          item={item}
                          onApprove={() => handleApprove(item.id)}
                          onReject={() => handleReject(item.id)}
                          onDefer={() => handleDefer(item.id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="decisions">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {items
                        .filter((i) => i.type === 'decision')
                        .map((item) => (
                          <BriefingCard
                            key={item.id}
                            item={item}
                            onApprove={() => handleApprove(item.id)}
                            onReject={() => handleReject(item.id)}
                            onDefer={() => handleDefer(item.id)}
                          />
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="tasks">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {items
                        .filter((i) => i.type === 'task')
                        .map((item) => (
                          <BriefingCard
                            key={item.id}
                            item={item}
                            onApprove={() => handleApprove(item.id)}
                            onReject={() => handleReject(item.id)}
                            onDefer={() => handleDefer(item.id)}
                          />
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="content">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {items
                        .filter((i) => i.type === 'content')
                        .map((item) => (
                          <BriefingCard
                            key={item.id}
                            item={item}
                            onApprove={() => handleApprove(item.id)}
                            onReject={() => handleReject(item.id)}
                            onDefer={() => handleDefer(item.id)}
                          />
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Agent Status */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Agents Status
              </CardTitle>
              <CardDescription>Các agents đang làm việc cho bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agents.map((agent) => (
                  <AgentStatusCard key={agent.id} agent={agent} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function BriefingCard({
  item,
  onApprove,
  onReject,
  onDefer,
}: {
  item: BriefingItem;
  onApprove: () => void;
  onReject: () => void;
  onDefer: () => void;
}) {
  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {getTypeIcon(item.type)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{item.title}</h4>
              <Badge variant="outline" className={cn('text-xs', getPriorityColor(item.priority))}>
                {item.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {item.source}
              </Badge>
              <Clock className="h-3 w-3" />
              <span>
                {item.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
            onClick={onApprove}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={onReject}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={onDefer}
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AgentStatusCard({ agent }: { agent: AgentStatus }) {
  const statusColor = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <Card className="p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {agent.icon}
          </div>
          <div
            className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
              statusColor[agent.status]
            )}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{agent.name}</h4>
            <Badge variant="outline" className="text-xs">
              {agent.completedTasks} done
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{agent.lastAction}</p>
        </div>
      </div>
    </Card>
  );
}

export default MorningBriefing;
