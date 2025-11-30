/**
 * 🚀 Global Upload Widget
 *
 * Floating widget that shows upload progress globally
 * Place this once in your app layout (e.g., App.tsx or Layout.tsx)
 *
 * Features:
 * - Shows active uploads count
 * - Expandable to see all uploads
 * - Persists across route changes
 * - Auto-hides when no uploads
 */

import { useEffect, useState } from 'react';
import { uploadManager, UploadManagerState } from '@/services/uploadManager';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Upload,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  Trash2,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalUploadWidget() {
  const [state, setState] = useState<UploadManagerState>({ tasks: [], isProcessing: false });
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const unsubscribe = uploadManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const activeTasks = state.tasks.filter(
    (t) => t.status === 'pending' || t.status === 'uploading' || t.status === 'processing'
  );
  const completedTasks = state.tasks.filter((t) => t.status === 'completed');
  const failedTasks = state.tasks.filter((t) => t.status === 'failed');
  const recentTasks = state.tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && Date.now() - t.completedAt < 60000
  );

  const hasActiveTasks = activeTasks.length > 0;
  const hasRecentActivity = recentTasks.length > 0 || failedTasks.length > 0;

  // Auto-hide if no activity
  if (!hasActiveTasks && !hasRecentActivity) {
    return null;
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Minimized view - just a small badge
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50" onClick={() => setIsMinimized(false)}>
        <Button
          variant="default"
          size="sm"
          className={cn(
            'rounded-full shadow-lg',
            hasActiveTasks
              ? 'bg-blue-500 hover:bg-blue-600'
              : failedTasks.length > 0
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
          )}
        >
          {hasActiveTasks ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : failedTasks.length > 0 ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span className="ml-1">
            {hasActiveTasks
              ? activeTasks.length
              : failedTasks.length > 0
                ? failedTasks.length
                : recentTasks.length}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-3 cursor-pointer',
          hasActiveTasks
            ? 'bg-blue-500/10'
            : failedTasks.length > 0
              ? 'bg-red-500/10'
              : 'bg-green-500/10'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {hasActiveTasks ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : failedTasks.length > 0 ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          <span className="font-medium text-sm">
            {hasActiveTasks
              ? `Đang upload ${activeTasks.length} file...`
              : failedTasks.length > 0
                ? `${failedTasks.length} upload thất bại`
                : `${recentTasks.length} upload hoàn thành`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          {/* Active uploads */}
          {activeTasks.map((task) => (
            <div key={task.id} className="p-3 border-b">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{task.fileName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => uploadManager.cancelUpload(task.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={task.progress} className="flex-1 h-1.5" />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(task.progress)}%
                </span>
              </div>
            </div>
          ))}

          {/* Failed uploads */}
          {failedTasks.map((task) => (
            <div key={task.id} className="p-3 border-b bg-red-500/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{task.fileName}</p>
                    <p className="text-xs text-red-500">{task.error}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => uploadManager.retryUpload(task.id)}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Recent completed */}
          {recentTasks.map((task) => (
            <div key={task.id} className="p-3 border-b bg-green-500/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span className="text-sm truncate flex-1">{task.fileName}</span>
                <span className="text-xs text-muted-foreground">{formatSize(task.fileSize)}</span>
              </div>
            </div>
          ))}

          {/* Clear button */}
          {(completedTasks.length > 0 || failedTasks.length > 0) && (
            <div className="p-2 bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => uploadManager.clearCompleted()}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Xóa lịch sử upload
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalUploadWidget;
