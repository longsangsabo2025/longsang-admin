import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStats,
  getAgents,
  getActivityLogs,
  getContentQueue,
  subscribeToAgentUpdates,
  subscribeToActivityLogs,
  subscribeToContentQueue,
} from '@/lib/automation/api';
import { DashboardHeader } from '@/components/automation/DashboardHeader';
import { StatsCards } from '@/components/automation/StatsCards';
import { AgentStatusCards } from '@/components/automation/AgentStatusCards';
import { ContentQueueList } from '@/components/automation/ContentQueueList';
import { ActivityLogList } from '@/components/automation/ActivityLogList';
import { CreateAgentModal } from '@/components/automation/CreateAgentModal';
import { WorkflowDashboard } from '@/components/automation/WorkflowDashboard';
import { MasterPlayButton } from '@/components/automation/MasterPlayButton';
import { McpDashboard } from '@/components/automation/McpDashboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Globe, Briefcase, Zap, Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useNotifications,
  useBudgetAlerts,
  useContentNotifications,
} from '@/hooks/use-notifications';

const AutomationDashboard = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Enable real-time notifications
  useNotifications();
  useBudgetAlerts();
  useContentNotifications();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', refreshKey],
    queryFn: getDashboardStats,
  });

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents', refreshKey],
    queryFn: getAgents,
  });

  const { data: activityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['activity-logs', refreshKey],
    queryFn: () => getActivityLogs(20),
  });

  const { data: contentQueue, isLoading: queueLoading } = useQuery({
    queryKey: ['content-queue', refreshKey],
    queryFn: () => getContentQueue(10),
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const agentsChannel = subscribeToAgentUpdates(() => {
      setRefreshKey((prev) => prev + 1);
    });

    const logsChannel = subscribeToActivityLogs(() => {
      setRefreshKey((prev) => prev + 1);
    });

    const queueChannel = subscribeToContentQueue(() => {
      setRefreshKey((prev) => prev + 1);
    });

    return () => {
      agentsChannel.unsubscribe();
      logsChannel.unsubscribe();
      queueChannel.unsubscribe();
    };
  }, []);

  // Categorize agents by category field
  const websiteAgents = agents?.filter((a) => a.category === 'website') || [];
  const otherAgents = agents?.filter((a) => a.category !== 'website') || [];

  // Further categorize "other" agents by specific categories
  const ecommerceAgents = agents?.filter((a) => a.category === 'ecommerce') || [];
  const crmAgents = agents?.filter((a) => a.category === 'crm') || [];
  const marketingAgents = agents?.filter((a) => a.category === 'marketing') || [];
  const operationsAgents = agents?.filter((a) => a.category === 'operations') || [];

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Page Info Banner */}
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-3xl">👤</span>
              <div>
                <h1 className="text-2xl font-bold mb-1">User Dashboard - Trung Tâm Tự Động</h1>
                <p className="text-muted-foreground">
                  Dành cho <strong>Người dùng</strong> - Xem và chạy agents, theo dõi hoạt động
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  💡 Cần tính năng nâng cao? Truy cập <strong>Admin Management</strong> để tạo/sửa
                  agents và workflows
                </p>
              </div>
            </div>
          </div>

          {/* Header & Master Control */}
          <div className="mb-8">
            <DashboardHeader />
            {/* Master Play Button - Central Control */}
            <div className="mt-6">
              <MasterPlayButton />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mb-8">
            <Button variant="outline" onClick={() => setRefreshKey((prev) => prev + 1)}>
              Refresh
            </Button>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </div>

          {/* Stats Overview */}
          <StatsCards stats={stats} isLoading={statsLoading} />

          {/* Agents by Category */}
          <Tabs defaultValue="website" className="mb-12">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website ({websiteAgents.length})
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Other Projects ({otherAgents.length})
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="mcp" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                MCP Protocol
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Website Automation Tab */}
            <TabsContent value="website" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">🌐 Website Automation</h2>
                  <p className="text-muted-foreground">
                    Agents supporting your portfolio website operations
                  </p>
                </div>
              </div>
              <AgentStatusCards
                agents={websiteAgents}
                isLoading={agentsLoading}
                onCreateAgent={() => setCreateModalOpen(true)}
              />
              {websiteAgents.length === 0 && !agentsLoading && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Website Agents Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create agents to automate your website operations
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Website Agent
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Other Projects Tab */}
            <TabsContent value="other" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">💼 Other Projects</h2>
                  <p className="text-muted-foreground">Agents organized by project category</p>
                </div>
              </div>

              {/* Sub-tabs for Other Projects */}
              <Tabs defaultValue="all-other" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="all-other" className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />
                    All ({otherAgents.length})
                  </TabsTrigger>
                  <TabsTrigger value="ecommerce" className="flex items-center gap-2">
                    🛍️ E-Commerce ({ecommerceAgents.length})
                  </TabsTrigger>
                  <TabsTrigger value="crm" className="flex items-center gap-2">
                    🎯 CRM ({crmAgents.length})
                  </TabsTrigger>
                  <TabsTrigger value="marketing" className="flex items-center gap-2">
                    ✍️ Marketing ({marketingAgents.length})
                  </TabsTrigger>
                  <TabsTrigger value="operations" className="flex items-center gap-2">
                    ⚡ Operations ({operationsAgents.length})
                  </TabsTrigger>
                </TabsList>

                {/* All Other Projects */}
                <TabsContent value="all-other">
                  <AgentStatusCards
                    agents={otherAgents}
                    isLoading={agentsLoading}
                    onCreateAgent={() => setCreateModalOpen(true)}
                  />
                  {otherAgents.length === 0 && !agentsLoading && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Other Agents Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create agents for other automation projects
                      </p>
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Agent
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* E-Commerce Tab */}
                <TabsContent value="ecommerce">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">🛍️ E-Commerce Automation</h3>
                    <p className="text-sm text-muted-foreground">
                      Automate product descriptions, customer support, and cart recovery
                    </p>
                  </div>
                  <AgentStatusCards
                    agents={ecommerceAgents}
                    isLoading={agentsLoading}
                    onCreateAgent={() => setCreateModalOpen(true)}
                  />
                  {ecommerceAgents.length === 0 && !agentsLoading && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">No E-Commerce Agents</h3>
                      <p className="text-muted-foreground mb-4">
                        Create agents for product descriptions, reviews, cart recovery
                      </p>
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create E-Commerce Agent
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* CRM Tab */}
                <TabsContent value="crm">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">🎯 CRM & Sales Automation</h3>
                    <p className="text-sm text-muted-foreground">
                      Lead qualification, follow-ups, and meeting notes
                    </p>
                  </div>
                  <AgentStatusCards
                    agents={crmAgents}
                    isLoading={agentsLoading}
                    onCreateAgent={() => setCreateModalOpen(true)}
                  />
                  {crmAgents.length === 0 && !agentsLoading && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">No CRM Agents</h3>
                      <p className="text-muted-foreground mb-4">
                        Create agents for lead qualification, sales follow-ups
                      </p>
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create CRM Agent
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Marketing Tab */}
                <TabsContent value="marketing">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">✍️ Marketing Automation</h3>
                    <p className="text-sm text-muted-foreground">
                      Content generation, social media, and email campaigns
                    </p>
                  </div>
                  <AgentStatusCards
                    agents={marketingAgents}
                    isLoading={agentsLoading}
                    onCreateAgent={() => setCreateModalOpen(true)}
                  />
                  {marketingAgents.length === 0 && !agentsLoading && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">No Marketing Agents</h3>
                      <p className="text-muted-foreground mb-4">
                        Create agents for blog posts, social media, email campaigns
                      </p>
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Marketing Agent
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Operations Tab */}
                <TabsContent value="operations">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">⚡ Operations & Productivity</h3>
                    <p className="text-sm text-muted-foreground">
                      Task management, document processing, and reporting
                    </p>
                  </div>
                  <AgentStatusCards
                    agents={operationsAgents}
                    isLoading={agentsLoading}
                    onCreateAgent={() => setCreateModalOpen(true)}
                  />
                  {operationsAgents.length === 0 && !agentsLoading && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">No Operations Agents</h3>
                      <p className="text-muted-foreground mb-4">
                        Create agents for task prioritization, document summaries, reports
                      </p>
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Operations Agent
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* MCP Protocol Tab */}
            <TabsContent value="mcp" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">🔗 MCP Protocol</h2>
                  <p className="text-muted-foreground">
                    Model Context Protocol server management and monitoring
                  </p>
                </div>
              </div>
              <McpDashboard />
            </TabsContent>

            {/* Workflows Tab */}
            <TabsContent value="workflows" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">🔧 Workflow Management</h2>
                  <p className="text-muted-foreground">
                    Create and manage n8n workflows for advanced automation
                  </p>
                </div>
              </div>
              <WorkflowDashboard />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">⚡ All Agents</h2>
                  <p className="text-muted-foreground">
                    Complete overview of all automation agents
                  </p>
                </div>
              </div>
              <AgentStatusCards
                agents={agents || []}
                isLoading={agentsLoading}
                onCreateAgent={() => setCreateModalOpen(true)}
              />
            </TabsContent>
          </Tabs>

          {/* Content Queue */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">📝 Content Queue</h2>
                <p className="text-muted-foreground">
                  {contentQueue?.length || 0} items pending or scheduled
                </p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/automation/content-queue')}>
                View All
              </Button>
            </div>
            <ContentQueueList items={contentQueue || []} isLoading={queueLoading} />
          </section>

          {/* Activity Log */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">📊 Activity Log</h2>
                <p className="text-muted-foreground">Recent automation activities and events</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/automation/logs')}>
                View All
              </Button>
            </div>
            <ActivityLogList logs={activityLogs || []} isLoading={logsLoading} />
          </section>
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
};

export default AutomationDashboard;
