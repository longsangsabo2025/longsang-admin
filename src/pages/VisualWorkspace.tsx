/**
 * Visual Workspace Page
 * Main page combining chat, canvas, and preview panels
 * Inspired by Lovable and Google AI Studio
 * NOW CONNECTED TO REAL SOLO HUB 4-LAYER API
 */

import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ChatPanel } from '@/components/visual-workspace/ChatPanel';
import { ComponentLibrary } from '@/components/visual-workspace/ComponentLibrary';
import { ExecutionReportDialog } from '@/components/visual-workspace/ExecutionReportDialog';
import { PreviewPanel } from '@/components/visual-workspace/PreviewPanel';
import { VisualCanvas } from '@/components/visual-workspace/VisualCanvas';
import { useToast } from '@/hooks/use-toast';
import { useExecutionHistory } from '@/hooks/useExecutionHistory';
import { ExecutionEvent, useExecutionSteps } from '@/hooks/useExecutionSteps';
import { ComponentDefinition, useVisualWorkspace } from '@/hooks/useVisualWorkspace';
import { parseAICommand } from '@/lib/visual-workspace/aiParser';
import { XCircle } from 'lucide-react';
import { useCallback, useMemo, useRef } from 'react';
import { Connection, Node } from 'reactflow';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function VisualWorkspace() {
  const {
    nodes,
    edges,
    selectedNode,
    isGenerating,
    setIsGenerating,
    addNode,
    handleNodeClick,
    handleNodesChange,
    handleEdgesChange,
    setSelectedNode,
    setNodes,
    setEdges,
  } = useVisualWorkspace();

  // Execution steps hook - now with cancel support
  const {
    nodes: executionNodes,
    edges: executionEdges,
    isExecuting,
    isCancelled,
    processEvent,
    clearSteps,
    cancelExecution,
    getAbortSignal,
    steps,
  } = useExecutionSteps();

  // Execution history hook - now with Supabase support
  const { addExecution } = useExecutionHistory();

  const { toast } = useToast();
  const startTimeRef = useRef<number>(0);

  // Merge execution nodes with regular nodes
  const allNodes = useMemo(() => {
    if (isExecuting && executionNodes.length > 0) {
      // When executing, show execution steps
      return executionNodes;
    }
    return nodes;
  }, [nodes, executionNodes, isExecuting]);

  const allEdges = useMemo(() => {
    if (isExecuting && executionEdges.length > 0) {
      return executionEdges;
    }
    return edges;
  }, [edges, executionEdges, isExecuting]);

  // Handle AI command from chat - CONNECTED TO REAL SOLO HUB API
  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsGenerating(true);
      clearSteps();
      startTimeRef.current = Date.now();

      try {
        // Check if command is for execution (contains keywords)
        const lowerMessage = message.toLowerCase();
        const isExecutionCommand =
          lowerMessage.includes('tạo') ||
          lowerMessage.includes('generate') ||
          lowerMessage.includes('build') ||
          lowerMessage.includes('thực hiện') ||
          lowerMessage.includes('execute') ||
          lowerMessage.includes('đăng') ||
          lowerMessage.includes('post') ||
          lowerMessage.includes('schedule');

        if (isExecutionCommand) {
          // Create execution plan matching 4-layer architecture
          const plan: ExecutionEvent = {
            type: 'plan',
            plan: {
              steps: [
                {
                  id: 'layer-1',
                  name: 'Layer 1: Planning',
                  description: 'Copilot Planner đang phân tích...',
                  type: 'planning',
                },
                {
                  id: 'layer-2',
                  name: 'Layer 2: Orchestration',
                  description: 'Đang chọn agents phù hợp...',
                  type: 'generation',
                },
                {
                  id: 'layer-3',
                  name: 'Layer 3: Execution',
                  description: 'Đang thực thi actions...',
                  type: 'execution',
                },
                {
                  id: 'layer-4',
                  name: 'Layer 4: Learning',
                  description: 'Ghi nhận feedback...',
                  type: 'review',
                },
              ],
            },
          };

          processEvent(plan);
          processEvent({ type: 'step_start', stepId: 'layer-1' });

          // CALL REAL SOLO HUB API
          const response = await fetch(`${API_BASE}/api/solo-hub/chat-smart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              agentRole: 'content',
              conversationHistory: [],
            }),
            signal: getAbortSignal(),
          });

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }

          const result = await response.json();

          // Update execution steps based on actual API response
          if (result.success) {
            // Layer 1 complete
            processEvent({ type: 'step_complete', stepId: 'layer-1' });
            processEvent({ type: 'step_start', stepId: 'layer-2' });

            // Check which layers were used
            const layersUsed = result.metadata?.layersUsed || [];

            // Simulate layer progression based on actual response
            await new Promise((r) => setTimeout(r, 300));
            processEvent({ type: 'step_complete', stepId: 'layer-2' });
            processEvent({ type: 'step_start', stepId: 'layer-3' });

            await new Promise((r) => setTimeout(r, 300));
            processEvent({ type: 'step_complete', stepId: 'layer-3' });
            processEvent({ type: 'step_start', stepId: 'layer-4' });

            await new Promise((r) => setTimeout(r, 200));
            processEvent({ type: 'step_complete', stepId: 'layer-4' });

            // Parse for visual components if applicable
            const parsed = await parseAICommand(message);
            const newNodes: Node[] = [];
            for (const component of parsed.components) {
              const x = newNodes.length * 250 + 50;
              const y = Math.floor(newNodes.length / 3) * 200 + 50;
              const node = addNode(component, { x, y });
              newNodes.push(node);
            }

            const totalDuration = Date.now() - startTimeRef.current;

            // Save to execution history (now goes to Supabase!)
            addExecution({
              command: message,
              steps: steps,
              duration: totalDuration,
              status: 'completed',
              layers_used: layersUsed,
              metadata: {
                apiResponse: result.type,
                agents: result.orchestration?.agents,
                totalTime: result.metadata?.totalTime,
              },
            });

            processEvent({ type: 'complete' });

            toast({
              title: '✅ Hoàn thành',
              description:
                result.message?.substring(0, 100) || `Đã xử lý với ${layersUsed.length} layers`,
            });
          } else {
            throw new Error(result.error || 'Unknown error');
          }

          setIsGenerating(false);
        } else {
          // Regular command - just parse and add components
          const parsed = await parseAICommand(message);

          const newNodes: Node[] = [];
          for (const component of parsed.components) {
            const x = newNodes.length * 250 + 50;
            const y = Math.floor(newNodes.length / 3) * 200 + 50;
            const node = addNode(component, { x, y });
            newNodes.push(node);
          }

          toast({
            title: 'Components created',
            description: `Created ${parsed.components.length} component(s) on canvas`,
          });
          setIsGenerating(false);
        }
      } catch (error: any) {
        console.error('Error:', error);

        // Check if cancelled by user
        if (error.name === 'AbortError') {
          processEvent({ type: 'error', error: 'Cancelled by user' });
          toast({
            title: '⚠️ Đã hủy',
            description: 'Quá trình đã bị hủy',
          });
        } else {
          processEvent({ type: 'error', error: error.message || 'Unknown error' });
          toast({
            title: '❌ Lỗi',
            description: error.message || 'Không thể xử lý yêu cầu',
            variant: 'destructive',
          });
        }

        // Save failed execution
        addExecution({
          command: message,
          steps: steps,
          duration: Date.now() - startTimeRef.current,
          status: error.name === 'AbortError' ? 'cancelled' : 'failed',
          error: error.message,
        });

        setIsGenerating(false);
      }
    },
    [addNode, setIsGenerating, toast, processEvent, clearSteps, steps, addExecution, getAbortSignal]
  );

  // Handle cancel button click
  const handleCancelExecution = useCallback(() => {
    cancelExecution();
    toast({
      title: '⏹️ Đang hủy...',
      description: 'Đang dừng quá trình thực thi',
    });
  }, [cancelExecution, toast]);

  // Handle canvas connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      // Connection will be handled by React Flow internally
      toast({
        title: 'Connected',
        description: `Connected ${connection.source} to ${connection.target}`,
      });
    },
    [toast]
  );

  // Handle component selection from library
  const handleComponentSelect = useCallback(
    (component: ComponentDefinition) => {
      const x = nodes.length * 250 + 50;
      const y = Math.floor(nodes.length / 3) * 200 + 50;
      addNode(component, { x, y });
      toast({
        title: 'Component added',
        description: `Added ${component.label} to canvas`,
      });
    },
    [nodes.length, addNode, toast]
  );

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="shrink-0 p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Visual Workspace Builder</h1>
            <p className="text-sm text-muted-foreground">
              Build applications visually with AI assistance
            </p>
          </div>
          <div className="flex gap-2">
            {isExecuting && (
              <Button variant="destructive" size="sm" onClick={handleCancelExecution}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <ExecutionReportDialog />
          </div>
        </div>

        {/* Main workspace area with 3 panels */}
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Chat Panel with Component Library */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                  <ChatPanel
                    onSendMessage={handleSendMessage}
                    isGenerating={isGenerating}
                    className="h-full"
                  />
                </div>
                <div className="border-t h-48 shrink-0">
                  <ComponentLibrary onComponentSelect={handleComponentSelect} className="h-full" />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Canvas Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <VisualCanvas
                nodes={allNodes}
                edges={allEdges}
                onNodesChange={(changes) => {
                  if (!isExecuting) {
                    handleNodesChange(changes);
                  }
                }}
                onEdgesChange={(changes) => {
                  if (!isExecuting) {
                    handleEdgesChange(changes);
                  }
                }}
                onConnect={handleConnect}
                onNodeClick={(event, node) => {
                  handleNodeClick(event, node);
                  setSelectedNode(node);
                }}
                className="h-full"
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Preview Panel */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <PreviewPanel selectedNode={selectedNode} className="h-full" />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </Layout>
  );
}
