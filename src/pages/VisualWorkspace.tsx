/**
 * Visual Workspace Page
 * Main page combining chat, canvas, and preview panels
 * Inspired by Lovable and Google AI Studio
 */

import { Layout } from '@/components/Layout';
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
import { useCallback, useMemo } from 'react';
import { Connection, Node } from 'reactflow';

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

  // Execution steps hook
  const {
    nodes: executionNodes,
    edges: executionEdges,
    isExecuting,
    processEvent,
    clearSteps,
    steps,
  } = useExecutionSteps();

  // Execution history hook
  const { addExecution } = useExecutionHistory();

  const { toast } = useToast();

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

  // Handle AI command from chat
  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsGenerating(true);
      clearSteps(); // Clear previous execution steps

      try {
        // Check if command is for execution (contains keywords)
        const lowerMessage = message.toLowerCase();
        const isExecutionCommand =
          lowerMessage.includes('tạo') ||
          lowerMessage.includes('generate') ||
          lowerMessage.includes('build') ||
          lowerMessage.includes('thực hiện') ||
          lowerMessage.includes('execute');

        // If execution command, show execution steps
        if (isExecutionCommand) {
          // Create execution plan
          const plan: ExecutionEvent = {
            type: 'plan',
            plan: {
              steps: [
                {
                  id: 'step-1',
                  name: 'Planning',
                  description: 'Đang phân tích yêu cầu...',
                  type: 'planning',
                },
                {
                  id: 'step-2',
                  name: 'Generation',
                  description: 'Đang tạo components...',
                  type: 'generation',
                },
                {
                  id: 'step-3',
                  name: 'Review',
                  description: 'Đang kiểm tra...',
                  type: 'review',
                },
                {
                  id: 'step-4',
                  name: 'Execution',
                  description: 'Đang thực thi...',
                  type: 'execution',
                },
              ],
            },
          };

          processEvent(plan);

          // Simulate execution steps
          setTimeout(() => {
            processEvent({ type: 'step_start', stepId: 'step-1' });
          }, 500);

          setTimeout(() => {
            processEvent({ type: 'step_complete', stepId: 'step-1' });
            processEvent({ type: 'step_start', stepId: 'step-2' });
          }, 2000);

          setTimeout(() => {
            processEvent({ type: 'step_complete', stepId: 'step-2' });
            processEvent({ type: 'step_start', stepId: 'step-3' });
          }, 4000);

          setTimeout(() => {
            processEvent({ type: 'step_complete', stepId: 'step-3' });
            processEvent({ type: 'step_start', stepId: 'step-4' });
          }, 5500);

          setTimeout(() => {
            // Parse command and add components
            parseAICommand(message).then((parsed) => {
              const newNodes: Node[] = [];
              for (const component of parsed.components) {
                const x = newNodes.length * 250 + 50;
                const y = Math.floor(newNodes.length / 3) * 200 + 50;
                const node = addNode(component, { x, y });
                newNodes.push(node);
              }

              processEvent({ type: 'step_complete', stepId: 'step-4' });

              // Calculate total duration
              const startTime = Date.now() - 7000; // Approximate start time
              const totalDuration = Date.now() - startTime;

              // Save to execution history
              addExecution({
                command: message,
                steps: steps,
                duration: totalDuration,
                status: 'completed',
              });

              processEvent({ type: 'complete' });

              toast({
                title: 'Hoàn thành',
                description: `Đã tạo ${parsed.components.length} component(s)`,
              });
              setIsGenerating(false);
            });
          }, 7000);
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
      } catch (error) {
        console.error('Error parsing command:', error);
        processEvent({ type: 'error', error: 'Could not parse command' });
        toast({
          title: 'Error',
          description: 'Could not parse command. Please try again.',
          variant: 'destructive',
        });
        setIsGenerating(false);
      }
    },
    [addNode, setIsGenerating, toast, processEvent, clearSteps, steps, addExecution]
  );

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
