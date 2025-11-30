import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentsDashboard from "@/components/agent-center/AgentsDashboard";
import WorkflowsDashboard from "@/components/agent-center/WorkflowsDashboard";
import ToolsDashboard from "@/components/agent-center/ToolsDashboard";
import ExecutionsDashboard from "@/components/agent-center/ExecutionsDashboard";
import AnalyticsDashboard from "@/components/agent-center/AnalyticsDashboard";
import { MVPMarketplace } from "@/components/agent-center/MVPMarketplace";
import { Bot, Workflow, Wrench, Play, BarChart3, Store } from "lucide-react";

const AgentCenter = () => {
  const [activeTab, setActiveTab] = useState("agents");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Page Info Banner */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg p-6 mb-8 shadow-lg shadow-indigo-500/10">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h1 className="text-2xl font-bold mb-1 text-white">Admin Management - AI Agent Center</h1>
              <p className="text-slate-300">
                Dành cho <strong className="text-indigo-400">Admin/Developer</strong> - Quản lý agents, workflows, tools + <strong className="text-green-400">🛒 Marketplace AI thật</strong>
              </p>
              <p className="text-sm text-slate-400 mt-2">
                💡 <strong>Marketplace:</strong> 5 AI agents sẵn sàng với GPT-4o-mini ($0.01-$0.50/run) | <strong>Management:</strong> CRUD agents, build workflows, analytics
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                AI Agent Center
              </h2>
              <p className="text-slate-400">
                Orchestrate, monitor, and manage your AI agents
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid bg-slate-900 border border-slate-700 backdrop-blur-sm p-1 shadow-lg">
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="gap-2">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2">
              <Workflow className="w-4 h-4" />
              <span className="hidden sm:inline">Workflows</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="executions" className="gap-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Executions</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            <AgentsDashboard />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4">
            <MVPMarketplace />
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <WorkflowsDashboard />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <ToolsDashboard />
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <ExecutionsDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentCenter;
