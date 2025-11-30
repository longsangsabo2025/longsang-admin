import { Hero } from "@/components/sabohub/Hero";
import { StatsBar } from "@/components/sabohub/StatsBar";
import { Features } from "@/components/sabohub/Features";
import { TargetUsers } from "@/components/sabohub/TargetUsers";
import { Benefits } from "@/components/sabohub/Benefits";
import { TechStack } from "@/components/sabohub/TechStack";
import { CTA as CallToAction } from "@/components/sabohub/CTA";
import { Footer } from "@/components/sabohub/Footer";

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
