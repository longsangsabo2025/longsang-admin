import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Separator } from '@/components/ui/separator';
import { useSidebarFavorites } from '@/hooks/useSidebarFavorites';

interface SidebarFavoritesProps {
  collapsed: boolean;
  onNavigate: (href: string) => void;
}

export function SidebarFavorites({ collapsed, onNavigate }: SidebarFavoritesProps) {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useSidebarFavorites();

  const handleClick = (href: string) => {
    navigate(href);
    onNavigate(href);
  };

  if (favorites.length === 0) {
    return (
      <>
        <div
          className={`px-3 py-3 text-center transition-all duration-300 ${collapsed ? 'lg:px-1' : ''}`}
        >
          {collapsed ? (
            <span className="text-muted-foreground text-lg" title="Pin trang hay dùng">
              ⭐
            </span>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">⭐ Pin trang hay dùng</p>
              <p className="text-[10px] text-muted-foreground/60">Nhấn ⭐ trong menu chuột phải</p>
            </div>
          )}
        </div>
        <Separator className="mb-4" />
      </>
    );
  }

  return (
    <>
      <div className={`mb-1 transition-all duration-300 ${collapsed ? 'lg:px-1' : 'px-3'}`}>
        <h3
          className={`text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2 ${collapsed ? 'lg:hidden' : ''}`}
        >
          ⭐ Ghim
        </h3>
        {collapsed && <div className="hidden lg:block w-2 h-2 rounded-full mx-auto bg-amber-500" />}
      </div>

      <div className="space-y-0.5 px-3">
        {favorites.map((fav) => (
          <ContextMenu key={fav.href}>
            <ContextMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full gap-2 h-8 transition-all duration-300 hover:bg-amber-500/10 ${
                  collapsed ? 'lg:justify-center lg:px-2' : 'justify-start'
                }`}
                onClick={() => handleClick(fav.href)}
                title={collapsed ? fav.title : undefined}
              >
                <span className="text-sm shrink-0">{fav.icon}</span>
                <span
                  className={`text-sm font-medium truncate text-left transition-all duration-300 ${collapsed ? 'lg:hidden' : ''}`}
                >
                  {fav.title}
                </span>
              </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => removeFavorite(fav.href)}
              >
                📌 Bỏ ghim
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      <Separator className="my-4" />
    </>
  );
}
