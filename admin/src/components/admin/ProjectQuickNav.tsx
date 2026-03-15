import {
  Bot,
  ChevronDown,
  ExternalLink,
  FolderOpen,
  Gamepad2,
  GraduationCap,
  Home,
  LayoutDashboard,
  Music,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectQuickNavProps {
  onNavigate: (path: string) => void;
}

export const ProjectQuickNav = ({ onNavigate }: ProjectQuickNavProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">Dự Án</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Chuyển Nhanh Dự Án
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* SABO Ecosystem */}
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase flex items-center gap-2">
          🎱 SABO Ecosystem
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => onNavigate('/admin/p/sabo-arena')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-green-500/10 text-green-500">
            <Gamepad2 className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">SABO Arena</div>
            <div className="text-xs text-muted-foreground">Billiards Platform</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => onNavigate('/admin/p/sabo-hub')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-green-500/10 text-green-500">
            <Home className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">SABO Hub</div>
            <div className="text-xs text-muted-foreground">Central Hub</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => onNavigate('/admin/p/sabo-billiards')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-green-500/10 text-green-500">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">SABO Billiards</div>
            <div className="text-xs text-muted-foreground">Main Business</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* AI Ecosystem */}
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase flex items-center gap-2">
          🤖 AI Newbie Ecosystem
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => onNavigate('/admin/p/ainewbie-web')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-500/10 text-cyan-500">
            <GraduationCap className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">AI Newbie Web</div>
            <div className="text-xs text-muted-foreground">Learning Platform</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => onNavigate('/admin/p/ai-secretary')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-pink-500/10 text-pink-500">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">AI Secretary</div>
            <div className="text-xs text-muted-foreground">Automation Tool</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Standalone Projects */}
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase flex items-center gap-2">
          📄 Other Projects
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => onNavigate('/admin/p/vungtau-dream-homes')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-orange-500/10 text-orange-500">
            <Home className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">VT Dream Homes</div>
            <div className="text-xs text-muted-foreground">Real Estate</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => onNavigate('/admin/p/music-video-app')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-500/10 text-purple-500">
            <Music className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">Music Video App</div>
            <div className="text-xs text-muted-foreground">Entertainment</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => onNavigate('/admin/projects')}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-500/10 text-slate-500">
            <FolderOpen className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">📂 Tất Cả Dự Án</div>
            <div className="text-xs text-muted-foreground">View all {`>`} 17 projects</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Dev Servers - External Links */}
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
          🚀 Dev Servers (localhost)
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => window.open('http://localhost:5173', '_blank')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10 text-blue-500">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">LongSang Admin</div>
            <div className="text-xs text-muted-foreground">:5173 - This Portal</div>
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => window.open('http://localhost:5174', '_blank')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-green-500/10 text-green-500">
            <Gamepad2 className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">SABO Arena</div>
            <div className="text-xs text-muted-foreground">:5174 - Billiards Platform</div>
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => window.open('http://localhost:5175', '_blank')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-500/10 text-orange-500">
            <Home className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">VT Dream Homes</div>
            <div className="text-xs text-muted-foreground">:5175 - Real Estate</div>
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Production Links */}
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
          🌐 Production
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => window.open('https://longsang.vercel.app', '_blank')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 text-emerald-500">
            <ExternalLink className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">longsang.vercel.app</div>
            <div className="text-xs text-muted-foreground">Production Site</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
