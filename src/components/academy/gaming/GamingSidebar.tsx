import { 
  BookOpen, 
  Flag, 
  Star, 
  Bookmark, 
  Trophy, 
  BarChart3, 
  Search, 
  Cpu, 
  Code, 
  Palette, 
  Database, 
  Link, 
  Smartphone, 
  Rocket, 
  Mail, 
  Users, 
  MessageSquare, 
  Gift, 
  Settings, 
  HelpCircle, 
  GraduationCap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const myLearningItems = [
  { icon: Flag, label: "In Progress", badge: "3", active: true },
  { icon: Star, label: "Completed", badge: "12" },
  { icon: Bookmark, label: "Saved Courses" },
  { icon: Trophy, label: "My Certificates" },
  { icon: BarChart3, label: "Learning Stats" },
];

const categories = [
  { icon: Cpu, label: "AI & Machine Learning", badge: "🔥" },
  { icon: Code, label: "Web Development", badge: "📈" },
  { icon: Palette, label: "UI/UX Design", badge: "⚡" },
  { icon: Database, label: "Data Science", badge: "🆕" },
  { icon: Link, label: "Blockchain & Web3", badge: "💎" },
  { icon: Smartphone, label: "Mobile Development", badge: "✨" },
  { icon: Rocket, label: "Game Development", badge: "🎯" },
  { icon: Mail, label: "Digital Marketing", badge: "💼" },
];

const communityItems = [
  { icon: MessageSquare, label: "Discussions", badge: "234 online" },
  { icon: Trophy, label: "Leaderboard" },
  { icon: Users, label: "Study Groups" },
  { icon: Flag, label: "Challenges" },
  { icon: Gift, label: "Rewards Shop" },
];

export const GamingSidebar = () => {
  return (
    <aside className="fixed left-0 top-[70px] bottom-0 w-[260px] glass-card border-r border-border/50 hidden lg:block">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* My Learning */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <BookOpen className="h-4 w-4" />
              MY LEARNING
            </h3>
            <div className="space-y-1">
              {myLearningItems.map((item) => (
                <Button
                  key={item.label}
                  variant={item.active ? "gaming" : "ghost"}
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/20">
                      {item.badge}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Browse Courses */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <Search className="h-4 w-4" />
              ALL COURSES
            </h3>
            <div className="space-y-1">
              {categories.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-muted/50"
                  size="sm"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="text-xs">{item.badge}</span>
                </Button>
              ))}
              <Button variant="ghost" className="w-full justify-start text-sm text-primary" size="sm">
                + View All Categories
              </Button>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Community Hub */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <Users className="h-4 w-4" />
              COMMUNITY
            </h3>
            <div className="space-y-1">
              {communityItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-muted/50"
                  size="sm"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Additional */}
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Support
            </Button>
            <Button variant="neon" className="w-full justify-start text-sm" size="sm">
              <GraduationCap className="h-4 w-4 mr-2" />
              Become Instructor
            </Button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};
