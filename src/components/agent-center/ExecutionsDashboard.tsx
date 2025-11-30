import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, XCircle, Clock, Loader2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { agentCenterApi } from '@/services/agent-center.service';
import { WorkflowExecution } from '@/types/agent-center.types';

const ExecutionsDashboard = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agentCenterApi.executions.list();
      setExecutions(data);
    } catch (error) {
      console.error('Error fetching executions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load executions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const calculateStats = () => {
    const total = executions.length;
    const completed = executions.filter((e) => e.status === 'completed').length;
    const running = executions.filter((e) => e.status === 'running').length;
    const failed = executions.filter((e) => e.status === 'failed').length;
    const totalCost = executions.reduce((sum, e) => sum + e.cost_usd, 0);

    return { total, completed, running, failed, totalCost };
  };

  const stats = calculateStats();

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700 shadow-lg shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total</CardTitle>
            <Play className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700 shadow-lg shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700 shadow-lg shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Running</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.running}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950 to-red-900 border-red-700 shadow-lg shadow-red-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950 to-orange-900 border-orange-700 shadow-lg shadow-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Execution History</h2>
          <p className="text-sm text-slate-400">Monitor workflow executions in real-time</p>
        </div>
        <Button
          onClick={fetchExecutions}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Refresh
        </Button>
      </div>

      {/* Executions List */}
      <div className="space-y-3">
        {executions.length === 0 ? (
          <Card className="bg-slate-900 border-slate-700 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="w-16 h-16 text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-200">No executions yet</h3>
              <p className="text-sm text-slate-400">Execute a workflow to see it here</p>
            </CardContent>
          </Card>
        ) : (
          executions.map((execution) => (
            <Card
              key={execution.id}
              className="bg-slate-900 border-slate-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getStatusIcon(execution.status)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-100">{execution.workflow_name}</h3>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Started: {new Date(execution.started_at).toLocaleString()}
                        </span>
                        {execution.execution_time_ms && (
                          <span>Duration: {formatDuration(execution.execution_time_ms)}</span>
                        )}
                        <span>Cost: ${execution.cost_usd.toFixed(3)}</span>
                      </div>

                      {/* Progress Bar */}
                      {execution.status === 'running' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                              Step {execution.completed_steps} of {execution.total_steps}:{' '}
                              {execution.current_step}
                            </span>
                            <span className="font-medium text-blue-400">
                              {Math.round(
                                (execution.completed_steps / execution.total_steps) * 100
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(execution.completed_steps / execution.total_steps) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {execution.error_message && (
                        <div className="bg-red-950/50 border border-red-700 p-3 rounded-lg">
                          <p className="text-sm text-red-300">
                            <strong>Error:</strong> {execution.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800">
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ExecutionsDashboard;
