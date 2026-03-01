/**
 * Visual Canvas Component - Lovable Style Dark Theme
 * React Flow canvas for visual workspace builder
 *
 * Features:
 * - Multi-select (Shift+Click, Box Selection)
 * - Keyboard shortcuts (Delete, Ctrl+A/C/V/X/Z/Y/D)
 * - Right-click context menu
 * - Undo/Redo support
 * - Copy/Paste/Duplicate
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './ComponentNodes';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Grid3X3,
  Layers,
  Undo,
  Redo,
  Keyboard,
} from 'lucide-react';
import { CanvasContextMenu } from './CanvasContextMenu';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useCanvasClipboard } from '@/hooks/useCanvasClipboard';
import { useCanvasKeyboard, KEYBOARD_SHORTCUTS } from '@/hooks/useCanvasKeyboard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface VisualCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onCanvasChange?: (nodes: Node[], edges: Edge[]) => void;
  className?: string;
}

export function VisualCanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onCanvasChange,
  className = '',
}: VisualCanvasProps) {
  const [canvasNodes, setNodes, onNodesChangeInternal] = useNodesState(nodes);
  const [canvasEdges, setEdges, onEdgesChangeInternal] = useEdgesState(edges);
  const [showGrid, setShowGrid] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  // Hooks for advanced features
  const { saveState, undo, redo, canUndo, canRedo, clearHistory } = useCanvasHistory();
  const { copy, paste, cut, duplicate, hasClipboard } = useCanvasClipboard();
  const reactFlowInstance = useReactFlow();

  // Sync external nodes/edges with internal state
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  // Track selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodes(params.nodes);
  }, []);

  // Save state before changes for undo/redo
  const saveCurrentState = useCallback(
    (action: string) => {
      saveState(canvasNodes, canvasEdges, action);
    },
    [canvasNodes, canvasEdges, saveState]
  );

  // Handle connections
  const handleConnect = useCallback(
    (params: Connection) => {
      saveCurrentState('Connect nodes');
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
      onCanvasChange?.(canvasNodes, newEdge);
    },
    [canvasEdges, canvasNodes, setEdges, onConnect, onCanvasChange, saveCurrentState]
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

  // ==================== KEYBOARD SHORTCUTS ====================

  // Copy selected nodes
  const handleCopy = useCallback(() => {
    if (copy(canvasNodes, canvasEdges)) {
      toast.success('Copied to clipboard');
    }
  }, [canvasNodes, canvasEdges, copy]);

  // Cut selected nodes
  const handleCut = useCallback(() => {
    const nodesToDelete = cut(canvasNodes, canvasEdges);
    if (nodesToDelete.length > 0) {
      saveCurrentState('Cut nodes');
      setNodes((prev) => prev.filter((n) => !nodesToDelete.includes(n.id)));
      setEdges((prev) =>
        prev.filter((e) => !nodesToDelete.includes(e.source) && !nodesToDelete.includes(e.target))
      );
      toast.success('Cut to clipboard');
    }
  }, [canvasNodes, canvasEdges, cut, setNodes, setEdges, saveCurrentState]);

  // Paste from clipboard
  const handlePaste = useCallback(() => {
    const pasted = paste();
    if (pasted) {
      saveCurrentState('Paste nodes');
      // Deselect all current nodes
      setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), ...pasted.nodes]);
      setEdges((prev) => [...prev, ...pasted.edges]);
      toast.success(`Pasted ${pasted.nodes.length} node(s)`);
    }
  }, [paste, setNodes, setEdges, saveCurrentState]);

  // Delete selected nodes
  const handleDelete = useCallback(() => {
    const selected = canvasNodes.filter((n) => n.selected);
    if (selected.length === 0) return;

    // Check for locked nodes
    const lockedNodes = selected.filter((n) => n.data?.locked);
    if (lockedNodes.length > 0) {
      toast.error('Cannot delete locked nodes');
      return;
    }

    saveCurrentState('Delete nodes');
    const selectedIds = new Set(selected.map((n) => n.id));
    setNodes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setEdges((prev) =>
      prev.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target))
    );
    toast.success(`Deleted ${selected.length} node(s)`);
  }, [canvasNodes, setNodes, setEdges, saveCurrentState]);

  // Duplicate selected nodes
  const handleDuplicate = useCallback(() => {
    const duplicated = duplicate(canvasNodes, canvasEdges);
    if (duplicated) {
      saveCurrentState('Duplicate nodes');
      setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), ...duplicated.nodes]);
      setEdges((prev) => [...prev, ...duplicated.edges]);
      toast.success(`Duplicated ${duplicated.nodes.length} node(s)`);
    }
  }, [canvasNodes, canvasEdges, duplicate, setNodes, setEdges, saveCurrentState]);

  // Undo action
  const handleUndo = useCallback(() => {
    const prevState = undo();
    if (prevState) {
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      toast.info(`Undo: ${prevState.action}`);
    }
  }, [undo, setNodes, setEdges]);

  // Redo action
  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      toast.info(`Redo: ${nextState.action}`);
    }
  }, [redo, setNodes, setEdges]);

  // Select all nodes
  const handleSelectAll = useCallback(() => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: true })));
  }, [setNodes]);

  // Deselect all
  const handleEscape = useCallback(() => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: false })));
  }, [setNodes]);

  // Bring to front
  const handleBringToFront = useCallback(() => {
    saveCurrentState('Bring to front');
    setNodes((prev) => {
      const selected = prev.filter((n) => n.selected);
      const others = prev.filter((n) => !n.selected);
      return [...others, ...selected];
    });
  }, [setNodes, saveCurrentState]);

  // Send to back
  const handleSendToBack = useCallback(() => {
    saveCurrentState('Send to back');
    setNodes((prev) => {
      const selected = prev.filter((n) => n.selected);
      const others = prev.filter((n) => !n.selected);
      return [...selected, ...others];
    });
  }, [setNodes, saveCurrentState]);

  // Alignment functions
  const handleAlignLeft = useCallback(() => {
    const selected = canvasNodes.filter((n) => n.selected);
    if (selected.length < 2) return;
    saveCurrentState('Align left');
    const minX = Math.min(...selected.map((n) => n.position.x));
    setNodes((prev) =>
      prev.map((n) => (n.selected ? { ...n, position: { ...n.position, x: minX } } : n))
    );
  }, [canvasNodes, setNodes, saveCurrentState]);

  const handleAlignCenter = useCallback(() => {
    const selected = canvasNodes.filter((n) => n.selected);
    if (selected.length < 2) return;
    saveCurrentState('Align center');
    const positions = selected.map((n) => n.position.x);
    const centerX = (Math.min(...positions) + Math.max(...positions)) / 2;
    setNodes((prev) =>
      prev.map((n) => (n.selected ? { ...n, position: { ...n.position, x: centerX } } : n))
    );
  }, [canvasNodes, setNodes, saveCurrentState]);

  const handleAlignRight = useCallback(() => {
    const selected = canvasNodes.filter((n) => n.selected);
    if (selected.length < 2) return;
    saveCurrentState('Align right');
    const maxX = Math.max(...selected.map((n) => n.position.x));
    setNodes((prev) =>
      prev.map((n) => (n.selected ? { ...n, position: { ...n.position, x: maxX } } : n))
    );
  }, [canvasNodes, setNodes, saveCurrentState]);

  // Toggle lock
  const handleToggleLock = useCallback(() => {
    saveCurrentState('Toggle lock');
    setNodes((prev) =>
      prev.map((n) =>
        n.selected
          ? {
              ...n,
              draggable: n.data?.locked ? true : false,
              data: { ...n.data, locked: !n.data?.locked },
            }
          : n
      )
    );
  }, [setNodes, saveCurrentState]);

  // Add new node
  const handleAddNode = useCallback(
    (type: string) => {
      const viewport = reactFlowInstance.getViewport();
      const position = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `New ${type}`,
          type,
        },
      };

      saveCurrentState('Add node');
      setNodes((prev) => [...prev, newNode]);
      toast.success(`Added ${type} node`);
    },
    [reactFlowInstance, setNodes, saveCurrentState]
  );

  // Register keyboard shortcuts
  useCanvasKeyboard({
    onCopy: handleCopy,
    onCut: handleCut,
    onPaste: handlePaste,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSelectAll: handleSelectAll,
    onEscape: handleEscape,
    enabled: true,
  });

  // ==================== CANVAS CONTROLS ====================
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const handleReset = useCallback(() => {
    if (canvasNodes.length > 0) {
      saveCurrentState('Reset canvas');
    }
    setNodes([]);
    setEdges([]);
    clearHistory();
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
    toast.success('Canvas reset');
  }, [setNodes, setEdges, setViewport, clearHistory, canvasNodes, saveCurrentState]);

  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  const handleToggleMiniMap = useCallback(() => {
    setShowMiniMap((prev) => !prev);
  }, []);

  const handleToggleShortcuts = useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, []);

  return (
    <div className={`relative w-full h-full bg-[#0d0d0d] ${className}`}>
      <CanvasContextMenu
        selectedNodes={selectedNodes}
        hasClipboard={hasClipboard()}
        canUndo={canUndo}
        canRedo={canRedo}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSelectAll={handleSelectAll}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onAlignLeft={handleAlignLeft}
        onAlignCenter={handleAlignCenter}
        onAlignRight={handleAlignRight}
        onToggleLock={handleToggleLock}
        onAddNode={handleAddNode}
      >
        <div className="w-full h-full">
          <ReactFlow
            nodes={canvasNodes}
            edges={canvasEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={onNodeClick}
            onSelectionChange={onSelectionChange}
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
            // Multi-select support
            selectionMode={SelectionMode.Partial}
            selectionOnDrag={true}
            panOnDrag={[1, 2]} // Middle mouse + right mouse for pan (left for selection)
            selectNodesOnDrag={true}
            // Additional settings
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            multiSelectionKeyCode="Shift"
            deleteKeyCode={null} // We handle this ourselves
            minZoom={0.1}
            maxZoom={4}
          >
            {/* Dark grid background - toggleable */}
            {showGrid && <Background color="#2a2a2a" gap={20} size={1} />}

            {/* Dark styled controls */}
            <Controls
              className="!bg-[#1a1a1a] !border-[#2a2a2a] !rounded-lg !shadow-lg [&>button]:!bg-[#1a1a1a] [&>button]:!border-[#2a2a2a] [&>button]:!text-gray-400 [&>button:hover]:!bg-[#2a2a2a] [&>button:hover]:!text-white"
              position="bottom-right"
            />

            {/* Dark styled minimap - toggleable */}
            {showMiniMap && (
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
            )}

            {/* Lovable-style floating toolbar */}
            <Panel
              position="top-right"
              className="flex gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]"
            >
              {/* Undo/Redo */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 hover:bg-[#2a2a2a] ${canUndo ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                      onClick={handleUndo}
                      disabled={!canUndo}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 hover:bg-[#2a2a2a] ${canRedo ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                      onClick={handleRedo}
                      disabled={!canRedo}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="w-px h-6 bg-[#2a2a2a] self-center" />

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
                className={`h-8 w-8 hover:bg-[#2a2a2a] ${showGrid ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                onClick={handleToggleGrid}
                title="Toggle Grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 hover:bg-[#2a2a2a] ${showMiniMap ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                onClick={handleToggleMiniMap}
                title="Toggle MiniMap"
              >
                <Layers className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-[#2a2a2a] self-center" />
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 hover:bg-[#2a2a2a] ${showShortcuts ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                onClick={handleToggleShortcuts}
                title="Keyboard Shortcuts"
              >
                <Keyboard className="h-4 w-4" />
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

            {/* Keyboard shortcuts panel */}
            {showShortcuts && (
              <Panel
                position="top-left"
                className="bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] max-w-[280px]"
              >
                <h3 className="text-white text-sm font-medium mb-2">Keyboard Shortcuts</h3>
                <div className="space-y-1 text-xs">
                  {KEYBOARD_SHORTCUTS.slice(0, 10).map((shortcut, idx) => (
                    <div key={idx} className="flex justify-between text-gray-400">
                      <span>{shortcut.action}</span>
                      <kbd className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-gray-300">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </CanvasContextMenu>

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

// Wrap with ReactFlowProvider for useReactFlow hook to work
export function VisualCanvas(props: VisualCanvasProps) {
  return (
    <ReactFlowProvider>
      <VisualCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
