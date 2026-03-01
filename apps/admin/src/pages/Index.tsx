import { Layout } from '@/components/Layout';
import { ContactSection } from '@/components/sections/ContactSection';
import { FeaturedProject } from '@/components/sections/FeaturedProject';
import { HeroSection } from '@/components/sections/HeroSection';
import { LearningSection } from '@/components/sections/LearningSection';
import { ProcessSection } from '@/components/sections/ProcessSection';
import { ProjectsTimeline } from '@/components/sections/ProjectsTimeline';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { TechStackSection } from '@/components/sections/TechStackSection';

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Featured Project */}
      <FeaturedProject />

      {/* Other Projects Timeline */}
      <ProjectsTimeline />

      {/* Tech Stack */}
      <TechStackSection />

      {/* Process */}
      <ProcessSection />

      {/* Learning Hub */}
      <LearningSection />

      {/* Contact Section */}
      <ContactSection />
    </Layout>
  );
};

export default Index;
