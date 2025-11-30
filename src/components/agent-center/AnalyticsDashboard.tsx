import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Activity, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { agentCenterApi } from '@/services/agent-center.service';
import { AnalyticsData } from '@/types/agent-center.types';
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

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agentCenterApi.analytics.getOverview(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Mock data for charts
  const executionTrends = [
    { date: 'Mon', executions: 12, success: 11, failed: 1 },
    { date: 'Tue', executions: 19, success: 18, failed: 1 },
    { date: 'Wed', executions: 15, success: 14, failed: 1 },
    { date: 'Thu', executions: 22, success: 20, failed: 2 },
    { date: 'Fri', executions: 18, success: 17, failed: 1 },
    { date: 'Sat', executions: 10, success: 10, failed: 0 },
    { date: 'Sun', executions: 8, success: 8, failed: 0 },
  ];

  const costTrends = [
    { date: 'Mon', cost: 1.25 },
    { date: 'Tue', cost: 2.1 },
    { date: 'Wed', cost: 1.85 },
    { date: 'Thu', cost: 2.45 },
    { date: 'Fri', cost: 2.2 },
    { date: 'Sat', cost: 1.1 },
    { date: 'Sun', cost: 0.95 },
  ];

  const agentUsage = [
    { name: 'work_agent', value: 45, color: '#3b82f6' },
    { name: 'research_agent', value: 30, color: '#8b5cf6' },
    { name: 'content_creator', value: 15, color: '#10b981' },
    { name: 'data_analyst', value: 10, color: '#f59e0b' },
  ];

  const toolUsage = [
    { name: 'web_search', calls: 150 },
    { name: 'sentiment_analysis', calls: 85 },
    { name: 'calculator', calls: 45 },
    { name: 'text_summarizer', calls: 38 },
    { name: 'email_validator', calls: 22 },
  ];

  // Use analytics data if available, otherwise use defaults
  // Use analytics data if available, otherwise use defaults
  const totalExecutions = analytics?.totalExecutions ?? 104;
  const successRate = analytics?.successRate ?? 96.2;
  const totalCost = analytics?.totalCost ?? 11.9;
  const avgDuration = analytics?.avgDuration ?? 8500;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-sm text-muted-foreground">Monitor performance and usage patterns</p>
        </div>
        <Tabs
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as '24h' | '7d' | '30d' | '90d')}
        >
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="90d">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700 shadow-lg shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalExecutions}</div>
            <p className="text-xs text-slate-400">
              <span className="text-green-400">+12%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700 shadow-lg shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{successRate}%</div>
            <p className="text-xs text-slate-400">
              <span className="text-green-400">+2.1%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950 to-orange-900 border-orange-700 shadow-lg shadow-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-slate-400">
              <span className="text-red-400">+8%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700 shadow-lg shadow-purple-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{(avgDuration / 1000).toFixed(1)}s</div>
            <p className="text-xs text-slate-400">
              <span className="text-green-400">-1.2s</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Trends */}
        <Card className="bg-slate-900 border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-100">Execution Trends</CardTitle>
            <CardDescription className="text-slate-400">
              Daily execution count and success rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={executionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="executions" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Trends */}
        <Card className="bg-slate-900 border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-100">Cost Trends</CardTitle>
            <CardDescription className="text-slate-400">Daily cost breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="cost" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agent Usage Distribution */}
        <Card className="bg-slate-900 border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-100">Agent Usage Distribution</CardTitle>
            <CardDescription className="text-slate-400">Execution count by agent</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agentUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {agentUsage.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tool Usage */}
        <Card className="bg-slate-900 border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-100">Top Tools</CardTitle>
            <CardDescription className="text-slate-400">Most frequently used tools</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={toolUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="calls" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Performance Improvement
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Average execution time decreased by 12% this week. Great optimization!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  High Usage Period
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Peak usage detected on Thursday. Consider scaling resources during this time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                  Cost Optimization
                </h4>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  Consider using GPT-3.5-turbo for simple tasks to reduce costs by up to 90%.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
