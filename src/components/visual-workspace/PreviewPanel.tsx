/**
 * Preview Panel Component
 * Shows code preview and component properties
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Settings, Eye } from 'lucide-react';
import { Node } from 'reactflow';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  selectedNode: Node | null;
  className?: string;
}

export function PreviewPanel({ selectedNode, className = '' }: PreviewPanelProps) {
  const componentCode = selectedNode?.data?.code || '';
  const componentProperties = selectedNode?.data?.properties || {};

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {selectedNode ? (
            <>
              <Eye className="h-5 w-5" />
              Preview: {selectedNode.data?.label || 'Component'}
            </>
          ) : (
            <>
              <Eye className="h-5 w-5" />
              Preview
            </>
          )}
        </CardTitle>
        <CardDescription>
          {selectedNode
            ? 'Xem code và chỉnh sửa properties của component'
            : 'Chọn một component để xem preview'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        {selectedNode ? (
          <Tabs defaultValue="code" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="properties" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Properties
              </TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="flex-1 min-h-0 mx-4 mb-4">
              <ScrollArea className="h-full">
                <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
                  <code>{componentCode || '// No code available'}</code>
                </pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="properties" className="flex-1 min-h-0 mx-4 mb-4">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {Object.keys(componentProperties).length > 0 ? (
                    Object.entries(componentProperties).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-medium">{key}</label>
                        <div className="p-2 bg-muted rounded-md text-sm">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No properties available</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chọn một component để xem preview</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

