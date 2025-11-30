import { useState, useEffect } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isIOS, isPWA, hasInstallPrompt, promptInstall } from '@/lib/pwa';

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isPWA()) return;

    // Check if on mobile route
    if (!window.location.pathname.startsWith('/mobile')) return;

    // Check if dismissed recently (24 hours)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) return;
    }

    // Show prompt after 3 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    // Listen for install available event (Android)
    const handleInstallAvailable = () => setShowPrompt(true);
    window.addEventListener('pwa-install-available', handleInstallAvailable);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSGuide(true);
    } else if (hasInstallPrompt()) {
      const installed = await promptInstall();
      if (installed) {
        setShowPrompt(false);
      }
    }
  };

  if (!showPrompt) return null;

  // iOS Guide Modal
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center p-4">
        <div className="bg-gray-900 rounded-t-3xl w-full max-w-md p-6 pb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Cài đặt trên iPhone</h3>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Share className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">Bước 1</p>
                <p className="text-sm text-gray-400">
                  Nhấn nút <span className="text-blue-400">Share</span> (chia sẻ) ở thanh dưới
                  Safari
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white">Bước 2</p>
                <p className="text-sm text-gray-400">
                  Chọn <span className="text-green-400">"Add to Home Screen"</span> (Thêm vào Màn
                  hình chính)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">Bước 3</p>
                <p className="text-sm text-gray-400">
                  Nhấn <span className="text-purple-400">"Add"</span> để cài đặt app
                </p>
              </div>
            </div>
          </div>

          <Button className="w-full mt-6 bg-blue-500 hover:bg-blue-600" onClick={handleDismiss}>
            Đã hiểu
          </Button>
        </div>
      </div>
    );
  }

  // Install Banner
  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">Cài đặt App</h3>
            <p className="text-sm text-white/80 mt-0.5">
              Thêm LS Admin vào màn hình chính để truy cập nhanh hơn
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={handleDismiss}
          >
            Để sau
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-white text-blue-600 hover:bg-white/90"
            onClick={handleInstall}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
