/**
 * AI Workspace Command Palette
 * Quick access to AI assistants via Cmd/Ctrl+K
 */

import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  DollarSign,
  Search,
  Newspaper,
  Briefcase,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const ASSISTANT_COMMANDS = [
  {
    id: 'course',
    label: 'Course Assistant - Phát triển khóa học',
    icon: BookOpen,
    action: 'assistant-course',
    shortcut: 'C',
  },
  {
    id: 'financial',
    label: 'Financial Assistant - Tài chính cá nhân',
    icon: DollarSign,
    action: 'assistant-financial',
    shortcut: 'F',
  },
  {
    id: 'research',
    label: 'Research Assistant - Nghiên cứu',
    icon: Search,
    action: 'assistant-research',
    shortcut: 'R',
  },
  {
    id: 'news',
    label: 'News Assistant - Tin tức',
    icon: Newspaper,
    action: 'assistant-news',
    shortcut: 'N',
  },
  {
    id: 'career',
    label: 'Career Assistant - Sự nghiệp',
    icon: Briefcase,
    action: 'assistant-career',
    shortcut: 'E',
  },
  {
    id: 'daily',
    label: 'Daily Planner - Kế hoạch ngày',
    icon: Calendar,
    action: 'assistant-daily',
    shortcut: 'D',
  },
];

const QUICK_ACTIONS = [
  { id: 'open-workspace', label: 'Mở AI Workspace', action: 'navigate-/admin/ai-workspace' },
];

export function AIWorkspaceCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (action: string) => {
    if (action.startsWith('navigate-')) {
      navigate(action.replace('navigate-', ''));
    } else if (action.startsWith('assistant-')) {
      const assistantType = action.replace('assistant-', '');
      navigate(`/admin/ai-workspace?assistant=${assistantType}`);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-2xl">
        <Command className="rounded-lg border-none shadow-lg">
          <div className="flex items-center border-b px-3">
            <Sparkles className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Tìm kiếm AI Assistant hoặc lệnh..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty>Không tìm thấy kết quả.</Command.Empty>

            <Command.Group heading="AI Assistants">
              {ASSISTANT_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <Command.Item
                    key={cmd.id}
                    onSelect={() => handleSelect(cmd.action)}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                        <span className="text-xs">⌘</span>
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Group heading="Quick Actions">
              {QUICK_ACTIONS.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  onSelect={() => handleSelect(cmd.action)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                >
                  <span>{cmd.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
