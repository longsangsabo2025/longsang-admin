import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroHologram from "@/assets/ainewbie/hero-hologram.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden cyber-grid">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-tech-darker via-background to-tech-dark opacity-90" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-glow-cyan/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-glow-blue/20 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm glow-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">AI Technology Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="glow-text">AINewbieVN</span>
              <br />
              <span className="text-foreground/80">Cộng Đồng AI</span>
              <br />
              <span className="text-primary">Việt Nam</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-xl">
              Nền tảng hàng đầu về sản phẩm số AI, workflow tự động hóa, và kết nối nhân tài công nghệ tại Việt Nam
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.5)] group">
                Khám Phá Ngay
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary">
                Tìm Hiểu Thêm
              </Button>
            </div>

            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary glow-text">5000+</div>
                <div className="text-sm text-muted-foreground">Thành viên</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary glow-text">1200+</div>
                <div className="text-sm text-muted-foreground">Workflows</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary glow-text">300+</div>
                <div className="text-sm text-muted-foreground">Dự án</div>
              </div>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden glow-box">
              <img
                src={heroHologram}
                alt="AI Technology Hologram"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 border-2 border-primary/30 rounded-full animate-spin-slow" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 border-2 border-primary/20 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};
