import { useEffect, useState } from 'react';
import { ConsultationManager } from '@/components/consultation/ConsultationManager';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';

export default function AdminConsultations() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ConsultationManager consultantId={user.id} />
    </div>
  );
}
