import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import {
  Rocket,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Globe,
  GitBranch,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Deployment {
  id: string;
  url: string;
  status: 'ready' | 'building' | 'error';
  branch: string;
  commit: string;
  createdAt: string;
}

export function MobileDeploy() {
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>(
    'idle'
  );
  const [recentDeployments] = useState<Deployment[]>([
    {
      id: '1',
      url: 'https://longsang-admin.vercel.app',
      status: 'ready',
      branch: 'main',
      commit: 'abc1234',
      createdAt: '2 giờ trước',
    },
    {
      id: '2',
      url: 'https://longsang-admin-preview.vercel.app',
      status: 'ready',
      branch: 'develop',
      commit: 'def5678',
      createdAt: '5 giờ trước',
    },
  ]);

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployStatus('deploying');

    try {
      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Deploy project longsang-admin lên Vercel production',
          sessionId: 'mobile-deploy',
          useMCPTools: true,
        }),
      });

      if (response.ok) {
        setDeployStatus('success');
        // Auto reset after 5 seconds
        setTimeout(() => {
          setDeployStatus('idle');
        }, 5000);
      } else {
        setDeployStatus('error');
      }
    } catch (error) {
      setDeployStatus('error');
    } finally {
      setDeploying(false);
    }
  };

  const getStatusIcon = (status: Deployment['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'building':
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <MobileLayout title="Deploy">
      <div className="p-4 space-y-4">
        {/* Deploy Button Card */}
        <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {deployStatus === 'idle' && (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Rocket className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Deploy to Production</h2>
                    <p className="text-sm text-gray-400 mt-1">Deploy code mới nhất lên Vercel</p>
                  </div>
                  <Button
                    onClick={handleDeploy}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-6"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Deploy Now
                  </Button>
                </>
              )}

              {deployStatus === 'deploying' && (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Đang Deploy...</h2>
                    <p className="text-sm text-gray-400 mt-1">Vui lòng đợi trong giây lát</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Building project...</span>
                    </div>
                  </div>
                </>
              )}

              {deployStatus === 'success' && (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-green-400">Deploy Thành Công!</h2>
                    <p className="text-sm text-gray-400 mt-1">Website đã được cập nhật</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-green-500 text-green-400 hover:bg-green-500/10"
                    onClick={() => window.open('https://longsang-admin.vercel.app', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Xem Website
                  </Button>
                </>
              )}

              {deployStatus === 'error' && (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-red-400">Deploy Thất Bại</h2>
                    <p className="text-sm text-gray-400 mt-1">Có lỗi xảy ra, vui lòng thử lại</p>
                  </div>
                  <Button
                    onClick={handleDeploy}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Thử Lại
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Production */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Production hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white">longsang-admin.vercel.app</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://longsang-admin.vercel.app', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deployments */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lịch sử Deploy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDeployments.map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(deployment.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3 h-3 text-gray-500" />
                      <span className="text-sm font-medium text-white">{deployment.branch}</span>
                      <span className="text-xs text-gray-500">#{deployment.commit}</span>
                    </div>
                    <span className="text-xs text-gray-500">{deployment.createdAt}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(deployment.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2 bg-gray-900 border-gray-800 hover:bg-gray-800"
            onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
          >
            <Globe className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">Vercel Dashboard</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2 bg-gray-900 border-gray-800 hover:bg-gray-800"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            <GitBranch className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400">GitHub Repo</span>
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}

export default MobileDeploy;
