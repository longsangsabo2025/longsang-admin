import { CTASection } from '@/components/ainewbie/CTASection';
import { Footer } from '@/components/ainewbie/Footer';
import { HeroSection } from '@/components/ainewbie/HeroSection';
import { JobSection } from '@/components/ainewbie/JobSection';
import { ServicesSection } from '@/components/ainewbie/ServicesSection';
import { WorkflowSection } from '@/components/ainewbie/WorkflowSection';

const AINewbieShowcase = () => {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <ServicesSection />
        <WorkflowSection />
        <JobSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default AINewbieShowcase;
