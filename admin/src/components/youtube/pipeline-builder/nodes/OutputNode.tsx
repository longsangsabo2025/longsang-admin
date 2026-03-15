/**
 * 💾 OutputNode — Terminal node (file export, YouTube upload)
 */

import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import type { PipelineNodeData } from '@/services/pipeline/pipeline-builder-types';

function OutputNodeComponent({
  data: rawData,
  selected,
}: {
  data: Record<string, unknown>;
  selected?: boolean;
}) {
  const data = rawData as unknown as PipelineNodeData;
  const statusDot =
    data.runStatus === 'completed'
      ? 'bg-green-400'
      : data.runStatus === 'failed'
        ? 'bg-red-400'
        : data.runStatus === 'running'
          ? 'bg-gray-400 animate-ping'
          : '';

  return (
    <div
      className={`
        relative rounded-xl border-2 border-dashed px-4 py-3 min-w-[150px]
        bg-gradient-to-br from-gray-500/10 to-gray-600/5
        dark:from-gray-500/20 dark:to-gray-700/10
        border-gray-400/50
        ${selected ? 'ring-2 ring-white/50' : ''}
        transition-all duration-300
      `}
    >
      {statusDot && (
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusDot}`} />
      )}

      <div className="flex items-center gap-2">
        <span className="text-xl">{data.icon}</span>
        <div>
          <div className="text-sm font-semibold text-foreground">{data.label}</div>
          <div className="text-[10px] text-muted-foreground">Output</div>
        </div>
      </div>

      {/* Format preview */}
      {data.config.exportFormat && (
        <div className="mt-1 text-[10px] text-muted-foreground uppercase">
          {String(data.config.exportFormat)}
        </div>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600"
      />
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent);
