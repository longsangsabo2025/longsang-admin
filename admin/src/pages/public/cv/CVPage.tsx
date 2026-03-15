import CVAboutSection from '@/components/cv/CVAboutSection';
import CVContactSection from '@/components/cv/CVContactSection';
import CVEducationSection from '@/components/cv/CVEducationSection';
import CVExperienceSection from '@/components/cv/CVExperienceSection';
import CVFooter from '@/components/cv/CVFooter';
import CVHeroSection from '@/components/cv/CVHeroSection';
import CVNavigation from '@/components/cv/CVNavigation';
import CVSkillsSection from '@/components/cv/CVSkillsSection';
import { LanguageProvider } from '@/contexts/LanguageContext';

const CVPage = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        <CVNavigation />
        <main>
          <CVHeroSection />
          <CVAboutSection />
          <CVExperienceSection />
          <CVSkillsSection />
          <CVEducationSection />
          <CVContactSection />
        </main>
        <CVFooter />
      </div>
    </LanguageProvider>
  );
};

export default CVPage;
