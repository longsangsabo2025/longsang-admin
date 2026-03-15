import { lazy } from 'react';
import { Route } from 'react-router-dom';

const Index = lazy(() => import('../pages/public/Index'));
const AdminLogin = lazy(() => import('../pages/admin-core/AdminLogin'));
const ManagerLogin = lazy(() => import('../pages/manager/ManagerLogin'));
const PricingPage = lazy(() =>
  import('../pages/public/Pricing').then((m) => ({ default: m.PricingPage }))
);
const CVPage = lazy(() => import('../pages/public/cv/CVPage'));
const UserDashboard = lazy(() => import('../pages/public/UserDashboard'));
const Academy = lazy(() => import('../pages/academy/Academy'));
const CourseDetail = lazy(() => import('../pages/academy/CourseDetail'));
const LearningPathPage = lazy(() => import('../pages/academy/LearningPathPage'));
const AcademyMyLearning = lazy(() => import('../pages/academy/AcademyMyLearning'));
const AcademyCertificates = lazy(() => import('../pages/academy/AcademyCertificates'));
const AcademyStats = lazy(() => import('../pages/academy/AcademyStats'));
const AcademyLeaderboard = lazy(() => import('../pages/academy/AcademyLeaderboard'));
const AcademyCategory = lazy(() => import('../pages/academy/AcademyCategory'));
const PaymentSuccess = lazy(() => import('../pages/public/PaymentSuccess'));
const ConsultationBooking = lazy(() => import('../pages/public/ConsultationBooking'));
const MVPMarketplace = lazy(() =>
  import('../components/agent-center/MVPMarketplace').then((m) => ({ default: m.MVPMarketplace }))
);
const AgentDetailPage = lazy(() =>
  import('../pages/workflow/AgentDetailPage').then((m) => ({ default: m.AgentDetailPage }))
);
const EnhancedProjectShowcase = lazy(() => import('../pages/projects/EnhancedProjectShowcase'));
const AppShowcaseDetail = lazy(() => import('../pages/projects/AppShowcaseDetail'));
const AppShowcaseAdmin = lazy(() =>
  import('../pages/projects/AppShowcaseAdmin').then((m) => ({ default: m.AppShowcaseAdmin }))
);
const ProjectInterest = lazy(() => import('../pages/projects/ProjectInterest'));
const WorkflowTest = lazy(() => import('../pages/workflow/WorkflowTest'));
const NotFound = lazy(() => import('../pages/public/NotFound'));

export const publicRoutes = (
  <>
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
    <Route path="/project-showcase/:slug" element={<AppShowcaseDetail />} />
    <Route path="/project-showcase/:slug/interest" element={<ProjectInterest />} />
    <Route path="/app-showcase/admin" element={<AppShowcaseAdmin />} />

    {/* Auth Pages */}
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/manager/login" element={<ManagerLogin />} />

    {/* Workflow Test - Public for testing */}
    <Route path="/workflow-test" element={<WorkflowTest />} />

    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </>
);
