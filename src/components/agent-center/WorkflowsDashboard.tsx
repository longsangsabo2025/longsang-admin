/**
 * ⚙️ Workflows Dashboard
 * 
 * Theo tài liệu: docs/ai-command-center/03-TAB-WORKFLOWS.md
 * 
 * @author LongSang Admin
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Workflow, Play, GitBranch, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WorkflowCard from "./WorkflowCard";
import CreateWorkflowDialog from "./CreateWorkflowDialog";
import { agentCenterApi } from "@/services/agent-center.service";
import { Workflow as WorkflowType } from "@/types/agent-center.types";

interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalRuns: number;
  successRate: number;
}

const WorkflowsDashboard = () => {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [stats, setStats] = useState<WorkflowStats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalRuns: 0,
    successRate: 0,
  });
  const { toast } = useToast();

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const [workflowsList, workflowStats] = await Promise.all([
        agentCenterApi.workflows.list(),
        agentCenterApi.workflows.getStats(),
      ]);

      setWorkflows(workflowsList);
      setStats(workflowStats);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700 shadow-lg shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalWorkflows}</div>
            <p className="text-xs text-slate-400">
              {stats.activeWorkflows} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700 shadow-lg shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Executions</CardTitle>
            <Play className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRuns}</div>
            <p className="text-xs text-slate-400">
              Total runs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700 shadow-lg shadow-purple-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Success Rate</CardTitle>
            <Zap className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-400">
              Average
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950 to-orange-900 border-orange-700 shadow-lg shadow-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Active</CardTitle>
            <GitBranch className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.templates}</div>
            <p className="text-xs text-muted-foreground">
              Pre-built workflows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Workflows</h2>
          <p className="text-sm text-slate-400">
            Orchestrate complex multi-agent workflows
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
      </div>

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="w-16 h-16 text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-slate-200">No workflows yet</h3>
            <p className="text-sm text-slate-400 mb-4">
              Create your first workflow to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} onUpdate={fetchWorkflows} />
          ))}
        </div>
      )}

      {/* Create Workflow Dialog */}
      <CreateWorkflowDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchWorkflows}
      />
    </div>
  );
};

export default WorkflowsDashboard;
