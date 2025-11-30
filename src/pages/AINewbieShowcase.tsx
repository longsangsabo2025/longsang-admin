import { HeroSection } from '@/components/ainewbie/HeroSection';
import { ServicesSection } from '@/components/ainewbie/ServicesSection';
import { WorkflowSection } from '@/components/ainewbie/WorkflowSection';
import { JobSection } from '@/components/ainewbie/JobSection';
import { CTASection } from '@/components/ainewbie/CTASection';
import { Footer } from '@/components/ainewbie/Footer';

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
