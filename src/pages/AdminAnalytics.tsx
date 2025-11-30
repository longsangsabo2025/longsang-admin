import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Calendar,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePersistedState, useScrollRestore } from "@/hooks/usePersistedState";

const AdminAnalytics = () => {
  // Restore scroll position and persist active tab
  useScrollRestore('admin-analytics');
  const [activeTab, setActiveTab] = usePersistedState('admin-analytics-tab', 'overview');

  // Mock data - replace with real data from Supabase
  const executionData = [
    { date: "Jan 5", executions: 45, success: 43, failed: 2 },
    { date: "Jan 6", executions: 52, success: 50, failed: 2 },
    { date: "Jan 7", executions: 49, success: 48, failed: 1 },
    { date: "Jan 8", executions: 63, success: 61, failed: 2 },
    { date: "Jan 9", executions: 71, success: 69, failed: 2 },
    { date: "Jan 10", executions: 68, success: 67, failed: 1 },
    { date: "Jan 11", executions: 127, success: 125, failed: 2 },
  ];

  const workflowUsage = [
    { name: "AI Content Factory", executions: 342, percentage: 35 },
    { name: "Lead Management", executions: 287, percentage: 29 },
    { name: "Social Media Manager", executions: 198, percentage: 20 },
    { name: "Email Campaign", executions: 151, percentage: 16 },
  ];

  const performanceData = [
    { name: "< 1s", count: 650, color: "#10b981" },
    { name: "1-3s", count: 280, color: "#3b82f6" },
    { name: "3-5s", count: 45, color: "#f59e0b" },
    { name: "> 5s", count: 25, color: "#ef4444" },
  ];

  const stats = [
    {
      title: "Total Executions",
      value: "1,247",
      change: "+23.5%",
      trend: "up",
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Success Rate",
      value: "98.5%",
      change: "+2.1%",
      trend: "up",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Avg Response Time",
      value: "1.2s",
      change: "-0.3s",
      trend: "up",
      icon: Zap,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Active Users",
      value: "12",
      change: "+4 this week",
      trend: "up",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
  ];

  const recentExecutions = [
    {
      workflow: "AI Content Factory",
      status: "success",
      duration: "1.2s",
      time: "2 min ago"
    },
    {
      workflow: "Lead Management",
      status: "success",
      duration: "0.8s",
      time: "5 min ago"
    },
    {
      workflow: "Social Media Manager",
      status: "failed",
      duration: "3.5s",
      time: "8 min ago"
    },
    {
      workflow: "Email Campaign",
      status: "success",
      duration: "1.5s",
      time: "12 min ago"
    },
  ];

  const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor performance and track your AI automation metrics
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Last 7 days
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardDescription className="text-sm font-medium">
                  {stat.title}
                </CardDescription>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">vs last week</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Executions</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Executions Chart */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Trends</CardTitle>
              <CardDescription>Daily workflow executions and success rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={executionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="executions" stroke="#0ea5e9" strokeWidth={2} name="Total Executions" />
                  <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} name="Successful" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Usage Chart */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Distribution</CardTitle>
                <CardDescription>Usage by workflow type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workflowUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="executions"
                    >
                      {workflowUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Executions</CardTitle>
                <CardDescription>Total runs per workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workflowUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="executions" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Chart */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>Workflow execution speed</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count">
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>Latest workflow runs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentExecutions.map((exec, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {exec.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{exec.workflow}</p>
                        <p className="text-xs text-muted-foreground">{exec.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{exec.duration}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
