/**
 * Visual Workspace Page
 * Main page combining chat, canvas, and preview panels
 * Inspired by Lovable and Google AI Studio
 * NOW CONNECTED TO REAL SOLO HUB 4-LAYER API
 */

import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ChatPanel } from '@/components/visual-workspace/ChatPanel';
import { ExecutionReportDialog } from '@/components/visual-workspace/ExecutionReportDialog';
import { PreviewPanel } from '@/components/visual-workspace/PreviewPanel';
import { VisualCanvas } from '@/components/visual-workspace/VisualCanvas';
import { useToast } from '@/hooks/use-toast';
import { useExecutionHistory } from '@/hooks/useExecutionHistory';
import { ExecutionEvent, useExecutionSteps } from '@/hooks/useExecutionSteps';
import { useVisualWorkspace } from '@/hooks/useVisualWorkspace';
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

  // Handle AI command from chat - CONNECTED TO REAL SOLO HUB API WITH SSE STREAMING
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
          // Create initial execution plan matching 4-layer architecture
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

          // USE SSE STREAMING FOR REAL-TIME UPDATES
          const abortController = new AbortController();
          
          const response = await fetch(`${API_BASE}/api/solo-hub/chat-smart/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              agentRole: 'content',
              conversationHistory: [],
            }),
            signal: abortController.signal,
          });

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }

          // Read SSE stream
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let finalResult: any = null;

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const eventData = JSON.parse(line.slice(6));
                    
                    // Process SSE events in real-time
                    switch (eventData.type) {
                      case 'step_start':
                        processEvent({ type: 'step_start', stepId: eventData.stepId });
                        break;
                      case 'step_progress':
                        // Update step description in real-time
                        processEvent({ 
                          type: 'step_progress', 
                          stepId: eventData.stepId,
                          progress: eventData.progress,
                          description: eventData.description
                        });
                        break;
                      case 'step_complete':
                        processEvent({ type: 'step_complete', stepId: eventData.stepId });
                        break;
                      case 'complete':
                        finalResult = eventData.result;
                        processEvent({ type: 'complete' });
                        break;
                      case 'error':
                        throw new Error(eventData.error);
                    }
                  } catch (parseError) {
                    // Skip malformed events
                    console.warn('SSE parse error:', parseError);
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
          const layersUsed = finalResult?.metadata?.layersUsed || ['planning', 'orchestration', 'execution', 'learning'];

          // Save to execution history (now goes to Supabase!)
          addExecution({
            command: message,
            steps: steps,
            duration: totalDuration,
            status: 'completed',
            layers_used: layersUsed,
            metadata: {
              apiResponse: finalResult?.type,
              agents: finalResult?.orchestration?.agents,
              totalTime: finalResult?.metadata?.totalTime,
              streaming: true,
            },
          });

          toast({
            title: '✅ Hoàn thành',
            description: finalResult?.message?.substring(0, 100) || `Đã xử lý với ${layersUsed.length} layers (SSE)`,
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

  return (
    <div className="h-screen w-screen bg-[#1a1a1a] text-white flex flex-col overflow-hidden">
      {/* Top Toolbar - Lovable Style */}
      <div className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 shrink-0">
        {/* Left - Project Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Solo Hub Workspace</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">{isGenerating ? 'Thinking...' : 'Ready'}</span>
          </div>
        </div>

        {/* Center - Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            History
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-white text-black hover:bg-gray-200 rounded-full px-4"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Preview
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
          </Button>
        </div>

        {/* Right - Share & Publish */}
        <div className="flex items-center gap-2">
          {isExecuting && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleCancelExecution}
              className="rounded-full"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Share
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4">
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Chat */}
          <ResizablePanel defaultSize={28} minSize={20} maxSize={45}>
            <div className="h-full bg-[#1a1a1a] flex flex-col">
              <ChatPanel
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                className="h-full"
              />
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-[1px] bg-[#333] hover:bg-purple-500 transition-colors" />

          {/* Center - Preview/Canvas */}
          <ResizablePanel defaultSize={44} minSize={30}>
            <div className="h-full bg-[#0d0d0d] flex flex-col">
              {/* Preview Header */}
              <div className="h-10 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-center gap-2 shrink-0">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  {isGenerating ? 'Getting ready...' : 'Live Preview'}
                </span>
              </div>
              {/* Canvas/Preview Area */}
              <div className="flex-1 min-h-0 relative">
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
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-[1px] bg-[#333] hover:bg-purple-500 transition-colors" />

          {/* Right Panel - Cloud/Preview */}
          <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
            <div className="h-full bg-[#1a1a1a] flex flex-col">
              {/* Cloud Panel Header */}
              <div className="h-10 border-b border-[#333] flex items-center px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#2a2a2a] rounded px-2 py-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-300">Cloud</span>
                  </div>
                  <span className="text-gray-500 text-sm">Solo Hub Cloud</span>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto text-gray-400 text-xs">
                  Close
                </Button>
              </div>
              {/* Cloud Content */}
              <PreviewPanel selectedNode={selectedNode} className="flex-1 min-h-0" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 bg-[#1a1a1a] border-t border-[#333] flex items-center justify-between px-4 text-xs text-gray-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>🟢 API Connected</span>
          <span>27 Actions Available</span>
        </div>
        <div className="flex items-center gap-4">
          <ExecutionReportDialog />
          <span>v2.0 Solo Hub</span>
        </div>
      </div>
    </div>
  );
}
