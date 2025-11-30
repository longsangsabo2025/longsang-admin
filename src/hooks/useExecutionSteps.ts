/**
 * Hook for managing execution steps visualization
 * Converts execution events into visual nodes for the canvas
 * Inspired by Lovable AI and VSCode Copilot execution visualization
 */

import {
  ExecutionStepData,
  ExecutionStepStatus,
} from "@/components/visual-workspace/ExecutionStepNodes";
import { useCallback, useRef, useState } from "react";
import { Edge, Node } from "reactflow";

export interface ExecutionEvent {
  type:
    | "plan"
    | "step_start"
    | "step_progress"
    | "step_complete"
    | "step_error"
    | "complete"
    | "error";
  stepId?: string;
  stepName?: string;
  description?: string;
  stepType?: "planning" | "generation" | "review" | "execution" | "completed";
  progress?: number;
  error?: string;
  duration?: number;
  plan?: {
    steps: Array<{
      id: string;
      name: string;
      description?: string;
      type?: string;
    }>;
  };
}

export interface ExecutionStep {
  id: string;
  name: string;
  description?: string;
  status: ExecutionStepStatus;
  stepType: "planning" | "generation" | "review" | "execution" | "completed";
  progress?: number;
  duration?: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export function useExecutionSteps() {
  const [steps, setSteps] = useState<Map<string, ExecutionStep>>(new Map());
  const [stepOrder, setStepOrder] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [parallelSteps, setParallelSteps] = useState<Map<string, string[]>>(new Map()); // Group ID -> Step IDs
  const stepTimers = useRef<Map<string, number>>(new Map());

  // Convert step to node
  const stepToNode = useCallback((step: ExecutionStep, index: number): Node<ExecutionStepData> => {
    return {
      id: step.id,
      type: "executionStep",
      position: {
        x: 100,
        y: index * 120 + 50,
      },
      data: {
        label: step.name,
        description: step.description,
        status: step.status,
        stepType: step.stepType,
        progress: step.progress,
        duration: step.duration,
        error: step.error,
        startTime: step.startTime,
        endTime: step.endTime,
      },
    };
  }, []);

  // Convert steps to nodes and edges
  const stepsToNodesAndEdges = useCallback((): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    stepOrder.forEach((stepId, index) => {
      const step = steps.get(stepId);
      if (step) {
        nodes.push(stepToNode(step, index));

        // Add edge from previous step
        if (index > 0) {
          const prevStepId = stepOrder[index - 1];
          edges.push({
            id: `${prevStepId}-${stepId}`,
            source: prevStepId,
            target: stepId,
            type: "smoothstep",
            animated: step.status === "running",
            style: {
              stroke:
                step.status === "completed"
                  ? "#10b981"
                  : step.status === "failed"
                  ? "#ef4444"
                  : "#6b7280",
            },
          });
        }
      }
    });

    return { nodes, edges };
  }, [steps, stepOrder, stepToNode]);

  // Handle execution plan
  const handlePlan = useCallback((plan: ExecutionEvent["plan"]) => {
    if (!plan) return;

    setIsExecuting(true);
    const newSteps = new Map<string, ExecutionStep>();
    const order: string[] = [];
    const parallelGroups = new Map<string, string[]>();

    plan.steps.forEach((step, index) => {
      const stepId = step.id || `step-${index}`;
      const stepType = (step.type || "execution") as ExecutionStep["stepType"];
      const parallelGroup = (step as any).parallelGroup; // Group ID for parallel execution

      newSteps.set(stepId, {
        id: stepId,
        name: step.name,
        description: step.description,
        status: "pending",
        stepType,
        progress: 0,
      });

      if (parallelGroup) {
        // Add to parallel group
        const groupSteps = parallelGroups.get(parallelGroup) || [];
        groupSteps.push(stepId);
        parallelGroups.set(parallelGroup, groupSteps);
      } else {
        // Sequential step
        order.push(stepId);
      }
    });

    setSteps(newSteps);
    setStepOrder(order);
    setParallelSteps(parallelGroups);
  }, []);

  // Handle step start
  const handleStepStart = useCallback((event: ExecutionEvent) => {
    if (!event.stepId) return;

    setSteps((prev) => {
      const updated = new Map(prev);
      const step = updated.get(event.stepId!);
      if (step) {
        const startTime = Date.now();
        stepTimers.current.set(event.stepId!, startTime);

        updated.set(event.stepId!, {
          ...step,
          status: "running",
          startTime,
          progress: 0,
        });
      }
      return updated;
    });
  }, []);

  // Handle step progress
  const handleStepProgress = useCallback((event: ExecutionEvent) => {
    if (!event.stepId) return;

    setSteps((prev) => {
      const updated = new Map(prev);
      const step = updated.get(event.stepId!);
      if (step) {
        updated.set(event.stepId!, {
          ...step,
          progress: event.progress ?? step.progress,
          description: event.description || step.description,
        });
      }
      return updated;
    });
  }, []);

  // Handle step complete
  const handleStepComplete = useCallback((event: ExecutionEvent) => {
    if (!event.stepId) return;

    setSteps((prev) => {
      const updated = new Map(prev);
      const step = updated.get(event.stepId!);
      if (step) {
        const endTime = Date.now();
        const startTime = stepTimers.current.get(event.stepId!) || endTime;
        const duration = endTime - startTime;
        stepTimers.current.delete(event.stepId!);

        updated.set(event.stepId!, {
          ...step,
          status: "completed",
          progress: 100,
          endTime,
          duration,
        });
      }
      return updated;
    });
  }, []);

  // Handle step error
  const handleStepError = useCallback((event: ExecutionEvent) => {
    if (!event.stepId) return;

    setSteps((prev) => {
      const updated = new Map(prev);
      const step = updated.get(event.stepId!);
      if (step) {
        const endTime = Date.now();
        const startTime = stepTimers.current.get(event.stepId!) || endTime;
        const duration = endTime - startTime;
        stepTimers.current.delete(event.stepId!);

        updated.set(event.stepId!, {
          ...step,
          status: "failed",
          error: event.error || "Unknown error",
          endTime,
          duration,
        });
      }
      return updated;
    });
  }, []);

  // Handle execution complete
  const handleComplete = useCallback(() => {
    setIsExecuting(false);
  }, []);

  // Handle execution error
  const handleError = useCallback((error: string) => {
    setIsExecuting(false);
    // Mark current running step as failed
    setSteps((prev) => {
      const updated = new Map(prev);
      prev.forEach((step, stepId) => {
        if (step.status === "running") {
          updated.set(stepId, {
            ...step,
            status: "failed",
            error,
          });
        }
      });
      return updated;
    });
  }, []);

  // Process execution event
  const processEvent = useCallback(
    (event: ExecutionEvent) => {
      switch (event.type) {
        case "plan":
          handlePlan(event.plan);
          break;
        case "step_start":
          handleStepStart(event);
          break;
        case "step_progress":
          handleStepProgress(event);
          break;
        case "step_complete":
          handleStepComplete(event);
          break;
        case "step_error":
          handleStepError(event);
          break;
        case "complete":
          handleComplete();
          break;
        case "error":
          handleError(event.error || "Execution failed");
          break;
      }
    },
    [
      handlePlan,
      handleStepStart,
      handleStepProgress,
      handleStepComplete,
      handleStepError,
      handleComplete,
      handleError,
    ]
  );

  // Clear steps
  const clearSteps = useCallback(() => {
    setSteps(new Map());
    setStepOrder([]);
    setIsExecuting(false);
    stepTimers.current.clear();
  }, []);

  // Get nodes and edges for React Flow
  const { nodes, edges } = stepsToNodesAndEdges();

  return {
    steps: Array.from(steps.values()),
    stepOrder,
    isExecuting,
    nodes,
    edges,
    processEvent,
    clearSteps,
  };
}
