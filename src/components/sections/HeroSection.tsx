import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

export const HeroSection = () => {
  const { t } = useTranslation();

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Animated Gradient Orbs */}
      <div
        className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse"
        style={{ animationDuration: "10s", animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] animate-pulse"
        style={{ animationDuration: "12s", animationDelay: "4s" }}
      />

      {/* Content Container - Increased width */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 xl:px-28 py-8 md:py-12">
        <div className="grid lg:grid-cols-[55%_45%] gap-8 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8 animate-slide-up">
            {/* Greeting */}
            <p className="text-2xl font-medium text-muted-foreground tracking-wide animate-slide-up animate-delay-100">
              {t("hero.greeting")}
            </p>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-foreground animate-slide-up animate-delay-200">
              {t("hero.headline1")}
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("hero.headline2")}
              </span>
              <br />
              {t("hero.headline3")}
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground animate-slide-up animate-delay-300">
              {t("hero.subheadline")}
            </p>

            {/* Tagline */}
            <p className="text-lg font-medium text-muted-foreground/80 animate-slide-up animate-delay-300">
              {t("hero.tagline")}
            </p>

            {/* Latest Work Badge - Now clickable */}
            <button
              onClick={() => scrollToSection("#projects")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm font-medium text-primary hover:scale-105 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all duration-200 animate-slide-up animate-delay-400"
            >
              {t("hero.latestBadge")}
            </button>

            {/* CTA Buttons - Reduced from 3 to 2 for better UX */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-slide-up animate-delay-500">
              <Button
                onClick={() => scrollToSection("#contact")}
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground px-8 py-6 rounded-xl text-lg font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {t("hero.cta2")}
              </Button>
            </div>
          </div>

          {/* Right Side - Profile Image */}
          <div className="flex justify-center lg:justify-end animate-slide-up animate-delay-300">
            <div className="relative w-full max-w-md lg:w-[500px] h-[400px] lg:h-[600px] rounded-2xl overflow-hidden bg-card border border-border/10 animate-float group hover:scale-105 transition-all duration-500 shadow-2xl">
              <img
                src="/images/avatarpro.png"
                alt="Long Sang - Software Developer"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  // Fallback to icon if image not found
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement?.classList.add(
                    "flex",
                    "items-center",
                    "justify-center"
                  );
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={() => scrollToSection("#services")}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group animate-slide-up animate-delay-500"
        >
          <ChevronDown className="w-8 h-8 animate-pulse-soft group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">{t("hero.scrollText")}</span>
        </button>
      </div>
    </section>
  );
};
