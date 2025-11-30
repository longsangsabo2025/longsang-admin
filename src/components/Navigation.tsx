import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchShortcut } from "@/hooks/useSearchShortcut";
import {
    Bot,
    FileText,
    GraduationCap,
    LogOut,
    Mail,
    Menu,
    Settings,
    Shield,
    Sparkles,
    User,
    X,
    FolderOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchDialog, SearchTrigger } from "./SearchDialog";
import { useAuth } from "./auth/AuthProvider";
import { LoginModal } from "./auth/LoginModal";

// Main navigation links
const mainNavLinks = [
  { name: "Dịch Vụ", href: "#services" },
  { name: "Dự Án", href: "#projects" },
  // { name: "Công Nghệ", href: "#tech-stack" }, // Hidden
  { name: "Liên Hệ", href: "#contact" },
];

// Product links (in dropdown for better organization)
const productLinks = [
  { name: "Dự án", href: "/project-showcase", icon: FileText, description: "Showcase các dự án" },
  { name: "Academy", href: "/academy", icon: GraduationCap, description: "Học viện đào tạo" },
  { name: "AI Marketplace", href: "/marketplace", icon: Sparkles, description: "Chợ AI agents" },
  { name: "My CV", href: "/cv", icon: User, description: "Hồ sơ cá nhân" },
];

// User menu links (when logged in)
const userMenuLinks = [
  { name: "My Agents", href: "/dashboard", icon: Bot },
  { name: "Analytics", href: "/analytics", icon: Settings },
];

// Core system navigation (admin only)
const coreSystemLinks = [
  { name: "Projects", href: "/admin", icon: FolderOpen, description: "Quản lý dự án" },
  { name: "Settings", href: "/admin/settings", icon: Settings, description: "Cấu hình hệ thống" },
];

// Admin menu links (admin only)
const adminMenuLinks = [
  { name: "Workflows", href: "/admin/workflows", icon: Bot },
  { name: "Analytics", href: "/admin/analytics", icon: Shield },
  { name: "Automation", href: "/automation", icon: Settings },
];

export const Navigation = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Global search shortcut
  useSearchShortcut(() => setSearchOpen(true));

  // Real auth state from AuthProvider
  const { user, signOut } = useAuth();
  const isAuthenticated = !!user;

  // Get user info from metadata
  const userRole = user?.user_metadata?.role as "user" | "admin" | undefined;
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  // Scroll effect for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = document.querySelectorAll("section[id]");
    for (const section of sections) {
      observer.observe(section);
    }

    return () => {
      for (const section of sections) {
        observer.unobserve(section);
      }
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    // Check if it's a route (starts with /)
    if (href?.startsWith("/")) {
      navigate(href);
      setIsMenuOpen(false);
      return;
    }

    // Otherwise it's an anchor link
    if (href) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    setLoginOpen(true);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isLinkActive = (href: string) => {
    if (href.startsWith("#")) {
      return activeSection === href.substring(1);
    }
    return false;
  };

  return (
    <>
      {/* Modern Header with better spacing */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/98 backdrop-blur-xl shadow-lg border-b border-border/50"
            : "bg-background/95 backdrop-blur-md border-b border-border/10"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="h-16 md:h-18 lg:h-20 flex items-center justify-between gap-4">
            {/* Logo - Enhanced */}
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, "#home")}
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-all"></div>
                <div className="relative text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  LS
                </div>
              </div>
            </a>

            {/* Desktop Navigation - Clean & Spacious */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {/* Main Navigation Links */}
              {mainNavLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isLinkActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                  `}
                >
                  {link.name}
                </a>
              ))}

              {/* Core System Navigation - Always Show */}
              {coreSystemLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Button
                    key={link.href}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(link.href)}
                    className="gap-2 text-sm font-medium"
                  >
                    <IconComponent className="w-4 h-4" />
                    {link.name}
                  </Button>
                );
              })}

              {/* Products Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Sparkles className="w-4 h-4" />
                    Sản phẩm
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  {productLinks.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <DropdownMenuItem
                        key={link.href}
                        onClick={() => navigate(link.href)}
                        className="flex-col items-start py-3"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <IconComponent className="w-4 h-4 text-primary" />
                          <span className="font-medium">{link.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 ml-6">
                          {link.description}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search */}
              <SearchTrigger onClick={() => setSearchOpen(true)} />

              {/* Language Switcher */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {/* Consultation CTA */}
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/consultation")}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden lg:inline">Tư vấn</span>
              </Button>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      <span className="hidden md:inline max-w-[100px] truncate">{userName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      {userRole && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize">
                          {userRole}
                        </span>
                      )}
                    </div>
                    <DropdownMenuSeparator />

                    {userMenuLinks.map((link) => {
                      const IconComponent = link.icon;
                      return (
                        <DropdownMenuItem key={link.href} onClick={() => navigate(link.href)}>
                          <IconComponent className="w-4 h-4 mr-2" />
                          {link.name}
                        </DropdownMenuItem>
                      );
                    })}

                    {/* Admin Links */}
                    {userRole === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin Tools</p>
                        </div>
                        {adminMenuLinks.map((link) => {
                          const IconComponent = link.icon;
                          return (
                            <DropdownMenuItem key={link.href} onClick={() => navigate(link.href)}>
                              <IconComponent className="w-4 h-4 mr-2" />
                              {link.name}
                            </DropdownMenuItem>
                          );
                        })}
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleLogin} size="sm" variant="outline">
                  Đăng nhập
                </Button>
              )}

              {/* Mobile Menu Toggle - Ensure min 44x44px touch target */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden min-h-[44px] min-w-[44px] p-3"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Mobile/Tablet Menu with smooth animations */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in">
          {/* Backdrop with fade-in */}
          <button
            type="button"
            className="absolute inset-0 bg-background/98 backdrop-blur-xl cursor-default transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />

          {/* Menu Content - Scrollable with slide-in animation */}
          <div className="relative h-full overflow-y-auto animate-slide-in-right">
            <div className="min-h-full flex flex-col px-6 py-20 will-change-transform">
              {/* Logo Section */}
              <div className="mb-8 animate-slide-up opacity-0 animate-delay-[0.1s]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    LS
                  </div>
                  <div className="text-lg font-semibold text-foreground">Long Sang</div>
                </div>
                <p className="text-sm text-muted-foreground">AI Automation & Development</p>
              </div>

              {/* Navigation Links with staggered animation */}
              <div className="space-y-2 mb-8">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 animate-slide-up opacity-0 animate-delay-[0.15s]">
                  Menu chính
                </div>
                {mainNavLinks.map((link, index) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`
                      block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
                      hover:scale-[1.02] hover:shadow-md
                      animate-slide-up opacity-0 will-change-transform
                      ${
                        isLinkActive(link.href)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent"
                      }
                    `}
                    style={{
                      animationDelay: `${0.2 + index * 0.05}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              {/* Core System Section - Admin Only */}
              {userRole === "admin" && (
                <div className="space-y-2 mb-8">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Hệ thống
                  </div>
                  {coreSystemLinks.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <button
                        key={link.href}
                        onClick={() => {
                          navigate(link.href);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-primary" />
                          <div>
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {link.name}
                            </div>
                            <div className="text-xs text-muted-foreground">{link.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Products Section */}
              <div className="space-y-2 mb-8">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Sản phẩm
                </div>
                {productLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <button
                      key={link.href}
                      onClick={() => {
                        navigate(link.href);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {link.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{link.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="space-y-3 mt-auto pt-8 border-t border-border">
                {/* Language Switcher */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Ngôn ngữ</span>
                  <LanguageSwitcher />
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => {
                    navigate("/consultation");
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                  size="lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Đặt lịch tư vấn
                </Button>

                {/* Auth Section */}
                {isAuthenticated ? (
                  <div className="space-y-2 pt-4">
                    <div className="px-4 py-2 bg-accent/50 rounded-lg">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      {userRole && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize">
                          {userRole}
                        </span>
                      )}
                    </div>

                    {userMenuLinks.map((link) => {
                      const IconComponent = link.icon;
                      return (
                        <Button
                          key={link.href}
                          variant="ghost"
                          onClick={() => {
                            navigate(link.href);
                            setIsMenuOpen(false);
                          }}
                          className="w-full justify-start"
                        >
                          <IconComponent className="w-4 h-4 mr-2" />
                          {link.name}
                        </Button>
                      );
                    })}

                    {userRole === "admin" && (
                      <>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 pt-4 pb-2">
                          Admin Tools
                        </div>
                        {adminMenuLinks.map((link) => {
                          const IconComponent = link.icon;
                          return (
                            <Button
                              key={link.href}
                              variant="ghost"
                              onClick={() => {
                                navigate(link.href);
                                setIsMenuOpen(false);
                              }}
                              className="w-full justify-start"
                            >
                              <IconComponent className="w-4 h-4 mr-2" />
                              {link.name}
                            </Button>
                          );
                        })}
                      </>
                    )}

                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleLogin} variant="outline" className="w-full" size="lg">
                    Đăng nhập
                  </Button>
                )}

                {/* Contact */}
                <a
                  href="mailto:contact@longsang.org"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                >
                  <Mail className="w-4 h-4" />
                  contact@longsang.org
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Login Modal */}
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={() => {
          // Redirect to user dashboard after successful login
          navigate("/dashboard");
        }}
      />
    </>
  );
};
