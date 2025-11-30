import { useEffect, useRef, useState } from "react";
import { Calendar, GraduationCap, Mail, MapPin, Award, Settings, Briefcase } from "lucide-react";

const CVAboutSection = () => {
  const [inView, setInView] = useState(false);
  const [counts, setCounts] = useState({ years: 0, projects: 0, clients: 0 });
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

  useEffect(() => {
    if (inView) {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      const targets = { years: 6, projects: 15, clients: 50 };
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setCounts({
          years: Math.floor(targets.years * progress),
          projects: Math.floor(targets.projects * progress),
          clients: Math.floor(targets.clients * progress),
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          setCounts(targets);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [inView]);

  return (
    <section ref={sectionRef} id="about" className="section-padding bg-background-secondary relative">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Left Content - 60% */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <p className="text-sm text-primary font-medium">About Me</p>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
                Who I Am
              </h2>
            </div>

            <div className="space-y-6 text-lg text-foreground-secondary leading-relaxed">
              <p>
                Full-stack Developer with <span className="text-primary font-semibold">extensive experience</span> in building 
                web and mobile applications integrated with AI. Currently developing innovative solutions at <span className="text-secondary font-semibold">AINewbieVN</span> while 
                managing <span className="text-accent font-semibold">SABO Billiards</span> as Owner & Manager.
              </p>
              
              <p>
                Specialized in <span className="text-accent font-semibold">full-stack development, AI integration, and mobile app development</span> using 
                cutting-edge technologies like React, TypeScript, Flutter, Node.js, and PostgreSQL. Expert in building real-time systems, 
                designing scalable architectures, and deploying production applications on AWS, Firebase, and Vercel.
              </p>

              <p>
                Passionate about leveraging technology to solve real-world problems through automation and intelligent systems. 
                Strong background in both technical engineering and business development, with a proven track record in creating 
                user-centric applications and managing cross-functional teams.
              </p>
            </div>

            {/* Quick Facts Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all hover-lift">
                <Calendar className="w-8 h-8 text-primary mb-3" />
                <p className="text-sm text-foreground-secondary mb-1">Date of Birth</p>
                <p className="text-lg font-semibold text-foreground">April 1996</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all hover-lift">
                <GraduationCap className="w-8 h-8 text-secondary mb-3" />
                <p className="text-sm text-foreground-secondary mb-1">Education</p>
                <p className="text-lg font-semibold text-foreground">B.Eng - Petroleum</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all hover-lift">
                <Mail className="w-8 h-8 text-accent mb-3" />
                <p className="text-sm text-foreground-secondary mb-1">Email</p>
                <p className="text-sm font-semibold text-foreground break-all">longsangsabo@gmail.com</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all hover-lift">
                <MapPin className="w-8 h-8 text-primary mb-3" />
                <p className="text-sm text-foreground-secondary mb-1">Location</p>
                <p className="text-lg font-semibold text-foreground">Vung Tau, Vietnam</p>
              </div>
            </div>
          </div>

          {/* Right Content - 40% Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
              <div className="space-y-8">
                {/* Years Counter */}
                <div className="text-center group hover-lift">
                  <div className="text-6xl font-heading font-black text-gradient-gold mb-2">
                    {counts.years}+
                  </div>
                  <p className="text-lg font-medium text-foreground-secondary">Years of Experience</p>
                  <p className="text-sm text-muted-foreground mt-1">Tech & Engineering</p>
                </div>

                <div className="h-px bg-border" />

                {/* Projects Counter */}
                <div className="text-center group hover-lift">
                  <div className="text-5xl font-heading font-black text-secondary mb-2">
                    {counts.projects}+
                  </div>
                  <p className="text-lg font-medium text-foreground-secondary">Projects Built</p>
                  <p className="text-sm text-muted-foreground mt-1">Web & Mobile Apps</p>
                </div>

                <div className="h-px bg-border" />

                {/* Clients Counter */}
                <div className="text-center group hover-lift">
                  <div className="text-5xl font-heading font-black text-accent mb-2">
                    {counts.clients}+
                  </div>
                  <p className="text-lg font-medium text-foreground-secondary">Happy Clients</p>
                  <p className="text-sm text-muted-foreground mt-1">Across Industries</p>
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4 text-center group hover-lift">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground">Full-stack Dev</p>
              </div>
              <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 rounded-xl p-4 text-center group hover-lift">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-xs font-semibold text-foreground">AI Integration</p>
              </div>
              <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-4 text-center group hover-lift">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5 text-accent" />
                </div>
                <p className="text-xs font-semibold text-foreground">Business Owner</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 rounded-xl p-4 text-center group hover-lift">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-xs font-semibold text-foreground">Mobile Dev</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVAboutSection;