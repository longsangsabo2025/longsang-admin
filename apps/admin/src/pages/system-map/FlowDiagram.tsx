/**
 * FlowDiagram component with legend for SystemMap
 */

import { Node, Edge } from 'reactflow';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FrontendNode,
  BackendNode,
  AINode,
  DatabaseNode,
  ExternalNode,
  AutomationNode,
} from './custom-nodes';

const nodeTypes = {
  frontend: FrontendNode,
  backend: BackendNode,
  ai: AINode,
  database: DatabaseNode,
  external: ExternalNode,
  automation: AutomationNode,
};

// ============================================================
// PROPS
// ============================================================

export interface FlowDiagramProps {
  nodes: Node[];
  edges: Edge[];
  title: string;
  description: string;
}

// ============================================================
// LEGEND
// ============================================================

function DiagramLegend() {
  const items = [
    { color: 'bg-blue-500', label: 'Frontend' },
    { color: 'bg-green-500', label: 'Backend' },
    { color: 'bg-purple-500', label: 'AI Services' },
    { color: 'bg-orange-500', label: 'Database' },
    { color: 'bg-red-500', label: 'External APIs' },
    { color: 'bg-cyan-500', label: 'Automation' },
  ];

  return (
    <div className="flex flex-wrap gap-3 p-3 bg-background/80 backdrop-blur rounded-lg border">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded', item.color)} />
          <span className="text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// FLOW DIAGRAM
// ============================================================

export function FlowDiagram({
  nodes: initialNodesProp,
  edges: initialEdgesProp,
  title,
  description,
}: FlowDiagramProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodesProp);
  const [edges, , onEdgesChange] = useEdgesState(initialEdgesProp);

  return (
    <Card className="h-[600px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[500px] p-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-muted/30"
        >
          <Background color="#ddd" gap={20} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              switch (node.type) {
                case 'frontend':
                  return '#3b82f6';
                case 'backend':
                  return '#22c55e';
                case 'ai':
                  return '#a855f7';
                case 'database':
                  return '#f97316';
                case 'external':
                  return '#ef4444';
                case 'automation':
                  return '#06b6d4';
                default:
                  return '#888';
              }
            }}
          />
          <Panel position="bottom-left">
            <DiagramLegend />
          </Panel>
        </ReactFlow>
      </CardContent>
    </Card>
  );
}
