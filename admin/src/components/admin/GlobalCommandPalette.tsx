import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  group: string;
  title: string;
  href: string;
  icon: string;
  keywords: string[];
}

interface RecentEntry {
  title: string;
  href: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: NavItem[] = [
  {
    group: 'Quick Actions',
    title: 'Tạo Video Mới',
    href: '/admin/video-factory?tab=create',
    icon: '🎬',
    keywords: ['video', 'tạo', 'create', 'new'],
  },
  {
    group: 'Quick Actions',
    title: 'Tạo Pipeline Mới',
    href: '/admin/pipeline-builder?view=builder',
    icon: '🔧',
    keywords: ['pipeline', 'tạo', 'create', 'builder'],
  },
  {
    group: 'Quick Actions',
    title: 'Viết Bài Mới',
    href: '/admin/content-queue?tab=create',
    icon: '✍️',
    keywords: ['bài', 'viết', 'content', 'write', 'post'],
  },
  {
    group: 'Quick Actions',
    title: 'Check Health',
    href: '/admin/services-health',
    icon: '🏥',
    keywords: ['health', 'status', 'kiểm tra'],
  },
  {
    group: 'Quick Actions',
    title: 'Mở AI Chat',
    href: '/admin/ai-workspace',
    icon: '💬',
    keywords: ['ai', 'chat', 'trò chuyện'],
  },
];

// ---------------------------------------------------------------------------
// Navigation Items (with search keywords)
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  // Command
  {
    group: 'Command',
    title: 'Mission Control',
    href: '/admin/mission-control',
    icon: '🎯',
    keywords: ['dashboard', 'home', 'trang chủ', 'tổng quan'],
  },
  {
    group: 'Command',
    title: 'Dự Án',
    href: '/admin/command-center',
    icon: '🏠',
    keywords: ['project', 'dự án', 'quản lý'],
  },
  {
    group: 'Command',
    title: 'Survival Mode',
    href: '/admin/survival',
    icon: '⚡',
    keywords: ['survival', 'khẩn cấp', 'emergency', 'focus'],
  },
  {
    group: 'Command',
    title: 'Ideas',
    href: '/admin/ideas',
    icon: '💡',
    keywords: ['idea', 'ý tưởng', 'brainstorm'],
  },
  {
    group: 'Command',
    title: 'Bảng Điều Khiển',
    href: '/admin',
    icon: '📊',
    keywords: ['dashboard', 'bảng', 'điều khiển', 'overview'],
  },
  {
    group: 'Command',
    title: 'Agent Registry',
    href: '/admin/agent-registry',
    icon: '🤖',
    keywords: ['agent', 'registry', 'bot', 'đăng ký'],
  },
  {
    group: 'Command',
    title: 'Revenue',
    href: '/admin/revenue',
    icon: '💰',
    keywords: ['revenue', 'doanh thu', 'money', 'tiền', 'income'],
  },
  // YouTube & Video
  {
    group: 'YouTube & Video',
    title: 'YouTube Channels',
    href: '/admin/youtube-channels',
    icon: '📺',
    keywords: ['video', 'channel', 'youtube', 'kênh'],
  },
  {
    group: 'YouTube & Video',
    title: 'Pipeline Studio',
    href: '/admin/pipeline-builder',
    icon: '🔧',
    keywords: ['pipeline', 'studio', 'workflow', 'quy trình'],
  },
  {
    group: 'YouTube & Video',
    title: 'Video Factory',
    href: '/admin/video-factory',
    icon: '🎬',
    keywords: ['video', 'factory', 'render', 'sản xuất'],
  },
  // AI Tools
  {
    group: 'AI Tools',
    title: 'AI Brain',
    href: '/admin/brain',
    icon: '🧠',
    keywords: ['brain', 'knowledge', 'second brain', 'kiến thức', 'não'],
  },
  {
    group: 'AI Tools',
    title: 'AI Workspace',
    href: '/admin/ai-workspace',
    icon: '💻',
    keywords: ['workspace', 'ai', 'chat', 'trợ lý'],
  },
  {
    group: 'AI Tools',
    title: 'Brand & Publish',
    href: '/admin/brand',
    icon: '👑',
    keywords: ['brand', 'publish', 'thương hiệu', 'xuất bản'],
  },
  {
    group: 'AI Tools',
    title: 'AI Command Center',
    href: '/admin/ai-center',
    icon: '🎮',
    keywords: ['ai', 'command', 'center', 'trung tâm'],
  },
  {
    group: 'AI Tools',
    title: 'AI Cost',
    href: '/admin/ai-cost',
    icon: '💵',
    keywords: ['cost', 'chi phí', 'token', 'usage', 'billing'],
  },
  // Marketing
  {
    group: 'Marketing',
    title: 'Social Hub',
    href: '/admin/social-media',
    icon: '📱',
    keywords: ['facebook', 'zalo', 'social', 'mạng xã hội', 'tiktok'],
  },
  {
    group: 'Marketing',
    title: 'Content & SEO',
    href: '/admin/content-queue',
    icon: '📝',
    keywords: ['content', 'seo', 'bài viết', 'nội dung', 'queue'],
  },
  {
    group: 'Marketing',
    title: 'Analytics',
    href: '/admin/unified-analytics',
    icon: '📈',
    keywords: ['analytics', 'thống kê', 'metrics', 'report', 'báo cáo'],
  },
  // System
  {
    group: 'Hệ Thống',
    title: 'Services Health',
    href: '/admin/services-health',
    icon: '🏥',
    keywords: ['health', 'service', 'status', 'sức khỏe'],
  },
  {
    group: 'Hệ Thống',
    title: 'Heartbeat',
    href: '/admin/heartbeat',
    icon: '💓',
    keywords: ['heartbeat', 'pulse', 'monitor', 'nhịp'],
  },
  {
    group: 'Hệ Thống',
    title: 'Files & Library',
    href: '/admin/library',
    icon: '📚',
    keywords: ['file', 'library', 'thư viện', 'tài liệu'],
  },
  {
    group: 'Hệ Thống',
    title: 'Settings',
    href: '/admin/settings',
    icon: '⚙️',
    keywords: ['settings', 'cài đặt', 'config', 'cấu hình'],
  },
  {
    group: 'Hệ Thống',
    title: 'Travis AI',
    href: '/admin/travis',
    icon: '🤖',
    keywords: ['travis', 'ai', 'assistant', 'trợ lý'],
  },
  {
    group: 'Hệ Thống',
    title: 'Database',
    href: '/admin/database-schema',
    icon: '🗄️',
    keywords: ['database', 'db', 'schema', 'dữ liệu'],
  },
  {
    group: 'Hệ Thống',
    title: 'Users',
    href: '/admin/users',
    icon: '👥',
    keywords: ['user', 'người dùng', 'account', 'tài khoản'],
  },
];

const NAV_GROUPS = [...new Set(NAV_ITEMS.map((item) => item.group))];

// ---------------------------------------------------------------------------
// Recent helpers
// ---------------------------------------------------------------------------

const RECENT_KEY = 'command-palette-recent';
const MAX_RECENT = 5;

function loadRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(entry: RecentEntry) {
  const list = loadRecent().filter((r) => r.href !== entry.href);
  list.unshift(entry);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

// Build a searchable value string for cmdk filtering
function searchValue(item: NavItem): string {
  return [item.title, item.group, ...item.keywords, item.href].join(' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Load recent on open
  useEffect(() => {
    if (open) setRecent(loadRecent());
  }, [open]);

  // Track navigation to save recent pages
  useEffect(() => {
    const path = location.pathname;
    if (path === prevPathRef.current) return;
    prevPathRef.current = path;

    const match =
      NAV_ITEMS.find((n) => n.href === path) ??
      QUICK_ACTIONS.find((n) => n.href.split('?')[0] === path);
    if (match) {
      saveRecent({ title: match.title, href: match.href, icon: match.icon });
    }
  }, [location.pathname]);

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback(
    (href: string, title: string, icon: string) => {
      saveRecent({ title, href, icon });
      navigate(href);
      setOpen(false);
    },
    [navigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Tìm trang, hành động..." />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả nào.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="⚡ Quick Actions">
          {QUICK_ACTIONS.map((item) => (
            <CommandItem
              key={item.href}
              value={searchValue(item)}
              onSelect={() => handleSelect(item.href, item.title, item.icon)}
            >
              <span className="mr-2">{item.icon}</span>
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Recent */}
        {recent.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="🕒 Recent">
              {recent.map((entry) => (
                <CommandItem
                  key={`recent-${entry.href}`}
                  value={`recent ${entry.title} ${entry.href}`}
                  onSelect={() => handleSelect(entry.href, entry.title, entry.icon)}
                  className={location.pathname === entry.href ? 'bg-accent' : ''}
                >
                  <span className="mr-2">{entry.icon}</span>
                  {entry.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Navigation groups */}
        {NAV_GROUPS.map((group) => (
          <CommandGroup key={group} heading={group}>
            {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
              <CommandItem
                key={item.href}
                value={searchValue(item)}
                onSelect={() => handleSelect(item.href, item.title, item.icon)}
                className={location.pathname === item.href ? 'bg-accent' : ''}
              >
                <span className="mr-2">{item.icon}</span>
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>

      {/* Keyboard hint */}
      <div className="border-t px-3 py-2 text-xs text-muted-foreground text-center">
        ↵ để chọn • Esc để đóng
      </div>
    </CommandDialog>
  );
}
