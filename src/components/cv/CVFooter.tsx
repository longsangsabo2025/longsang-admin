import { Linkedin, Mail, Phone, Download, Heart, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CVFooter = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-heading font-bold text-gradient-gold">VÕ LONG SANG</h3>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Petroleum Refining Engineer & Business Development Specialist
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'About', 'Experience', 'Contact'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-foreground-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-foreground-secondary">
              <li>Engineering Consultation</li>
              <li>Business Development</li>
              <li>Operations Management</li>
              <li>Strategic Advisory</li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Connect</h4>
            <div className="flex gap-3 mb-4">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground-secondary hover:text-primary hover:border-primary transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:longsangsabo@gmail.com"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground-secondary hover:text-primary hover:border-primary transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="tel:+84961167717"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground-secondary hover:text-primary hover:border-primary transition-all"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
              <Download className="w-4 h-4 mr-2" />
              Download CV
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-foreground-secondary text-center md:text-left">
              © 2025 Võ Long Sang. All rights reserved.
            </p>
            <p className="text-sm text-foreground-secondary flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-destructive fill-current" /> and{' '}
              <Coffee className="w-4 h-4" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CVFooter;
