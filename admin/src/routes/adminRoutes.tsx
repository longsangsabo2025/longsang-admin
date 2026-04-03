import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';

const AgentDetail = lazy(() => import('../pages/workflow/AgentDetail'));
const AdminSettings = lazy(() => import('../pages/admin-core/AdminSettings'));
const SettingsPage = lazy(() => import('../pages/admin-core/SettingsPage'));
const AdminBackup = lazy(() => import('../pages/admin-core/AdminBackup'));
const AdminWorkflows = lazy(() => import('../pages/workflow/AdminWorkflows'));
const N8nManagement = lazy(() => import('../pages/workflow/N8nManagement'));
const AdminContentQueue = lazy(() => import('../pages/content/AdminContentQueue'));
const AdminAnalytics = lazy(() => import('../pages/marketing/AdminAnalytics'));
const AdminFileManagerReal = lazy(() => import('../pages/content/AdminFileManagerReal'));
const GoogleDriveIntegrationTest = lazy(
  () => import('../pages/marketing/GoogleDriveIntegrationTest')
);
const AdminConsultations = lazy(() => import('../pages/admin-core/AdminConsultations'));
const DevSetup = lazy(() =>
  import('../pages/admin-core/DevSetup').then((m) => ({ default: m.DevSetup }))
);
const SupabaseTest = lazy(() =>
  import('../pages/admin-core/SupabaseTest').then((m) => ({ default: m.SupabaseTest }))
);
const DatabaseSchema = lazy(() =>
  import('../pages/admin-core/DatabaseSchema').then((m) => ({ default: m.DatabaseSchema }))
);
const GoogleAutomation = lazy(() => import('../pages/marketing/GoogleAutomation'));
const GoogleMaps = lazy(() => import('../pages/marketing/GoogleMaps'));
const AgentTest = lazy(() => import('../pages/workflow/AgentTest'));
const SubscriptionDashboard = lazy(() =>
  import('../components/subscription/SubscriptionDashboard').then((m) => ({
    default: m.SubscriptionDashboard,
  }))
);
const AdminUsers = lazy(() => import('../pages/admin-core/AdminUsers'));
const AdminIdeas = lazy(() => import('../pages/content/AdminIdeas'));
const AdminCourses = lazy(() => import('../pages/content/AdminCourses'));
const CourseBuilder = lazy(() => import('../pages/academy/CourseBuilder'));
const UnifiedAnalyticsDashboard = lazy(() =>
  import('../components/UnifiedAnalyticsDashboard').then((m) => ({
    default: m.UnifiedAnalyticsDashboard,
  }))
);
const MarketingAutomation = lazy(() =>
  import('../pages/marketing/MarketingAutomation').then((m) => ({ default: m.MarketingAutomation }))
);
const KnowledgeBaseEditor = lazy(() =>
  import('../pages/ai/KnowledgeBaseEditor').then((m) => ({ default: m.default }))
);
const SocialMediaManagement = lazy(() => import('../pages/marketing/SocialMediaManagement'));
const ContentRepurposePage = lazy(() => import('../pages/content/ContentRepurpose'));
const ImageGenerator = lazy(() => import('../pages/video/ImageGenerator'));
const VideoGenerator = lazy(() => import('../pages/video/VideoGenerator'));
const GeminiChatPage = lazy(() => import('../pages/ai/GeminiChatPage'));
const UnifiedAICommandCenter = lazy(() => import('../pages/ai/UnifiedAICommandCenter'));
const SurvivalDashboard = lazy(() => import('../pages/system/SurvivalDashboard'));
const ProjectDetail = lazy(() => import('../pages/projects/ProjectDetail'));
const ProjectCommandCenter = lazy(() => import('../pages/projects/ProjectCommandCenter'));
const UnifiedProjectCenter = lazy(() => import('../pages/projects/UnifiedProjectCenter'));
const AIWorkspace = lazy(() => import('../pages/ai/AIWorkspace'));
const BugSystemDashboard = lazy(() => import('../pages/system/BugSystemDashboard'));
const SystemMap = lazy(() => import('../pages/system/SystemMap'));
const MissionControl = lazy(() => import('../pages/system/MissionControl'));
const ProductSettings = lazy(() => import('../pages/system/ProductSettings'));
const AgentRegistry = lazy(() => import('../pages/workflow/AgentRegistry'));
const BrainDashboard = lazy(() => import('../pages/ai/BrainDashboard'));
const DomainView = lazy(() => import('../pages/ai/DomainView'));
const UnifiedLibrary = lazy(() => import('../pages/content/UnifiedLibrary'));
const DocsManager = lazy(() => import('../pages/content/DocsManager'));
const DocsViewer = lazy(() => import('../pages/content/DocsViewer'));
const WorkspaceChatPage = lazy(() => import('../pages/ai/WorkspaceChatPage'));
const AISettings = lazy(() => import('../pages/ai/AISettings'));
const AICostDashboardPage = lazy(() => import('../pages/ai/AICostDashboardPage'));
const PipelineBuilder = lazy(() => import('../pages/video/PipelineBuilder'));
const PipelineSettings = lazy(() => import('../pages/video/PipelineSettings'));
const YouTubeChannels = lazy(() => import('../pages/video/YouTubeChannels'));
const YouTubeChannelWorkspace = lazy(() => import('../pages/video/YouTubeChannelWorkspace'));
const VideoFactoryDashboard = lazy(() => import('../pages/video/VideoFactoryDashboard'));
const RevenueDashboardPage = lazy(() => import('../pages/system/RevenueDashboardPage'));
const ServicesHealthPage = lazy(() => import('../pages/system/ServicesHealthPage'));
const HeartbeatDashboardPage = lazy(() => import('../pages/system/HeartbeatDashboardPage'));
const TravisDashboardPage = lazy(() => import('../pages/system/TravisDashboardPage'));
const ContentCommandOS = lazy(() => import('../pages/content/ContentCommandOS'));

export const adminRoutes = (
  <>
    <Route index element={<Navigate to="/admin/mission-control" replace />} />
    {/* Command Center - Mission Control pages */}
    <Route path="mission-control" element={<MissionControl />} />
    <Route path="marketing-engine" element={<Navigate to="/admin/mission-control" replace />} />
    <Route path="product-settings" element={<ProductSettings />} />
    <Route path="agent-registry" element={<AgentRegistry />} />
    <Route path="workflows" element={<AdminWorkflows />} />
    <Route path="n8n" element={<N8nManagement />} />
    <Route path="content-queue" element={<AdminContentQueue />} />
    {/* 🎯 Content Command OS — Multi-View Pipeline */}
    <Route path="content-os" element={<ContentCommandOS />} />
    <Route path="analytics" element={<AdminAnalytics />} />
    <Route path="consultations" element={<AdminConsultations />} />
    <Route path="files" element={<AdminFileManagerReal />} />
    <Route path="documents" element={<Navigate to="/admin/docs" replace />} />
    <Route path="credentials" element={<Navigate to="/admin/command-center" replace />} />
    <Route path="seo-center" element={<Navigate to="/admin/content-queue?tab=seo" replace />} />
    <Route path="seo-monitoring" element={<Navigate to="/admin/content-queue?tab=seo" replace />} />
    <Route path="subscription" element={<SubscriptionDashboard />} />
    <Route path="integrations" element={<Navigate to="/admin/settings" replace />} />
    <Route path="users" element={<AdminUsers />} />
    <Route path="ideas" element={<AdminIdeas />} />
    <Route path="courses" element={<AdminCourses />} />
    <Route path="courses/new" element={<CourseBuilder />} />
    <Route path="courses/edit/:courseId" element={<CourseBuilder />} />
    <Route
      path="google-services"
      element={<Navigate to="/admin/unified-analytics?tab=google-services" replace />}
    />
    <Route path="google-automation" element={<GoogleAutomation />} />
    <Route path="google-maps" element={<GoogleMaps />} />
    <Route path="database-schema" element={<DatabaseSchema />} />
    <Route path="unified-analytics" element={<UnifiedAnalyticsDashboard />} />
    <Route path="marketing-automation" element={<MarketingAutomation />} />
    <Route path="knowledge-base" element={<KnowledgeBaseEditor />} />
    <Route path="social-media" element={<SocialMediaManagement />} />
    <Route
      path="social-connections"
      element={<Navigate to="/admin/social-media?tab=connections" replace />}
    />
    <Route path="content-repurpose" element={<ContentRepurposePage />} />
    <Route path="zalo-oa" element={<Navigate to="/admin/social-media?tab=zalo-oa" replace />} />
    <Route
      path="zalo-campaigns"
      element={<Navigate to="/admin/social-media?tab=zalo-campaigns" replace />}
    />
    <Route path="sora-video" element={<Navigate to="/admin/video-factory?tab=sora" replace />} />
    <Route path="bulk-video" element={<Navigate to="/admin/video-factory?tab=bulk" replace />} />
    <Route path="image-generator" element={<Navigate to="/admin/video-factory" replace />} />
    <Route path="video-generator" element={<Navigate to="/admin/video-factory" replace />} />
    <Route path="gemini-chat" element={<Navigate to="/admin/ai-workspace?tab=gemini" replace />} />
    <Route path="ai-center" element={<UnifiedAICommandCenter />} />
    <Route path="solo-hub" element={<Navigate to="/admin/ai-center?tab=solo-hub" replace />} />
    <Route path="survival" element={<SurvivalDashboard />} />
    <Route path="auto-publish" element={<Navigate to="/admin/social-media" replace />} />
    <Route path="ai-workspace" element={<AIWorkspace />} />
    <Route
      path="visual-workspace"
      element={<Navigate to="/admin/ai-workspace?tab=visual" replace />}
    />
    <Route path="ai-settings" element={<AISettings />} />
    <Route path="ai-cost" element={<AICostDashboardPage />} />
    <Route path="ai-pricing" element={<Navigate to="/admin/ai-cost" replace />} />
    <Route
      path="pipeline"
      element={<Navigate to="/admin/pipeline-builder?view=monitor" replace />}
    />
    <Route path="pipeline-builder" element={<PipelineBuilder />} />
    <Route path="pipeline-settings" element={<PipelineSettings />} />
    <Route path="youtube-channels" element={<YouTubeChannels />} />
    <Route path="youtube-channels/:channelId" element={<YouTubeChannelWorkspace />} />
    <Route path="video-factory" element={<VideoFactoryDashboard />} />
    <Route path="video-composer" element={<Navigate to="/admin/video-factory" replace />} />
    <Route path="studio" element={<Navigate to="/admin/video-factory" replace />} />
    <Route path="revenue" element={<RevenueDashboardPage />} />
    <Route path="services-health" element={<ServicesHealthPage />} />
    <Route path="heartbeat" element={<HeartbeatDashboardPage />} />
    {/* 🧠 Travis AI - CTO Brain */}
    <Route path="travis" element={<TravisDashboardPage />} />
    <Route
      path="facebook-marketing"
      element={<Navigate to="/admin/social-media?tab=facebook" replace />}
    />
    <Route path="bug-system" element={<BugSystemDashboard />} />
    <Route path="sentry" element={<Navigate to="/admin/bug-system" replace />} />
    {/* System Map - Connection Network */}
    <Route path="system-map" element={<SystemMap />} />
    {/* AI Second Brain */}
    <Route path="brain" element={<BrainDashboard />} />
    <Route path="brain/domain/:id" element={<DomainView />} />
    {/* Legacy: Redirect old avatar-studio to video-factory */}
    <Route path="avatar-studio" element={<Navigate to="/admin/video-factory" replace />} />
    {/* Brand Identity Hub */}
    <Route path="brand" element={<Navigate to="/admin/social-media" replace />} />
    {/* 📚 UNIFIED LIBRARY - All assets in one place */}
    <Route path="library" element={<UnifiedLibrary />} />
    {/* Documentation Manager */}
    <Route path="docs" element={<DocsManager />} />
    <Route path="docs/viewer" element={<DocsViewer />} />
    {/* Workspace AI Chat */}
    <Route path="chat" element={<WorkspaceChatPage />} />
    {/* Unified Project Command Center */}
    <Route path="command-center" element={<UnifiedProjectCenter />} />
    {/* Projects management */}
    <Route
      path="projects"
      element={<Navigate to="/admin/unified-analytics?tab=projects" replace />}
    />
    <Route path="projects/:projectId" element={<ProjectDetail />} />
    {/* Legacy routes - Redirect to command-center */}
    <Route path="vault" element={<Navigate to="/admin/command-center" replace />} />
    <Route path="project-agents" element={<Navigate to="/admin/command-center" replace />} />
    <Route path="p/:slug" element={<ProjectCommandCenter />} />
    <Route path="workflow-manager" element={<Navigate to="/admin/workflows" replace />} />
    <Route path="workflow-import" element={<Navigate to="/admin/workflows" replace />} />
    <Route path="feature-audit" element={<Navigate to="/admin/mission-control" replace />} />
    <Route path="backup" element={<AdminBackup />} />
    {/* media-library redirects to unified library */}
    <Route path="media-library" element={<Navigate to="/admin/library" replace />} />
    <Route path="settings" element={<AdminSettings />} />
    <Route path="settings/credentials" element={<SettingsPage />} />
    {/* Automation & Agents - redirected to consolidated pages */}
    <Route path="automation" element={<Navigate to="/admin/ai-center" replace />} />
    <Route path="automation/agents/:id" element={<AgentDetail />} />
    <Route path="agent-center" element={<Navigate to="/admin/ai-center" replace />} />
    <Route path="agent-test" element={<AgentTest />} />
    {/* Dev/Debug Routes */}
    <Route path="dev-setup" element={<DevSetup />} />
    <Route path="supabase-test" element={<SupabaseTest />} />
    <Route path="google-drive-test" element={<GoogleDriveIntegrationTest />} />
  </>
);
