import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminLayout } from './components/admin/AdminLayout';
import { GlobalUploadWidget } from './components/ai-workspace/GlobalUploadWidget';
import { AdminRoute } from './components/auth/AdminRoute';
import { AuthProvider } from './components/auth/AuthProvider';
import { ManagerRoute } from './components/auth/ManagerRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalQuickCommands } from './components/GlobalQuickCommands';
import { StatusBar } from './components/StatusBar';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { YouTubeLayout } from './components/youtube/YouTubeLayout';
import { useAnalytics } from './lib/analytics';

// Route modules
import {
  adminRoutes,
  investmentRoutes,
  legacyRedirects,
  managerRoutes,
  mobileRoutes,
  publicRoutes,
  youtubeRoutes,
} from './routes';

// Manager Layout (lazy)
const ManagerLayout = lazy(() => import('./components/manager/ManagerLayout'));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
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
                      {/* Public routes */}
                      {publicRoutes}

                      {/* Investment portal (nested layout) */}
                      {investmentRoutes}

                      {/* Manager portal */}
                      <Route
                        path="/manager"
                        element={
                          <ManagerRoute>
                            <ManagerLayout />
                          </ManagerRoute>
                        }
                      >
                        {managerRoutes}
                      </Route>

                      {/* Admin portal */}
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        {adminRoutes}
                      </Route>

                      {/* YouTube Studio — focused layout, no sidebar */}
                      <Route path="/youtube" element={<YouTubeLayout />}>
                        {youtubeRoutes}
                      </Route>

                      {/* Mobile routes */}
                      {mobileRoutes}

                      {/* Legacy redirects */}
                      {legacyRedirects}
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
