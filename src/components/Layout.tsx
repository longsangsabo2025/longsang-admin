import { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";
import { ScrollToTop } from "./ScrollToTop";
import { CopilotBridge } from "./copilot/CopilotBridge";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs />
        </div>
        {children}
      </main>
      <Footer />
      <ScrollToTop />
      <CopilotBridge />
    </div>
  );
};
