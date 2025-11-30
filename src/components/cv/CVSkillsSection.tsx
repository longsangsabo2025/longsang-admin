import { useEffect, useRef, useState } from "react";
import { Code, Wrench, Users, Brain, Target, MessageSquare } from "lucide-react";

const technicalSkills = [
  { name: "Full-stack Web Development", level: 95 },
  { name: "Mobile App Development (Flutter)", level: 90 },
  { name: "AI Integration & Automation", level: 88 },
  { name: "Database Design & Optimization", level: 92 },
  { name: "Cloud Infrastructure & DevOps", level: 85 },
  { name: "Real-time System Architecture", level: 87 },
  { name: "Business Strategy & Development", level: 88 },
  { name: "Operations Management", level: 92 },
];

const softwareTools = [
  { name: "React", level: 95, icon: Code },
  { name: "TypeScript", level: 92, icon: Code },
  { name: "Flutter", level: 90, icon: Target },
  { name: "Node.js", level: 88, icon: Wrench },
  { name: "PostgreSQL", level: 90, icon: Brain },
  { name: "AWS", level: 85, icon: Users },
  { name: "Firebase", level: 90, icon: MessageSquare },
  { name: "Git/GitHub", level: 95, icon: Code },
  { name: "Figma", level: 85, icon: Target },
];

const competencies = [
  { name: "Communication", icon: MessageSquare },
  { name: "Teamwork", icon: Users },
  { name: "Problem Solving", icon: Target },
  { name: "Self-Learning", icon: Brain },
];

const CVSkillsSection = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="skills" className="section-padding bg-background-secondary relative">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <p className="text-sm text-primary font-medium">What I Know</p>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
            Skills & Expertise
          </h2>
          
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            A comprehensive skill set combining technical engineering knowledge with business acumen
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Technical Skills */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            <div className="flex items-center gap-3 mb-8">
              <Code className="w-8 h-8 text-primary" />
              <h3 className="text-2xl font-heading font-bold text-foreground">Technical Skills</h3>
            </div>

            <div className="space-y-6">
              {technicalSkills.map((skill, index) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{skill.name}</span>
                    <span className="text-sm text-primary font-semibold">{skill.level}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: inView ? `${skill.level}%` : "0%",
                        transitionDelay: `${index * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Software & Tools */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            <div className="flex items-center gap-3 mb-8">
              <Wrench className="w-8 h-8 text-secondary" />
              <h3 className="text-2xl font-heading font-bold text-foreground">Software & Tools</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {softwareTools.map((tool, index) => {
                const IconComponent = tool.icon;
                return (
                  <div
                    key={tool.name}
                    className="bg-muted border border-border rounded-xl p-4 text-center hover:border-secondary/50 hover-lift transition-all group"
                    style={{
                      animation: inView ? `fade-in 0.5s ease-out ${index * 100}ms both` : "none",
                    }}
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-secondary/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
                      <IconComponent className="w-6 h-6 text-secondary" />
                    </div>
                    <p className="font-semibold text-foreground text-sm mb-1">{tool.name}</p>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-accent rounded-full"
                        style={{
                          width: inView ? `${tool.level}%` : "0%",
                          transition: "width 1s ease-out",
                          transitionDelay: `${index * 100 + 300}ms`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-foreground-secondary mt-1">{tool.level}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Professional Competencies */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
              Professional Competencies
            </h3>
            <p className="text-foreground-secondary">Core soft skills that drive success</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {competencies.map((comp, index) => {
              const Icon = comp.icon;
              return (
                <div
                  key={comp.name}
                  className="flex flex-col items-center gap-3 p-6 bg-muted rounded-xl hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all hover-lift group"
                  style={{
                    animation: inView ? `scale-in 0.5s ease-out ${index * 150}ms both` : "none",
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-center">{comp.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVSkillsSection;