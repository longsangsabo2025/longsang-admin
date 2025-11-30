import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { ForbiddenPage } from "./ForbiddenPage";
import { ProtectedRoute } from "./ProtectedRoute";

interface UserRouteProps {
  readonly children: ReactNode;
}

export function UserRoute({ children }: UserRouteProps) {
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

  // Check if user has user role (not admin)
  const userRole = user?.user_metadata?.role as string | undefined;
  const isUser = userRole === "user" || !userRole; // Default to user if no role set

  if (!isUser) {
    // Show forbidden page for admin users trying to access user-only content
    return <ForbiddenPage />;
  }

  // User has correct role, render children
  return <>{children}</>;
}
