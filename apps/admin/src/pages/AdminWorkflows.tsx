import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowTemplateLibrary } from '@/components/workflow/WorkflowTemplateLibrary';
import WorkflowTester from '@/components/WorkflowTester';
import WorkflowImporter from '@/components/WorkflowImporter';
import { TestTube, Upload, Sparkles } from 'lucide-react';

const AdminWorkflows = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-3xl">🔄</span>
          <div>
            <h1 className="text-3xl font-bold">Workflow Management</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý workflow templates, instances và automation
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="library" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Template Library
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Workflow
          </TabsTrigger>
          <TabsTrigger value="tester" className="gap-2">
            <TestTube className="h-4 w-4" />
            Workflow Tester
          </TabsTrigger>
        </TabsList>

        {/* Template Library Tab */}
        <TabsContent value="library">
          <WorkflowTemplateLibrary />
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import">
          <WorkflowImporter />
        </TabsContent>

        {/* Tester Tab */}
        <TabsContent value="tester">
          <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <TestTube className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-semibold">Developer Testing Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Dành cho developers - công cụ test và debug workflows nâng cao
                </p>
              </div>
            </div>
          </div>
          <WorkflowTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWorkflows;
