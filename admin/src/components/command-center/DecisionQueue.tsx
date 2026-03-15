/**
 * Decision Queue Component
 * Shows all pending decisions that need user approval
 * Agents submit decisions, user approves/rejects
 */

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  DollarSign,
  Eye,
  FileText,
  Mail,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  useApproveDecision,
  useDecisionsSummary,
  useDeferDecision,
  usePendingDecisions,
  useRejectDecision,
} from '@/hooks/use-solo-hub';
import { cn } from '@/lib/utils';
import type { Decision as DecisionType } from '@/types/solo-hub.types';

// Local display interface (maps from DB type)
export interface Decision {
  id: string;
  agentId: string;
  agentName: string;
  type: 'budget' | 'content' | 'code' | 'outreach' | 'security' | 'strategy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'today' | 'this_week';
  recommendation: 'approve' | 'reject' | 'review';
  details: {
    current?: string;
    proposed?: string;
    reason?: string;
    risk?: string;
    benefit?: string;
    cost?: number;
    timeline?: string;
  };
  createdAt: Date;
  deadline?: Date;
  attachments?: string[];
}

// Mock decisions (fallback)
const mockDecisions: Decision[] = [
  {
    id: '1',
    agentId: 'marketing',
    agentName: 'Marketing Agent',
    type: 'budget',
    title: 'Tăng budget Google Ads',
    description: 'Đề xuất tăng ngân sách quảng cáo hàng ngày để tận dụng CTR tăng cao',
    impact: 'high',
    urgency: 'today',
    recommendation: 'approve',
    details: {
      current: '$50/ngày',
      proposed: '$100/ngày',
      reason: 'CTR tăng 25% trong 7 ngày qua, conversion rate ổn định',
      benefit: 'Dự kiến tăng 80% leads với cùng CPA',
      risk: 'Chi phí tăng gấp đôi nếu CTR giảm',
      cost: 1500,
      timeline: 'Áp dụng ngay, review sau 7 ngày',
    },
    createdAt: new Date(),
    deadline: new Date(Date.now() + 86400000),
  },
  {
    id: '2',
    agentId: 'content',
    agentName: 'Content Agent',
    type: 'content',
    title: 'Publish blog: "AI cho Solo Founders"',
    description: 'Bài blog đã được draft, cần review và approve để publish',
    impact: 'medium',
    urgency: 'this_week',
    recommendation: 'review',
    details: {
      proposed: 'Bài viết 2,500 từ về AI automation cho solo founders',
      reason: 'Keyword "ai automation solo founder" có search volume tăng 150%',
      benefit: 'Dự kiến 500-1000 organic visits/tháng sau 3 tháng',
      timeline: 'Publish trong tuần này để bắt trend',
    },
    createdAt: new Date(Date.now() - 3600000),
    attachments: ['blog-draft.md'],
  },
  {
    id: '3',
    agentId: 'dev',
    agentName: 'Dev Agent',
    type: 'code',
    title: 'Deploy hotfix: Auth timeout fix',
    description: 'Fix lỗi user bị logout sau 30 phút, cần deploy gấp',
    impact: 'high',
    urgency: 'immediate',
    recommendation: 'approve',
    details: {
      current: 'Token refresh không hoạt động đúng',
      proposed: 'Fix refresh token logic, thêm retry mechanism',
      reason: '15 user reports trong 24h qua',
      risk: 'Minimal - đã test trên staging',
      benefit: 'Cải thiện UX, giảm churn',
      timeline: 'Deploy ngay sau khi approve',
    },
    createdAt: new Date(Date.now() - 7200000),
    deadline: new Date(Date.now() + 3600000),
  },
  {
    id: '4',
    agentId: 'sales',
    agentName: 'Sales Agent',
    type: 'outreach',
    title: 'Gửi email sequence mới',
    description: 'Đề xuất A/B test email sequence mới cho leads chưa convert',
    impact: 'medium',
    urgency: 'this_week',
    recommendation: 'approve',
    details: {
      current: '3-email sequence, 12% reply rate',
      proposed: '5-email sequence với case studies, target 18% reply rate',
      reason: 'Leads cần nhiều touchpoints hơn trước khi convert',
      benefit: 'Dự kiến tăng 50% replies từ cold leads',
      timeline: '200 leads sẽ được gửi trong 2 tuần',
    },
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '5',
    agentId: 'security',
    agentName: 'Security Agent',
    type: 'security',
    title: 'Update dependencies với security patches',
    description: '3 dependencies có security vulnerabilities cần update',
    impact: 'high',
    urgency: 'today',
    recommendation: 'approve',
    details: {
      current: '3 moderate vulnerabilities detected',
      proposed: 'Update react-scripts, axios, lodash',
      reason: 'npm audit báo moderate severity',
      risk: 'Low - chỉ minor version updates',
      benefit: 'Loại bỏ security risks, compliance ready',
      timeline: 'Update và test trong 2 giờ',
    },
    createdAt: new Date(Date.now() - 1800000),
    deadline: new Date(Date.now() + 43200000),
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  budget: <DollarSign className="h-5 w-5 text-green-500" />,
  content: <FileText className="h-5 w-5 text-purple-500" />,
  code: <Code2 className="h-5 w-5 text-blue-500" />,
  outreach: <Mail className="h-5 w-5 text-orange-500" />,
  security: <Shield className="h-5 w-5 text-red-500" />,
  strategy: <TrendingUp className="h-5 w-5 text-cyan-500" />,
};

const impactColors = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const urgencyColors = {
  immediate: 'bg-red-500 text-white',
  today: 'bg-orange-500 text-white',
  this_week: 'bg-blue-500 text-white',
};

const recommendationIcons = {
  approve: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  reject: <XCircle className="h-4 w-4 text-red-500" />,
  review: <Eye className="h-4 w-4 text-yellow-500" />,
};

// Helper to transform DB decision to display format
function transformDecision(dbDecision: DecisionType): Decision {
  return {
    id: dbDecision.id,
    agentId: dbDecision.agent_id || '',
    agentName: dbDecision.agent_id ? 'AI Agent' : 'System', // Would need to join with agents table
    type: dbDecision.decision_type,
    title: dbDecision.title,
    description: dbDecision.description || '',
    impact: dbDecision.impact,
    urgency: dbDecision.urgency,
    recommendation: dbDecision.recommendation,
    details: dbDecision.details,
    createdAt: new Date(dbDecision.created_at),
    deadline: dbDecision.deadline ? new Date(dbDecision.deadline) : undefined,
    attachments: dbDecision.attachments,
  };
}

export function DecisionQueue() {
  // Real data hooks
  const { data: pendingDecisions, isLoading, refetch } = usePendingDecisions();
  const { data: summary } = useDecisionsSummary();
  const approveDecision = useApproveDecision();
  const rejectDecision = useRejectDecision();
  const deferDecision = useDeferDecision();

  // Transform and fallback to mock data
  const decisions: Decision[] = pendingDecisions?.map(transformDecision) || mockDecisions;

  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [feedback, setFeedback] = useState('');

  const urgentCount =
    summary?.immediate_count || decisions.filter((d) => d.urgency === 'immediate').length;
  const todayCount = summary?.today_count || decisions.filter((d) => d.urgency === 'today').length;
  const highImpactCount =
    summary?.high_impact_count || decisions.filter((d) => d.impact === 'high').length;

  const handleApprove = async (decisionId: string) => {
    await approveDecision.mutateAsync({ id: decisionId, feedback });
    setSelectedDecision(null);
    setFeedback('');
  };

  const handleReject = async (decisionId: string) => {
    await rejectDecision.mutateAsync({ id: decisionId, feedback });
    setSelectedDecision(null);
    setFeedback('');
  };

  const handleDefer = async (decisionId: string) => {
    await deferDecision.mutateAsync(decisionId);
    setSelectedDecision(null);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Decision Queue
          </h1>
          <p className="text-muted-foreground">Các quyết định cần sự phê duyệt của bạn</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
        <div className="flex gap-2">
          <Badge variant="destructive" className="text-sm">
            {urgentCount} Urgent
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {decisions.length} Total
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cần xử lý ngay</p>
                <p className="text-2xl font-bold text-red-500">{urgentCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hôm nay</p>
                <p className="text-2xl font-bold text-orange-500">{todayCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Impact</p>
                <p className="text-2xl font-bold text-purple-500">{highImpactCount}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Today</p>
                <p className="text-2xl font-bold text-green-500">12</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decisions List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Decisions</CardTitle>
          <CardDescription>Click vào decision để xem chi tiết và approve/reject</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {decisions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="font-medium text-lg">All caught up!</h3>
                  <p className="text-muted-foreground">Không có quyết định nào đang chờ</p>
                </div>
              ) : (
                decisions
                  .sort((a, b) => {
                    const urgencyOrder = { immediate: 0, today: 1, this_week: 2 };
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                  })
                  .map((decision) => (
                    <DecisionCard
                      key={decision.id}
                      decision={decision}
                      onApprove={() => handleApprove(decision.id)}
                      onReject={() => handleReject(decision.id)}
                      onDefer={() => handleDefer(decision.id)}
                      onViewDetails={() => setSelectedDecision(decision)}
                    />
                  ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Decision Detail Dialog */}
      <Dialog open={!!selectedDecision} onOpenChange={() => setSelectedDecision(null)}>
        <DialogContent className="max-w-2xl">
          {selectedDecision && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {typeIcons[selectedDecision.type]}
                  <div>
                    <DialogTitle>{selectedDecision.title}</DialogTitle>
                    <DialogDescription>{selectedDecision.agentName}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Badges */}
                <div className="flex gap-2">
                  <Badge className={urgencyColors[selectedDecision.urgency]}>
                    {selectedDecision.urgency === 'immediate'
                      ? '🔥 Immediate'
                      : selectedDecision.urgency === 'today'
                        ? '⏰ Today'
                        : '📅 This Week'}
                  </Badge>
                  <Badge variant="outline" className={impactColors[selectedDecision.impact]}>
                    {selectedDecision.impact.toUpperCase()} Impact
                  </Badge>
                  <div className="flex items-center gap-1">
                    {recommendationIcons[selectedDecision.recommendation]}
                    <span className="text-sm capitalize">{selectedDecision.recommendation}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedDecision.description}</p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedDecision.details.current && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Current</p>
                      <p className="font-medium">{selectedDecision.details.current}</p>
                    </div>
                  )}
                  {selectedDecision.details.proposed && (
                    <div className="p-3 rounded-lg bg-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Proposed</p>
                      <p className="font-medium">{selectedDecision.details.proposed}</p>
                    </div>
                  )}
                </div>

                {selectedDecision.details.reason && (
                  <div>
                    <h4 className="font-medium mb-2">Reason</h4>
                    <p className="text-muted-foreground">{selectedDecision.details.reason}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedDecision.details.benefit && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-500 mb-1">✓ Benefit</p>
                      <p className="text-sm">{selectedDecision.details.benefit}</p>
                    </div>
                  )}
                  {selectedDecision.details.risk && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-500 mb-1">⚠ Risk</p>
                      <p className="text-sm">{selectedDecision.details.risk}</p>
                    </div>
                  )}
                </div>

                {selectedDecision.details.cost && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span>
                      Estimated cost: <strong>${selectedDecision.details.cost}</strong>
                    </span>
                  </div>
                )}

                {/* Feedback */}
                <div>
                  <h4 className="font-medium mb-2">Your Feedback (optional)</h4>
                  <Textarea
                    placeholder="Add notes or instructions for the agent..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => handleDefer(selectedDecision.id)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Defer
                </Button>
                <Button variant="destructive" onClick={() => handleReject(selectedDecision.id)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedDecision.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Decision Card Component
function DecisionCard({
  decision,
  onApprove,
  onReject,
  onDefer,
  onViewDetails,
}: {
  decision: Decision;
  onApprove: () => void;
  onReject: () => void;
  onDefer: () => void;
  onViewDetails: () => void;
}) {
  return (
    <Card
      className={cn(
        'p-4 transition-all hover:shadow-md cursor-pointer',
        decision.urgency === 'immediate' && 'border-red-500/50 bg-red-500/5'
      )}
      onClick={onViewDetails}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {typeIcons[decision.type]}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{decision.title}</h4>
              <Badge className={cn('text-xs', urgencyColors[decision.urgency])}>
                {decision.urgency === 'immediate'
                  ? '🔥'
                  : decision.urgency === 'today'
                    ? '⏰'
                    : '📅'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{decision.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="secondary">{decision.agentName}</Badge>
              <span className="flex items-center gap-1">
                {recommendationIcons[decision.recommendation]}
                Agent recommends: {decision.recommendation}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
            onClick={onApprove}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={onReject}
          >
            <XCircle className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onViewDetails}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default DecisionQueue;
