/**
 * ⌨️ Command Palette Component
 *
 * Cmd+K command launcher with history and suggestions
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const COMMAND_EXAMPLES = [
  'Tạo bài post về dự án Vũng Tàu',
  'Backup database lên Google Drive',
  'Tạo 5 bài SEO cho từ khóa bất động sản',
  'Thống kê workflows hôm nay',
  'Lên lịch đăng bài lúc 9h sáng',
  'Tạo workflow marketing campaign',
];

export function CommandPalette({
  open,
  onOpenChange,
  onCommandSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommandSelect?: (command: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load command history from localStorage
    const saved = localStorage.getItem('ai_command_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const commands = parsed
          .map((item: any) => item.command)
          .filter((cmd: string) => cmd && typeof cmd === 'string')
          .slice(0, 10);
        setHistory(commands);
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  const filteredExamples = COMMAND_EXAMPLES.filter((cmd) =>
    cmd.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = history.filter((cmd) => cmd.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (command: string) => {
    onCommandSelect?.(command);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} data-testid="command-palette">
      <CommandInput
        placeholder="Gõ lệnh hoặc tìm kiếm..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Không tìm thấy command nào.</CommandEmpty>

        {filteredHistory.length > 0 && (
          <CommandGroup heading="Lịch sử">
            {filteredHistory.map((cmd, i) => (
              <CommandItem key={`history-${i}`} onSelect={() => handleSelect(cmd)}>
                {cmd}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Gợi ý">
          {filteredExamples.map((cmd, i) => (
            <CommandItem key={`example-${i}`} onSelect={() => handleSelect(cmd)}>
              {cmd}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Hook to use Command Palette with Cmd+K
export function useCommandPalette(onCommandSelect?: (command: string) => void) {
  const [open, setOpen] = useState(false);

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

  return {
    open,
    setOpen,
    CommandPaletteComponent: (
      <CommandPalette open={open} onOpenChange={setOpen} onCommandSelect={onCommandSelect} />
    ),
  };
}
