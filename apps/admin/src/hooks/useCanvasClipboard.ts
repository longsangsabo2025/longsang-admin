/**
 * Canvas Clipboard Hook - Copy/Paste/Duplicate for Visual Workspace
 */

import { useCallback, useRef } from 'react';
import { Node, Edge, XYPosition } from 'reactflow';

interface ClipboardData {
  nodes: Node[];
  edges: Edge[];
  copyPosition: XYPosition;
}

export function useCanvasClipboard() {
  const clipboard = useRef<ClipboardData | null>(null);
  const pasteCount = useRef(0);

  // Generate new unique ID
  const generateId = (prefix: string = 'node') =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Copy selected nodes and their edges
  const copy = useCallback((nodes: Node[], edges: Edge[]) => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return false;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    // Get edges between selected nodes
    const selectedEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    // Calculate center position of selection
    const positions = selectedNodes.map((n) => n.position);
    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

    clipboard.current = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges)),
      copyPosition: { x: centerX, y: centerY },
    };

    pasteCount.current = 0;
    return true;
  }, []);

  // Paste from clipboard
  const paste = useCallback(
    (targetPosition?: XYPosition): { nodes: Node[]; edges: Edge[] } | null => {
      if (!clipboard.current) return null;

      pasteCount.current++;
      const offset = 50 * pasteCount.current;

      // Create ID mapping for nodes
      const idMap = new Map<string, string>();

      // Clone and offset nodes
      const newNodes = clipboard.current.nodes.map((node) => {
        const newId = generateId(node.type || 'node');
        idMap.set(node.id, newId);

        const offsetX = targetPosition
          ? targetPosition.x -
            clipboard.current!.copyPosition.x +
            node.position.x -
            clipboard.current!.copyPosition.x
          : node.position.x -
            clipboard.current!.copyPosition.x +
            clipboard.current!.copyPosition.x +
            offset;

        const offsetY = targetPosition
          ? targetPosition.y -
            clipboard.current!.copyPosition.y +
            node.position.y -
            clipboard.current!.copyPosition.y
          : node.position.y -
            clipboard.current!.copyPosition.y +
            clipboard.current!.copyPosition.y +
            offset;

        return {
          ...node,
          id: newId,
          position: {
            x: offsetX,
            y: offsetY,
          },
          selected: true,
          data: { ...node.data },
        };
      });

      // Clone edges with new IDs
      const newEdges = clipboard.current.edges.map((edge) => ({
        ...edge,
        id: `${idMap.get(edge.source)}-${idMap.get(edge.target)}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        selected: false,
      }));

      return { nodes: newNodes, edges: newEdges };
    },
    []
  );

  // Duplicate selected nodes (copy + paste in one action)
  const duplicate = useCallback(
    (nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } | null => {
      if (copy(nodes, edges)) {
        return paste();
      }
      return null;
    },
    [copy, paste]
  );

  // Cut (copy + delete)
  const cut = useCallback(
    (nodes: Node[], edges: Edge[]): string[] => {
      const selectedNodes = nodes.filter((n) => n.selected);
      if (copy(nodes, edges)) {
        return selectedNodes.map((n) => n.id);
      }
      return [];
    },
    [copy]
  );

  // Check if clipboard has content
  const hasClipboard = useCallback(() => {
    return clipboard.current !== null && clipboard.current.nodes.length > 0;
  }, []);

  return {
    copy,
    paste,
    cut,
    duplicate,
    hasClipboard,
  };
}
