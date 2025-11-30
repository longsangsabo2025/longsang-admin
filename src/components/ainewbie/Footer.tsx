import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative border-t border-primary/20 bg-tech-darker">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-box">
                <span className="text-primary font-bold text-xl">AI</span>
              </div>
              <span className="text-xl font-bold glow-text">AINewbieVN</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nền tảng hàng đầu về AI và tự động hóa tại Việt Nam
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Sản phẩm */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Sản Phẩm</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  AI Solutions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Automation Tools
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  API Services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Custom Development
                </a>
              </li>
            </ul>
          </div>

          {/* Cộng đồng */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Cộng Đồng</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Workflows
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Forum
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Events
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Công ty */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Công Ty</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Về Chúng Tôi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tuyển Dụng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Liên Hệ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Điều Khoản
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 AINewbieVN. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
