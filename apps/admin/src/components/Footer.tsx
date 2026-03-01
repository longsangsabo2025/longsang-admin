import { Linkedin, Github, Twitter, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { nameKey: 'footer.links.home', href: '#home' },
    { nameKey: 'footer.links.about', href: '#about' },
    { nameKey: 'footer.links.projects', href: '#projects' },
    { nameKey: 'footer.links.contact', href: '#contact' },
  ];

  const services = [
    { nameKey: 'footer.servicesList.mobile', href: '#services' },
    { nameKey: 'footer.servicesList.web', href: '#services' },
    { nameKey: 'footer.servicesList.automation', href: '#services' },
    { nameKey: 'footer.servicesList.ai', href: '#services' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0a0f1a] border-t border-border/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-20">
        {/* Top Section - 3 Columns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-12 md:gap-16 mb-12">
          {/* Brand Column */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-3">{t('footer.brand')}</h3>
            <p className="text-base font-medium text-muted-foreground mb-4">
              {t('footer.tagline')}
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground/80 max-w-sm">
              {t('footer.description')}
            </p>

            {/* Social Icons */}
            <div className="flex gap-5 mt-8">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary hover:scale-110 hover:rotate-6 transition-all duration-250"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary hover:scale-110 hover:rotate-6 transition-all duration-250"
                aria-label="GitHub"
              >
                <Github className="w-6 h-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary hover:scale-110 hover:rotate-6 transition-all duration-250"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="mailto:contact@longsang.org"
                className="text-muted-foreground hover:text-primary hover:scale-110 hover:rotate-6 transition-all duration-250"
                aria-label="Email"
              >
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-5">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.nameKey}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-[15px] text-muted-foreground hover:text-primary hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    {t(link.nameKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-5">
              {t('footer.services')}
            </h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.nameKey}>
                  <button
                    onClick={() => scrollToSection(service.href)}
                    className="text-[15px] text-muted-foreground hover:text-primary hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    {t(service.nameKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground/60">
            <p>{t('footer.copyright')}</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                {t('footer.privacy')}
              </a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors duration-200">
                {t('footer.terms')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
