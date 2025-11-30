import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LoginModal } from './LoginModal';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    // Show login modal instead of redirecting
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access the automation dashboard.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Sign In
            </button>
          </div>
        </div>
        <LoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
        />
      </>
    );
  }

  return <>{children}</>;
}
