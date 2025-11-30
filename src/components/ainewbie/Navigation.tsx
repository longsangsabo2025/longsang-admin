import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Trang Chủ", href: "#home" },
    { label: "Dịch Vụ", href: "#services" },
    { label: "Workflows", href: "#workflows" },
    { label: "Công Việc", href: "#jobs" },
    { label: "Liên Hệ", href: "#contact" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-box">
              <span className="text-primary font-bold text-xl">AI</span>
            </div>
            <span className="text-xl font-bold glow-text">AINewbieVN</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" className="border-primary/50 text-foreground hover:bg-primary/10">
              Đăng Nhập
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
              Đăng Ký
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary/20">
            <div className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-foreground/80 hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-primary/20">
                <Button variant="outline" className="w-full border-primary/50">
                  Đăng Nhập
                </Button>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Đăng Ký
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
