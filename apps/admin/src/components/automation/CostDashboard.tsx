import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Activity, Zap } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CostStats {
  totalCost: number;
  todayCost: number;
  thisMonthCost: number;
  totalTokens: number;
  avgCostPerRun: number;
}

interface AgentCost {
  agent_id: string;
  agent_name: string;
  total_cost: number;
  total_tokens: number;
  run_count: number;
}

interface DailyCost {
  date: string;
  cost: number;
  tokens: number;
}

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

export function CostDashboard() {
  const [stats, setStats] = useState<CostStats>({
    totalCost: 0,
    todayCost: 0,
    thisMonthCost: 0,
    totalTokens: 0,
    avgCostPerRun: 0,
  });
  const [agentCosts, setAgentCosts] = useState<AgentCost[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCostData();

    // Real-time subscription
    const subscription = supabase
      .channel('cost_analytics_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_analytics' }, () => {
        loadCostData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadCostData = async () => {
    try {
      // Get overall stats
      const { data: analytics } = await supabase
        .from('cost_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (analytics && analytics.length > 0) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thisMonth = now.toISOString().slice(0, 7);

        const totalCost = analytics.reduce((sum, row) => sum + (row.cost || 0), 0);
        const todayCost = analytics
          .filter((row) => row.created_at.startsWith(today))
          .reduce((sum, row) => sum + (row.cost || 0), 0);
        const thisMonthCost = analytics
          .filter((row) => row.created_at.startsWith(thisMonth))
          .reduce((sum, row) => sum + (row.cost || 0), 0);
        const totalTokens = analytics.reduce((sum, row) => sum + (row.tokens_used || 0), 0);
        const avgCostPerRun = totalCost / analytics.length;

        setStats({
          totalCost,
          todayCost,
          thisMonthCost,
          totalTokens,
          avgCostPerRun,
        });

        // Group by date for chart
        const dailyMap = new Map<string, { cost: number; tokens: number }>();
        analytics.forEach((row) => {
          const date = row.created_at.split('T')[0];
          const existing = dailyMap.get(date) || { cost: 0, tokens: 0 };
          dailyMap.set(date, {
            cost: existing.cost + (row.cost || 0),
            tokens: existing.tokens + (row.tokens_used || 0),
          });
        });

        const dailyData = Array.from(dailyMap.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7); // Last 7 days

        setDailyCosts(dailyData);
      }

      // Get cost by agent
      const { data: agents } = await supabase.from('ai_agents').select('id, name, total_runs');

      if (agents) {
        const agentCostData: AgentCost[] = [];

        for (const agent of agents) {
          const { data: agentAnalytics } = await supabase
            .from('cost_analytics')
            .select('*')
            .eq('agent_id', agent.id);

          if (agentAnalytics && agentAnalytics.length > 0) {
            const totalCost = agentAnalytics.reduce((sum, row) => sum + (row.cost || 0), 0);
            const totalTokens = agentAnalytics.reduce(
              (sum, row) => sum + (row.tokens_used || 0),
              0
            );

            agentCostData.push({
              agent_id: agent.id,
              agent_name: agent.name,
              total_cost: totalCost,
              total_tokens: totalTokens,
              run_count: agent.total_runs || 0,
            });
          }
        }

        setAgentCosts(agentCostData.sort((a, b) => b.total_cost - a.total_cost));
      }
    } catch (error) {
      console.error('Error loading cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todayCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.thisMonthCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalTokens / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">All time usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Run</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgCostPerRun.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Average cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Trend (Last 7 Days)</CardTitle>
            <CardDescription>Daily spending on AI operations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="#8B5CF6" name="Cost ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Token Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Token Usage (Last 7 Days)</CardTitle>
            <CardDescription>Daily token consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tokens" fill="#10B981" name="Tokens" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost by Agent */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Agent</CardTitle>
            <CardDescription>Total spending per agent</CardDescription>
          </CardHeader>
          <CardContent>
            {agentCosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={agentCosts}
                    dataKey="total_cost"
                    nameKey="agent_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.agent_name}: $${entry.total_cost.toFixed(4)}`}
                  >
                    {agentCosts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No cost data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Cost Details</CardTitle>
            <CardDescription>Breakdown by agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentCosts.map((agent, index) => (
                <div key={agent.agent_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium">{agent.agent_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.run_count} runs · {(agent.total_tokens / 1000).toFixed(1)}K tokens
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">${agent.total_cost.toFixed(4)}</Badge>
                </div>
              ))}
              {agentCosts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No agents have run yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
