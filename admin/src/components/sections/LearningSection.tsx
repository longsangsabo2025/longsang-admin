import { ArrowRight, BookOpen, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const LearningSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="learning" className="py-8 md:py-16 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 xl:px-28 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary mb-4 font-mono">
            {t('learning.header')}
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
            {t('learning.subtitle')}
          </h2>
        </div>

        {/* Academy Banner - Enhanced */}
        <div className="mb-12 group relative bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/40 rounded-3xl p-8 overflow-hidden hover:border-primary/70 hover:shadow-[0_0_40px_rgba(14,165,233,0.3)] transition-all duration-500">
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="flex items-center justify-between flex-wrap gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div>
                <h3 className="text-2xl md:text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                  🎓 AI Academy - Nền tảng học AI chuyên nghiệp
                </h3>
                <p className="text-muted-foreground text-sm md:text-base font-medium">
                  <span className="text-primary font-bold">15+</span> khóa học AI/Agent Development
                  • <span className="text-accent font-bold">15K+</span> học viên •{' '}
                  <span className="text-secondary font-bold">Certificate</span> chuyên nghiệp
                </p>
              </div>
            </div>

            {/* Enhanced Button with gradient */}
            <button
              onClick={() => navigate('/academy')}
              className="group/btn relative px-8 py-4 rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer"></div>
              <div className="relative flex items-center gap-3 text-white">
                Khám phá ngay
                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Cards Grid - Enhanced */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Online Courses Card */}
          <div
            className="group relative bg-gradient-to-br from-card via-card to-primary/5 border-2 border-border/20 rounded-3xl p-10 flex flex-col min-h-[450px] overflow-hidden hover:-translate-y-2 hover:border-primary/60 hover:shadow-[0_20px_60px_rgba(14,165,233,0.3)] hover:scale-[1.02] transition-all duration-500"
            style={{
              animation: 'fade-in 0.6s ease-out forwards',
              animationDelay: '0ms',
              opacity: 0,
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Icon and Title aligned horizontally */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen
                    className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]"
                    strokeWidth={2.5}
                  />
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary relative z-10">
                {t('learning.courses.badge')}
              </h3>
            </div>

            <ul className="space-y-4 mb-8 flex-grow relative z-10">
              {(t('learning.courses.items', { returnObjects: true }) as string[]).map(
                (item: string, index: number) => (
                  <li
                    key={`course-item-${index}-${item.substring(0, 15)}`}
                    className="text-base text-muted-foreground leading-relaxed flex items-start gap-3 group/item hover:text-foreground transition-colors"
                  >
                    <span className="text-primary mt-1.5 text-xl font-bold group-hover/item:scale-125 transition-transform">
                      ●
                    </span>
                    <span className="font-medium">{item}</span>
                  </li>
                )
              )}
            </ul>

            {/* Enhanced Button */}
            <button
              onClick={scrollToContact}
              className="relative px-8 py-4 rounded-2xl font-bold text-base overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.4)] group/btn z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent"></div>
              <div className="relative flex items-center justify-center gap-3 text-white">
                {t('learning.courses.cta')}
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Free Resources Card */}
          <div
            className="group relative bg-gradient-to-br from-card via-card to-accent/5 border-2 border-border/20 rounded-3xl p-10 flex flex-col min-h-[450px] overflow-hidden hover:-translate-y-2 hover:border-accent/60 hover:shadow-[0_20px_60px_rgba(6,182,212,0.3)] hover:scale-[1.02] transition-all duration-500"
            style={{
              animation: 'fade-in 0.6s ease-out forwards',
              animationDelay: '150ms',
              opacity: 0,
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Icon and Title aligned horizontally */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent to-secondary rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Gift
                    className="w-8 h-8 text-accent drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    strokeWidth={2.5}
                  />
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-accent relative z-10">
                {t('learning.resources.badge')}
              </h3>
            </div>

            <ul className="space-y-4 mb-8 flex-grow relative z-10">
              {(t('learning.resources.items', { returnObjects: true }) as string[]).map(
                (item: string, index: number) => (
                  <li
                    key={`resource-item-${index}-${item.substring(0, 15)}`}
                    className="text-base text-muted-foreground leading-relaxed flex items-start gap-3 group/item hover:text-foreground transition-colors"
                  >
                    <span className="text-accent mt-1.5 text-xl font-bold group-hover/item:scale-125 transition-transform">
                      ●
                    </span>
                    <span className="font-medium">{item}</span>
                  </li>
                )
              )}
            </ul>

            {/* Enhanced Button */}
            <button
              onClick={scrollToContact}
              className="relative px-8 py-4 rounded-2xl font-bold text-base overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] group/btn z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-secondary"></div>
              <div className="relative flex items-center justify-center gap-3 text-white">
                {t('learning.resources.cta')}
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
