import CVNavigation from "@/components/cv/CVNavigation";
import CVHeroSection from "@/components/cv/CVHeroSection";
import CVAboutSection from "@/components/cv/CVAboutSection";
import CVExperienceSection from "@/components/cv/CVExperienceSection";
import CVSkillsSection from "@/components/cv/CVSkillsSection";
import CVEducationSection from "@/components/cv/CVEducationSection";
import CVContactSection from "@/components/cv/CVContactSection";
import CVFooter from "@/components/cv/CVFooter";
import { LanguageProvider } from "@/contexts/LanguageContext";

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