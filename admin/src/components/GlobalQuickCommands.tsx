/**
 * ⌨️ Global Quick Commands (Ctrl+K)
 *
 * Command palette toàn cục với các shortcuts:
 * - /brain search <query> - Tìm kiếm trong Brain
 * - /post <content> - Đăng bài social media
 * - /error - Xem errors mới nhất
 * - /backup - Chạy backup
 * - /ai <assistant> - Chuyển đổi AI assistant
 * - /project <name> - Mở project
 */

import {
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  Bug,
  Calendar,
  Clock,
  Database,
  DollarSign,
  FileText,
  Folder,
  Globe,
  Home,
  Lightbulb,
  MessageSquare,
  Newspaper,
  Search,
  Send,
  Settings,
  Sparkles,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';

interface QuickCommand {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
  keywords?: string[];
  group: 'navigation' | 'actions' | 'ai' | 'projects';
}

export function GlobalQuickCommands() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle với Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Alternative: Ctrl+/ hoặc Ctrl+Space
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input khi mở
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Navigation commands
  const navigationCommands: QuickCommand[] = [
    {
      id: 'home',
      label: 'Dashboard',
      shortcut: '⌘D',
      icon: Home,
      action: () => navigate('/admin'),
      keywords: ['home', 'main', 'dashboard', 'trang chủ'],
      group: 'navigation',
    },
    {
      id: 'brain',
      label: 'AI Second Brain',
      shortcut: '⌘B',
      icon: Brain,
      action: () => navigate('/admin/brain'),
      keywords: ['brain', 'knowledge', 'memory', 'não'],
      group: 'navigation',
    },
    {
      id: 'ai-workspace',
      label: 'AI Workspace',
      shortcut: '⌘W',
      icon: Sparkles,
      action: () => navigate('/admin/ai-workspace'),
      keywords: ['ai', 'workspace', 'assistant', 'trợ lý'],
      group: 'navigation',
    },
    {
      id: 'bug-system',
      label: 'Bug System',
      shortcut: '⌘E',
      icon: Bug,
      action: () => navigate('/admin/bug-system'),
      keywords: ['bug', 'error', 'lỗi', 'tracking'],
      group: 'navigation',
    },
    {
      id: 'social-media',
      label: 'Social Media',
      icon: Globe,
      action: () => navigate('/admin/social'),
      keywords: ['social', 'facebook', 'instagram', 'mạng xã hội'],
      group: 'navigation',
    },
    {
      id: 'seo-center',
      label: 'SEO Center',
      icon: Search,
      action: () => navigate('/admin/seo'),
      keywords: ['seo', 'google', 'ranking'],
      group: 'navigation',
    },
    {
      id: 'backup',
      label: 'Backup Manager',
      icon: Database,
      action: () => navigate('/admin/backup'),
      keywords: ['backup', 'restore', 'sao lưu'],
      group: 'navigation',
    },
    {
      id: 'settings',
      label: 'Settings',
      shortcut: '⌘,',
      icon: Settings,
      action: () => navigate('/admin/settings'),
      keywords: ['settings', 'config', 'cài đặt'],
      group: 'navigation',
    },
    {
      id: 'ideas-page',
      label: '💡 Ideas & Planning',
      shortcut: '⌘I',
      icon: Lightbulb,
      action: () => navigate('/admin/ideas'),
      keywords: ['ideas', 'planning', 'ideas', 'kế hoạch', 'ý tưởng'],
      group: 'navigation',
    },
  ];

  // Action commands (slash commands)
  const actionCommands: QuickCommand[] = [
    {
      id: 'brain-search',
      label: '/brain search - Tìm trong Brain',
      icon: Brain,
      action: async () => {
        const query = inputValue.replace('/brain search', '').trim();
        if (!query) {
          toast({ title: 'Nhập từ khóa để tìm kiếm', variant: 'destructive' });
          return;
        }
        navigate(`/admin/brain?search=${encodeURIComponent(query)}`);
      },
      keywords: ['brain', 'search', 'tìm', 'knowledge'],
      group: 'actions',
    },
    {
      id: 'post-social',
      label: '/post - Đăng bài Social Media',
      icon: Send,
      action: () => {
        navigate('/admin/social?action=compose');
      },
      keywords: ['post', 'đăng', 'social', 'facebook'],
      group: 'actions',
    },
    {
      id: 'view-errors',
      label: '/error - Xem lỗi mới nhất',
      icon: Bug,
      action: () => {
        navigate('/admin/bug-system?filter=recent');
      },
      keywords: ['error', 'lỗi', 'bug', 'recent'],
      group: 'actions',
    },
    {
      id: 'run-backup',
      label: '/backup - Chạy backup ngay',
      icon: Database,
      action: async () => {
        toast({ title: 'Đang khởi chạy backup...', description: 'Vui lòng đợi' });
        try {
          const response = await fetch('/api/backup/run', {
            method: 'POST',
          });
          if (response.ok) {
            toast({ title: 'Backup thành công!', description: 'Đã backup lên Google Drive' });
          }
        } catch (_error) {
          toast({ title: 'Backup failed', variant: 'destructive' });
        }
      },
      keywords: ['backup', 'sao lưu', 'drive'],
      group: 'actions',
    },
    {
      id: 'ingest-docs',
      label: '/ingest - Nạp docs vào Brain',
      icon: FileText,
      action: async () => {
        toast({ title: 'Đang nạp docs...', description: 'Chạy auto-ingest script' });
        navigate('/admin/brain?tab=manage');
      },
      keywords: ['ingest', 'nạp', 'docs', 'import'],
      group: 'actions',
    },
    {
      id: 'capture-idea',
      label: '/idea - Quick Capture Idea',
      icon: Lightbulb,
      action: () => {
        navigate('/admin/ideas?action=capture');
      },
      keywords: ['idea', 'capture', 'quick', 'ý tưởng', 'note'],
      group: 'actions',
    },
  ];

  // AI Assistant quick switch
  const aiCommands: QuickCommand[] = [
    {
      id: 'ai-research',
      label: 'AI: Nghiên cứu',
      icon: Search,
      action: () => navigate('/admin/ai-workspace?assistant=research'),
      keywords: ['research', 'nghiên cứu'],
      group: 'ai',
    },
    {
      id: 'ai-course',
      label: 'AI: Khóa học',
      icon: BookOpen,
      action: () => navigate('/admin/ai-workspace?assistant=course'),
      keywords: ['course', 'khóa học', 'học'],
      group: 'ai',
    },
    {
      id: 'ai-financial',
      label: 'AI: Tài chính',
      icon: DollarSign,
      action: () => navigate('/admin/ai-workspace?assistant=financial'),
      keywords: ['financial', 'tài chính', 'money'],
      group: 'ai',
    },
    {
      id: 'ai-news',
      label: 'AI: Tin tức',
      icon: Newspaper,
      action: () => navigate('/admin/ai-workspace?assistant=news'),
      keywords: ['news', 'tin tức'],
      group: 'ai',
    },
    {
      id: 'ai-career',
      label: 'AI: Sự nghiệp',
      icon: Briefcase,
      action: () => navigate('/admin/ai-workspace?assistant=career'),
      keywords: ['career', 'sự nghiệp', 'job'],
      group: 'ai',
    },
    {
      id: 'ai-daily',
      label: 'AI: Kế hoạch hàng ngày',
      icon: Calendar,
      action: () => navigate('/admin/ai-workspace?assistant=daily'),
      keywords: ['daily', 'kế hoạch', 'planning'],
      group: 'ai',
    },
  ];

  // Project quick access
  const projectCommands: QuickCommand[] = [
    {
      id: 'project-portfolio',
      label: 'Project: LongSang Portfolio',
      icon: Folder,
      action: () => {
        window.open('http://localhost:5000', '_blank');
      },
      keywords: ['portfolio', 'longsang'],
      group: 'projects',
    },
    {
      id: 'project-ainewbie',
      label: 'Project: AI Newbie Web',
      icon: Folder,
      action: () => {
        window.open('http://localhost:5174', '_blank');
      },
      keywords: ['ainewbie', 'ai newbie'],
      group: 'projects',
    },
    {
      id: 'project-secretary',
      label: 'Project: AI Secretary',
      icon: MessageSquare,
      action: () => {
        window.open('http://localhost:5173', '_blank');
      },
      keywords: ['secretary', 'ai secretary'],
      group: 'projects',
    },
    {
      id: 'project-vungtau',
      label: 'Project: Vung Tau Dream Homes',
      icon: Home,
      action: () => {
        window.open('http://localhost:5175', '_blank');
      },
      keywords: ['vungtau', 'bđs', 'real estate'],
      group: 'projects',
    },
  ];

  const _allCommands = [
    ...navigationCommands,
    ...actionCommands,
    ...aiCommands,
    ...projectCommands,
  ];

  const handleSelect = useCallback((command: QuickCommand) => {
    setOpen(false);
    setInputValue('');
    command.action();
  }, []);

  // Check for slash commands
  const handleValueChange = (value: string) => {
    setInputValue(value);
  };

  // Run slash command when Enter is pressed with / prefix
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.startsWith('/')) {
      e.preventDefault();

      // Find matching slash command
      const matchedCommand = actionCommands.find((cmd) =>
        inputValue.toLowerCase().startsWith(cmd.label.split(' ')[0].toLowerCase())
      );

      if (matchedCommand) {
        handleSelect(matchedCommand);
      }
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        // @ts-expect-error - CommandInput ref typing issue
        ref={inputRef}
        placeholder="Gõ lệnh hoặc tìm kiếm... (/ cho slash commands)"
        value={inputValue}
        onValueChange={handleValueChange}
        onKeyDown={handleKeyDown}
      />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả. Thử gõ "/" để xem slash commands.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="📍 Điều hướng">
          {navigationCommands.map((cmd) => (
            <CommandItem key={cmd.id} onSelect={() => handleSelect(cmd)} keywords={cmd.keywords}>
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Slash Commands */}
        <CommandGroup heading="⚡ Slash Commands">
          {actionCommands.map((cmd) => (
            <CommandItem key={cmd.id} onSelect={() => handleSelect(cmd)} keywords={cmd.keywords}>
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* AI Assistants */}
        <CommandGroup heading="🤖 AI Assistants">
          {aiCommands.map((cmd) => (
            <CommandItem key={cmd.id} onSelect={() => handleSelect(cmd)} keywords={cmd.keywords}>
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Projects */}
        <CommandGroup heading="📁 Projects">
          {projectCommands.map((cmd) => (
            <CommandItem key={cmd.id} onSelect={() => handleSelect(cmd)} keywords={cmd.keywords}>
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              <CommandShortcut>
                <ArrowRight className="h-3 w-3" />
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      {/* Footer hint */}
      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">↵</kbd>
          <span>Chọn</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">↑↓</kbd>
          <span>Di chuyển</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">esc</kbd>
          <span>Đóng</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Ctrl+K để mở</span>
        </div>
      </div>
    </CommandDialog>
  );
}

export default GlobalQuickCommands;
