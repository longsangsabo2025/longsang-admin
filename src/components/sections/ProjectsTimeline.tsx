import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ProjectsTimeline = () => {
  const { t } = useTranslation();

  const projects = [
    {
      titleKey: "projects.ecommerce.title",
      descriptionKey: "projects.ecommerce.description",
      techStack: ["Python", "Zapier", "Shopify", "PostgreSQL"],
      image: "/images/ecommerce-automation.jpg",
    },
    {
      titleKey: "projects.analytics.title",
      descriptionKey: "projects.analytics.description",
      techStack: ["React", "Node.js", "PostgreSQL", "Chart.js"],
      image: "/images/analytics-dashboard.jpg",
    },
    {
      titleKey: "projects.aiDoc.title",
      descriptionKey: "projects.aiDoc.description",
      techStack: ["OpenAI", "Python", "Firebase", "Cloud Functions"],
      image: "/images/ai-document-processor.jpg",
    },
  ];

  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-8 md:py-16 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">
            {t("projects.header")}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {t("projects.subtitle")}
          </h2>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Timeline Line (Desktop Only) */}
          <div className="hidden md:block absolute left-0 top-8 bottom-8 w-0.5 bg-border/30" />

          {/* Projects */}
          <div className="space-y-12">
            {projects.map((project, index) => (
              <div
                key={project.titleKey}
                className="relative md:ml-12"
                style={{
                  animation: "fade-in 0.6s ease-out forwards",
                  animationDelay: `${index * 200}ms`,
                  opacity: 0,
                }}
              >
                {/* Timeline Dot (Desktop Only) */}
                <div className="hidden md:block absolute -left-14 top-8 w-4 h-4 rounded-full bg-primary border-[3px] border-background shadow-[0_0_0_4px_rgba(14,165,233,0.2)]" />

                {/* Project Card */}
                <div className="bg-card border border-border/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-250 group">
                  {/* Thumbnail with enhanced visual */}
                  <div className="md:w-[300px] flex-shrink-0">
                    <div className="relative aspect-video md:aspect-[3/2] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 group-hover:from-primary/30 group-hover:via-secondary/30 group-hover:to-accent/30 transition-all duration-300">
                      {/* Gradient overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <img
                        src={project.image}
                        alt={t(project.titleKey)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to gradient background if image fails
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Title */}
                    <h3 className="text-2xl font-semibold text-foreground">
                      {t(project.titleKey)}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-muted-foreground leading-relaxed line-clamp-2">
                      {t(project.descriptionKey)}
                    </p>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 text-xs font-medium font-mono bg-primary/10 border border-primary/30 text-accent rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Link */}
                    <button
                      onClick={scrollToContact}
                      className="inline-flex items-center gap-2 text-base font-medium text-primary hover:text-accent transition-colors duration-200 group/link mt-auto"
                    >
                      {t("projects.viewDetails")}
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
