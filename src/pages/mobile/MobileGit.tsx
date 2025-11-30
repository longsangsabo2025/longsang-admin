import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  Check,
  X,
  FileEdit,
  FilePlus,
  FileX,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GitFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
}

export function MobileGit() {
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('master');
  const [changedFiles, setChangedFiles] = useState<GitFile[]>([
    { path: 'src/pages/mobile/MobileDashboard.tsx', status: 'added' },
    { path: 'src/components/mobile/MobileLayout.tsx', status: 'added' },
    { path: 'vite.config.ts', status: 'modified' },
  ]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleFile = (path: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    if (selectedFiles.size === changedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(changedFiles.map((f) => f.path)));
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast({
        title: '⚠️ Thiếu commit message',
        description: 'Vui lòng nhập nội dung commit',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `git commit với message: "${commitMessage}"`,
          sessionId: 'mobile-git-commit',
          useMCPTools: true,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Commit thành công!',
          description: commitMessage,
        });
        setCommitMessage('');
        setChangedFiles([]);
        setSelectedFiles(new Set());
      }
    } catch (error) {
      toast({
        title: '❌ Lỗi commit',
        description: 'Vui lòng thử lại',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'git push origin master',
          sessionId: 'mobile-git-push',
          useMCPTools: true,
        }),
      });

      if (response.ok) {
        toast({
          title: '🚀 Push thành công!',
          description: 'Code đã được push lên remote',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Lỗi push',
        description: 'Vui lòng thử lại',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'git pull',
          sessionId: 'mobile-git-pull',
          useMCPTools: true,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Pull thành công!',
          description: 'Đã cập nhật code mới nhất',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Lỗi pull',
        description: 'Vui lòng thử lại',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: GitFile['status']) => {
    switch (status) {
      case 'modified':
        return <FileEdit className="w-4 h-4 text-yellow-400" />;
      case 'added':
        return <FilePlus className="w-4 h-4 text-green-400" />;
      case 'deleted':
        return <FileX className="w-4 h-4 text-red-400" />;
      case 'untracked':
        return <FilePlus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: GitFile['status']) => {
    switch (status) {
      case 'modified':
        return 'text-yellow-400';
      case 'added':
        return 'text-green-400';
      case 'deleted':
        return 'text-red-400';
      case 'untracked':
        return 'text-gray-400';
    }
  };

  return (
    <MobileLayout title="Git">
      <div className="p-4 space-y-6">
        {/* Branch Info */}
        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Current Branch</p>
                <p className="font-mono text-blue-400">{branch}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePull}
              disabled={loading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 bg-gray-900 border-gray-800 hover:bg-gray-800"
            onClick={handlePull}
            disabled={loading}
          >
            <div className="flex flex-col items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-orange-400" />
              <span className="text-sm">Pull</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 bg-gray-900 border-gray-800 hover:bg-gray-800"
            onClick={handlePush}
            disabled={loading}
          >
            <div className="flex flex-col items-center gap-2">
              <GitCommit className="w-5 h-5 text-green-400" />
              <span className="text-sm">Push</span>
            </div>
          </Button>
        </div>

        {/* Changed Files */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400">
              Changed Files ({changedFiles.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {selectedFiles.size === changedFiles.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="space-y-2">
            {changedFiles.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 p-6 text-center">
                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-gray-400">No changes to commit</p>
              </Card>
            ) : (
              changedFiles.map((file) => (
                <Card
                  key={file.path}
                  className={cn(
                    'bg-gray-900 border-gray-800 p-3 cursor-pointer transition-colors',
                    selectedFiles.has(file.path) && 'border-blue-500 bg-blue-500/10'
                  )}
                  onClick={() => toggleFile(file.path)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        selectedFiles.has(file.path)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-600'
                      )}
                    >
                      {selectedFiles.has(file.path) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {getStatusIcon(file.status)}
                    <span className="flex-1 text-sm font-mono truncate text-gray-300">
                      {file.path.split('/').pop()}
                    </span>
                    <span className={cn('text-xs uppercase', getStatusColor(file.status))}>
                      {file.status.charAt(0)}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Commit Section */}
        {changedFiles.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-gray-400">Commit Message</h2>
            <Input
              placeholder="Nhập commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
            <Button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90"
              onClick={handleCommit}
              disabled={loading || !commitMessage.trim()}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GitCommit className="w-4 h-4 mr-2" />
              )}
              Commit {selectedFiles.size > 0 ? `(${selectedFiles.size} files)` : 'All'}
            </Button>
          </section>
        )}
      </div>
    </MobileLayout>
  );
}

export default MobileGit;
