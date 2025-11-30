import { Home, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <Shield className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Status Code */}
          <h1 className="text-6xl font-bold text-red-600 dark:text-red-400 mb-4">403</h1>

          {/* Message */}
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Truy cập bị từ chối
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn tin rằng
            đây là lỗi.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Về trang chủ
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              Quay lại
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
            Nếu bạn cần quyền truy cập quản trị viên, vui lòng liên hệ với đội ngũ hỗ trợ.
          </p>
        </div>
      </div>
    </div>
  );
}
