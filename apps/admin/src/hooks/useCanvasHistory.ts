/**
 * Canvas History Hook - Undo/Redo functionality for Visual Workspace
 * Inspired by Lovable, v0.dev, and Cursor
 */

import { useCallback, useRef, useState } from 'react';
import { Node, Edge } from 'reactflow';

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
}

interface HistoryEntry {
  state: CanvasState;
  timestamp: number;
  action: string;
}

const MAX_HISTORY_SIZE = 50;

export function useCanvasHistory(initialNodes: Node[] = [], initialEdges: Edge[] = []) {
  // History stacks
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);

  // Current state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Last saved state for comparison
  const lastState = useRef<CanvasState>({ nodes: initialNodes, edges: initialEdges });

  // Save current state to history
  const saveState = useCallback((nodes: Node[], edges: Edge[], action: string = 'edit') => {
    const currentState: CanvasState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    // Don't save if state hasn't changed
    if (JSON.stringify(currentState) === JSON.stringify(lastState.current)) {
      return;
    }

    // Push previous state to undo stack
    undoStack.current.push({
      state: lastState.current,
      timestamp: Date.now(),
      action,
    });

    // Limit history size
    if (undoStack.current.length > MAX_HISTORY_SIZE) {
      undoStack.current.shift();
    }

    // Clear redo stack on new action
    redoStack.current = [];

    // Update last state
    lastState.current = currentState;

    // Update can undo/redo
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(false);
  }, []);

  // Undo last action
  const undo = useCallback((): CanvasState | null => {
    if (undoStack.current.length === 0) return null;

    const entry = undoStack.current.pop()!;

    // Save current state to redo stack
    redoStack.current.push({
      state: lastState.current,
      timestamp: Date.now(),
      action: 'redo',
    });

    // Restore previous state
    lastState.current = entry.state;

    // Update can undo/redo
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);

    return entry.state;
  }, []);

  // Redo last undone action
  const redo = useCallback((): CanvasState | null => {
    if (redoStack.current.length === 0) return null;

    const entry = redoStack.current.pop()!;

    // Save current state to undo stack
    undoStack.current.push({
      state: lastState.current,
      timestamp: Date.now(),
      action: 'undo',
    });

    // Restore redo state
    lastState.current = entry.state;

    // Update can undo/redo
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);

    return entry.state;
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  // Get history info
  const getHistoryInfo = useCallback(
    () => ({
      undoCount: undoStack.current.length,
      redoCount: redoStack.current.length,
      lastAction: undoStack.current[undoStack.current.length - 1]?.action || null,
    }),
    []
  );

  return {
    saveState,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    getHistoryInfo,
  };
}
