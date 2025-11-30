/**
 * Visual Workspace Component Nodes
 * Custom React Flow nodes for UI components, APIs, and data flows
 */

import { cn } from '@/lib/utils';
import {
  Box,
  Code,
  Database,
  FileText,
  FormInput,
  Globe,
  Image,
  Layout,
  MousePointerClick,
  Zap,
} from 'lucide-react';
import { Handle, NodeProps, Position } from 'reactflow';
import { ExecutionStepNode } from './ExecutionStepNodes';

// Base node style
const baseNodeStyle = 'px-4 py-3 rounded-xl text-white shadow-lg border-2 min-w-[140px]';

// UI Component Node
export function UIComponentNode({ data, selected }: NodeProps) {
  const iconMap: Record<string, typeof Box> = {
    button: MousePointerClick,
    form: FormInput,
    card: Layout,
    image: Image,
    text: FileText,
    default: Box,
  };

  const Icon = iconMap[data.componentType] || iconMap.default;

  return (
    <div
      className={cn(
        baseNodeStyle,
        'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400',
        selected && 'ring-2 ring-blue-300 ring-offset-2'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-300" />
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label || data.componentType}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-300" />
    </div>
  );
}

// API Service Node
export function APIServiceNode({ data, selected }: NodeProps) {
  return (
    <div
      className={cn(
        baseNodeStyle,
        'bg-gradient-to-br from-green-500 to-green-600 border-green-400',
        selected && 'ring-2 ring-green-300 ring-offset-2'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-green-300" />
      <Handle type="target" position={Position.Left} className="!bg-green-300" />
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label || 'API Service'}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
          {data.method && (
            <div className="text-xs opacity-80 mt-1">
              <span className="px-1.5 py-0.5 bg-white/20 rounded">{data.method}</span>
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-300" />
      <Handle type="source" position={Position.Right} className="!bg-green-300" />
    </div>
  );
}

// Data Flow Node
export function DataFlowNode({ data, selected }: NodeProps) {
  return (
    <div
      className={cn(
        baseNodeStyle,
        'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400',
        selected && 'ring-2 ring-purple-300 ring-offset-2'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-300" />
      <Handle type="target" position={Position.Left} className="!bg-purple-300" />
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label || 'Data Flow'}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-300" />
      <Handle type="source" position={Position.Right} className="!bg-purple-300" />
    </div>
  );
}

// Database Node
export function DatabaseNode({ data, selected }: NodeProps) {
  return (
    <div
      className={cn(
        baseNodeStyle,
        'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400',
        selected && 'ring-2 ring-orange-300 ring-offset-2'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-300" />
      <Handle type="target" position={Position.Left} className="!bg-orange-300" />
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label || 'Database'}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-orange-300" />
    </div>
  );
}

// Custom Component Node
export function CustomComponentNode({ data, selected }: NodeProps) {
  return (
    <div
      className={cn(
        baseNodeStyle,
        'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-400',
        selected && 'ring-2 ring-indigo-300 ring-offset-2'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-300" />
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label || 'Custom Component'}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-300" />
    </div>
  );
}

// Export node types mapping
export const nodeTypes = {
  uiComponent: UIComponentNode,
  apiService: APIServiceNode,
  dataFlow: DataFlowNode,
  database: DatabaseNode,
  customComponent: CustomComponentNode,
  executionStep: ExecutionStepNode,
};

// Re-export ExecutionStepNode types
export type { ExecutionStepStatus, ExecutionStepData } from './ExecutionStepNodes';
