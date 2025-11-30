import { GlowCard } from '@/components/ui/glow-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, GitBranch, Zap, Share2 } from 'lucide-react';
import workflowNetwork from '@/assets/ainewbie/workflow-network.jpg';

const workflows = [
  {
    title: 'Email Marketing Automation',
    author: 'Nguyễn Văn A',
    downloads: '1.2K',
    category: 'Marketing',
  },
  {
    title: 'Data Analysis Pipeline',
    author: 'Trần Thị B',
    downloads: '856',
    category: 'Data Science',
  },
  {
    title: 'Customer Support Bot',
    author: 'Lê Văn C',
    downloads: '2.1K',
    category: 'Customer Service',
  },
];

export const WorkflowSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-tech-dark to-background" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden glow-box">
              <img src={workflowNetwork} alt="Workflow Network" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent" />
            </div>

            {/* Floating stats */}
            <div className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-sm p-4 rounded-lg glow-border">
              <div className="flex items-center gap-3">
                <GitBranch className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-primary">1.2K+</div>
                  <div className="text-xs text-muted-foreground">Active Workflows</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Chia Sẻ <span className="glow-text">Workflow</span>
                <br />
                Từ Cộng Đồng
              </h2>
              <p className="text-xl text-muted-foreground">
                Khám phá và tải xuống hàng ngàn workflow tự động hóa được chia sẻ bởi cộng đồng AI
                Việt Nam
              </p>
            </div>

            <div className="space-y-4">
              {workflows.map((workflow, index) => (
                <GlowCard
                  key={index}
                  glowIntensity="low"
                  className="hover:scale-105 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground mb-1">{workflow.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>by {workflow.author}</span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-primary" />
                          {workflow.downloads}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          {workflow.category}
                        </span>
                      </div>
                    </div>
                    <Share2 className="w-5 h-5 text-primary" />
                  </div>
                </GlowCard>
              ))}
            </div>

            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] group">
              Xem Tất Cả Workflows
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
