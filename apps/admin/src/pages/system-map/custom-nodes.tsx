/**
 * Custom ReactFlow node components for SystemMap
 */

import { Handle, Position, NodeProps } from 'reactflow';
import {
  Brain,
  Database,
  Globe,
  LayoutGrid,
  Server,
  Workflow,
} from 'lucide-react';

export function FrontendNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-2 border-blue-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-300" />
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-300" />
    </div>
  );
}

export function BackendNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg border-2 border-green-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-green-300" />
      <div className="flex items-center gap-2">
        <Server className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-300" />
    </div>
  );
}

export function AINode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg border-2 border-purple-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-300" />
      <Handle type="target" position={Position.Left} className="!bg-purple-300" />
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-300" />
      <Handle type="source" position={Position.Right} className="!bg-purple-300" />
    </div>
  );
}

export function DatabaseNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg border-2 border-orange-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-orange-300" />
      <Handle type="target" position={Position.Left} className="!bg-orange-300" />
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-orange-300" />
    </div>
  );
}

export function ExternalNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg border-2 border-red-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-red-300" />
      <Handle type="target" position={Position.Left} className="!bg-red-300" />
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-red-300" />
    </div>
  );
}

export function AutomationNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg border-2 border-cyan-400 min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-cyan-300" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-300" />
      <div className="flex items-center gap-2">
        <Workflow className="h-5 w-5" />
        <div>
          <div className="font-bold text-sm">{data.label}</div>
          {data.sublabel && <div className="text-xs opacity-80">{data.sublabel}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-300" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-300" />
    </div>
  );
}


