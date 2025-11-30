import { GraduationCap, Award, CheckCircle2 } from "lucide-react";

const certifications = [
  {
    title: "ISO 9001:2015 Internal Auditor",
    issuer: "Posco Vietnam",
    year: "2021",
  },
  {
    title: "ISO 14001:2015 Internal Auditor",
    issuer: "Posco Vietnam",
    year: "2021",
  },
  {
    title: "Oil & Gas Safety Competition",
    issuer: "Medical First Aid Segment - Vung Tau",
    year: "2022",
  },
  {
    title: "Periodic Maintenance Project",
    issuer: "PVD Training",
    year: "2019",
  },
];

const CVEducationSection = () => {
  return (
    <section id="education" className="section-padding bg-background relative">
      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <p className="text-sm text-primary font-medium">Learning Journey</p>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
            Education & Certifications
          </h2>
          
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Academic foundation and professional certifications that validate my expertise
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Education Card */}
          <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 shadow-elevated hover-lift group">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-wide">Education</span>
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-1">
                  PetroVietnam University
                </h3>
                <p className="text-lg text-secondary font-semibold">
                  Bachelor of Engineering
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-foreground-secondary mb-1">Major</p>
                <p className="text-lg font-semibold text-foreground">Petroleum Refining Engineering</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-foreground-secondary mb-1">Duration</p>
                  <p className="font-semibold text-foreground">2014 - 2019</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-foreground-secondary mb-1">GPA</p>
                  <p className="font-semibold text-primary">7.3/10</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-secondary/20 to-accent/20 border border-secondary/30 rounded-lg p-4">
                <p className="text-sm text-foreground-secondary mb-1">Language Proficiency</p>
                <p className="font-semibold text-foreground">IELTS: 5.5 (Issued by PVU)</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-foreground-secondary leading-relaxed">
                Comprehensive engineering education with focus on petroleum refining processes, 
                plant operations, safety management, and quality control systems.
              </p>
            </div>
          </div>

          {/* Certifications Card */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-foreground">
                Certifications & Training
              </h3>
            </div>

            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div
                  key={cert.title}
                  className="bg-muted/50 border border-border rounded-xl p-5 hover:border-accent/50 hover:bg-accent/5 transition-all hover-lift group"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">
                        {cert.title}
                      </h4>
                      <p className="text-sm text-foreground-secondary">{cert.issuer}</p>
                      <div className="mt-2 inline-block px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                        <span className="text-xs font-medium text-accent">{cert.year}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl">
              <p className="text-sm text-foreground-secondary leading-relaxed">
                <span className="font-semibold text-foreground">Continuous Learning:</span> Committed to 
                professional development through industry certifications, safety training, and quality 
                management systems to stay current with best practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVEducationSection;