import { ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AnimatedCollapseButton,
  CompactToggle,
  SidebarCollapseToggle,
} from '@/components/ui/sidebar-collapse-toggle';
import { useSidebarFavorites } from '@/hooks/useSidebarFavorites';
import { adminNavGroups, NAV_EMOJI } from './admin-nav.config';
import { SidebarFavorites } from './SidebarFavorites';

interface AdminSidebarProps {
  open: boolean;
  collapsed: boolean;
  expandedGroups: Record<string, boolean>;
  onToggleCollapse: () => void;
  onClose: () => void;
  onToggleGroup: (label: string) => void;
}

export const AdminSidebar = ({
  open,
  collapsed,
  expandedGroups,
  onToggleCollapse,
  onClose,
  onToggleGroup,
}: AdminSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite } = useSidebarFavorites();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background 
        transition-all duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${collapsed ? 'lg:w-16' : 'lg:w-64'}
        w-64
      `}
    >
      {/* Floating Collapse Toggle Button - hiện ở cạnh sidebar */}
      <SidebarCollapseToggle
        isCollapsed={collapsed}
        onToggle={onToggleCollapse}
        variant="floating"
        position="middle"
        className="hidden lg:flex"
      />

      <ScrollArea className="h-full py-6 px-3">
        {/* Favorites / Pinned items */}
        <SidebarFavorites collapsed={collapsed} onNavigate={onClose} />

        <div className="space-y-4">
          {adminNavGroups.map((group) => (
            <div key={group.label}>
              {/* Group Label */}
              <div
                className={`px-3 mb-2 transition-all duration-300 ${collapsed ? 'lg:px-1 lg:text-center' : ''}`}
              >
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider ${group.color} ${collapsed ? 'lg:hidden' : ''}`}
                >
                  {group.label}
                </h3>
                {/* Collapsed: show dot indicator */}
                {collapsed && (
                  <div
                    className={`hidden lg:block w-2 h-2 rounded-full mx-auto ${group.color.replace('text-', 'bg-')}`}
                  />
                )}
              </div>

              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const pinned = isFavorite(item.href);

                  return (
                    <ContextMenu key={item.href}>
                      <ContextMenuTrigger asChild>
                        <Button
                          variant={active ? 'secondary' : 'ghost'}
                          className={`w-full gap-3 transition-all duration-300 ${
                            active ? 'bg-secondary' : group.bgColor
                          } ${collapsed ? 'lg:justify-center lg:px-2' : 'justify-start'}`}
                          onClick={() => {
                            navigate(item.href);
                            onClose();
                          }}
                          title={collapsed ? item.title : undefined}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${active ? '' : group.color}`} />
                          <span
                            className={`text-sm font-medium flex-1 text-left transition-all duration-300 ${collapsed ? 'lg:hidden' : ''}`}
                          >
                            {item.title}
                          </span>
                          {pinned && !collapsed && (
                            <span className="text-[10px] opacity-50">📌</span>
                          )}
                          {item.badge && !collapsed && (
                            <span
                              className={`ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full lg:block hidden ${
                                active
                                  ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                                  : 'bg-green-500/10 text-green-600 dark:text-green-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Button>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() =>
                            toggleFavorite({
                              href: item.href,
                              title: item.title,
                              icon: NAV_EMOJI[item.href] || '📄',
                            })
                          }
                        >
                          {pinned ? '📌 Bỏ ghim' : '⭐ Ghim trang này'}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}

                {/* More Items Toggle */}
                {group.moreItems && group.moreItems.length > 0 && !collapsed && (
                  <>
                    <Button
                      variant="ghost"
                      className={`w-full gap-2 justify-start text-muted-foreground hover:text-foreground text-xs h-7 ${collapsed ? 'lg:hidden' : ''}`}
                      onClick={() => onToggleGroup(group.label)}
                    >
                      <ChevronRight
                        className={`h-3 w-3 transition-transform duration-200 ${
                          expandedGroups[group.label] ? 'rotate-90' : ''
                        }`}
                      />
                      <span>
                        {expandedGroups[group.label]
                          ? 'Ẩn bớt'
                          : `Thêm ${group.moreItems.length} mục...`}
                      </span>
                    </Button>
                    {expandedGroups[group.label] &&
                      group.moreItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Button
                            key={item.href}
                            variant={active ? 'secondary' : 'ghost'}
                            className={`w-full gap-3 transition-all duration-300 ${
                              active ? 'bg-secondary' : group.bgColor
                            } justify-start pl-6 opacity-80 hover:opacity-100`}
                            onClick={() => {
                              navigate(item.href);
                              onClose();
                            }}
                          >
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? '' : group.color}`} />
                            <span className="text-sm font-medium flex-1 text-left">
                              {item.title}
                            </span>
                          </Button>
                        );
                      })}
                  </>
                )}
              </div>

              {/* Separator between groups (except last) */}
              {group.label !== adminNavGroups.at(-1)?.label && <Separator className="my-4" />}
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Quick Stats - ẩn khi collapsed */}
        <div
          className={`px-3 space-y-2 transition-all duration-300 ${collapsed ? 'lg:hidden' : ''}`}
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Thống Kê Nhanh</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quy Trình Hoạt Động</span>
              <span className="font-semibold">15</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AI Agents</span>
              <span className="font-semibold">4</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Thực Thi Hôm Nay</span>
              <span className="font-semibold text-green-600">127</span>
            </div>
          </div>
        </div>

        {/* Collapse Toggle Button at Bottom */}
        <div className={`mt-4 px-2 hidden lg:block`}>
          {collapsed ? (
            <CompactToggle isCollapsed={collapsed} onToggle={onToggleCollapse} />
          ) : (
            <AnimatedCollapseButton
              isCollapsed={collapsed}
              onToggle={onToggleCollapse}
              label="Thu gọn menu"
            />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
