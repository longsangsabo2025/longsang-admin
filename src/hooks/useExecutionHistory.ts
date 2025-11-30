/**
 * Hook for managing execution history
 * Save/load execution steps history to/from localStorage
 */

import { useCallback, useEffect, useState } from "react";
import { ExecutionStep } from "./useExecutionSteps";

export interface ExecutionHistory {
  id: string;
  command: string;
  timestamp: Date;
  steps: ExecutionStep[];
  duration: number;
  status: "completed" | "failed" | "cancelled";
  error?: string;
}

const STORAGE_KEY = "longsang_execution_history";
const MAX_HISTORY_ITEMS = 50;

export function useExecutionHistory() {
  const [history, setHistory] = useState<ExecutionHistory[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const historyWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      console.error("Failed to load execution history:", error);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((historyItems: ExecutionHistory[]) => {
    try {
      const toStore = historyItems.slice(-MAX_HISTORY_ITEMS); // Keep only last 50
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      setHistory(toStore);
    } catch (error) {
      console.error("Failed to save execution history:", error);
    }
  }, []);

  // Add execution to history
  const addExecution = useCallback(
    (execution: Omit<ExecutionHistory, "id" | "timestamp">) => {
      const newExecution: ExecutionHistory = {
        ...execution,
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      const updated = [newExecution, ...history];
      saveHistory(updated);
      return newExecution.id;
    },
    [history, saveHistory]
  );

  // Get execution by ID
  const getExecution = useCallback(
    (id: string): ExecutionHistory | undefined => {
      return history.find((item) => item.id === id);
    },
    [history]
  );

  // Delete execution
  const deleteExecution = useCallback(
    (id: string) => {
      const updated = history.filter((item) => item.id !== id);
      saveHistory(updated);
    },
    [history, saveHistory]
  );

  // Clear all history
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  // Export history as JSON
  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `execution-history-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [history]);

  return {
    history,
    addExecution,
    getExecution,
    deleteExecution,
    clearHistory,
    exportHistory,
  };
}
