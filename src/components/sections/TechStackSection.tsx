import { Brain, Container, Database, Globe, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";

export const TechStackSection = () => {
  const { t } = useTranslation();

  const techCategories = [
    {
      Icon: Smartphone,
      labelKey: "techStack.mobile",
      technologies: ["Flutter", "Dart", "iOS SDK", "Android SDK", "React Native"],
      color: "text-blue-500",
    },
    {
      Icon: Globe,
      labelKey: "techStack.web",
      technologies: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "HTML/CSS"],
      color: "text-purple-500",
    },
    {
      Icon: Database,
      labelKey: "techStack.backend",
      technologies: [
        "Node.js",
        "Python",
        "Supabase",
        "Firebase",
        "PostgreSQL",
        "MongoDB",
        "REST APIs",
        "GraphQL",
      ],
      color: "text-green-500",
    },
    {
      Icon: Brain,
      labelKey: "techStack.ai",
      technologies: [
        "OpenAI API",
        "Claude API",
        "Google Gemini",
        "LangChain",
        "Zapier",
        "Make",
        "n8n",
      ],
      color: "text-pink-500",
    },
    {
      Icon: Container,
      labelKey: "techStack.devops",
      technologies: ["Git", "GitHub", "Docker", "Vercel", "Railway", "VS Code", "Postman", "Figma"],
      color: "text-orange-500",
    },
  ];

  return (
    <section id="tech-stack" className="py-8 md:py-16 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-64 bg-gradient-to-t from-primary/10 to-transparent blur-3xl" />

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 xl:px-28 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">
            {t("techStack.header")}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {t("techStack.subtitle")}
          </h2>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {techCategories.map((category, categoryIndex) => (
            <div
              key={category.labelKey}
              className="animate-fade-in"
              style={{
                animationDelay: `${categoryIndex * 200}ms`,
                opacity: 0,
              }}
            >
              {/* Category Label with Icon - Enhanced */}
              <div className="flex items-center gap-3 mb-6 group">
                <div
                  className={`relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-primary/20 ${category.color}`}
                >
                  {/* Glow effect on hover */}
                  <div
                    className={`absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${category.color.replace(
                      "text-",
                      "bg-"
                    )}`}
                  />
                  <category.Icon className="relative w-6 h-6" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-semibold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors duration-300">
                  {t(category.labelKey)}
                </h3>
              </div>

              {/* Tech Badges */}
              <div className="flex flex-wrap gap-2">
                {category.technologies.map((tech, techIndex) => (
                  <span
                    key={tech}
                    className="inline-flex items-center px-5 py-2.5 bg-primary/10 border border-primary/30 rounded-full font-mono text-sm font-medium text-accent hover:bg-primary/20 hover:border-primary/60 hover:scale-105 hover:shadow-[0_0_12px_rgba(14,165,233,0.3)] transition-all duration-200 cursor-default"
                    style={{
                      animationDelay: `${categoryIndex * 200 + techIndex * 50}ms`,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
