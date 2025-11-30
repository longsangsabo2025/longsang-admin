import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Play,
  Trash2,
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ActiveAgent {
  id: string;
  name: string;
  role: string;
  agent_type: string;
  description: string;
  status: string;
  created_at: string;
  metadata: {
    pricing?: {
      base_cost: number;
      free_runs: number;
    };
    stats?: {
      total_runs?: number;
      success_rate?: number;
      avg_execution_time?: number;
    };
  };
}

interface ExecutionHistory {
  id: string;
  agent_id: string;
  input: string;
  output: string;
  status: string;
  execution_time: number;
  cost: number;
  created_at: string;
  agent_name: string;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([]);
  const [executions, setExecutions] = useState<ExecutionHistory[]>([]);
  const [stats, setStats] = useState({
    total_agents: 0,
    total_runs: 0,
    total_cost: 0,
    success_rate: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please login to view your agents');
        navigate('/marketplace');
        return;
      }

      // Load active agents
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      // Load execution history
      const { data: execHistory, error: execError } = await supabase
        .from('agent_executions')
        .select(
          `
          id,
          agent_id,
          input,
          output,
          status,
          execution_time,
          cost,
          created_at,
          agents!inner(name)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (execError) throw execError;

      // Calculate stats
      const totalRuns = execHistory?.length || 0;
      const totalCost = execHistory?.reduce((sum, e) => sum + (e.cost || 0), 0) || 0;
      const successCount = execHistory?.filter((e) => e.status === 'completed').length || 0;
      const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;

      setActiveAgents(agents || []);
      setExecutions(
        execHistory?.map((e) => ({
          ...e,
          agent_name: e.agents?.name || 'Unknown',
        })) || []
      );
      setStats({
        total_agents: agents?.length || 0,
        total_runs: totalRuns,
        total_cost: totalCost,
        success_rate: successRate,
      });
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from('agents').delete().eq('id', agentId);

      if (error) throw error;

      toast.success('Agent deleted successfully');
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to delete agent');
    }
  };

  const handleExecuteAgent = (agentId: string) => {
    const agent = activeAgents.find((a) => a.id === agentId);
    if (agent) {
      navigate(`/marketplace/${agent.name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My AI Agents</h1>
            <p className="text-gray-300">Manage and monitor your activated agents</p>
          </div>
          <Button
            onClick={() => navigate('/marketplace')}
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <Bot className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Agents</CardTitle>
              <Bot className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total_agents}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Runs</CardTitle>
              <Activity className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total_runs}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Cost</CardTitle>
              <DollarSign className="w-4 h-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${stats.total_cost.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Success Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.success_rate.toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Agents */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Active Agents</CardTitle>
            <CardDescription className="text-gray-300">Your activated AI agents</CardDescription>
          </CardHeader>
          <CardContent>
            {activeAgents.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-4">No active agents yet</p>
                <Button
                  onClick={() => navigate('/marketplace')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAgents.map((agent) => (
                  <Card key={agent.id} className="bg-white/5 border-white/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">{agent.role}</CardTitle>
                          <Badge className="mt-2 bg-green-600">{agent.agent_type}</Badge>
                        </div>
                        <Bot className="w-8 h-8 text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-300 line-clamp-2">{agent.description}</p>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>${agent.metadata?.pricing?.base_cost || 0} per run</span>
                        <span>{agent.metadata?.pricing?.free_runs || 0} free runs</span>
                      </div>

                      {agent.metadata?.stats && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/5 p-2 rounded">
                            <div className="text-gray-400">Runs</div>
                            <div className="text-white font-semibold">
                              {agent.metadata.stats.total_runs || 0}
                            </div>
                          </div>
                          <div className="bg-white/5 p-2 rounded">
                            <div className="text-gray-400">Success</div>
                            <div className="text-white font-semibold">
                              {agent.metadata.stats.success_rate || 0}%
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleExecuteAgent(agent.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Execute
                        </Button>
                        <Button
                          onClick={() => handleDeleteAgent(agent.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution History */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Execution History</CardTitle>
            <CardDescription className="text-gray-300">Recent agent executions</CardDescription>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No executions yet</p>
            ) : (
              <div className="space-y-3">
                {executions.map((exec) => (
                  <div key={exec.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">{exec.agent_name}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(exec.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge
                        className={exec.status === 'completed' ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {exec.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-gray-400">Time</div>
                        <div className="text-white font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exec.execution_time}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Cost</div>
                        <div className="text-white font-semibold flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />${exec.cost.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Input Length</div>
                        <div className="text-white font-semibold">{exec.input.length} chars</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
