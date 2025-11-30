import { GlowCard } from "@/components/ui/glow-card";
import { Cpu, Network, Briefcase, Users } from "lucide-react";

const services = [
  {
    icon: Cpu,
    title: "Sản Phẩm Số AI",
    description: "Các giải pháp AI tùy chỉnh, automation tools, và sản phẩm số tiên tiến phục vụ doanh nghiệp",
    features: ["Custom AI Models", "Automation Tools", "API Integration"]
  },
  {
    icon: Network,
    title: "Workflow Automation",
    description: "Chia sẻ và khám phá các workflow tự động hóa từ cộng đồng AI Việt Nam",
    features: ["Community Sharing", "Ready-to-use Templates", "Custom Workflows"]
  },
  {
    icon: Briefcase,
    title: "Dịch Vụ Tư Vấn",
    description: "Tư vấn chuyên sâu về tích hợp AI, chuyển đổi số và tối ưu quy trình doanh nghiệp",
    features: ["AI Strategy", "Digital Transformation", "Process Optimization"]
  },
  {
    icon: Users,
    title: "Tuyển Dụng & Job Board",
    description: "Kết nối nhân tài AI với các cơ hội việc làm hàng đầu trong lĩnh vực công nghệ",
    features: ["Job Posting", "Talent Matching", "Career Development"]
  }
];

export const ServicesSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="glow-text">Dịch Vụ</span> Của Chúng Tôi
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Giải pháp toàn diện cho doanh nghiệp và cộng đồng AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <GlowCard key={index} className="group hover:scale-105 transition-transform duration-300">
              <div className="flex flex-col h-full">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors glow-box">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-foreground">{service.title}</h3>
                <p className="text-muted-foreground mb-4 flex-grow">{service.description}</p>
                
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-primary/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary glow-box" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  );
};
