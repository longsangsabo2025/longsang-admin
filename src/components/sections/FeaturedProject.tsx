import { Button } from '@/components/ui/button';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const projectImages = [
  '/images/sabo-arena-1.jpg',
  '/images/sabo-arena-2.jpg',
  '/images/sabo-arena-3.jpg',
  '/images/sabo-arena-4.jpg',
];

export const FeaturedProject = () => {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % projectImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const techStack = ['Flutter', 'Dart', 'Supabase', 'PostgreSQL', 'Real-time'];

  return (
    <section id="projects" className="py-8 md:py-16 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/5" />

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 xl:px-28 relative z-10">
        {/* Featured Badge */}
        <div className="mb-12">
          <span className="inline-block px-5 py-2 text-sm font-bold uppercase bg-secondary/10 border border-secondary/30 text-secondary rounded-full">
            {t('featured.badge')}
          </span>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Image Gallery */}
          <div className="relative animate-fade-in">
            <div className="bg-card border border-border/10 rounded-2xl p-6">
              {/* Image Container */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={projectImages[currentImageIndex]}
                  alt={`SABO Arena Screenshot ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-400"
                />

                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {projectImages.map((image, index) => (
                  <button
                    key={`image-dot-${index}-${image}`}
                    onClick={() => goToImage(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-primary w-8'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="space-y-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {/* Project Name */}
            <div>
              <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                {t('featured.title')}
              </h3>
              <p className="text-lg md:text-xl font-medium text-muted-foreground">
                {t('featured.tagline')}
              </p>
            </div>

            {/* The Challenge */}
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">
                {t('featured.challengeTitle')}
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t('featured.challengeText')}
              </p>
            </div>

            {/* The Solution */}
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">
                {t('featured.solutionTitle')}
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                {t('featured.solutionIntro')}
              </p>
              <ul className="space-y-3">
                {(t('featured.features', { returnObjects: true }) as string[]).map(
                  (feature: string, index: number) => (
                    <li
                      key={`feature-${index}-${feature.substring(0, 20)}`}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <span className="text-primary mt-1">•</span>
                      <span className="text-base leading-relaxed">{feature}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Tech Stack */}
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">
                {t('featured.techStackTitle')}
              </p>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 text-xs font-medium font-mono bg-primary/10 border border-primary/30 text-accent rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Results & Impact */}
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">
                {t('featured.resultsTitle')}
              </p>
              <ul className="space-y-3">
                {(t('featured.results', { returnObjects: true }) as string[]).map(
                  (result: string, index: number) => (
                    <li
                      key={`result-${index}-${result.substring(0, 20)}`}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-base leading-relaxed">{result}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* CTA Button */}
            <Button
              onClick={scrollToContact}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-6 rounded-xl font-semibold hover:scale-105 transition-all duration-200 inline-flex items-center gap-2"
            >
              {t('featured.cta')}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
