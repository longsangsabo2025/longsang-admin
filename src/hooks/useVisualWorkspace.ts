/**
 * Visual Workspace State Management Hook
 */

import { useState, useCallback } from 'react';
import { Node, Edge, Connection } from 'reactflow';

export interface ComponentDefinition {
  id: string;
  type: 'uiComponent' | 'apiService' | 'dataFlow' | 'database' | 'customComponent';
  label: string;
  componentType?: string;
  sublabel?: string;
  properties?: Record<string, any>;
  code?: string;
}

export function useVisualWorkspace() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Add node to canvas
  const addNode = useCallback((component: ComponentDefinition, position?: { x: number; y: number }) => {
    const newNode: Node = {
      id: component.id,
      type: component.type,
      position: position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: component.label,
        componentType: component.componentType,
        sublabel: component.sublabel,
        properties: component.properties || {},
        code: component.code,
      },
    };

    setNodes((prev) => [...prev, newNode]);
    return newNode;
  }, []);

  // Update node
  const updateNode = useCallback((nodeId: string, updates: Partial<Node['data']>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            }
          : node
      )
    );
  }, []);

  // Remove node
  const removeNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Add edge
  const addEdge = useCallback((connection: Connection) => {
    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      type: 'smoothstep',
      animated: true,
    };
    setEdges((prev) => [...prev, newEdge]);
  }, []);

  // Remove edge
  const removeEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  }, []);

  // Handle node selection
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle nodes change from React Flow
  const handleNodesChange = useCallback((changes: any) => {
    setNodes((prev) => {
      let updated = [...prev];
      changes.forEach((change: any) => {
        if (change.type === 'remove') {
          updated = updated.filter((node) => node.id !== change.id);
        } else if (change.type === 'position' && change.dragging === false) {
          updated = updated.map((node) =>
            node.id === change.id
              ? { ...node, position: change.position || node.position }
              : node
          );
        } else if (change.type === 'select') {
          updated = updated.map((node) =>
            node.id === change.id ? { ...node, selected: change.selected } : node
          );
        }
      });
      return updated;
    });
  }, []);

  // Handle edges change from React Flow
  const handleEdgesChange = useCallback((changes: any) => {
    setEdges((prev) => {
      let updated = [...prev];
      changes.forEach((change: any) => {
        if (change.type === 'remove') {
          updated = updated.filter((edge) => edge.id !== change.id);
        } else if (change.type === 'select') {
          updated = updated.map((edge) =>
            edge.id === change.id ? { ...edge, selected: change.selected } : edge
          );
        }
      });
      return updated;
    });
  }, []);

  return {
    nodes,
    edges,
    selectedNode,
    isGenerating,
    setIsGenerating,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    clearCanvas,
    handleNodeClick,
    handleNodesChange,
    handleEdgesChange,
    setNodes,
    setEdges,
    setSelectedNode,
  };
}

