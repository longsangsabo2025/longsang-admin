/**
 * Preview Panel Component - Lovable Style
 * Shows code preview and component properties
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Code,
  Settings,
  Eye,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { Node } from 'reactflow';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PreviewPanelProps {
  selectedNode: Node | null;
  className?: string;
}

export function PreviewPanel({ selectedNode, className = '' }: PreviewPanelProps) {
  const componentCode = selectedNode?.data?.code || '';
  const componentProperties = selectedNode?.data?.properties || {};
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return (
    <div className={cn('flex flex-col h-full bg-[#1a1a1a]', className)}>
      {/* Preview Header - Lovable Style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-white">Preview</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Device Switcher */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              viewMode === 'desktop' ? 'bg-[#2a2a2a] text-white' : 'text-gray-500 hover:text-white'
            )}
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              viewMode === 'tablet' ? 'bg-[#2a2a2a] text-white' : 'text-gray-500 hover:text-white'
            )}
            onClick={() => setViewMode('tablet')}
          >
            <Tablet className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              viewMode === 'mobile' ? 'bg-[#2a2a2a] text-white' : 'text-gray-500 hover:text-white'
            )}
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-[#2a2a2a] mx-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-white">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 min-h-0">
        {selectedNode ? (
          <Tabs defaultValue="preview" className="h-full flex flex-col">
            <TabsList className="mx-3 mt-3 bg-[#2a2a2a] border-0">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white text-gray-400 text-xs"
              >
                <Eye className="h-3 w-3 mr-1.5" />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white text-gray-400 text-xs"
              >
                <Code className="h-3 w-3 mr-1.5" />
                Code
              </TabsTrigger>
              <TabsTrigger
                value="properties"
                className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white text-gray-400 text-xs"
              >
                <Settings className="h-3 w-3 mr-1.5" />
                Props
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 min-h-0 m-3">
              <div
                className={cn(
                  'h-full bg-white rounded-lg mx-auto transition-all duration-300',
                  viewMode === 'desktop' && 'w-full',
                  viewMode === 'tablet' && 'max-w-[768px]',
                  viewMode === 'mobile' && 'max-w-[375px]'
                )}
              >
                <div className="p-4 text-center text-gray-500">
                  <div className="text-sm font-medium text-gray-800 mb-2">
                    {selectedNode.data?.label || 'Component'}
                  </div>
                  <p className="text-xs">Live preview sẽ hiển thị ở đây</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 min-h-0 m-3">
              <ScrollArea className="h-full rounded-lg bg-[#0d0d0d]">
                <pre className="p-4 text-sm font-mono text-green-400 overflow-x-auto">
                  <code>{componentCode || '// Select a component to see code'}</code>
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="properties" className="flex-1 min-h-0 m-3">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {Object.keys(componentProperties).length > 0 ? (
                    Object.entries(componentProperties).map(([key, value]) => (
                      <div key={key} className="p-3 bg-[#2a2a2a] rounded-lg">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          {key}
                        </label>
                        <div className="mt-1 text-sm text-white font-mono">
                          {typeof value === 'object'
                            ? JSON.stringify(value, null, 2)
                            : String(value)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">No properties</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          /* Empty State - Lovable Style */
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-white font-medium mb-2">No Preview</h3>
              <p className="text-gray-500 text-sm max-w-[200px]">
                Select a component from the canvas to preview it here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
