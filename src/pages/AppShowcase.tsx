import { useState, useEffect } from 'react';
import { HeroSection } from '@/components/showcase/HeroSection';
import { FeaturesSection } from '@/components/showcase/FeaturesSectionDynamic';
import { CTASection } from '@/components/showcase/CTASection';
import { FooterSection } from '@/components/showcase/FooterSection';
import { AnimatedBackground } from '@/components/showcase/AnimatedBackground';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShowcaseService } from '@/services/app-showcase.service';
import { AppShowcaseData } from '@/types/app-showcase.types';

const AppShowcase = () => {
  const [data, setData] = useState<AppShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Subscribe to realtime changes from Supabase
    const unsubscribe = AppShowcaseService.subscribeToChanges('sabo-arena', (newData) => {
      setData(newData);
      setLoading(false);
    });

    // Also listen for custom event (admin save triggers this)
    const handleAppUpdate = () => {
      loadData();
    };

    window.addEventListener('app-showcase-updated', handleAppUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('app-showcase-updated', handleAppUpdate);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const appData = await AppShowcaseService.loadData('sabo-arena');
    setData(appData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <p className="text-destructive">Không tìm thấy dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AnimatedBackground />

      {/* Admin Button - Floating */}
      <Link
        to="/app-showcase/admin"
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-neon-cyan text-dark-bg flex items-center justify-center shadow-lg shadow-neon-cyan/50 hover:scale-110 transition-transform"
        title="Vào trang Admin"
      >
        <Settings size={24} />
      </Link>

      <HeroSection data={data} />
      <FeaturesSection data={data} />
      <CTASection data={data} />
      <FooterSection />
    </div>
  );
};

export default AppShowcase;
