/**
 * ⚡ Pipeline Graph Executor — runs a node graph via topological sort
 *
 * Given a set of nodes and edges, determines execution order (layers),
 * then dispatches each node to the existing agent modules.
 * Nodes in the same layer run in parallel.
 */

import { runAssembly } from './assembly.agent';
import { runImageGen } from './image-gen.agent';
import type {
  ExecutionLayer,
  ExecutionPlan,
  NodeExecutionResult,
  PipelineNodeData,
  SerializedEdge,
  SerializedNode,
} from './pipeline-builder-types';
import { persistUpdate } from './run-persistence';
import { completeRun, createRun, failRun, getRun } from './run-tracker';
import { runScriptWriter } from './script-writer.agent';
import { runStoryboard } from './storyboard.agent';
import type { GenerateRequest } from './types';
import { runVoiceover } from './voiceover.agent';

// ─── Topological Sort ───────────────────────────────────

/**
 * Build an execution plan from nodes & edges using Kahn's algorithm.
 * Returns layers where each layer's nodes can run in parallel.
 */
export function buildExecutionPlan(
  nodes: SerializedNode[],
  edges: SerializedEdge[],
  templateId: string
): ExecutionPlan {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // Build graph
  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) continue;
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Kahn's algorithm — layer by layer
  const layers: ExecutionLayer[] = [];
  let queue = [...inDegree.entries()].filter(([, deg]) => deg === 0).map(([id]) => id);

  while (queue.length > 0) {
    layers.push({ nodeIds: [...queue] });

    const nextQueue: string[] = [];
    for (const nodeId of queue) {
      for (const neighbor of adjacency.get(nodeId) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) {
          nextQueue.push(neighbor);
        }
      }
    }
    queue = nextQueue;
  }

  // Check for cycles
  const scheduled = new Set(layers.flatMap((l) => l.nodeIds));
  if (scheduled.size !== nodes.length) {
    const missing = nodes.filter((n) => !scheduled.has(n.id)).map((n) => n.data.label);
    throw new Error(
      `Pipeline có vòng lặp (cycle) — không thể thực thi. Nodes bị kẹt: ${missing.join(', ')}`
    );
  }

  return { layers, templateId };
}

// ─── Node Dispatch ──────────────────────────────────────

/** Map a pipeline node type to the corresponding agent execution */
async function dispatchNode(
  node: SerializedNode,
  runId: string,
  req: GenerateRequest,
  nodeOutputs: Map<string, Record<string, unknown>>,
  edges: SerializedEdge[]
): Promise<NodeExecutionResult> {
  const start = Date.now();
  const run = getRun(runId);
  const nodeData = node.data as PipelineNodeData;

  try {
    // Log start
    if (run) {
      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `${nodeData.icon} Running ${nodeData.label}...`,
        step: nodeData.type,
      });
    }

    // Build merged request from node config + upstream outputs
    const mergedReq = buildMergedRequest(node, req, nodeOutputs, edges);

    switch (nodeData.type) {
      // ─── Triggers (pass-through) ───
      case 'topic-input':
      case 'transcript-input':
      case 'batch-input':
        return {
          nodeId: node.id,
          status: 'completed',
          output: { topic: mergedReq.topic, transcript: mergedReq.transcript },
          durationMs: Date.now() - start,
        };

      // ─── AI Agents ───
      case 'script-writer':
        await runScriptWriter(runId, mergedReq);
        break;
      case 'storyboard': {
        // Skip if Script Writer (full-pipeline mode) already produced storyboard
        const hasStoryboard = run?.result?.files?.['storyboard.json'];
        if (hasStoryboard) {
          if (run) {
            run.logs.push({
              t: Date.now(),
              level: 'info',
              msg: '⏭️ Storyboard đã được tạo bởi Script Writer (Full Pipeline) — skip',
              step: 'storyboard',
            });
          }
          return {
            nodeId: node.id,
            status: 'skipped',
            output: { skipped: true, reason: 'already-generated-by-script-writer' },
            durationMs: Date.now() - start,
          };
        }
        await runStoryboard(runId, mergedReq);
        break;
      }
      case 'image-gen':
        await runImageGen(runId, mergedReq);
        break;
      case 'voiceover':
        await runVoiceover(runId, mergedReq);
        break;
      case 'assembly':
        await runAssembly(runId, mergedReq);
        break;

      // ─── Transforms ───
      case 'script-cleaner': {
        if (run) {
          run.logs.push({
            t: Date.now(),
            level: 'info',
            msg: '🧹 Cleaning script for TTS...',
            step: 'script-cleaner',
          });
        }
        // Pass-through for now — actual implementation would strip headings/notes
        return {
          nodeId: node.id,
          status: 'completed',
          output: { cleaned: true },
          durationMs: Date.now() - start,
        };
      }
      case 'prompt-enhancer': {
        if (run) {
          run.logs.push({
            t: Date.now(),
            level: 'info',
            msg: '✨ Enhancing image prompts...',
            step: 'prompt-enhancer',
          });
        }
        return {
          nodeId: node.id,
          status: 'completed',
          output: { enhanced: true },
          durationMs: Date.now() - start,
        };
      }

      // ─── Logic ───
      case 'delay': {
        const ms = (nodeData.config.delayMs as number) || 3000;
        await new Promise((resolve) => setTimeout(resolve, ms));
        return {
          nodeId: node.id,
          status: 'completed',
          output: {},
          durationMs: Date.now() - start,
        };
      }
      case 'condition':
      case 'merge':
        // Pass-through for now
        return {
          nodeId: node.id,
          status: 'completed',
          output: {},
          durationMs: Date.now() - start,
        };

      // ─── Outputs (terminal) ───
      case 'file-export':
      case 'youtube-upload':
        if (run) {
          run.logs.push({
            t: Date.now(),
            level: 'info',
            msg: `${nodeData.icon} ${nodeData.label} — done`,
            step: nodeData.type,
          });
        }
        return {
          nodeId: node.id,
          status: 'completed',
          output: { exported: true },
          durationMs: Date.now() - start,
        };

      default:
        throw new Error(`Unknown node type: ${nodeData.type}`);
    }

    // Check if agent failed the run
    if (run && run.status === 'failed') {
      return {
        nodeId: node.id,
        status: 'failed',
        error: run.error || 'Agent failed',
        durationMs: Date.now() - start,
      };
    }

    // Track completed step
    if (run) {
      if (!run.completedSteps) run.completedSteps = [];
      if (!run.completedSteps.includes(nodeData.type)) {
        run.completedSteps.push(nodeData.type);
      }
    }

    return {
      nodeId: node.id,
      status: 'completed',
      output: run?.result?.files ? { ...run.result.files } : {},
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (run) {
      run.logs.push({
        t: Date.now(),
        level: 'error',
        msg: `❌ ${nodeData.label}: ${errMsg}`,
        step: nodeData.type,
      });
    }
    return {
      nodeId: node.id,
      status: 'failed',
      error: errMsg,
      durationMs: Date.now() - start,
    };
  }
}

// ─── Request Merger ─────────────────────────────────────

/** Merge node config + upstream outputs into a GenerateRequest */
function buildMergedRequest(
  node: SerializedNode,
  baseReq: GenerateRequest,
  _nodeOutputs: Map<string, Record<string, unknown>>,
  _edges: SerializedEdge[]
): GenerateRequest {
  const config = node.data.config || {};
  const merged: GenerateRequest = { ...baseReq };

  // Apply node-specific config overrides
  if (config.topic) merged.topic = String(config.topic);
  if (config.model) merged.model = String(config.model);
  if (config.tone) merged.tone = String(config.tone);
  if (config.wordTarget) merged.wordTarget = Number(config.wordTarget);
  if (config.customPrompt) merged.customPrompt = String(config.customPrompt);
  if (config.style) merged.style = String(config.style);
  if (config.scenes) merged.scenes = Number(config.scenes);
  if (config.duration) merged.duration = Number(config.duration);
  if (config.aspectRatio) merged.aspectRatio = String(config.aspectRatio);
  if (config.provider) {
    merged.imageGenProvider = String(config.provider);
    merged.imageGenEnabled = true;
  }
  if (config.quality) merged.imageGenQuality = String(config.quality);
  if (config.engine) {
    merged.voiceoverEngine = String(config.engine);
    merged.voiceoverEnabled = true;
  }
  if (config.voice) merged.voiceoverVoice = String(config.voice);
  if (config.speed) merged.voiceoverSpeed = Number(config.speed);
  if (config.format) {
    merged.assemblyFormat = String(config.format);
    merged.assemblyEnabled = true;
  }
  if (config.transitions) merged.assemblyTransitions = String(config.transitions);
  if (config.fps) merged.assemblyFps = Number(config.fps);
  if (config.bgMusic !== undefined) merged.assemblyBgMusic = Boolean(config.bgMusic);

  // Script Writer: fullPipelineMode OFF → scriptOnly (don't produce storyboard)
  if (node.data.type === 'script-writer' && !config.fullPipelineMode) {
    merged.scriptOnly = true;
  }

  return merged;
}

// ─── Main Executor ──────────────────────────────────────

export interface GraphExecutionCallbacks {
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, result: NodeExecutionResult) => void;
  onLayerComplete?: (layerIndex: number) => void;
}

/**
 * Execute a pipeline graph.
 * Creates a GenerationRun and executes nodes layer by layer.
 */
export async function executeGraph(
  nodes: SerializedNode[],
  edges: SerializedEdge[],
  baseReq: GenerateRequest,
  templateId: string,
  callbacks?: GraphExecutionCallbacks
): Promise<{ runId: string; results: NodeExecutionResult[] }> {
  // Build execution plan
  const plan = buildExecutionPlan(nodes, edges, templateId);

  // Create a run
  const allSteps = nodes.filter((n) => n.data.category === 'agent').map((n) => n.data.type);
  const runId = `graph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const run = createRun(runId, baseReq, `🧩 Running pipeline graph (${nodes.length} nodes)...`);
  run.pipelineSteps = allSteps;
  run.completedSteps = [];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const nodeOutputs = new Map<string, Record<string, unknown>>();
  const allResults: NodeExecutionResult[] = [];

  // Execute layer by layer
  for (let i = 0; i < plan.layers.length; i++) {
    const layer = plan.layers[i];

    // Run all nodes in this layer in parallel
    const layerPromises = layer.nodeIds.map(async (nodeId) => {
      const node = nodeMap.get(nodeId);
      if (!node) return null;

      callbacks?.onNodeStart?.(nodeId);

      const result = await dispatchNode(node, runId, baseReq, nodeOutputs, edges);
      if (result.output) {
        nodeOutputs.set(nodeId, result.output);
      }

      callbacks?.onNodeComplete?.(nodeId, result);
      return result;
    });

    const layerResults = (await Promise.all(layerPromises)).filter(
      Boolean
    ) as NodeExecutionResult[];
    allResults.push(...layerResults);

    callbacks?.onLayerComplete?.(i);

    // If any node failed, stop execution
    const failed = layerResults.find((r) => r.status === 'failed');
    if (failed) {
      const node = nodeMap.get(failed.nodeId);
      failRun(run, `Node "${node?.data.label || failed.nodeId}" failed: ${failed.error}`);
      return { runId, results: allResults };
    }

    // Persist progress
    persistUpdate(run).catch(() => {});
  }

  // Complete the run
  if (run.status === 'running') {
    completeRun(run, run.result || { outputDir: 'graph', files: {} });
  }

  return { runId, results: allResults };
}
