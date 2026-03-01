/**
 * 📋 ActivityLogPanel — Activity log dialog
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  History, Plus, X, Package, Trash2,
  Activity, ListChecks, Sparkle, Pencil,
  FileDown, FolderOpen, Timer, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ActivityLogEntry } from '@/hooks/library';

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

export interface ActivityLogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: ActivityLogEntry[];
  clearAll: () => void;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ActivityLogPanel({
  open,
  onOpenChange,
  entries,
  clearAll,
}: ActivityLogPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            Lịch sử hoạt động
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có hoạt động nào</p>
              <p className="text-sm">Các thao tác sẽ được ghi lại ở đây</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {entries.map((log) => {
                  const getActionIcon = () => {
                    switch (log.action) {
                      case 'add_workspace': return <Plus className="h-4 w-4 text-blue-500" />;
                      case 'remove_workspace': return <X className="h-4 w-4 text-red-500" />;
                      case 'add_products': return <Package className="h-4 w-4 text-green-500" />;
                      case 'remove_products': return <Trash2 className="h-4 w-4 text-red-500" />;
                      case 'status_change': return <Activity className="h-4 w-4 text-yellow-500" />;
                      case 'batch_status': return <ListChecks className="h-4 w-4 text-purple-500" />;
                      case 'batch_delete': return <Trash2 className="h-4 w-4 text-red-500" />;
                      case 'ai_tag': return <Sparkle className="h-4 w-4 text-pink-500" />;
                      case 'rename': return <Pencil className="h-4 w-4 text-cyan-500" />;
                      case 'export': return <FileDown className="h-4 w-4 text-green-500" />;
                      case 'clear_workspace': return <FolderOpen className="h-4 w-4 text-orange-500" />;
                      case 'clear_products': return <Package className="h-4 w-4 text-red-500" />;
                      default: return <Activity className="h-4 w-4 text-gray-500" />;
                    }
                  };

                  const getActionColor = () => {
                    if (log.action.includes('remove') || log.action.includes('delete') || log.action.includes('clear')) {
                      return 'border-l-red-500 bg-red-500/5';
                    }
                    if (log.action.includes('add') || log.action.includes('products')) {
                      return 'border-l-green-500 bg-green-500/5';
                    }
                    if (log.action.includes('status') || log.action.includes('batch')) {
                      return 'border-l-yellow-500 bg-yellow-500/5';
                    }
                    if (log.action.includes('ai') || log.action.includes('tag')) {
                      return 'border-l-purple-500 bg-purple-500/5';
                    }
                    return 'border-l-blue-500 bg-blue-500/5';
                  };

                  return (
                    <div 
                      key={log.id} 
                      className={`flex items-start gap-3 p-3 rounded-r-lg border-l-4 ${getActionColor()}`}
                    >
                      <div className="mt-0.5">{getActionIcon()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          <span>{format(new Date(log.timestamp), 'HH:mm:ss dd/MM/yyyy', { locale: vi })}</span>
                          {log.count && log.count > 1 && (
                            <Badge variant="secondary" className="text-[10px] px-1 h-4">
                              {log.count} items
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {entries.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                clearAll();
                toast.success('Đã xóa lịch sử');
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa lịch sử
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
