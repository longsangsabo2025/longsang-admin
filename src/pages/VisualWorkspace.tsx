/**
 * Visual Workspace Page
 * Main page combining chat, canvas, and preview panels
 * Inspired by Lovable and Google AI Studio
 */

import { useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { VisualCanvas } from '@/components/visual-workspace/VisualCanvas';
import { ChatPanel } from '@/components/visual-workspace/ChatPanel';
import { PreviewPanel } from '@/components/visual-workspace/PreviewPanel';
import { useVisualWorkspace, ComponentDefinition } from '@/hooks/useVisualWorkspace';
import { parseAICommand } from '@/lib/visual-workspace/aiParser';
import { Node, Edge, Connection } from 'reactflow';
import { useToast } from '@/hooks/use-toast';

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
  } = useVisualWorkspace();

  const { toast } = useToast();

  // Handle AI command from chat
  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsGenerating(true);

      try {
        // Parse command
        const parsed = await parseAICommand(message);

        // Add components to canvas
        const newNodes: Node[] = [];
        for (const component of parsed.components) {
          // Calculate position to avoid overlap
          const x = newNodes.length * 250 + 50;
          const y = Math.floor(newNodes.length / 3) * 200 + 50;

          const node = addNode(component, { x, y });
          newNodes.push(node);
        }

        // Add connections if specified
        if (parsed.connections) {
          // Connections will be handled by React Flow
          toast({
            title: 'Components created',
            description: `Created ${parsed.components.length} component(s)`,
          });
        } else {
          toast({
            title: 'Components created',
            description: `Created ${parsed.components.length} component(s) on canvas`,
          });
        }
      } catch (error) {
        console.error('Error parsing command:', error);
        toast({
          title: 'Error',
          description: 'Could not parse command. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [addNode, setIsGenerating, toast]
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
        <div className="shrink-0 p-4 border-b">
          <h1 className="text-2xl font-bold">Visual Workspace Builder</h1>
          <p className="text-sm text-muted-foreground">
            Build applications visually with AI assistance
          </p>
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
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
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
