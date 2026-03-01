/**
 * ⏪ History Manager
 * Implements undo/redo functionality for scene production
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useCallback } from 'react';
import type { Scene } from '@/pages/studio/scene-production/types';

interface HistoryState {
  scenes: Scene[];
  timestamp: number;
  action: string;
}

const MAX_HISTORY_SIZE = 50; // Keep last 50 states

export function useHistoryManager(initialScenes: Scene[]) {
  const [history, setHistory] = useState<HistoryState[]>([
    { scenes: initialScenes, timestamp: Date.now(), action: 'initial' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Save current state to history
  const saveState = useCallback((scenes: Scene[], action: string) => {
    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      const newState: HistoryState = {
        scenes: JSON.parse(JSON.stringify(scenes)), // Deep clone
        timestamp: Date.now(),
        action,
      };
      
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentIndex]);
  
  // Undo
  const undo = useCallback((): Scene[] | null => {
    if (currentIndex === 0) return null;
    
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex].scenes;
  }, [currentIndex, history]);
  
  // Redo
  const redo = useCallback((): Scene[] | null => {
    if (currentIndex >= history.length - 1) return null;
    
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex].scenes;
  }, [currentIndex, history]);
  
  // Check if can undo/redo
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  
  // Get current action description
  const currentAction = history[currentIndex]?.action || '';
  const previousAction = currentIndex > 0 ? history[currentIndex - 1]?.action : '';
  const nextAction = currentIndex < history.length - 1 ? history[currentIndex + 1]?.action : '';
  
  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    currentAction,
    previousAction,
    nextAction,
    historySize: history.length,
    currentIndex,
  };
}
