import { Calendar, Code, Trophy, Droplet, Factory, Wind, Wrench } from 'lucide-react';

const experiences = [
  {
    company: 'AINewbieVN',
    position: 'Full-stack Developer',
    period: '2023 - Present',
    description: [
      'Develop full-stack web and mobile applications integrated with AI, specializing in automation and business management solutions',
      'Design and build scalable applications using React, TypeScript, Node.js, and Flutter',
      'Implement AI integrations (GPT-4, workflow automation) and real-time systems',
      'Deploy and maintain production applications on AWS, Firebase, and Vercel',
      'Develop mobile apps: SABO Arena (tournament management), SaboHub (business management platform)',
    ],
    skills: ['React', 'TypeScript', 'Flutter', 'Node.js', 'PostgreSQL', 'AWS', 'AI Integration'],
    icon: Code,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-400/20',
    side: 'left',
  },
  {
    company: 'SABO Billiards',
    position: 'Owner & Manager',
    period: '04/2023 - Present',
    description: [
      'Develop business strategies, enhance brand recognition, expand customer base',
      'Oversee business operations and coordinate teams to create healthy work environment',
      'Organize weekly billiard tournaments and entertainment activities',
      'Create and produce content on social media platforms for marketing',
    ],
    skills: ['Business Strategy', 'Operations Management', 'Marketing', 'Team Leadership'],
    icon: Trophy,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/20',
    side: 'right',
  },
  {
    company: 'PVChem Drilling Mud',
    position: 'Drilling Mud Engineer',
    period: '07/2022 - 03/2023',
    description: [
      'Responsible for drilling mud quality control and testing procedures',
      'Coordinate with drilling teams to optimize mud properties',
      'Ensure safety compliance and environmental standards',
      'Technical support and consultation for drilling operations',
    ],
    skills: ['Quality Control', 'Safety Management', 'Technical Analysis', 'Oil & Gas'],
    icon: Droplet,
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/20',
    side: 'left',
  },
  {
    company: 'Posco Vietnam',
    position: 'Engineer – Utilities Section',
    period: '03/2020 - 04/2022',
    description: [
      'Managed utility systems operations and maintenance',
      'Implemented ISO 9001:2015 and ISO 14001:2015 quality standards',
      'Conducted internal audits and process optimization',
      'Coordinated with cross-functional teams for system improvements',
    ],
    skills: ['ISO Standards', 'Process Optimization', 'Maintenance', 'Quality Assurance'],
    icon: Factory,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/20',
    side: 'left',
  },
  {
    company: 'Daikin Vietnam',
    position: 'Sales Engineer – B2B',
    period: '10/2019 - 02/2020',
    description: [
      'Developed B2B client relationships and technical consultations',
      'Provided HVAC solutions for commercial and industrial projects',
      'Conducted site surveys and technical presentations',
      'Achieved sales targets through strategic client engagement',
    ],
    skills: ['B2B Sales', 'Technical Consulting', 'HVAC Systems', 'Client Relations'],
    icon: Wind,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/20',
    side: 'right',
  },
  {
    company: 'PVD Training',
    position: 'Worker - Periodic Maintenance',
    period: '09/2019 - 10/2019',
    description: [
      'Participated in periodic maintenance project',
      'Learned hands-on refinery operations and safety procedures',
      'Assisted in equipment inspection and maintenance tasks',
      'Gained practical experience in oil & gas industry',
    ],
    skills: ['Maintenance', 'Safety Procedures', 'Refinery Operations', 'Hands-on Training'],
    icon: Wrench,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-400/20',
    side: 'left',
  },
];

const CVExperienceSection = () => {
  return (
    <section id="experience" className="section-padding bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <p className="text-sm text-primary font-medium">My Journey</p>
          </div>

          <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
            Professional Experience
          </h2>

          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Over 5 years of diverse experience across Oil & Gas, Manufacturing, and Business
            Management
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-6xl mx-auto">
          {/* Center Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent hidden lg:block" />

          {/* Experience Items */}
          <div className="space-y-12">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className={`relative flex items-center ${
                  exp.side === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } flex-col gap-8`}
              >
                {/* Content Card */}
                <div
                  className={`lg:w-[calc(50%-3rem)] w-full ${exp.side === 'left' ? 'lg:text-right' : 'lg:text-left'}`}
                >
                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card hover:shadow-elevated hover:border-primary/50 transition-all hover-lift group">
                    {/* Company & Logo */}
                    <div
                      className={`flex items-center gap-4 mb-4 ${exp.side === 'left' ? 'lg:flex-row-reverse lg:justify-end' : 'lg:justify-start'} justify-start`}
                    >
                      <div
                        className={`w-16 h-16 rounded-xl ${exp.iconBg} border-2 border-${exp.iconColor.replace('text-', '')}/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all`}
                      >
                        <exp.icon className={`w-8 h-8 ${exp.iconColor}`} />
                      </div>
                      <div className={exp.side === 'left' ? 'lg:text-right' : 'lg:text-left'}>
                        <h3 className="text-2xl font-heading font-bold text-foreground mb-1">
                          {exp.company}
                        </h3>
                        <p className="text-lg text-primary font-semibold">{exp.position}</p>
                      </div>
                    </div>

                    {/* Period */}
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4 ${exp.side === 'left' ? 'lg:float-right lg:ml-4' : ''}`}
                    >
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">{exp.period}</span>
                    </div>

                    {/* Description */}
                    <ul
                      className={`space-y-2 mb-6 clear-both ${exp.side === 'left' ? 'lg:text-right' : 'lg:text-left'} text-left`}
                    >
                      {exp.description.map((item, i) => (
                        <li key={i} className="text-foreground-secondary flex items-start gap-2">
                          <span
                            className={`text-primary mt-1 ${exp.side === 'left' ? 'lg:order-2' : ''}`}
                          >
                            •
                          </span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Skills Tags */}
                    <div
                      className={`flex flex-wrap gap-2 ${exp.side === 'left' ? 'lg:justify-end' : 'lg:justify-start'} justify-start`}
                    >
                      {exp.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-muted border border-border rounded-full text-xs font-medium text-foreground hover:border-primary/50 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline Dot */}
                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary border-4 border-background shadow-glow z-10" />

                {/* Empty Space for Zigzag */}
                <div className="hidden lg:block lg:w-[calc(50%-3rem)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVExperienceSection;
