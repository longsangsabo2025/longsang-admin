import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SHORTCUTS, type ShortcutEntry } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: { key: ShortcutEntry['category']; label: string }[] = [
  { key: 'navigation', label: 'Điều hướng (G + ...)' },
  { key: 'create', label: 'Tạo mới (N + ...)' },
  { key: 'general', label: 'Chung' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutRow({ entry }: { entry: ShortcutEntry }) {
  const parts = entry.keys.split(' + ');
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground">{entry.description}</span>
      <span className="flex shrink-0 items-center gap-1">
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-xs text-muted-foreground">rồi</span>}
            <Kbd>{part}</Kbd>
          </span>
        ))}
      </span>
    </div>
  );
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Phím tắt bàn phím</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat.key);
            if (items.length === 0) return null;
            return (
              <div key={cat.key}>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{cat.label}</h3>
                <div className="space-y-1">
                  {items.map((entry) => (
                    <ShortcutRow key={entry.keys} entry={entry} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Phím tắt không hoạt động khi đang nhập liệu trong ô văn bản.
        </p>
      </DialogContent>
    </Dialog>
  );
}
