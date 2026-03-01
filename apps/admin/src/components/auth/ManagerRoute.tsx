import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { isAdminOrManager, getUserRole } from '@/types/roles';
import { Loader2 } from 'lucide-react';

interface ManagerRouteProps {
  readonly children: ReactNode;
}

/**
 * Route guard cho Manager Portal
 * Cho phép cả admin và manager truy cập
 */
export function ManagerRoute({ children }: ManagerRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user is authenticated first
  if (!user) {
    return <Navigate to="/manager/login" replace />;
  }

  // Check if user has admin or manager role
  const userRole = getUserRole(user);
  
  if (!isAdminOrManager(userRole)) {
    // Redirect non-admin/manager users to manager login
    return <Navigate to="/manager/login" replace />;
  }

  // User is admin or manager, render children
  return <>{children}</>;
}
