/**
 * 🔀 ConditionNode — Branch logic node
 */

import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import type { PipelineNodeData } from '@/services/pipeline/pipeline-builder-types';

function ConditionNodeComponent({
  data: rawData,
  selected,
}: {
  data: Record<string, unknown>;
  selected?: boolean;
}) {
  const data = rawData as unknown as PipelineNodeData;
  return (
    <div
      className={`
        relative rounded-xl border-2 px-4 py-3 min-w-[140px]
        bg-gradient-to-br from-orange-500/10 to-orange-600/5
        dark:from-orange-500/20 dark:to-orange-700/10
        border-orange-400/50
        ${selected ? 'ring-2 ring-white/50' : ''}
        transition-all duration-300
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{data.icon}</span>
        <div>
          <div className="text-sm font-semibold text-foreground">{data.label}</div>
          <div className="text-[10px] text-muted-foreground">Logic</div>
        </div>
      </div>

      {/* Condition preview */}
      {data.type === 'condition' && data.config.field && (
        <div className="mt-1 text-[10px] text-muted-foreground font-mono">
          {String(data.config.field)} {String(data.config.operator)} {String(data.config.value)}
        </div>
      )}
      {data.type === 'delay' && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          Wait {(Number(data.config.delayMs) / 1000).toFixed(1)}s
        </div>
      )}

      {/* Input */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600"
      />

      {/* Output(s) */}
      {data.type === 'condition' ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="!w-3 !h-3 !bg-green-400 !border-2 !border-green-600"
            style={{ top: '35%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="!w-3 !h-3 !bg-red-400 !border-2 !border-red-600"
            style={{ top: '65%' }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!w-3 !h-3 !bg-orange-400 !border-2 !border-orange-600"
        />
      )}
    </div>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
