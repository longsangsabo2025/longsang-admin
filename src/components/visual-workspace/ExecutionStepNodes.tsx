/**
 * Execution Step Node Component
 * Visual representation of execution steps in the visual workspace
 * Similar to Lovable AI and VSCode Copilot execution visualization
 */

import { Handle, NodeProps, Position } from 'reactflow';
import {
  CheckCircle2,
  Loader2,
  Circle,
  Clock,
  AlertCircle,
  Sparkles,
  Settings,
  Play,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Base node style
const baseNodeStyle = 'px-4 py-3 rounded-xl text-white shadow-lg border-2 min-w-[140px]';

export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ExecutionStepData {
  label: string;
  description?: string;
  status: ExecutionStepStatus;
  stepType: 'planning' | 'generation' | 'review' | 'execution' | 'completed';
  progress?: number;
  duration?: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export function ExecutionStepNode({ data, selected }: NodeProps<ExecutionStepData>) {
  const stepData = data as ExecutionStepData;
  const { status, stepType, label, description, progress, duration, error } = stepData;

  // Icon mapping
  const iconMap = {
    planning: Settings,
    generation: Sparkles,
    review: Eye,
    execution: Play,
    completed: CheckCircle2,
  };

  const Icon = iconMap[stepType] || Circle;

  // Status colors
  const statusColors = {
    pending: 'from-gray-400 to-gray-500 border-gray-300',
    running: 'from-blue-500 to-blue-600 border-blue-400',
    completed: 'from-green-500 to-green-600 border-green-400',
    failed: 'from-red-500 to-red-600 border-red-400',
  };

  // Status icons
  const statusIconMap = {
    pending: <Circle className="h-4 w-4 text-gray-400" />,
    running: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <AlertCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <div
      className={cn(
        baseNodeStyle,
        `bg-gradient-to-br ${statusColors[status]}`,
        selected && 'ring-2 ring-offset-2',
        status === 'running' && 'ring-blue-300',
        status === 'completed' && 'ring-green-300',
        status === 'failed' && 'ring-red-300'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/30" />

      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          {statusIconMap[status]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4" />
            <div className="font-bold text-sm truncate">{label}</div>
          </div>

          {description && (
            <div className="text-xs opacity-80 line-clamp-2 mb-2">{description}</div>
          )}

          {progress !== undefined && status === 'running' && (
            <div className="mt-2">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/60 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs opacity-70 mt-1">{progress}%</div>
            </div>
          )}

          {duration && (
            <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
              <Clock className="h-3 w-3" />
              {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`}
            </div>
          )}

          {error && (
            <div className="mt-2 text-xs bg-white/20 p-2 rounded border border-red-300">
              ❌ {error}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-white/30" />
    </div>
  );
}

