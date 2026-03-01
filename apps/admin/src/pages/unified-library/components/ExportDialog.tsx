/**
 * 📥 ExportDialog — Export products to CSV/JSON
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileDown, FileSpreadsheet, Clock, Eye, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductItem, ActivityAction } from '@/hooks/library';

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productItems: ProductItem[];
  logActivity: (action: ActivityAction, description: string, count?: number) => void;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ExportDialog({
  open,
  onOpenChange,
  productItems,
  logActivity,
}: ExportDialogProps) {
  const exportProducts = (fmt: 'csv' | 'json') => {
    if (productItems.length === 0) {
      toast.error('Không có sản phẩm để xuất');
      return;
    }

    const data = productItems.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      status: item.status,
      url: item.url || `https://drive.google.com/file/d/${item.id}/view`,
      tags: (item.tags || []).join(', '),
      aiTags: (item.aiTags || []).join(', '),
      addedAt: item.addedAt,
    }));

    let content: string;
    let filename: string;
    let mimeType: string;

    if (fmt === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      content = [headers, ...rows].join('\n');
      filename = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(data, null, 2);
      filename = `products_export_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    logActivity('export', `Xuất ${productItems.length} sản phẩm ra ${fmt.toUpperCase()}`, productItems.length);
    toast.success(`📥 Đã xuất ${productItems.length} sản phẩm ra ${fmt.toUpperCase()}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Sản phẩm ({productItems.length} files)
          </DialogTitle>
          <DialogDescription>
            Xuất danh sách sản phẩm ra file để sử dụng
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Export Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{productItems.length}</div>
              <div className="text-xs text-muted-foreground">Tổng files</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{productItems.filter(p => p.aiTags?.length).length}</div>
              <div className="text-xs text-muted-foreground">Đã AI-tag</div>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium mb-2">Theo trạng thái:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-yellow-600" />
                Draft: {productItems.filter(p => p.status === 'draft').length}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3 text-blue-600" />
                Review: {productItems.filter(p => p.status === 'review').length}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Approved: {productItems.filter(p => p.status === 'approved').length}
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-purple-600" />
                Published: {productItems.filter(p => p.status === 'published').length}
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => exportProducts('csv')}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => exportProducts('json')}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
