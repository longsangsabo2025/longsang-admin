import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  GitBranch, 
  MessageSquare, 
  FolderOpen, 
  Rocket,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PWAInstallPrompt } from "./PWAInstallPrompt";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { path: "/mobile", icon: Home, label: "Home" },
  { path: "/mobile/git", icon: GitBranch, label: "Git" },
  { path: "/mobile/files", icon: FolderOpen, label: "Files" },
  { path: "/mobile/chat", icon: MessageSquare, label: "AI Chat" },
  { path: "/mobile/deploy", icon: Rocket, label: "Deploy" },
];

export function MobileLayout({ children, title }: MobileLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold">LS</span>
            </div>
            <h1 className="text-lg font-semibold truncate">
              {title || "LongSang Admin"}
            </h1>
          </div>
          <Link to="/mobile/settings" className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 pb-safe">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/mobile" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                  isActive 
                    ? "text-blue-400 bg-blue-500/10" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default MobileLayout;
