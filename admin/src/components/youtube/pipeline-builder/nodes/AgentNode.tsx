/**
 * 🤖 AgentNode — AI processing step (script-writer, storyboard, image-gen, etc.)
 */

import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import type { PipelineNodeData } from '@/services/pipeline/pipeline-builder-types';

const CATEGORY_GRADIENT: Record<string, string> = {
  agent: 'from-blue-500/10 to-indigo-600/5 dark:from-blue-500/20 dark:to-indigo-700/10',
  transform: 'from-teal-500/10 to-emerald-600/5 dark:from-teal-500/20 dark:to-emerald-700/10',
};

const STATUS_BORDER: Record<string, string> = {
  idle: 'border-slate-300 dark:border-slate-600',
  running: 'border-blue-400 shadow-blue-400/30 shadow-lg',
  completed: 'border-green-400 shadow-green-400/20 shadow-md',
  failed: 'border-red-400 shadow-red-400/20 shadow-md',
  skipped: 'border-gray-400 opacity-50',
};

function AgentNodeComponent({
  data: rawData,
  selected,
}: {
  data: Record<string, unknown>;
  selected?: boolean;
}) {
  const data = rawData as unknown as PipelineNodeData;
  const gradient = CATEGORY_GRADIENT[data.category] || CATEGORY_GRADIENT.agent;
  const border = STATUS_BORDER[data.runStatus || 'idle'];

  // Determine number of input handles
  const hasMultipleInputs = data.type === 'assembly'; // assembly takes images + audio + storyboard

  return (
    <div
      className={`
        relative rounded-xl border-2 px-4 py-3 min-w-[180px]
        bg-gradient-to-br ${gradient}
        ${border}
        ${selected ? 'ring-2 ring-white/50' : ''}
        ${data.runStatus === 'running' ? 'animate-pulse' : ''}
        transition-all duration-300
      `}
    >
      {/* Status indicator */}
      {data.runStatus && data.runStatus !== 'idle' && (
        <div
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
            data.runStatus === 'running'
              ? 'bg-blue-400 animate-ping'
              : data.runStatus === 'completed'
                ? 'bg-green-400'
                : data.runStatus === 'failed'
                  ? 'bg-red-400'
                  : 'bg-gray-400'
          }`}
        />
      )}

      {/* Color stripe */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${data.color}`} />

      <div className="flex items-center gap-2 ml-2">
        <span className="text-xl">{data.icon}</span>
        <div>
          <div className="text-sm font-semibold text-foreground">{data.label}</div>
          <div className="text-[10px] text-muted-foreground capitalize">{data.category}</div>
        </div>
      </div>

      {/* Config summary */}
      {data.config.model && (
        <div className="mt-1.5 ml-2 flex gap-1 flex-wrap">
          <span className="text-[9px] bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5">
            {String(data.config.model)}
          </span>
          {Number(data.config.scenes) > 0 && (
            <span className="text-[9px] bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5">
              {String(data.config.scenes)} scenes
            </span>
          )}
          {Number(data.config.duration) > 0 && (
            <span className="text-[9px] bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5">
              {String(data.config.duration)}s
            </span>
          )}
          {Boolean(data.config.fullPipelineMode) && (
            <span className="text-[9px] bg-blue-500/20 text-blue-400 rounded px-1.5 py-0.5 font-medium">
              ⚡ Full
            </span>
          )}
        </div>
      )}

      {/* Error display */}
      {data.runError && (
        <div className="mt-1.5 ml-2 text-[10px] text-red-500 truncate max-w-[160px]">
          ❌ {data.runError}
        </div>
      )}

      {/* Input handle(s) */}
      {hasMultipleInputs ? (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="input-1"
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600"
            style={{ top: '30%' }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="input-2"
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600"
            style={{ top: '50%' }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="input-3"
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600"
            style={{ top: '70%' }}
          />
        </>
      ) : (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600"
        />
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-600"
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
