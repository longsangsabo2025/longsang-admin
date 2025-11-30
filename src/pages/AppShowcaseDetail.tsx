import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { HeroSection } from "@/components/showcase/HeroSection";
import { FeaturesSection } from "@/components/showcase/FeaturesSectionDynamic";
import { CTASection } from "@/components/showcase/CTASection";
import { FooterSection } from "@/components/showcase/FooterSection";
import { AnimatedBackground } from "@/components/showcase/AnimatedBackground";
import { Settings } from "lucide-react";
import { AppShowcaseService } from "@/services/app-showcase.service";
import { AppShowcaseData } from "@/types/app-showcase.types";
import SaboHubShowcase from "./SaboHubShowcase";
import AINewbieShowcase from "./AINewbieShowcase";

const AppShowcaseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AppShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip loading data for custom showcases
    if (slug === "sabohub" || slug === "ainewbievn") {
      setLoading(false);
      return;
    }

    const loadDataAsync = async () => {
      if (!slug) {
        navigate('/app-showcase');
        return;
      }
      
      setLoading(true);
      const appData = await AppShowcaseService.loadData(slug);
      setData(appData);
      setLoading(false);
    };
    
    loadDataAsync();
    
    // Subscribe to realtime changes from Supabase
    const unsubscribe = slug ? AppShowcaseService.subscribeToChanges(slug, (newData) => {
      setData(newData);
      setLoading(false);
    }) : () => {};
    
    // Also listen for custom event (admin save triggers this)
    const handleAppUpdate = () => {
      loadDataAsync();
    };
    
    globalThis.addEventListener('app-showcase-updated', handleAppUpdate);
    
    return () => {
      unsubscribe();
      globalThis.removeEventListener('app-showcase-updated', handleAppUpdate);
    };
  }, [slug, navigate]);

  // If slug is "sabohub", render SaboHub showcase directly
  if (slug === "sabohub") {
    return <SaboHubShowcase />;
  }

  // If slug is "ainewbievn", render AINewbie showcase directly
  if (slug === "ainewbievn") {
    return <AINewbieShowcase />;
  }

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

export default AppShowcaseDetail;
