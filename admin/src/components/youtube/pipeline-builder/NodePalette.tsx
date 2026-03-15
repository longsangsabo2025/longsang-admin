/**
 * 🎨 NodePalette — Draggable node library sidebar
 *
 * Users drag node types from here onto the canvas to add them.
 */
import { type DragEvent } from 'react';
import { NODE_REGISTRY, type NodeCategory } from '@/services/pipeline/pipeline-builder-types';

const CATEGORY_META: Record<NodeCategory, { label: string; icon: string; color: string }> = {
  trigger: { label: 'Triggers', icon: '⚡', color: 'text-amber-500' },
  agent: { label: 'AI Agents', icon: '🤖', color: 'text-blue-500' },
  transform: { label: 'Transforms', icon: '🔄', color: 'text-teal-500' },
  logic: { label: 'Logic', icon: '🔀', color: 'text-orange-500' },
  output: { label: 'Outputs', icon: '📤', color: 'text-gray-500' },
};

const CATEGORY_ORDER: NodeCategory[] = ['trigger', 'agent', 'transform', 'logic', 'output'];

function onDragStart(event: DragEvent, nodeType: string, data: string) {
  event.dataTransfer.setData('application/reactflow-type', nodeType);
  event.dataTransfer.setData('application/reactflow-data', data);
  event.dataTransfer.effectAllowed = 'move';
}

export function NodePalette() {
  return (
    <div className="w-[220px] border-r border-border bg-card/50 overflow-y-auto">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">🧩 Modules</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Kéo module vào canvas</p>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const meta = CATEGORY_META[cat];
        const nodes = NODE_REGISTRY.filter((n) => n.category === cat);

        return (
          <div key={cat} className="p-2">
            <div className={`text-xs font-semibold ${meta.color} mb-1.5 flex items-center gap-1`}>
              <span>{meta.icon}</span>
              {meta.label}
            </div>
            <div className="space-y-1">
              {nodes.map((entry) => {
                const flowNodeType =
                  cat === 'trigger'
                    ? 'trigger-node'
                    : cat === 'agent'
                      ? 'agent-node'
                      : cat === 'transform'
                        ? 'transform-node'
                        : cat === 'logic'
                          ? 'condition-node'
                          : 'output-node';

                return (
                  <div
                    key={entry.type}
                    className="
                      flex items-center gap-2 px-2.5 py-2 rounded-lg
                      bg-muted/50 hover:bg-muted cursor-grab active:cursor-grabbing
                      border border-transparent hover:border-border
                      transition-colors duration-150
                    "
                    draggable
                    onDragStart={(e) =>
                      onDragStart(
                        e,
                        flowNodeType,
                        JSON.stringify({
                          type: entry.type,
                          label: entry.label,
                          icon: entry.icon,
                          color: entry.color,
                          category: entry.category,
                          config: { ...entry.defaultConfig },
                        })
                      )
                    }
                  >
                    <span className="text-base">{entry.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {entry.label}
                      </div>
                      <div className="text-[9px] text-muted-foreground truncate">
                        {entry.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
