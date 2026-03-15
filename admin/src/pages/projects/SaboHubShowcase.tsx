import { Benefits } from '@/components/sabohub/Benefits';
import { CTA as CallToAction } from '@/components/sabohub/CTA';
import { Features } from '@/components/sabohub/Features';
import { Footer } from '@/components/sabohub/Footer';
import { Hero } from '@/components/sabohub/Hero';
import { StatsBar } from '@/components/sabohub/StatsBar';
import { TargetUsers } from '@/components/sabohub/TargetUsers';
import { TechStack } from '@/components/sabohub/TechStack';

const SaboHubShowcase = () => {
  return (
    <div className="min-h-screen bg-background dark">
      <Hero />
      <StatsBar />
      <Features />
      <TargetUsers />
      <Benefits />
      <TechStack />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default SaboHubShowcase;
