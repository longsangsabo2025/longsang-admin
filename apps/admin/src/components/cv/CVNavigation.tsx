import { useState, useEffect } from 'react';
import { Menu, X, Download, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const CVNavigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'nav.home', href: '#home' },
    { name: 'nav.about', href: '#about' },
    { name: 'nav.experience', href: '#experience' },
    { name: 'nav.skills', href: '#skills' },
    { name: 'nav.education', href: '#education' },
    { name: 'nav.contact', href: '#contact' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'backdrop-glass border-b border-border shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('#home');
              }}
              className="text-2xl font-heading font-bold text-gradient-gold hover:glow-gold transition-all"
            >
              VLS
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.href);
                  }}
                  className="relative text-sm font-medium text-foreground hover:text-primary transition-all group"
                >
                  {t(link.name)}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <a
                href="tel:+84961167717"
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4" />
                +84 961 167 717
              </a>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                <Download className="w-4 h-4 mr-2" />
                {t('buttons.downloadCV')}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-background/95 backdrop-blur-lg pt-20">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.href);
                  }}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  {t(link.name)}
                </a>
              ))}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-center mb-4">
                  <LanguageSwitcher />
                </div>
                <a
                  href="tel:+84961167717"
                  className="flex items-center gap-2 text-foreground-secondary hover:text-primary transition-colors mb-4"
                >
                  <Phone className="w-5 h-5" />
                  +84 961 167 717
                </a>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Download className="w-4 h-4 mr-2" />
                  {t('buttons.downloadCV')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CVNavigation;
