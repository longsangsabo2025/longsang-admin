/**
 * 🎨 PipelineCanvas — Main React Flow visual pipeline editor
 *
 * Features:
 * - Drag & drop nodes from palette
 * - Connect nodes with edges
 * - Load/save templates
 * - Run pipeline through graph executor
 */

import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { type DragEvent, useCallback, useRef, useState } from 'react';
import '@xyflow/react/dist/style.css';

import type {
  PipelineNodeData,
  PipelineTemplate,
  SerializedEdge,
  SerializedNode,
} from '@/services/pipeline/pipeline-builder-types';
import {
  executeGraph,
  type GraphExecutionCallbacks,
} from '@/services/pipeline/pipeline-graph-executor';
import type { GenerateRequest } from '@/services/pipeline/types';
import { nodeTypes } from './nodes';

interface PipelineCanvasProps {
  onNodesChange?: (count: number) => void;
  onEdgesChange?: (count: number) => void;
  /** Ref to expose imperative methods (load template, get state, run) */
  canvasRef?: React.MutableRefObject<PipelineCanvasHandle | null>;
}

export interface PipelineCanvasHandle {
  loadTemplate: (template: PipelineTemplate) => void;
  getState: () => { nodes: SerializedNode[]; edges: SerializedEdge[] };
  clear: () => void;
  run: (baseReq: GenerateRequest) => Promise<{ runId: string }>;
  updateNodeData: (nodeId: string, data: Partial<PipelineNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  isRunning: boolean;
}

let nodeIdCounter = 0;
function nextNodeId() {
  return `node-${Date.now()}-${++nodeIdCounter}`;
}

/** Helper: build a Node from PipelineNodeData, casting data for React Flow compatibility */
function makeNode(
  id: string,
  type: string,
  position: { x: number; y: number },
  data: PipelineNodeData
): Node {
  return { id, type, position, data: data as unknown as Record<string, unknown> };
}

/** Helper: extract PipelineNodeData from a React Flow Node */
function nodeData(n: Node): PipelineNodeData {
  return n.data as unknown as PipelineNodeData;
}

export function PipelineCanvas({ onNodesChange, onEdgesChange, canvasRef }: PipelineCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChangeHandler] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeHandler] = useEdgesState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Track counts for parent — use refs to avoid stale closures
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const handleNodesChange: typeof onNodesChangeHandler = useCallback(
    (changes) => {
      onNodesChangeHandler(changes);
      setTimeout(() => onNodesChange?.(nodesRef.current.length), 0);
    },
    [onNodesChangeHandler, onNodesChange]
  );

  const handleEdgesChange: typeof onEdgesChangeHandler = useCallback(
    (changes) => {
      onEdgesChangeHandler(changes);
      setTimeout(() => onEdgesChange?.(edgesRef.current.length), 0);
    },
    [onEdgesChangeHandler, onEdgesChange]
  );

  // ─── Connect edges ───
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  // ─── Drag & drop from palette ───
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type');
      const dataStr = event.dataTransfer.getData('application/reactflow-data');
      if (!type || !dataStr) return;

      const data = JSON.parse(dataStr) as PipelineNodeData;

      const position = rfInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) || { x: 100, y: 100 };

      setNodes((nds) => [...nds, makeNode(nextNodeId(), type, position, data)]);
    },
    [rfInstance, setNodes]
  );

  // ─── Template loading ───
  const loadTemplate = useCallback(
    (template: PipelineTemplate) => {
      const newNodes = template.nodes.map((n) =>
        makeNode(n.id, n.type, n.position, { ...n.data, runStatus: 'idle' as const })
      );

      const newEdges: Edge[] = template.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        animated: e.animated ?? true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
    },
    [setNodes, setEdges]
  );

  // ─── Get current state ───
  const getState = useCallback((): { nodes: SerializedNode[]; edges: SerializedEdge[] } => {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type || 'agent-node',
        position: n.position,
        data: nodeData(n),
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        animated: e.animated,
      })),
    };
  }, [nodes, edges]);

  // ─── Update a single node's data ───
  const updateNodeData = useCallback(
    (nodeId: string, partial: Partial<PipelineNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? makeNode(n.id, n.type || 'agent-node', n.position, { ...nodeData(n), ...partial })
            : n
        )
      );
    },
    [setNodes]
  );

  // ─── Delete a node (and its connected edges) ───
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  // ─── Clear canvas ───
  const clear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // ─── Run pipeline ───
  const run = useCallback(
    async (baseReq: GenerateRequest) => {
      setIsRunning(true);

      // Reset all node statuses
      setNodes((nds) =>
        nds.map((n) =>
          makeNode(n.id, n.type || 'agent-node', n.position, {
            ...nodeData(n),
            runStatus: 'idle',
            runError: undefined,
          })
        )
      );

      const state = getState();

      const callbacks: GraphExecutionCallbacks = {
        onNodeStart: (nodeId) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? makeNode(n.id, n.type || 'agent-node', n.position, {
                    ...nodeData(n),
                    runStatus: 'running',
                  })
                : n
            )
          );
        },
        onNodeComplete: (nodeId, result) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? makeNode(n.id, n.type || 'agent-node', n.position, {
                    ...nodeData(n),
                    runStatus:
                      result.status === 'skipped'
                        ? 'skipped'
                        : result.status === 'completed'
                          ? 'completed'
                          : 'failed',
                    runError: result.error,
                  })
                : n
            )
          );
        },
      };

      try {
        const graphResult = await executeGraph(
          state.nodes,
          state.edges,
          baseReq,
          'canvas',
          callbacks
        );
        return { runId: graphResult.runId };
      } finally {
        setIsRunning(false);
      }
    },
    [getState, setNodes]
  );

  // ─── Expose imperative handle ───
  if (canvasRef) {
    canvasRef.current = {
      loadTemplate,
      getState,
      clear,
      run,
      updateNodeData,
      deleteNode,
      isRunning,
    };
  }

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full relative">
      {/* Empty state overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 rounded-2xl bg-card/80 backdrop-blur border border-dashed border-border max-w-sm">
            <div className="text-4xl mb-3">🧩</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Pipeline Builder</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Kéo thả module từ panel bên trái vào đây, hoặc chọn template sẵn ở toolbar.
            </p>
            <div className="text-[11px] text-muted-foreground/70 space-y-1">
              <p>
                ⌨️ <strong>Delete</strong> — xóa node đang chọn
              </p>
              <p>
                ⌨️ <strong>Ctrl+S</strong> — lưu pipeline
              </p>
              <p>🖱️ Kéo từ ● output → ● input để kết nối</p>
            </div>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!bg-background" />
        <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
        <MiniMap
          className="!bg-card !border-border"
          maskColor="rgba(0,0,0,0.2)"
          nodeColor={(n) => {
            const data = nodeData(n);
            if (data.runStatus === 'completed') return '#22c55e';
            if (data.runStatus === 'running') return '#3b82f6';
            if (data.runStatus === 'failed') return '#ef4444';
            if (data.category === 'trigger') return '#f59e0b';
            if (data.category === 'agent') return '#6366f1';
            if (data.category === 'transform') return '#14b8a6';
            if (data.category === 'output') return '#6b7280';
            return '#94a3b8';
          }}
        />
      </ReactFlow>
    </div>
  );
}
