import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminLayout } from './components/admin/AdminLayout';
import { GlobalUploadWidget } from './components/ai-workspace/GlobalUploadWidget';
import { GlobalQuickCommands } from './components/GlobalQuickCommands';
import { AdminRoute } from './components/auth/AdminRoute';
import { AuthProvider } from './components/auth/AuthProvider';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { StatusBar } from './components/StatusBar';
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
const AutomationDashboard = lazy(() => import('./pages/AutomationDashboard'));
const AgentDetail = lazy(() => import('./pages/AgentDetail'));
const AgentCenter = lazy(() => import('./pages/AgentCenter'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminBackup = lazy(() => import('./pages/AdminBackup'));
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
const SEOMonitoringDashboard = lazy(() =>
  import('./components/monitoring/SEOMonitoringDashboard').then((m) => ({
    default: m.SEOMonitoringDashboard,
  }))
);
const AgentTest = lazy(() => import('./pages/AgentTest'));
const AdminSEOCenter = lazy(() => import('./pages/AdminSEOCenter'));
const PricingPage = lazy(() => import('./pages/Pricing').then((m) => ({ default: m.PricingPage })));
const SubscriptionDashboard = lazy(() =>
  import('./components/subscription/SubscriptionDashboard').then((m) => ({
    default: m.SubscriptionDashboard,
  }))
);
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminCourses = lazy(() => import('./pages/AdminCourses'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PlatformIntegrations = lazy(() => import('./pages/PlatformIntegrations'));
const Academy = lazy(() => import('./pages/Academy'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const LearningPathPage = lazy(() => import('./pages/LearningPathPage'));
const MVPMarketplace = lazy(() =>
  import('./components/agent-center/MVPMarketplace').then((m) => ({ default: m.MVPMarketplace }))
);
const AgentDetailPage = lazy(() =>
  import('./pages/AgentDetailPage').then((m) => ({ default: m.AgentDetailPage }))
);
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const ProjectShowcase = lazy(() => import('./pages/ProjectShowcase'));
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
const AdminProjects = lazy(() => import('./pages/AdminProjects'));
const SoraVideoGenerator = lazy(() => import('./pages/SoraVideoGenerator'));
const UnifiedAICommandCenter = lazy(() => import('./pages/UnifiedAICommandCenter'));
// AI Command Center - Solo Founder Hub
const AICommandCenter = lazy(() => import('./pages/AICommandCenter'));
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
const SentryDashboard = lazy(() => import('./pages/SentryDashboard'));

// System Map - Connection Network
const SystemMap = lazy(() => import('./pages/SystemMap'));

// AI Second Brain
const BrainDashboard = lazy(() => import('./pages/BrainDashboard'));
const DomainView = lazy(() => import('./pages/DomainView'));

// Documentation Manager
const DocsManager = lazy(() => import('./pages/DocsManager'));
const DocsViewer = lazy(() => import('./pages/DocsViewer'));

// Workspace AI Chat
const WorkspaceChatPage = lazy(() => import('./pages/WorkspaceChatPage'));

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
                      {/* Redirect root to admin dashboard */}
                      <Route path="/" element={<Navigate to="/admin" replace />} />

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

                      {/* Payment Success */}
                      <Route path="/payment-success" element={<PaymentSuccess />} />

                      {/* Public Consultation Booking */}
                      <Route path="/consultation" element={<ConsultationBooking />} />

                      {/* MVP Marketplace - Public */}
                      <Route path="/marketplace" element={<MVPMarketplace />} />
                      <Route path="/marketplace/:agentId" element={<AgentDetailPage />} />

                      {/* Showcase Pages */}
                      <Route path="/project-showcase" element={<EnhancedProjectShowcase />} />
                      <Route path="/legacy-showcase" element={<ProjectShowcase />} />
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

                      {/* User Dashboard */}
                      <Route path="/dashboard" element={<AgentDashboard />} />

                      {/* Admin Login */}
                      <Route path="/admin/login" element={<AdminLogin />} />

                      {/* Dev/Debug Routes */}
                      <Route path="/dev-setup" element={<DevSetup />} />
                      <Route path="/supabase-test" element={<SupabaseTest />} />
                      <Route path="/google-drive-test" element={<GoogleDriveIntegrationTest />} />

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
                        <Route path="workflows" element={<AdminWorkflows />} />
                        <Route path="n8n" element={<N8nManagement />} />
                        <Route path="content-queue" element={<AdminContentQueue />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="consultations" element={<AdminConsultations />} />
                        <Route path="files" element={<AdminFileManagerReal />} />
                        <Route path="documents" element={<AdminDocumentEditor />} />
                        <Route path="credentials" element={<CredentialManager />} />
                        <Route path="seo-monitoring" element={<SEOMonitoringDashboard />} />
                        <Route path="seo-center" element={<AdminSEOCenter />} />
                        <Route path="subscription" element={<SubscriptionDashboard />} />
                        <Route path="integrations" element={<PlatformIntegrations />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="courses" element={<AdminCourses />} />
                        <Route path="google-services" element={<GoogleServices />} />
                        <Route path="google-automation" element={<GoogleAutomation />} />
                        <Route path="google-maps" element={<GoogleMaps />} />
                        <Route path="database-schema" element={<DatabaseSchema />} />
                        <Route path="unified-analytics" element={<UnifiedAnalyticsDashboard />} />
                        <Route path="marketing-automation" element={<MarketingAutomation />} />
                        <Route path="knowledge-base" element={<KnowledgeBaseEditor />} />
                        <Route path="social-media" element={<SocialMediaManagement />} />
                        <Route path="social-connections" element={<SocialMediaConnections />} />
                        <Route path="sora-video" element={<SoraVideoGenerator />} />
                        <Route path="ai-center" element={<UnifiedAICommandCenter />} />
                        <Route path="solo-hub" element={<AICommandCenter />} />
                        <Route path="ai-workspace" element={<AIWorkspace />} />
                        <Route path="facebook-marketing" element={<FacebookMarketing />} />
                        <Route path="bug-system" element={<BugSystemDashboard />} />
                        <Route path="sentry" element={<SentryDashboard />} />
                        {/* System Map - Connection Network */}
                        <Route path="system-map" element={<SystemMap />} />
                        {/* AI Second Brain */}
                        <Route path="brain" element={<BrainDashboard />} />
                        <Route path="brain/domain/:id" element={<DomainView />} />
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
                        <Route path="settings" element={<AdminSettings />} />
                      </Route>

                      {/* Automation & Agent Center - Protected with AdminLayout */}
                      <Route
                        path="/automation"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AutomationDashboard />} />
                        <Route path="agents/:id" element={<AgentDetail />} />
                      </Route>

                      <Route
                        path="/agent-center"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AgentCenter />} />
                      </Route>

                      {/* Additional Admin Tools - Protected with AdminLayout */}
                      <Route
                        path="/agent-test"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AgentTest />} />
                      </Route>

                      <Route
                        path="/analytics"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AnalyticsDashboard />} />
                      </Route>

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
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
