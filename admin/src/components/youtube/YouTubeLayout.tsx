/**
 * 🎬 YouTube Studio Layout
 * Minimal fullscreen layout — no admin sidebar, just a focused topbar.
 * Reuses all existing page components & pipeline services.
 */

import { BarChart3, ChevronLeft, Clapperboard, Settings, Tv, Workflow } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const NAV_ITEMS = [
  { to: '/youtube/channels', label: 'Channels', icon: Tv },
  { to: '/youtube/pipeline', label: 'Pipeline Builder', icon: Workflow },
  { to: '/youtube/factory', label: 'Video Factory', icon: BarChart3 },
  { to: '/youtube/settings', label: 'Settings', icon: Settings },
];

export function YouTubeLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Topbar ── */}
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40 flex items-center px-4 gap-4">
        {/* Back to Admin */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/admin/youtube-channels')}
        >
          <ChevronLeft className="h-4 w-4" />
          Admin
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Brand */}
        <div className="flex items-center gap-2 font-semibold text-red-500">
          <Clapperboard className="h-5 w-5" />
          <span className="hidden sm:inline">YouTube Studio</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Nav tabs */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/youtube/channels'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
