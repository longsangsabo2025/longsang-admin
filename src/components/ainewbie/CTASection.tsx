import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import aiBrain from "@/assets/ainewbie/ai-brain.jpg";

export const CTASection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-tech-darker via-background to-tech-dark" />
      <div className="absolute inset-0 cyber-grid opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-glow-cyan/10 rounded-full blur-3xl" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            {/* AI Brain Image */}
            <div className="w-48 h-48 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <img
                src={aiBrain}
                alt="AI Brain"
                className="relative w-full h-full object-cover rounded-full glow-box"
              />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Sẵn Sàng Bắt Đầu <span className="glow-text">Hành Trình AI?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Tham gia cộng đồng AI Việt Nam và khám phá tiềm năng vô hạn của công nghệ trí tuệ nhân tạo
            </p>
          </div>

          {/* CTA Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-lg p-8 glow-border hover:scale-105 transition-transform">
              <h3 className="text-2xl font-bold mb-3 text-foreground">Dành Cho Doanh Nghiệp</h3>
              <p className="text-muted-foreground mb-6">
                Khám phá các giải pháp AI tùy chỉnh và dịch vụ tư vấn chuyên nghiệp
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] group">
                Yêu Cầu Tư Vấn
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-lg p-8 glow-border hover:scale-105 transition-transform">
              <h3 className="text-2xl font-bold mb-3 text-foreground">Dành Cho Cá Nhân</h3>
              <p className="text-muted-foreground mb-6">
                Tham gia cộng đồng, chia sẻ workflows và tìm kiếm cơ hội việc làm
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] group">
                Đăng Ký Ngay
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-card/30 backdrop-blur-sm border border-primary/20 rounded-lg p-8 glow-box">
            <h3 className="text-xl font-bold mb-3 text-center text-foreground">
              Nhận Tin Tức Mới Nhất
            </h3>
            <p className="text-center text-muted-foreground mb-6">
              Đăng ký để nhận các cập nhật mới nhất về AI, workflows và công việc
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Email của bạn"
                className="flex-grow bg-background/50 border-primary/30 focus:border-primary"
              />
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
                Đăng Ký
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
