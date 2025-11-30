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
import { Maximize2, Minimize2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // Full view mode state
  const [isFullView, setIsFullView] = useState(false);

  // Keyboard shortcut: Escape to exit full view, F11 to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullView) {
        setIsFullView(false);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullView((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullView]);

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

          // 🚀 REAL SSE STREAMING - 4-layer architecture
          // Use stream-test for fast testing, stream for real AI
          const USE_FAST_TEST = true; // Toggle for production
          const streamEndpoint = USE_FAST_TEST
            ? `${API_BASE}/api/solo-hub/chat-smart/stream-test`
            : `${API_BASE}/api/solo-hub/chat-smart/stream`;

          const response = await fetch(streamEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream',
            },
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

          // Process SSE stream
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let finalResult: any = null;

          if (reader) {
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;

                  try {
                    const event = JSON.parse(data);
                    console.log('📨 SSE Event:', event.type, event);

                    // Forward event to execution steps
                    processEvent(event);

                    if (event.type === 'complete') {
                      finalResult = event;
                    }
                  } catch (e) {
                    console.warn('Failed to parse SSE event:', data);
                  }
                }
              }
            }
          }

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
            layers_used: finalResult?.metadata?.layersUsed || [
              'planning',
              'orchestration',
              'execution',
              'learning',
            ],
            metadata: {
              streaming: true,
              apiResponse: finalResult?.type,
              agents: finalResult?.orchestration?.agents,
              totalTime: finalResult?.metadata?.totalTime,
            },
          });

          toast({
            title: '✅ Hoàn thành',
            description: finalResult?.message?.substring(0, 100) || `Xử lý xong với 4 layers`,
          });

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

  // Full View Content - extracted for reuse
  const workspaceContent = (
    <div
      className={
        isFullView
          ? 'h-screen w-screen bg-[#0a0a0a] flex flex-col'
          : 'h-[calc(100vh-4rem)] flex flex-col'
      }
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-between">
        <div>
          <h1 className={`font-bold ${isFullView ? 'text-xl text-white' : 'text-2xl'}`}>
            Visual Workspace Builder
          </h1>
          <p className="text-sm text-gray-500">Build applications visually with AI assistance</p>
        </div>
        <div className="flex gap-2 items-center">
          {isExecuting && (
            <Button variant="destructive" size="sm" onClick={handleCancelExecution}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <ExecutionReportDialog />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullView(!isFullView)}
            className="bg-[#1a1a1a] border-[#3a3a3a] hover:bg-[#2a2a2a] text-white"
          >
            {isFullView ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Full View
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Full View
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main workspace area with 3 panels */}
      <div className="flex-1 min-h-0 bg-[#0a0a0a]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chat Panel with Component Library */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Chat Panel */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <ChatPanel
                  onSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                  className="h-full bg-[#0f0f0f]"
                />
              </ResizablePanel>

              <ResizableHandle
                withHandle
                className="bg-[#2a2a2a] hover:bg-purple-600 transition-colors"
              />

              {/* Component Library - Now resizable! */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <ComponentLibrary onComponentSelect={handleComponentSelect} className="h-full" />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-[#2a2a2a] hover:bg-purple-600 transition-colors"
          />

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

          <ResizableHandle
            withHandle
            className="bg-[#2a2a2a] hover:bg-purple-600 transition-colors"
          />

          {/* Preview Panel */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <PreviewPanel selectedNode={selectedNode} className="h-full bg-[#0f0f0f]" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );

  // Full view mode - render without Layout wrapper
  if (isFullView) {
    return <div className="fixed inset-0 z-50">{workspaceContent}</div>;
  }

  return <Layout>{workspaceContent}</Layout>;
}
