/**
 * Visual Canvas Component - Lovable Style Dark Theme
 * React Flow canvas for visual workspace builder
 */

import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './ComponentNodes';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Grid3X3, Layers } from 'lucide-react';

interface VisualCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  className?: string;
}

export function VisualCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  className = '',
}: VisualCanvasProps) {
  const [canvasNodes, setNodes, onNodesChangeInternal] = useNodesState(nodes);
  const [canvasEdges, setEdges, onEdgesChangeInternal] = useEdgesState(edges);

  // Sync external nodes/edges with internal state
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  // Handle connections
  const handleConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(
        {
          ...params,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: '#6366f1' },
        },
        canvasEdges
      );
      setEdges(newEdge);
      onConnect(params);
    },
    [canvasEdges, setEdges, onConnect]
  );

  // Combine internal and external change handlers
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
      onNodesChange(changes);
    },
    [onNodesChangeInternal, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes);
      onEdgesChange(changes);
    },
    [onEdgesChangeInternal, onEdgesChange]
  );

  // Canvas controls
  const handleZoomIn = useCallback(() => {
    // Zoom in functionality can be added with ref
  }, []);

  const handleZoomOut = useCallback(() => {
    // Zoom out functionality can be added with ref
  }, []);

  const handleFitView = useCallback(() => {
    // Fit view functionality can be added with ref
  }, []);

  const handleReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  return (
    <div className={`relative w-full h-full bg-[#0d0d0d] ${className}`}>
      <ReactFlow
        nodes={canvasNodes}
        edges={canvasEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#0d0d0d]"
        connectionLineType="smoothstep"
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: '#6366f1' },
        }}
        // 🚀 PERFORMANCE: Node virtualization - only render visible nodes
        onlyRenderVisibleElements={true}
        // Additional performance optimizations
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        minZoom={0.1}
        maxZoom={4}
      >
        {/* Dark grid background */}
        <Background color="#2a2a2a" gap={20} size={1} />
        
        {/* Dark styled controls */}
        <Controls 
          className="!bg-[#1a1a1a] !border-[#2a2a2a] !rounded-lg !shadow-lg [&>button]:!bg-[#1a1a1a] [&>button]:!border-[#2a2a2a] [&>button]:!text-gray-400 [&>button:hover]:!bg-[#2a2a2a] [&>button:hover]:!text-white"
          position="bottom-right"
        />
        
        {/* Dark styled minimap */}
        <MiniMap
          className="!bg-[#1a1a1a] !border-[#2a2a2a] !rounded-lg"
          maskColor="rgba(0, 0, 0, 0.7)"
          nodeColor={(node) => {
            switch (node.type) {
              case 'uiComponent':
                return '#3b82f6';
              case 'apiService':
                return '#22c55e';
              case 'dataFlow':
                return '#a855f7';
              case 'database':
                return '#f97316';
              case 'customComponent':
                return '#6366f1';
              case 'executionStep':
                // Color based on status
                const status = node.data?.status;
                if (status === 'completed') return '#10b981';
                if (status === 'running') return '#3b82f6';
                if (status === 'failed') return '#ef4444';
                return '#4a4a4a';
              default:
                return '#4a4a4a';
            }
          }}
          position="bottom-left"
        />
        
        {/* Lovable-style floating toolbar */}
        <Panel position="top-right" className="flex gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            onClick={handleZoomIn} 
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            onClick={handleZoomOut} 
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-[#2a2a2a] self-center" />
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            onClick={handleFitView} 
            title="Fit View"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            title="Toggle Grid"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            title="Layers"
          >
            <Layers className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-[#2a2a2a] self-center" />
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleReset} 
            title="Reset Canvas"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </Panel>
      </ReactFlow>
      
      {/* Empty state overlay when no nodes */}
      {canvasNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
              <Layers className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-gray-400 font-medium mb-2">Empty Canvas</h3>
            <p className="text-gray-600 text-sm max-w-[250px]">
              Use the chat to describe what you want to build, or drag components onto the canvas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
