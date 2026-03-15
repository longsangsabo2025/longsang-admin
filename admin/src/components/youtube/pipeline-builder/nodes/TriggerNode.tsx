/**
 * 💡 TriggerNode — Start node for pipeline (topic/transcript/batch input)
 */

import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import type { PipelineNodeData } from '@/services/pipeline/pipeline-builder-types';

function TriggerNodeComponent({
  data: rawData,
  selected,
}: {
  data: Record<string, unknown>;
  selected?: boolean;
}) {
  const data = rawData as unknown as PipelineNodeData;
  const statusColors: Record<string, string> = {
    idle: 'border-amber-400/50',
    running: 'border-amber-400 shadow-amber-400/30 shadow-lg animate-pulse',
    completed: 'border-green-400 shadow-green-400/20 shadow-md',
    failed: 'border-red-400 shadow-red-400/20 shadow-md',
  };

  return (
    <div
      className={`
        relative rounded-xl border-2 px-4 py-3 min-w-[160px]
        bg-gradient-to-br from-amber-500/10 to-amber-600/5
        dark:from-amber-500/20 dark:to-amber-700/10
        ${statusColors[data.runStatus || 'idle']}
        ${selected ? 'ring-2 ring-white/50' : ''}
        transition-all duration-300
      `}
    >
      {/* Status indicator dot */}
      {data.runStatus && data.runStatus !== 'idle' && (
        <div
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
            data.runStatus === 'running'
              ? 'bg-amber-400 animate-ping'
              : data.runStatus === 'completed'
                ? 'bg-green-400'
                : 'bg-red-400'
          }`}
        />
      )}

      <div className="flex items-center gap-2">
        <span className="text-xl">{data.icon}</span>
        <div>
          <div className="text-sm font-semibold text-foreground">{data.label}</div>
          <div className="text-[10px] text-muted-foreground">Trigger</div>
        </div>
      </div>

      {/* Topic preview */}
      {data.config.topic && (
        <div className="mt-2 text-[10px] text-muted-foreground truncate max-w-[140px]">
          {String(data.config.topic)}
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-amber-600"
      />
    </div>
  );
}

export const TriggerNode = memo(TriggerNodeComponent);
