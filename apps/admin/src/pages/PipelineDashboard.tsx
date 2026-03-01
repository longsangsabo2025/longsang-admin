import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipelineCommandCenter } from '@/components/pipeline/PipelineCommandCenter';
import { PipelineStageManager } from '@/components/pipeline/PipelineStageManager';
import { Zap, SlidersHorizontal } from 'lucide-react';

export default function PipelineDashboardPage() {
  const [activeView, setActiveView] = useState('command');

  return (
    <div className="container py-6">
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="mb-4">
          <TabsTrigger value="command" className="gap-2">
            <Zap className="h-4 w-4" />
            Command Center
          </TabsTrigger>
          <TabsTrigger value="stages" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Stage Inspector
          </TabsTrigger>
        </TabsList>

        <TabsContent value="command">
          <PipelineCommandCenter />
        </TabsContent>

        <TabsContent value="stages">
          <PipelineStageManager onClose={() => setActiveView('command')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
