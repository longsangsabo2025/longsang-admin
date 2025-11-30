import { Github, Twitter, Linkedin } from "lucide-react";

export const FooterSection = () => {
  return (
    <footer className="bg-dark-bg border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-foreground font-bold text-xl mb-4 font-display">TravelApp</h3>
            <p className="text-muted-foreground text-sm">
              Your perfect travel companion for exploring the world.
            </p>
          </div>
          
          <div>
            <h4 className="text-foreground font-semibold mb-4 font-display">Product</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Download</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-foreground font-semibold mb-4 font-display">Company</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-foreground font-semibold mb-4 font-display">Legal</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 TravelApp. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
