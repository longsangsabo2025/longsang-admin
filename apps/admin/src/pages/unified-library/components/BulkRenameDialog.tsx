/**
 * ✏️ BulkRenameDialog — Bulk rename dialog with pattern preview
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Eye, Hash } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductItem, ActivityAction } from '@/hooks/library';
import { RENAME_PATTERNS } from '../shared';

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

export interface BulkRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productItems: ProductItem[];
  setProductItems: (items: ProductItem[] | ((prev: ProductItem[]) => ProductItem[])) => void;
  logActivity: (action: ActivityAction, description: string, count?: number) => void;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function BulkRenameDialog({
  open,
  onOpenChange,
  productItems,
  setProductItems,
  logActivity,
}: BulkRenameDialogProps) {
  const [renamePattern, setRenamePattern] = useState('prefix');
  const [renameValue, setRenameValue] = useState('');
  const [renamePreview, setRenamePreview] = useState<string[]>([]);

  // Generate rename preview
  const generateRenamePreview = (pattern: string, value: string) => {
    const items = productItems.slice(0, 5);
    const today = new Date().toISOString().split('T')[0];
    
    return items.map((item, idx) => {
      const ext = item.name.includes('.') ? '.' + item.name.split('.').pop() : '';
      const baseName = item.name.replace(ext, '');
      
      switch (pattern) {
        case 'prefix':
          return value ? `${value}_${item.name}` : item.name;
        case 'suffix':
          return value ? `${baseName}_${value}${ext}` : item.name;
        case 'date':
          return `${baseName}_${today}${ext}`;
        case 'number': {
          const num = String(idx + 1).padStart(3, '0');
          return value ? `${value}_${num}${ext}` : `file_${num}${ext}`;
        }
        case 'replace': {
          const [oldText, newText] = value.split('→').map(s => s.trim());
          return oldText ? item.name.replace(new RegExp(oldText, 'gi'), newText || '') : item.name;
        }
        default:
          return item.name;
      }
    });
  };

  // Apply bulk rename
  const applyBulkRename = () => {
    if (!renameValue && renamePattern !== 'date') {
      toast.error('Vui lòng nhập giá trị');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const renamedItems = productItems.map((item, idx) => {
      const ext = item.name.includes('.') ? '.' + item.name.split('.').pop() : '';
      const baseName = item.name.replace(ext, '');
      let newName = item.name;
      
      switch (renamePattern) {
        case 'prefix':
          newName = `${renameValue}_${item.name}`;
          break;
        case 'suffix':
          newName = `${baseName}_${renameValue}${ext}`;
          break;
        case 'date':
          newName = `${baseName}_${today}${ext}`;
          break;
        case 'number': {
          const num = String(idx + 1).padStart(3, '0');
          newName = `${renameValue}_${num}${ext}`;
          break;
        }
        case 'replace': {
          const [oldText, newText] = renameValue.split('→').map(s => s.trim());
          newName = oldText ? item.name.replace(new RegExp(oldText, 'gi'), newText || '') : item.name;
          break;
        }
      }
      
      return { ...item, name: newName };
    });

    setProductItems(renamedItems);
    onOpenChange(false);
    setRenameValue('');
    logActivity('rename', `Đổi tên hàng loạt ${renamedItems.length} files (${renamePattern})`, renamedItems.length);
    toast.success(`✏️ Đã đổi tên ${renamedItems.length} files`);
  };

  // Update preview when pattern or value changes
  useEffect(() => {
    setRenamePreview(generateRenamePreview(renamePattern, renameValue));
  }, [renamePattern, renameValue, productItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Đổi tên hàng loạt ({productItems.length} files)
          </DialogTitle>
          <DialogDescription>
            Chọn pattern và nhập giá trị để đổi tên tất cả files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pattern Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Kiểu đổi tên</label>
            <Select value={renamePattern} onValueChange={setRenamePattern}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RENAME_PATTERNS.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col">
                      <span>{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.example}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value Input */}
          {renamePattern !== 'date' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {renamePattern === 'replace' ? 'Thay thế (old → new)' : 'Giá trị'}
              </label>
              <Input
                placeholder={renamePattern === 'replace' ? 'old_text → new_text' : 'Nhập giá trị...'}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
              />
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Xem trước (5 files đầu)
            </label>
            <div className="bg-muted rounded-lg p-3 space-y-1 text-sm font-mono max-h-32 overflow-y-auto">
              {renamePreview.map((name, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={applyBulkRename}>
            <Pencil className="h-4 w-4 mr-2" />
            Đổi tên {productItems.length} files
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
