import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';

interface AdminRouteProps {
  readonly children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is authenticated first
  if (!user) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  // Check if user has admin role
  const userRole = user?.user_metadata?.role as string | undefined;
  const isAdmin = userRole === 'admin';

  if (!isAdmin) {
    // Redirect non-admin users to user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // User is admin, render children
  return <>{children}</>;
}
