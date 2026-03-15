/**
 * 🧩 Pipeline Studio — Design + Monitor pipelines in one place
 *
 * Tab 1: Builder — Drag & drop AI modules, connect, run custom pipelines
 * Tab 2: Monitor — Command Center + Stage Inspector (from PipelineDashboard)
 *
 * Route: /admin/pipeline-builder
 * Consolidated from: PipelineBuilder + PipelineDashboard
 */

import type { Node } from '@xyflow/react';
import { ReactFlowProvider, useOnSelectionChange } from '@xyflow/react';
import { Activity, Loader2, Pencil } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AISettingsDialog } from '@/components/youtube/pipeline-builder/AISettingsDialog';
import { NodeConfigPanel } from '@/components/youtube/pipeline-builder/NodeConfigPanel';
import { NodePalette } from '@/components/youtube/pipeline-builder/NodePalette';
import { PipelineBuilderToolbar } from '@/components/youtube/pipeline-builder/PipelineBuilderToolbar';
import {
  PipelineCanvas,
  type PipelineCanvasHandle,
} from '@/components/youtube/pipeline-builder/PipelineCanvas';
import type { PipelineTemplate } from '@/services/pipeline/pipeline-builder-types';
import { BUILT_IN_TEMPLATES, saveTemplate } from '@/services/pipeline/pipeline-templates';

// Lazy load monitor components (from old PipelineDashboard)
const PipelineCommandCenter = lazy(() =>
  import('@/components/pipeline/PipelineCommandCenter').then((m) => ({
    default: m.PipelineCommandCenter,
  }))
);
const PipelineStageManager = lazy(() =>
  import('@/components/pipeline/PipelineStageManager').then((m) => ({
    default: m.PipelineStageManager,
  }))
);

function PipelineBuilderInner() {
  const canvasRef = useRef<PipelineCanvasHandle | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<PipelineTemplate | null>(
    BUILT_IN_TEMPLATES[0]
  );
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  // Load initial template on mount
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!initialLoadDone.current && canvasRef.current && currentTemplate) {
      canvasRef.current.loadTemplate(currentTemplate);
      setNodeCount(currentTemplate.nodes.length);
      setEdgeCount(currentTemplate.edges.length);
      initialLoadDone.current = true;
    }
  }, [currentTemplate]);

  // Selection tracking
  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes }) => {
      setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null);
    },
  });

  // ─── Handlers ───

  const handleLoadTemplate = useCallback((template: PipelineTemplate) => {
    canvasRef.current?.loadTemplate(template);
    setCurrentTemplate(template);
    setNodeCount(template.nodes.length);
    setEdgeCount(template.edges.length);
    setSelectedNode(null);
    toast.success(`Loaded: ${template.name}`);
  }, []);

  const handleSave = useCallback(() => {
    const state = canvasRef.current?.getState();
    if (!state || state.nodes.length === 0) return;

    const name = currentTemplate?.isBuiltIn
      ? `${currentTemplate.name} (Custom)`
      : currentTemplate?.name || 'My Pipeline';

    const saved = saveTemplate({
      name,
      description: `Custom pipeline with ${state.nodes.length} nodes`,
      icon: '🧩',
      channelId: null,
      nodes: state.nodes,
      edges: state.edges,
    });
    setCurrentTemplate(saved);
    toast.success('Pipeline saved!');
  }, [currentTemplate]);

  const handleRun = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsRunning(true);

    // Find the trigger node to get topic
    const state = canvasRef.current.getState();
    const triggerNode = state.nodes.find((n) => n.data.category === 'trigger');
    const topic = (triggerNode?.data.config?.topic as string) || 'Pipeline test topic';

    try {
      const result = await canvasRef.current.run({
        topic,
        channelId: (triggerNode?.data.config?.channelId as string) || undefined,
      });
      toast.success(`Pipeline completed! Run: ${result.runId}`);
    } catch (err) {
      toast.error(`Pipeline failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (nodeCount === 0) return;
    if (!window.confirm('Xoá toàn bộ pipeline? Thao tác này không thể hoàn tác.')) return;
    canvasRef.current?.clear();
    setCurrentTemplate(null);
    setNodeCount(0);
    setEdgeCount(0);
    setSelectedNode(null);
  }, [nodeCount]);

  const handleUpdateConfig = useCallback((nodeId: string, config: Record<string, unknown>) => {
    canvasRef.current?.updateNodeData(nodeId, { config });
    // Keep selectedNode in sync so NodeConfigPanel doesn't show stale data
    setSelectedNode((prev) => {
      if (!prev || prev.id !== nodeId) return prev;
      return { ...prev, data: { ...prev.data, config } };
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    canvasRef.current?.deleteNode(nodeId);
    setSelectedNode(null);
  }, []);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        handleDeleteNode(selectedNode.id);
      }
      // Ctrl+S to save
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, handleDeleteNode, handleSave]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <PipelineBuilderToolbar
        currentTemplate={currentTemplate}
        isRunning={isRunning}
        nodeCount={nodeCount}
        edgeCount={edgeCount}
        onLoadTemplate={handleLoadTemplate}
        onSave={handleSave}
        onRun={handleRun}
        onClear={handleClear}
        onOpenAISettings={() => setShowAISettings(true)}
      />

      {/* Main area: Palette + Canvas + Config */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Node Palette */}
        <NodePalette />

        {/* Center: Canvas */}
        <PipelineCanvas
          canvasRef={canvasRef}
          onNodesChange={setNodeCount}
          onEdgesChange={setEdgeCount}
        />

        {/* Right: Config Panel */}
        <NodeConfigPanel
          selectedNode={selectedNode}
          onUpdateConfig={handleUpdateConfig}
          onDeleteNode={handleDeleteNode}
        />
      </div>

      {/* AI Settings Dialog */}
      <AISettingsDialog open={showAISettings} onClose={() => setShowAISettings(false)} />
    </div>
  );
}

/** Page wrapper — Pipeline Studio with Builder + Monitor tabs */
export default function PipelineBuilder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('view') || 'builder';
  const [monitorView, setMonitorView] = useState<'command' | 'stages'>('command');

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setSearchParams({ view: v })}
      className="flex flex-col h-[calc(100vh-64px)]"
    >
      <div className="border-b bg-background/95 backdrop-blur px-4">
        <TabsList className="h-10">
          <TabsTrigger value="builder" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="monitor" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Monitor
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="builder" className="flex-1 mt-0 data-[state=inactive]:hidden">
        <ReactFlowProvider>
          <PipelineBuilderInner />
        </ReactFlowProvider>
      </TabsContent>

      <TabsContent value="monitor" className="flex-1 mt-0 overflow-auto">
        <div className="container py-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMonitorView('command')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                monitorView === 'command'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              ⚡ Command Center
            </button>
            <button
              onClick={() => setMonitorView('stages')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                monitorView === 'stages'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              🔧 Stage Inspector
            </button>
          </div>
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            }
          >
            {monitorView === 'command' ? (
              <PipelineCommandCenter />
            ) : (
              <PipelineStageManager onClose={() => setMonitorView('command')} />
            )}
          </Suspense>
        </div>
      </TabsContent>
    </Tabs>
  );
}
