/**
 * 🎛️ UNIFIED AI COMMAND CENTER
 *
 * Tích hợp tất cả chức năng AI & Automation vào một nơi duy nhất:
 * - AI Agents Management
 * - Workflow Management (Templates, Import, Test)
 * - AI Tools (Sora Video, etc.)
 * - Marketplace
 * - Executions & Analytics
 *
 * @author LongSang Admin
 * @version 2.0.0
 * @date 2025-11-25
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Bot,
  LayoutGrid,
  Lightbulb,
  Play,
  Settings,
  Sparkles,
  Store,
  TestTube,
  Upload,
  Video,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import { Suspense, lazy, useState } from 'react';

// Layout components (always visible - keep static)
import { CommandInput } from '@/components/agent-center/CommandInput';
import { useCommandPalette } from '@/components/agent-center/CommandPalette';
import { IntelligentAlerts } from '@/components/agent-center/IntelligentAlerts';
import { ProactiveSuggestionsPanel } from '@/components/agent-center/ProactiveSuggestionsPanel';
import { QuickActionsPanel } from '@/components/copilot/QuickActionsPanel';
import { useAgentStats } from '@/hooks/use-agent-company';

// Lazy-load tab content components for code splitting
const WorkflowImporter = lazy(() => import('@/components/WorkflowImporter'));
const WorkflowTester = lazy(() => import('@/components/WorkflowTester'));
const AgentIdeasDashboard = lazy(() => import('@/components/agent-center/AgentIdeasDashboard'));
const AgentsDashboard = lazy(() => import('@/components/agent-center/AgentsDashboard'));
const AnalyticsDashboard = lazy(() => import('@/components/agent-center/AnalyticsDashboard'));
const ExecutionsDashboard = lazy(() => import('@/components/agent-center/ExecutionsDashboard'));
const MVPMarketplace = lazy(() => import('@/components/agent-center/MVPMarketplace').then(m => ({ default: m.MVPMarketplace })));
const MultiAgentOrchestrator = lazy(() => import('@/components/agent-center/MultiAgentOrchestrator').then(m => ({ default: m.MultiAgentOrchestrator })));
const ToolsDashboard = lazy(() => import('@/components/agent-center/ToolsDashboard'));
const WorkflowOptimizer = lazy(() => import('@/components/agent-center/WorkflowOptimizer').then(m => ({ default: m.WorkflowOptimizer })));
const WorkflowsDashboard = lazy(() => import('@/components/agent-center/WorkflowsDashboard'));
const WorkflowTemplateLibrary = lazy(() => import('@/components/workflow/WorkflowTemplateLibrary').then(m => ({ default: m.WorkflowTemplateLibrary })));

// Lazy import for Sora Video (heavy component)
const SoraVideoContent = lazy(() => import('./SoraVideoGenerator'));

// ============================================================
// TYPES
// ============================================================

type MainTab =
  | 'ideas'
  | 'agents'
  | 'workflows'
  | 'tools'
  | 'marketplace'
  | 'executions'
  | 'analytics';
type WorkflowSubTab = 'templates' | 'builder' | 'import' | 'tester';
type ToolSubTab = 'all' | 'sora-video' | 'custom';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  description: string;
}

// ============================================================
// CONFIGURATION
// ============================================================

const MAIN_TABS: TabConfig[] = [
  {
    id: 'ideas',
    label: 'Ideas',
    icon: <Lightbulb className="w-4 h-4" />,
    badge: 'NEW',
    description: 'Brainstorm và lên kế hoạch AI Agents',
  },
  {
    id: 'agents',
    label: 'AI Agents',
    icon: <Bot className="w-4 h-4" />,
    description: 'Quản lý và điều phối AI Agents',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: <Workflow className="w-4 h-4" />,
    description: 'Templates, Import & Test workflows',
  },
  {
    id: 'tools',
    label: 'AI Tools',
    icon: <Wrench className="w-4 h-4" />,
    badge: 'Sora',
    description: 'Video AI, Image Gen, và công cụ khác',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: <Store className="w-4 h-4" />,
    badge: 'NEW',
    description: 'Mua/bán AI agents sẵn sàng sử dụng',
  },
  {
    id: 'executions',
    label: 'Executions',
    icon: <Play className="w-4 h-4" />,
    description: 'Lịch sử thực thi và logs',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Thống kê và báo cáo',
  },
];

const WORKFLOW_SUB_TABS: TabConfig[] = [
  {
    id: 'templates',
    label: 'Template Library',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Thư viện workflow templates',
  },
  {
    id: 'builder',
    label: 'Workflow Builder',
    icon: <LayoutGrid className="w-4 h-4" />,
    description: 'Xây dựng workflows',
  },
  {
    id: 'import',
    label: 'Import',
    icon: <Upload className="w-4 h-4" />,
    badge: 'Smart',
    description: 'Import từ JSON với AI analysis',
  },
  {
    id: 'tester',
    label: 'Tester',
    icon: <TestTube className="w-4 h-4" />,
    description: 'Test và debug workflows',
  },
];

const TOOL_SUB_TABS: TabConfig[] = [
  {
    id: 'all',
    label: 'All Tools',
    icon: <LayoutGrid className="w-4 h-4" />,
    description: 'Tất cả công cụ AI',
  },
  {
    id: 'sora-video',
    label: 'Sora Video',
    icon: <Video className="w-4 h-4" />,
    badge: 'Popular',
    description: 'Tạo video với Sora 2 AI',
  },
  {
    id: 'custom',
    label: 'Custom Tools',
    icon: <Settings className="w-4 h-4" />,
    description: 'Công cụ tùy chỉnh',
  },
];

// ============================================================
// COMPONENTS
// ============================================================

const TabBadge = ({ text }: { text: string }) => (
  <Badge
    variant="secondary"
    className="ml-1 px-1.5 py-0 text-[10px] font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30"
  >
    {text}
  </Badge>
);

const HeaderBadges = () => {
  const { data: agentStats } = useAgentStats();
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <Badge variant="outline" className="text-xs border-indigo-500/50 text-indigo-400">
        🤖 {agentStats?.active ?? '...'} Active Agents
      </Badge>
      <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
        📊 {agentStats?.total ?? '...'} Total Agents
      </Badge>
      <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
        💰 ${(agentStats?.totalCost ?? 0).toFixed(2)} Total Cost
      </Badge>
    </div>
  );
};

const QuickStats = () => {
  const { data: agentStats, isLoading } = useAgentStats();
  const stats = [
    {
      id: 'agents',
      label: 'Active Agents',
      value: isLoading ? '...' : String(agentStats?.active ?? 0),
      change: `/${agentStats?.total ?? 0} total`,
      icon: <Bot className="w-4 h-4" />,
    },
    {
      id: 'idle',
      label: 'Idle Agents',
      value: isLoading ? '...' : String(agentStats?.idle ?? 0),
      change: 'standby',
      icon: <Workflow className="w-4 h-4" />,
    },
    {
      id: 'executions',
      label: 'Total Executions',
      value: isLoading ? '...' : String(agentStats?.totalExecutions ?? 0),
      change: 'all time',
      icon: <Play className="w-4 h-4" />,
    },
    {
      id: 'cost',
      label: 'Total Cost',
      value: isLoading ? '...' : `$${(agentStats?.totalCost ?? 0).toFixed(2)}`,
      change: 'all time',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card
          key={stat.id}
          className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-slate-800 rounded-lg">{stat.icon}</div>
              <span className="text-xs text-green-400">{stat.change}</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const UnifiedAICommandCenter = () => {
  const [mainTab, setMainTab] = useState<MainTab>('agents');
  const [workflowSubTab, setWorkflowSubTab] = useState<WorkflowSubTab>('templates');
  const [toolSubTab, setToolSubTab] = useState<ToolSubTab>('all');

  // Command Palette
  const { CommandPaletteComponent } = useCommandPalette((command) => {
    // Handle command selection from palette
    console.log('Command selected from palette:', command);
  });

  // Handler for navigating to different tabs (called from child components)
  const handleNavigateToTab = (tab: string, subTab?: string) => {
    setMainTab(tab as MainTab);
    if (subTab && tab === 'workflows') {
      setWorkflowSubTab(subTab as WorkflowSubTab);
    }
    if (subTab && tab === 'tools') {
      setToolSubTab(subTab as ToolSubTab);
    }
  };

  // Handler when an idea is completed
  const handleIdeaCompleted = (idea: unknown) => {
    console.log('🎉 Idea completed:', idea);
    // Future: Could auto-create a workflow template from the completed idea
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 rounded-xl p-6 mb-8 shadow-lg shadow-indigo-500/10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Command Center
              </h1>
              <p className="text-slate-300 mt-1">
                Trung tâm điều khiển AI thống nhất - Agents, Workflows, Tools & Analytics
              </p>
              <HeaderBadges />
            </div>
            <Button variant="outline" className="hidden md:flex gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Proactive AI Suggestions */}
        <ProactiveSuggestionsPanel />

        {/* Intelligent Alerts */}
        <IntelligentAlerts />

        {/* Command Input */}
        <CommandInput />

        {/* Command Palette */}
        {CommandPaletteComponent}

        {/* Quick Stats */}
        <QuickStats />

        {/* Main Navigation Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-2">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 gap-1 bg-transparent h-auto">
              {MAIN_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                >
                  {tab.icon}
                  <span className="text-xs md:text-sm font-medium">{tab.label}</span>
                  {tab.badge && <TabBadge text={tab.badge} />}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="ideas" className="space-y-4 mt-6">
            <Suspense fallback={<LoadingSpinner />}>
              <AgentIdeasDashboard
                onNavigateToTab={handleNavigateToTab}
                onIdeaCompleted={handleIdeaCompleted}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4 mt-6">
            <Suspense fallback={<LoadingSpinner />}>
              <AgentsDashboard />
              <MultiAgentOrchestrator />
            </Suspense>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4 mt-6">
            {/* Workflow Sub-tabs */}
            <Tabs
              value={workflowSubTab}
              onValueChange={(v) => setWorkflowSubTab(v as WorkflowSubTab)}
            >
              <div className="flex items-center gap-4 mb-6">
                <TabsList className="bg-slate-900 border border-slate-800">
                  {WORKFLOW_SUB_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.badge && <TabBadge text={tab.badge} />}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="templates">
                <Suspense fallback={<LoadingSpinner />}>
                  <WorkflowTemplateLibrary />
                </Suspense>
              </TabsContent>

              <TabsContent value="builder">
                <Suspense fallback={<LoadingSpinner />}>
                  <WorkflowsDashboard />
                  <WorkflowOptimizer workflowId={undefined} />
                </Suspense>
              </TabsContent>

              <TabsContent value="import">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-white">Smart Workflow Import</h3>
                      <p className="text-sm text-slate-400">
                        AI tự động phân tích và đề xuất cải tiến cho workflow của bạn
                      </p>
                    </div>
                  </div>
                </div>
                <WorkflowImporter />
              </TabsContent>

              <TabsContent value="tester">
                <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-orange-400" />
                    <div>
                      <h3 className="font-semibold text-white">Developer Testing Tools</h3>
                      <p className="text-sm text-slate-400">
                        Test và debug workflows với payload tùy chỉnh
                      </p>
                    </div>
                  </div>
                </div>
                <Suspense fallback={<LoadingSpinner />}>
                  <WorkflowTester />
                </Suspense>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 mt-6">
            {/* Tools Sub-tabs */}
            <Tabs value={toolSubTab} onValueChange={(v) => setToolSubTab(v as ToolSubTab)}>
              <div className="flex items-center gap-4 mb-6">
                <TabsList className="bg-slate-900 border border-slate-800">
                  {TOOL_SUB_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.badge && <TabBadge text={tab.badge} />}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="all">
                <Suspense fallback={<LoadingSpinner />}>
                  <ToolsDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="sora-video">
                <Suspense fallback={<LoadingSpinner />}>
                  <SoraVideoContent />
                </Suspense>
              </TabsContent>

              <TabsContent value="custom">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Custom Tools</CardTitle>
                    <CardDescription>Tạo và quản lý các công cụ AI tùy chỉnh</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Wrench className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-400 mb-2">Coming Soon</h3>
                      <p className="text-slate-500 text-sm">
                        Khả năng tạo custom AI tools sẽ sớm được cập nhật
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-4 mt-6">
            <Suspense fallback={<LoadingSpinner />}>
              <MVPMarketplace />
            </Suspense>
          </TabsContent>

          <TabsContent value="executions" className="space-y-4 mt-6">
            <Suspense fallback={<LoadingSpinner />}>
              <ExecutionsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-6">
            <Suspense fallback={<LoadingSpinner />}>
              <AnalyticsDashboard />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions Panel - Floating */}
      <QuickActionsPanel
        onCommandExecute={(cmd) => {
          // Could navigate to command input or execute directly
          console.log('Quick action:', cmd);
        }}
      />
    </div>
  );
};

export default UnifiedAICommandCenter;
