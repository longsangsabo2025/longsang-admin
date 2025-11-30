import { GlowCard } from '@/components/ui/glow-card';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Clock, Briefcase } from 'lucide-react';

const jobs = [
  {
    title: 'Senior AI Engineer',
    company: 'Tech Corp Vietnam',
    location: 'Hà Nội',
    salary: '30-50M VNĐ',
    type: 'Full-time',
    posted: '2 ngày trước',
  },
  {
    title: 'Machine Learning Specialist',
    company: 'AI Solutions',
    location: 'Hồ Chí Minh',
    salary: '25-40M VNĐ',
    type: 'Full-time',
    posted: '1 tuần trước',
  },
  {
    title: 'AI Product Manager',
    company: 'Digital Innovations',
    location: 'Remote',
    salary: '35-60M VNĐ',
    type: 'Full-time',
    posted: '3 ngày trước',
  },
];

export const JobSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-20" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Cơ Hội <span className="glow-text">Nghề Nghiệp</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Kết nối với các vị trí việc làm hàng đầu trong lĩnh vực AI & Machine Learning
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 mb-8">
          {jobs.map((job, index) => (
            <GlowCard key={index} glowIntensity="medium" className="hover:scale-102 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-foreground mb-2">{job.title}</h3>
                  <p className="text-primary mb-3">{job.company}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.posted}
                    </span>
                  </div>
                </div>

                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
                  Ứng Tuyển
                </Button>
              </div>
            </GlowCard>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            className="border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary"
          >
            Xem Tất Cả Công Việc
          </Button>
        </div>
      </div>
    </section>
  );
};
