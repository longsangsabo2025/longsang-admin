import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalQuickCommands } from './components/GlobalQuickCommands';
import { StatusBar } from './components/StatusBar';
import { AdminLayout } from './components/admin/AdminLayout';
import { GlobalUploadWidget } from './components/ai-workspace/GlobalUploadWidget';
import { AdminRoute } from './components/auth/AdminRoute';
import { ManagerRoute } from './components/auth/ManagerRoute';
import { AuthProvider } from './components/auth/AuthProvider';
import { ThemeProvider } from './components/theme/ThemeProvider';

// Manager Layout
const ManagerLayout = lazy(() => import('./components/manager/ManagerLayout'));
import { useAnalytics } from './lib/analytics';

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

// Lazy load all page components for code splitting
const Index = lazy(() => import('./pages/Index'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const ManagerLogin = lazy(() => import('./pages/ManagerLogin'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const ManagerProjects = lazy(() => import('./pages/ManagerProjects'));
const ManagerLibrary = lazy(() => import('./pages/ManagerLibrary'));
const AutomationDashboard = lazy(() => import('./pages/AutomationDashboard'));
const AgentDetail = lazy(() => import('./pages/AgentDetail'));
const AgentCenter = lazy(() => import('./pages/AgentCenter'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminBackup = lazy(() => import('./pages/AdminBackup'));
// MediaLibraryPage removed - use UnifiedLibrary instead
const WorkflowTest = lazy(() => import('./pages/WorkflowTest'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminWorkflows = lazy(() => import('./pages/AdminWorkflows'));
const N8nManagement = lazy(() => import('./pages/N8nManagement'));
const AdminContentQueue = lazy(() => import('./pages/AdminContentQueue'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminFileManagerReal = lazy(() => import('./pages/AdminFileManagerReal'));
const AdminDocumentEditor = lazy(() => import('./pages/AdminDocumentEditor'));
const GoogleDriveIntegrationTest = lazy(() => import('./pages/GoogleDriveIntegrationTest'));
const CredentialManager = lazy(() => import('./pages/CredentialManager'));
const ConsultationBooking = lazy(() => import('./pages/ConsultationBooking'));
const AdminConsultations = lazy(() => import('./pages/AdminConsultations'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DevSetup = lazy(() => import('./pages/DevSetup').then((m) => ({ default: m.DevSetup })));
const SupabaseTest = lazy(() =>
  import('./pages/SupabaseTest').then((m) => ({ default: m.SupabaseTest }))
);
const DatabaseSchema = lazy(() =>
  import('./pages/DatabaseSchema').then((m) => ({ default: m.DatabaseSchema }))
);
const GoogleServices = lazy(() => import('./pages/GoogleServices'));
const GoogleAutomation = lazy(() => import('./pages/GoogleAutomation'));
const GoogleMaps = lazy(() => import('./pages/GoogleMaps'));
const AdminSEOCenter = lazy(() => import('./pages/AdminSEOCenter'));
const AgentTest = lazy(() => import('./pages/AgentTest'));
const PricingPage = lazy(() => import('./pages/Pricing').then((m) => ({ default: m.PricingPage })));
const SubscriptionDashboard = lazy(() =>
  import('./components/subscription/SubscriptionDashboard').then((m) => ({
    default: m.SubscriptionDashboard,
  }))
);
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminIdeas = lazy(() => import('./pages/AdminIdeas'));
const AdminCourses = lazy(() => import('./pages/AdminCourses'));
const CourseBuilder = lazy(() => import('./pages/CourseBuilder'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PlatformIntegrations = lazy(() => import('./pages/PlatformIntegrations'));
const Academy = lazy(() => import('./pages/Academy'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const LearningPathPage = lazy(() => import('./pages/LearningPathPage'));
const AcademyMyLearning = lazy(() => import('./pages/AcademyMyLearning'));
const AcademyCertificates = lazy(() => import('./pages/AcademyCertificates'));
const AcademyStats = lazy(() => import('./pages/AcademyStats'));
const AcademyLeaderboard = lazy(() => import('./pages/AcademyLeaderboard'));
const AcademyCategory = lazy(() => import('./pages/AcademyCategory'));
const MVPMarketplace = lazy(() =>
  import('./components/agent-center/MVPMarketplace').then((m) => ({ default: m.MVPMarketplace }))
);
const AgentDetailPage = lazy(() =>
  import('./pages/AgentDetailPage').then((m) => ({ default: m.AgentDetailPage }))
);
const EnhancedProjectShowcase = lazy(() => import('./pages/EnhancedProjectShowcase'));
const AppShowcaseDetail = lazy(() => import('./pages/AppShowcaseDetail'));
const AppShowcaseAdmin = lazy(() =>
  import('./pages/AppShowcaseAdmin').then((m) => ({ default: m.AppShowcaseAdmin }))
);
const ProjectInterest = lazy(() => import('./pages/ProjectInterest'));
const InvestmentPortalLayout = lazy(() => import('./pages/InvestmentPortalLayout'));
const InvestmentOverview = lazy(() => import('./pages/InvestmentOverview'));
const InvestmentRoadmap = lazy(() => import('./pages/InvestmentRoadmap'));
const InvestmentFinancials = lazy(() => import('./pages/InvestmentFinancials'));
const InvestmentApply = lazy(() => import('./pages/InvestmentApply'));
const CVPage = lazy(() => import('./pages/cv/CVPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const UnifiedAnalyticsDashboard = lazy(() =>
  import('./components/UnifiedAnalyticsDashboard').then((m) => ({
    default: m.UnifiedAnalyticsDashboard,
  }))
);
const MarketingAutomation = lazy(() =>
  import('./pages/MarketingAutomation').then((m) => ({ default: m.MarketingAutomation }))
);
const KnowledgeBaseEditor = lazy(() =>
  import('./pages/KnowledgeBaseEditor').then((m) => ({ default: m.default }))
);
const SocialMediaManagement = lazy(() => import('./pages/SocialMediaManagement'));
const SocialMediaConnections = lazy(() => import('./pages/SocialMediaConnections'));
const ContentRepurposePage = lazy(() => import('./pages/ContentRepurpose'));
const ZaloOAManagement = lazy(() => import('./pages/ZaloOAManagement'));
const ZaloCampaignDashboard = lazy(() => import('./pages/ZaloCampaignDashboard'));
const AdminProjects = lazy(() => import('./pages/AdminProjects'));
const SoraVideoGenerator = lazy(() => import('./pages/SoraVideoGenerator'));
const ImageGenerator = lazy(() => import('./pages/ImageGenerator'));
const VideoGenerator = lazy(() => import('./pages/VideoGenerator'));
const BulkVideoProduction = lazy(() => import('./pages/BulkVideoProduction'));
const GeminiChatPage = lazy(() => import('./pages/GeminiChatPage'));
const UnifiedAICommandCenter = lazy(() => import('./pages/UnifiedAICommandCenter'));
// AI Command Center - Solo Founder Hub
const AICommandCenter = lazy(() => import('./pages/AICommandCenter'));
// Survival Dashboard - Eisenhower + ICE + 1-3-5
const SurvivalDashboard = lazy(() => import('./pages/SurvivalDashboard'));
// Auto Publish Dashboard - Multi-platform posting
const AutoPublishDashboard = lazy(() => import('./pages/AutoPublishDashboard'));
// Legacy pages - kept for project detail routes
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ProjectCommandCenter = lazy(() => import('./pages/ProjectCommandCenter'));
// Unified Project Center - replaces ProjectsHub, CredentialsVault, ProjectAgentsManager
const UnifiedProjectCenter = lazy(() => import('./pages/UnifiedProjectCenter'));
const WorkflowManager = lazy(() => import('./pages/WorkflowManager'));
const WorkflowImport = lazy(() => import('./pages/WorkflowImport'));
const FeatureAudit = lazy(() => import('./pages/FeatureAudit'));
const AIWorkspace = lazy(() => import('./pages/AIWorkspace'));
const FacebookMarketing = lazy(() => import('./pages/FacebookMarketing'));
const BugSystemDashboard = lazy(() => import('./pages/BugSystemDashboard'));

// System Map - Connection Network
const SystemMap = lazy(() => import('./pages/SystemMap'));

// Mission Control - Command Center pages
const MissionControl = lazy(() => import('./pages/MissionControl'));
const MarketingEngine = lazy(() => import('./pages/MarketingEngine'));
const ProductSettings = lazy(() => import('./pages/ProductSettings'));
const AgentRegistry = lazy(() => import('./pages/AgentRegistry'));

// AI Second Brain
const BrainDashboard = lazy(() => import('./pages/BrainDashboard'));
const DomainView = lazy(() => import('./pages/DomainView'));

// Brand Identity Hub
const BrandIdentityHub = lazy(() => import('./pages/BrandIdentityHub'));
// DocumentLibrary removed - merged into UnifiedLibrary
const UnifiedLibrary = lazy(() => import('./pages/UnifiedLibrary'));

// Documentation Manager
const DocsManager = lazy(() => import('./pages/DocsManager'));
const DocsViewer = lazy(() => import('./pages/DocsViewer'));

// Workspace AI Chat
const WorkspaceChatPage = lazy(() => import('./pages/WorkspaceChatPage'));

// Visual Workspace Builder
const VisualWorkspace = lazy(() => import('./pages/VisualWorkspace'));

// AI Settings & Cost Dashboard
const AISettings = lazy(() => import('./pages/AISettings'));
const AICostDashboardPage = lazy(() => import('./pages/AICostDashboardPage'));

// Pipeline Dashboard - YouTube Agent Crew monitoring
const PipelineDashboard = lazy(() => import('./pages/PipelineDashboard'));

// YouTube Channels - 5-channel strategy + video factory
const YouTubeChannels = lazy(() => import('./pages/YouTubeChannels'));

// Video Factory - Automated video production with Higgsfield.ai
const VideoFactoryDashboard = lazy(() => import('./pages/VideoFactoryDashboard'));
const VideoComposer = lazy(() => import('./pages/VideoComposer'));

// Revenue Dashboard - Costs, revenue projections, automation health
const RevenueDashboardPage = lazy(() => import('./pages/RevenueDashboardPage'));

// Services Health - Unified microservice monitoring
const ServicesHealthPage = lazy(() => import('./pages/ServicesHealthPage'));

// Heartbeat Monitor - Real-time empire health
const HeartbeatDashboardPage = lazy(() => import('./pages/HeartbeatDashboardPage'));

// Travis AI - CTO ảo Brain Dashboard
const TravisDashboardPage = lazy(() => import('./pages/TravisDashboardPage'));

// AI Studio - Central hub for all AI content creation
const Studio = lazy(() => import('./pages/Studio'));
// Legacy: Keep AvatarStudio for backward compatibility
const AvatarStudio = lazy(() => import('./pages/AvatarStudio'));

// Mobile Pages
const MobileDashboard = lazy(() => import('./pages/mobile/MobileDashboard'));
const MobileGit = lazy(() => import('./pages/mobile/MobileGit'));
const MobileChat = lazy(() => import('./pages/mobile/MobileChat'));
const MobileDeploy = lazy(() => import('./pages/mobile/MobileDeploy'));
const MobileFiles = lazy(() => import('./pages/mobile/MobileFiles'));

const queryClient = new QueryClient();

const App = () => {
  // Auto-track page views for LongSang
  useAnalytics('longsang');

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="sabo-arena-theme">
          <AuthProvider>
            <TooltipProvider>
              <HelmetProvider>
                <Toaster />
                <Sonner />
                <GlobalUploadWidget />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <GlobalQuickCommands />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Redirect root to mission control */}
                      <Route path="/" element={<Navigate to="/admin/mission-control" replace />} />
                      
                      {/* Legacy redirects - old URLs that should go to admin */}
                      <Route path="/brain" element={<Navigate to="/admin/brain" replace />} />
                      <Route path="/brain/*" element={<Navigate to="/admin/brain" replace />} />

                      {/* Public Landing Page (Portfolio) */}
                      <Route path="/portfolio" element={<Index />} />

                      {/* Public Pricing Page */}
                      <Route path="/pricing" element={<PricingPage />} />

                      {/* CV Page */}
                      <Route path="/cv" element={<CVPage />} />

                      {/* User Dashboard - After Login */}
                      <Route path="/dashboard" element={<UserDashboard />} />

                      {/* Academy - Learning Platform */}
                      <Route path="/academy" element={<Academy />} />
                      <Route path="/academy/course/:id" element={<CourseDetail />} />
                      <Route path="/academy/learning-path" element={<LearningPathPage />} />
                      <Route path="/academy/my-learning" element={<AcademyMyLearning />} />
                      <Route path="/academy/certificates" element={<AcademyCertificates />} />
                      <Route path="/academy/stats" element={<AcademyStats />} />
                      <Route path="/academy/leaderboard" element={<AcademyLeaderboard />} />
                      <Route path="/academy/category/:category" element={<AcademyCategory />} />

                      {/* Payment Success */}
                      <Route path="/payment-success" element={<PaymentSuccess />} />

                      {/* Public Consultation Booking */}
                      <Route path="/consultation" element={<ConsultationBooking />} />

                      {/* MVP Marketplace - Public */}
                      <Route path="/marketplace" element={<MVPMarketplace />} />
                      <Route path="/marketplace/:agentId" element={<AgentDetailPage />} />

                      {/* Showcase Pages */}
                      <Route path="/project-showcase" element={<EnhancedProjectShowcase />} />
                      <Route path="/legacy-showcase" element={<Navigate to="/project-showcase" replace />} />
                      <Route path="/project-showcase/:slug" element={<AppShowcaseDetail />} />
                      <Route
                        path="/project-showcase/:slug/interest"
                        element={<ProjectInterest />}
                      />

                      {/* Investment Portal - Nested Routes */}
                      <Route
                        path="/project-showcase/:slug/investment"
                        element={<InvestmentPortalLayout />}
                      >
                        <Route index element={<InvestmentOverview />} />
                        <Route path="roadmap" element={<InvestmentRoadmap />} />
                        <Route path="financials" element={<InvestmentFinancials />} />
                        <Route path="apply" element={<InvestmentApply />} />
                      </Route>

                      <Route path="/app-showcase/admin" element={<AppShowcaseAdmin />} />

                      {/* Admin Login */}
                      <Route path="/admin/login" element={<AdminLogin />} />

                      {/* Manager Login */}
                      <Route path="/manager/login" element={<ManagerLogin />} />
                      
                      {/* Manager Portal - Protected with ManagerLayout */}
                      <Route
                        path="/manager"
                        element={
                          <ManagerRoute>
                            <ManagerLayout />
                          </ManagerRoute>
                        }
                      >
                        <Route index element={<ManagerDashboard />} />
                        <Route path="projects" element={<ManagerProjects />} />
                        <Route path="library" element={<ManagerLibrary />} />
                        <Route path="project/:slug" element={<ProjectCommandCenter />} />
                        {/* AI Tools for Manager */}
                        <Route path="image-generator" element={<ImageGenerator />} />
                        <Route path="video-generator" element={<VideoGenerator />} />
                        <Route path="gemini-chat" element={<GeminiChatPage />} />
                      </Route>

                      {/* Dev/Debug Routes - moved under admin */}
                      <Route path="/dev-setup" element={<Navigate to="/admin/dev-setup" replace />} />
                      <Route path="/supabase-test" element={<Navigate to="/admin/supabase-test" replace />} />
                      <Route path="/google-drive-test" element={<Navigate to="/admin/google-drive-test" replace />} />

                      {/* Admin Portal - Protected with AdminLayout */}
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AdminDashboard />} />
                        {/* Command Center - Mission Control pages */}
                        <Route path="mission-control" element={<MissionControl />} />
                        <Route path="marketing-engine" element={<MarketingEngine />} />
                        <Route path="product-settings" element={<ProductSettings />} />
                        <Route path="agent-registry" element={<AgentRegistry />} />
                        <Route path="workflows" element={<AdminWorkflows />} />
                        <Route path="n8n" element={<N8nManagement />} />
                        <Route path="content-queue" element={<AdminContentQueue />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="consultations" element={<AdminConsultations />} />
                        <Route path="files" element={<AdminFileManagerReal />} />
                        <Route path="documents" element={<AdminDocumentEditor />} />
                        <Route path="credentials" element={<CredentialManager />} />
                        <Route path="seo-center" element={<AdminSEOCenter />} />
                        <Route path="seo-monitoring" element={<Navigate to="/admin/seo-center" replace />} />
                        <Route path="subscription" element={<SubscriptionDashboard />} />
                        <Route path="integrations" element={<PlatformIntegrations />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="ideas" element={<AdminIdeas />} />
                        <Route path="courses" element={<AdminCourses />} />
                        <Route path="courses/new" element={<CourseBuilder />} />
                        <Route path="courses/edit/:courseId" element={<CourseBuilder />} />
                        <Route path="google-services" element={<GoogleServices />} />
                        <Route path="google-automation" element={<GoogleAutomation />} />
                        <Route path="google-maps" element={<GoogleMaps />} />
                        <Route path="database-schema" element={<DatabaseSchema />} />
                        <Route path="unified-analytics" element={<UnifiedAnalyticsDashboard />} />
                        <Route path="marketing-automation" element={<MarketingAutomation />} />
                        <Route path="knowledge-base" element={<KnowledgeBaseEditor />} />
                        <Route path="social-media" element={<SocialMediaManagement />} />
                        <Route path="social-connections" element={<SocialMediaConnections />} />
                        <Route path="content-repurpose" element={<ContentRepurposePage />} />
                        <Route path="zalo-oa" element={<ZaloOAManagement />} />
                        <Route path="zalo-campaigns" element={<ZaloCampaignDashboard />} />
                        <Route path="sora-video" element={<SoraVideoGenerator />} />
                        <Route path="bulk-video" element={<BulkVideoProduction />} />
                        <Route path="image-generator" element={<Navigate to="/admin/studio?tab=image" replace />} />
                        <Route path="video-generator" element={<Navigate to="/admin/studio?tab=video" replace />} />
                        <Route path="gemini-chat" element={<GeminiChatPage />} />
                        <Route path="ai-center" element={<UnifiedAICommandCenter />} />
                        <Route path="solo-hub" element={<AICommandCenter />} />
                        <Route path="survival" element={<SurvivalDashboard />} />
                        <Route path="auto-publish" element={<AutoPublishDashboard />} />
                        <Route path="ai-workspace" element={<AIWorkspace />} />
                        <Route path="visual-workspace" element={<VisualWorkspace />} />
                        <Route path="ai-settings" element={<AISettings />} />
                        <Route path="ai-cost" element={<AICostDashboardPage />} />
                        <Route path="ai-pricing" element={<Navigate to="/admin/ai-cost" replace />} />
                        <Route path="pipeline" element={<PipelineDashboard />} />
                        <Route path="youtube-channels" element={<YouTubeChannels />} />
                        <Route path="video-factory" element={<VideoFactoryDashboard />} />
                        <Route path="video-composer" element={<VideoComposer />} />
                        <Route path="revenue" element={<RevenueDashboardPage />} />
                        <Route path="services-health" element={<ServicesHealthPage />} />
                        <Route path="heartbeat" element={<HeartbeatDashboardPage />} />
                        {/* 🧠 Travis AI - CTO Brain */}
                        <Route path="travis" element={<TravisDashboardPage />} />
                        <Route path="facebook-marketing" element={<FacebookMarketing />} />
                        <Route path="bug-system" element={<BugSystemDashboard />} />
                        <Route path="sentry" element={<Navigate to="/admin/bug-system" replace />} />
                        {/* System Map - Connection Network */}
                        <Route path="system-map" element={<SystemMap />} />
                        {/* AI Second Brain */}
                        <Route path="brain" element={<BrainDashboard />} />
                        <Route path="brain/domain/:id" element={<DomainView />} />
                        
                        {/* 🎬 AI Studio - Central hub for content creation */}
                        <Route path="studio" element={<Studio />} />
                        {/* Legacy: Redirect old avatar-studio to new studio */}
                        <Route path="avatar-studio" element={<Navigate to="/admin/studio?tab=avatar" replace />} />
                        
                        {/* Brand Identity Hub */}
                        <Route path="brand" element={<BrandIdentityHub />} />
                        
                        {/* 📚 UNIFIED LIBRARY - All assets in one place */}
                        <Route path="library" element={<UnifiedLibrary />} />
                        
                        {/* Documentation Manager */}
                        <Route path="docs" element={<DocsManager />} />
                        <Route path="docs/viewer" element={<DocsViewer />} />
                        {/* Workspace AI Chat */}
                        <Route path="chat" element={<WorkspaceChatPage />} />
                        {/* Unified Project Command Center - Gộp 3 tab thành 1 */}
                        <Route path="command-center" element={<UnifiedProjectCenter />} />
                        {/* Projects management */}
                        <Route path="projects" element={<AdminProjects />} />
                        <Route path="projects/:projectId" element={<ProjectDetail />} />
                        {/* Legacy routes - Redirect to command-center */}
                        <Route
                          path="vault"
                          element={<Navigate to="/admin/command-center" replace />}
                        />
                        <Route
                          path="project-agents"
                          element={<Navigate to="/admin/command-center" replace />}
                        />
                        <Route path="p/:slug" element={<ProjectCommandCenter />} />
                        <Route path="workflow-manager" element={<WorkflowManager />} />
                        <Route path="workflow-import" element={<WorkflowImport />} />
                        <Route path="feature-audit" element={<FeatureAudit />} />
                        <Route path="backup" element={<AdminBackup />} />
                        {/* media-library redirects to unified library */}
                        <Route path="media-library" element={<Navigate to="/admin/library" replace />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="settings/credentials" element={<SettingsPage />} />
                        {/* Automation & Agents - consolidated from standalone blocks */}
                        <Route path="automation" element={<AutomationDashboard />} />
                        <Route path="automation/agents/:id" element={<AgentDetail />} />
                        <Route path="agent-center" element={<AgentCenter />} />
                        <Route path="agent-test" element={<AgentTest />} />
                        {/* Dev/Debug Routes */}
                        <Route path="dev-setup" element={<DevSetup />} />
                        <Route path="supabase-test" element={<SupabaseTest />} />
                        <Route path="google-drive-test" element={<GoogleDriveIntegrationTest />} />
                      </Route>

                      {/* Automation & Agent Center - moved under /admin */}
                      {/* Legacy redirects for old top-level paths */}
                      <Route path="/automation" element={<Navigate to="/admin/automation" replace />} />
                      <Route path="/automation/*" element={<Navigate to="/admin/automation" replace />} />
                      <Route path="/agent-center" element={<Navigate to="/admin/agent-center" replace />} />
                      <Route path="/agent-test" element={<Navigate to="/admin/agent-test" replace />} />
                      <Route path="/analytics" element={<Navigate to="/admin/unified-analytics" replace />} />

                      {/* Workflow Test - Public for testing */}
                      <Route path="/workflow-test" element={<WorkflowTest />} />

                      {/* Shortcuts - Redirect to admin routes */}
                      <Route
                        path="/ai-workspace"
                        element={<Navigate to="/admin/ai-workspace" replace />}
                      />

                      {/* Mobile Routes - For remote access from phone */}
                      <Route path="/mobile" element={<MobileDashboard />} />
                      <Route path="/mobile/git" element={<MobileGit />} />
                      <Route path="/mobile/files" element={<MobileFiles />} />
                      <Route path="/mobile/chat" element={<MobileChat />} />
                      <Route path="/mobile/deploy" element={<MobileDeploy />} />

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </HelmetProvider>
              <StatusBar />
            </TooltipProvider>
            {/* StatusBar temporarily disabled for debugging click issues */}
            {/* <StatusBar /> */}
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
