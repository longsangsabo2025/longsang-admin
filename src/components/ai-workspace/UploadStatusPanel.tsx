/**
 * 🚀 Upload Status Panel - Shows upload progress globally
 * 
 * This component can be placed anywhere in the app
 * and will show active/completed uploads from the global manager
 */

import { useEffect, useState } from 'react';
import { uploadManager, UploadManagerState, UploadTask } from '@/services/uploadManager';
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
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadStatusPanelProps {
  className?: string;
  showCompleted?: boolean;
  compact?: boolean;
}

export function UploadStatusPanel({ 
  className, 
  showCompleted = true,
  compact = false 
}: UploadStatusPanelProps) {
  const [state, setState] = useState<UploadManagerState>({ tasks: [], isProcessing: false });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = uploadManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const activeTasks = state.tasks.filter(t => 
    t.status === 'pending' || t.status === 'uploading' || t.status === 'processing'
  );
  const completedTasks = state.tasks.filter(t => t.status === 'completed');
  const failedTasks = state.tasks.filter(t => t.status === 'failed');

  const hasActiveTasks = activeTasks.length > 0;
  const hasTasks = state.tasks.length > 0;

  if (!hasTasks) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getStatusIcon = (task: UploadTask) => {
    switch (task.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Upload className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (task: UploadTask) => {
    switch (task.status) {
      case 'pending':
        return 'Đang chờ...';
      case 'uploading':
        return `Đang upload... ${Math.round(task.progress)}%`;
      case 'processing':
        return 'Đang xử lý...';
      case 'completed':
        return 'Hoàn thành ✅';
      case 'failed':
        return task.error || 'Thất bại';
      default:
        return task.status;
    }
  };

  if (compact) {
    return (
      <div className={cn(
        'fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg',
        className
      )}>
        <div 
          className="flex items-center gap-2 p-3 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {hasActiveTasks ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : failedTasks.length > 0 ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {hasActiveTasks 
              ? `Đang upload ${activeTasks.length} file...`
              : `${completedTasks.length} hoàn thành${failedTasks.length > 0 ? `, ${failedTasks.length} thất bại` : ''}`
            }
          </span>
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        
        {!isCollapsed && (
          <div className="max-h-64 overflow-y-auto border-t">
            {state.tasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                formatSize={formatSize}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
              />
            ))}
            {(completedTasks.length > 0 || failedTasks.length > 0) && (
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => uploadManager.clearCompleted()}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Xóa lịch sử
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Active uploads */}
      {activeTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang upload ({activeTasks.length})
          </h4>
          {activeTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              formatSize={formatSize}
              getStatusIcon={getStatusIcon}
              getStatusText={getStatusText}
            />
          ))}
        </div>
      )}

      {/* Failed uploads */}
      {failedTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-red-500">
            <XCircle className="h-4 w-4" />
            Thất bại ({failedTasks.length})
          </h4>
          {failedTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              formatSize={formatSize}
              getStatusIcon={getStatusIcon}
              getStatusText={getStatusText}
            />
          ))}
        </div>
      )}

      {/* Completed uploads */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Hoàn thành ({completedTasks.length})
            </h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => uploadManager.clearCompleted()}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Xóa
            </Button>
          </div>
          {completedTasks.slice(0, 5).map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              formatSize={formatSize}
              getStatusIcon={getStatusIcon}
              getStatusText={getStatusText}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: UploadTask;
  formatSize: (bytes: number) => string;
  getStatusIcon: (task: UploadTask) => React.ReactNode;
  getStatusText: (task: UploadTask) => string;
}

function TaskItem({ task, formatSize, getStatusIcon, getStatusText }: TaskItemProps) {
  return (
    <div className="p-3 border rounded-lg bg-muted/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{task.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(task.fileSize)} • {getStatusText(task)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon(task)}
          {task.status === 'failed' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => uploadManager.retryUpload(task.id)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {(task.status === 'pending' || task.status === 'uploading') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => uploadManager.cancelUpload(task.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {(task.status === 'uploading' || task.status === 'processing') && (
        <Progress value={task.progress} className="h-1 mt-2" />
      )}
    </div>
  );
}

export default UploadStatusPanel;
