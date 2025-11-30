import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import {
  GitBranch,
  Upload,
  Rocket,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  FileCode,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  action: () => Promise<void>;
}

interface SystemStatus {
  frontend: boolean;
  api: boolean;
  mcp: boolean;
  lastDeploy?: string;
}

export function MobileDashboard() {
  const [loading, setLoading] = useState<string | null>(null);
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    frontend: true,
    api: false,
    mcp: false,
  });
  const { toast } = useToast();

  // Fetch git status on mount
  useEffect(() => {
    fetchGitStatus();
  }, []);

  const fetchGitStatus = async () => {
    try {
      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'git status',
          sessionId: 'mobile-dashboard',
          useMCPTools: true,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setGitStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch git status:', error);
    }
  };

  const handleCommitAndPush = async () => {
    setLoading('commit');
    try {
      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "commit all changes with message 'Mobile update' and push to remote",
          sessionId: 'mobile-commit',
          useMCPTools: true,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Thành công!',
          description: 'Đã commit và push lên remote',
        });
        fetchGitStatus();
      } else {
        throw new Error('Failed to commit');
      }
    } catch (error) {
      toast({
        title: '❌ Lỗi',
        description: 'Không thể commit. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDeploy = async () => {
    setLoading('deploy');
    try {
      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'deploy to vercel production',
          sessionId: 'mobile-deploy',
          useMCPTools: true,
        }),
      });

      if (response.ok) {
        toast({
          title: '🚀 Deploy started!',
          description: 'Đang deploy lên Vercel...',
        });
      } else {
        throw new Error('Failed to deploy');
      }
    } catch (error) {
      toast({
        title: '❌ Lỗi',
        description: 'Không thể deploy. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handlePull = async () => {
    setLoading('pull');
    try {
      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'git pull',
          sessionId: 'mobile-pull',
          useMCPTools: true,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Đã pull!',
          description: 'Code đã được cập nhật từ remote',
        });
        fetchGitStatus();
      }
    } catch (error) {
      toast({
        title: '❌ Lỗi',
        description: 'Không thể pull. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'commit',
      icon: GitBranch,
      label: 'Commit & Push',
      description: 'Commit và push code',
      color: 'from-green-500 to-emerald-600',
      action: handleCommitAndPush,
    },
    {
      id: 'deploy',
      icon: Rocket,
      label: 'Deploy',
      description: 'Deploy lên Vercel',
      color: 'from-blue-500 to-purple-600',
      action: handleDeploy,
    },
    {
      id: 'pull',
      icon: RefreshCw,
      label: 'Pull',
      description: 'Cập nhật code mới',
      color: 'from-orange-500 to-red-600',
      action: handlePull,
    },
  ];

  return (
    <MobileLayout title="Dashboard">
      <div className="p-4 space-y-6">
        {/* System Status */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System Status
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatusCard label="Frontend" active={systemStatus.frontend} />
            <StatusCard label="API" active={systemStatus.api} />
            <StatusCard label="MCP" active={systemStatus.mcp} />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className={`h-auto p-4 bg-gradient-to-r ${action.color} hover:opacity-90 transition-opacity`}
                onClick={action.action}
                disabled={loading !== null}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {loading === action.id ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <action.icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-base">{action.label}</div>
                    <div className="text-sm text-white/70">{action.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </section>

        {/* Git Status Summary */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Git Status
          </h2>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Branch</span>
              <span className="text-sm font-mono text-blue-400">master</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Changed files</span>
              <span className="text-sm font-mono text-yellow-400">
                {gitStatus?.changedFiles || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Last commit</span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {gitStatus?.lastCommit || 'Loading...'}
              </span>
            </div>
          </Card>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h2>
          <div className="space-y-2">
            <ActivityItem
              icon={CheckCircle2}
              text="Deploy completed"
              time="2 phút trước"
              status="success"
            />
            <ActivityItem
              icon={GitBranch}
              text="Pushed to master"
              time="15 phút trước"
              status="success"
            />
            <ActivityItem
              icon={AlertCircle}
              text="Build warning"
              time="1 giờ trước"
              status="warning"
            />
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}

function StatusCard({ label, active }: { label: string; active: boolean }) {
  return (
    <Card
      className={`p-3 border ${active ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900 border-gray-800'}`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-600'}`} />
        <span className={`text-xs font-medium ${active ? 'text-green-400' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
    </Card>
  );
}

function ActivityItem({
  icon: Icon,
  text,
  time,
  status,
}: {
  icon: React.ElementType;
  text: string;
  time: string;
  status: 'success' | 'warning' | 'error';
}) {
  const colors = {
    success: 'text-green-400 bg-green-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10',
    error: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
      <div className={`p-2 rounded-lg ${colors[status]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 truncate">{text}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

export default MobileDashboard;
