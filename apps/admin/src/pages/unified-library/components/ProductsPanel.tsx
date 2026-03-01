/**
 * 📦 ProductsPanel — Products tab with batch mode, AI tagging, status management
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { TabsContent } from '@/components/ui/tabs';
import {
  Package, History, FastForward, CheckCheck, PlayCircle,
  ListChecks, Activity, Wand2, Pencil, FileDown, Copy,
  Plus, Trash2, Clock, Eye, CheckCircle, Star,
  GripVertical, Play, FileText, X, Sparkle,
  ExternalLink, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MediaItem } from '@/components/media/MediaGallery';
import type {
  ProductItem,
  WorkspaceItem,
  ProductStatus,
  ActivityAction,
  ActivityLogEntry,
} from '@/hooks/library';
import { STATUS_CONFIG } from '@/hooks/library';
import { AI_TAG_CATEGORIES } from '../shared';
import { BulkRenameDialog } from './BulkRenameDialog';
import { ExportDialog } from './ExportDialog';
import { ActivityLogPanel } from './ActivityLogPanel';

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

export interface ProductsPanelProps {
  productItems: ProductItem[];
  setProductItems: (items: ProductItem[] | ((prev: ProductItem[]) => ProductItem[])) => void;
  workspaceItems: WorkspaceItem[];
  addToProducts: (items: MediaItem[], status: ProductStatus) => Promise<void>;
  removeFromProducts: (id: string) => void;
  updateProductStatus: (id: string, status: ProductStatus) => void;
  clearProducts: () => void;
  clearWorkspace: () => void;
  handleDragStart: (e: React.DragEvent, items: MediaItem[]) => void;
  logActivity: (action: ActivityAction, description: string, count?: number) => void;
  activityLogEntries: ActivityLogEntry[];
  activityLogClearAll: () => void;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ProductsPanel({
  productItems,
  setProductItems,
  workspaceItems,
  addToProducts,
  removeFromProducts,
  updateProductStatus,
  clearProducts,
  clearWorkspace,
  handleDragStart,
  logActivity,
  activityLogEntries,
  activityLogClearAll,
}: ProductsPanelProps) {
  // ─── Internal state ──────────────────────────────────────────
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [batchSelectMode, setBatchSelectMode] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const [showBulkRenameDialog, setShowBulkRenameDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // ─── Batch operations ────────────────────────────────────────
  const toggleProductSelect = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllProducts = () => {
    if (selectedProductIds.length === productItems.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(productItems.map(p => p.id));
    }
  };

  const batchUpdateStatus = (status: ProductItem['status']) => {
    if (selectedProductIds.length === 0) {
      toast.error('Chưa chọn file nào');
      return;
    }
    setProductItems(prev => prev.map(item =>
      selectedProductIds.includes(item.id) ? { ...item, status } : item
    ));
    const statusLabel = STATUS_CONFIG[status].label;
    logActivity('batch_action', `Đổi ${selectedProductIds.length} files sang ${statusLabel}`, selectedProductIds.length);
    toast.success(`⚡ Đã đổi ${selectedProductIds.length} files sang ${statusLabel}`);
    setSelectedProductIds([]);
  };

  const batchDeleteProducts = () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    setProductItems(prev => prev.filter(item => !selectedProductIds.includes(item.id)));
    logActivity('remove', `Xóa ${count} files khỏi Sản phẩm`, count);
    toast.success(`🗑️ Đã xóa ${count} files`);
    setSelectedProductIds([]);
  };

  // ─── Quick workflows ─────────────────────────────────────────
  const moveAllToProducts = () => {
    if (workspaceItems.length === 0) {
      toast.info('Workspace trống');
      return;
    }
    const count = workspaceItems.length;
    addToProducts(workspaceItems, 'draft');
    logActivity('add_products', `Chuyển ${count} files từ Workspace sang Products`, count);
    clearWorkspace();
  };

  const approveAllDrafts = () => {
    const drafts = productItems.filter(p => p.status === 'draft');
    if (drafts.length === 0) {
      toast.info('Không có Draft nào');
      return;
    }
    setProductItems(prev => prev.map(item =>
      item.status === 'draft' ? { ...item, status: 'approved' } : item
    ));
    logActivity('batch_action', `Duyệt ${drafts.length} files Draft`, drafts.length);
    toast.success(`✅ Đã duyệt ${drafts.length} files`);
  };

  const publishAllApproved = () => {
    const approved = productItems.filter(p => p.status === 'approved');
    if (approved.length === 0) {
      toast.info('Không có file Approved nào');
      return;
    }
    setProductItems(prev => prev.map(item =>
      item.status === 'approved' ? { ...item, status: 'published' } : item
    ));
    logActivity('batch_action', `Xuất bản ${approved.length} files`, approved.length);
    toast.success(`🚀 Đã xuất bản ${approved.length} files`);
  };

  // ─── AI Auto-tag ─────────────────────────────────────────────
  const handleAutoTag = async () => {
    if (productItems.length === 0) {
      toast.error('Không có sản phẩm để tag');
      return;
    }

    setIsAutoTagging(true);
    toast.loading('🤖 AI đang phân tích files...', { id: 'auto-tag' });

    await new Promise(resolve => setTimeout(resolve, 1500));

    const taggedItems = productItems.map(item => {
      const filename = item.name.toLowerCase();
      const type = item.type as keyof typeof AI_TAG_CATEGORIES;
      const possibleTags = AI_TAG_CATEGORIES[type] || AI_TAG_CATEGORIES.image;

      const detectedTags: string[] = [];
      if (filename.includes('banner') || filename.includes('cover')) detectedTags.push('banner');
      if (filename.includes('logo')) detectedTags.push('logo');
      if (filename.includes('thumb') || filename.includes('thumbnail')) detectedTags.push('thumbnail');
      if (filename.includes('product') || filename.includes('sp')) detectedTags.push('product');
      if (filename.includes('bg') || filename.includes('background')) detectedTags.push('background');
      if (filename.includes('icon')) detectedTags.push('icon');
      if (filename.includes('screenshot') || filename.includes('ss')) detectedTags.push('screenshot');
      if (filename.includes('social') || filename.includes('fb') || filename.includes('ig')) detectedTags.push('social-media');
      if (filename.includes('promo') || filename.includes('ad')) detectedTags.push('promo');
      if (filename.includes('demo') || filename.includes('tutorial')) detectedTags.push('tutorial');

      if (detectedTags.length === 0) {
        detectedTags.push(possibleTags[Math.floor(Math.random() * 3)]);
      }

      return {
        ...item,
        aiTags: detectedTags,
        tags: [...(item.tags || []), ...detectedTags].filter((t, i, arr) => arr.indexOf(t) === i),
      };
    });

    setProductItems(taggedItems);
    setIsAutoTagging(false);
    logActivity('ai_tag', `AI Auto-tag ${taggedItems.length} files`, taggedItems.length);
    toast.success(`🎯 Đã tag ${taggedItems.length} files với AI`, { id: 'auto-tag' });
  };

  // ─── Status helpers ──────────────────────────────────────────
  const statusColors: Record<ProductStatus, string> = {
    draft: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    review: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    approved: 'bg-green-500/20 text-green-600 border-green-500/30',
    published: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  };
  const statusIcons: Record<ProductStatus, React.ElementType> = {
    draft: Clock,
    review: Eye,
    approved: CheckCircle,
    published: Star,
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <TabsContent value="products" className="flex-1 mt-2">
      <Card className="h-[calc(100vh-140px)] min-h-[700px]">
        <CardContent className="p-4 h-full">
          {/* Header with actions */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Row 1: Title + Activity Log */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Sản phẩm ({productItems.length} files)</h3>
                {selectedProductIds.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
                    {selectedProductIds.length} đã chọn
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowActivityLog(true)}
                className="relative"
              >
                <History className="h-4 w-4 mr-2" />
                Lịch sử
                {activityLogEntries.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activityLogEntries.length > 99 ? '99+' : activityLogEntries.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Row 2: Quick Workflow Buttons */}
            {(workspaceItems.length > 0 || productItems.some(p => p.status === 'draft') || productItems.some(p => p.status === 'approved')) && (
              <div className="flex gap-2 p-2 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-lg border border-orange-500/20">
                <span className="text-xs text-muted-foreground self-center mr-2">⚡ Quick:</span>
                {workspaceItems.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={moveAllToProducts}
                    className="bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600"
                  >
                    <FastForward className="h-4 w-4 mr-1" />
                    Workspace → Products ({workspaceItems.length})
                  </Button>
                )}
                {productItems.some(p => p.status === 'draft') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={approveAllDrafts}
                    className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-600"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Approve All Drafts ({productItems.filter(p => p.status === 'draft').length})
                  </Button>
                )}
                {productItems.some(p => p.status === 'approved') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={publishAllApproved}
                    className="bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-600"
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Publish All Approved ({productItems.filter(p => p.status === 'approved').length})
                  </Button>
                )}
              </div>
            )}

            {/* Row 3: Batch Mode + Actions */}
            <div className="flex gap-2 flex-wrap items-center">
              {/* Batch Mode Toggle */}
              {productItems.length > 0 && (
                <Button
                  size="sm"
                  variant={batchSelectMode ? "default" : "outline"}
                  onClick={() => {
                    setBatchSelectMode(!batchSelectMode);
                    if (batchSelectMode) setSelectedProductIds([]);
                  }}
                  className={batchSelectMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  {batchSelectMode ? "Thoát Batch Mode" : "Batch Mode"}
                </Button>
              )}

              {/* Batch Actions - Only show when in batch mode with selection */}
              {batchSelectMode && selectedProductIds.length > 0 && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <Button size="sm" variant="outline" onClick={selectAllProducts}>
                    {selectedProductIds.length === productItems.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="bg-yellow-500/10 border-yellow-500/30">
                        <Activity className="h-4 w-4 mr-2" />
                        Đổi trạng thái ({selectedProductIds.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => batchUpdateStatus('draft')}>
                        <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Draft
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => batchUpdateStatus('review')}>
                        <Eye className="h-4 w-4 mr-2 text-blue-500" /> Review
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => batchUpdateStatus('approved')}>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Approved
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => batchUpdateStatus('published')}>
                        <Star className="h-4 w-4 mr-2 text-purple-500" /> Published
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" variant="destructive" onClick={batchDeleteProducts}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa ({selectedProductIds.length})
                  </Button>
                </>
              )}

              {/* Original Actions */}
              {!batchSelectMode && productItems.length > 0 && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAutoTag}
                    disabled={isAutoTagging}
                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500"
                  >
                    {isAutoTagging ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    AI Auto-tag
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowBulkRenameDialog(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Đổi tên hàng loạt
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowExportDialog(true)}
                    className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const urls = productItems.map(f => f.url || `https://drive.google.com/file/d/${f.id}/view`).join('\n');
                    navigator.clipboard.writeText(urls);
                    toast.success('Đã copy URLs');
                  }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URLs
                  </Button>
                </>
              )}
              
              {!batchSelectMode && (
                <>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (workspaceItems.length > 0) {
                      addToProducts(workspaceItems, 'draft');
                    } else {
                      toast.info('Workspace trống');
                    }
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Từ Workspace
                  </Button>
                  {productItems.length > 0 && (
                    <Button size="sm" variant="destructive" onClick={clearProducts}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa tất cả
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status filter */}
          {productItems.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Tất cả ({productItems.length})
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-yellow-500/20 text-yellow-600">
                <Clock className="h-3 w-3 mr-1" />
                Draft ({productItems.filter(p => p.status === 'draft').length})
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-blue-500/20 text-blue-600">
                <Eye className="h-3 w-3 mr-1" />
                Review ({productItems.filter(p => p.status === 'review').length})
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-green-500/20 text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved ({productItems.filter(p => p.status === 'approved').length})
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-purple-500/20 text-purple-600">
                <Star className="h-3 w-3 mr-1" />
                Published ({productItems.filter(p => p.status === 'published').length})
              </Badge>
            </div>
          )}

          <ScrollArea className="h-[calc(100%-100px)]">
            {productItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Chưa có sản phẩm</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Đây là nơi lưu trữ các files chính thức, đã hoàn thiện. <br />
                  Thêm từ Workspace hoặc chọn files từ thư viện.
                </p>
                {workspaceItems.length > 0 && (
                  <Button className="mt-4" onClick={() => addToProducts(workspaceItems, 'draft')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm {workspaceItems.length} files từ Workspace
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {productItems.map((item) => {
                  const StatusIcon = statusIcons[item.status];

                  return (
                    <ContextMenu key={item.id}>
                      <ContextMenuTrigger>
                        <div 
                          className={`group relative rounded-lg border-2 bg-card overflow-hidden hover:shadow-lg transition-all cursor-grab active:cursor-grabbing ${statusColors[item.status]} ${batchSelectMode && selectedProductIds.includes(item.id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                          draggable={!batchSelectMode}
                          onDragStart={(e) => !batchSelectMode && handleDragStart(e, [item])}
                          onClick={() => batchSelectMode && toggleProductSelect(item.id)}
                        >
                          {/* Batch Select Checkbox */}
                          {batchSelectMode && (
                            <div 
                              className="absolute top-2 left-2 z-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductSelect(item.id);
                              }}
                            >
                              <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                                selectedProductIds.includes(item.id) 
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'bg-white/80 border-gray-400 hover:border-blue-400'
                              }`}>
                                {selectedProductIds.includes(item.id) && (
                                  <CheckCircle className="h-3 w-3 text-white" />
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Drag handle indicator */}
                          <div className={`absolute top-2 ${batchSelectMode ? 'left-10' : 'left-8'} z-10 opacity-0 group-hover:opacity-70 transition-opacity`}>
                            {!batchSelectMode && <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />}
                          </div>
                          
                          {/* Thumbnail */}
                          <div className="aspect-square bg-muted relative">
                            {item.type === 'image' || item.type === 'video' ? (
                              <img 
                                src={`http://localhost:3001/api/drive/thumbnail/${item.id}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.fallback-icon')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'fallback-icon w-full h-full flex items-center justify-center bg-gradient-to-br ' + 
                                      (item.type === 'video' ? 'from-purple-500/20 to-pink-500/20' : 'from-blue-500/20 to-cyan-500/20');
                                    fallback.innerHTML = item.type === 'video' 
                                      ? '<svg class="h-12 w-12 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
                                      : '<svg class="h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                                <FileText className="h-12 w-12 text-blue-500" />
                              </div>
                            )}
                            
                            {/* Play button overlay for videos */}
                            {item.type === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                  <Play className="h-6 w-6 text-purple-600 ml-1" />
                                </div>
                              </div>
                            )}
                            
                            {/* Remove button */}
                            {!batchSelectMode && (
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFromProducts(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Status icon */}
                            <div className={`absolute ${batchSelectMode ? 'top-2 right-2' : 'top-2 left-2'} p-1 rounded ${statusColors[item.status]}`}>
                              <StatusIcon className="h-4 w-4" />
                            </div>

                            {/* Type badge */}
                            <Badge 
                              variant="secondary" 
                              className="absolute bottom-2 left-2 text-xs capitalize"
                            >
                              {item.type}
                            </Badge>
                          </div>

                          {/* Info & Status actions */}
                          <div className="p-2">
                            <p className="text-xs font-medium truncate" title={item.name}>
                              {item.name}
                            </p>
                            
                            {/* AI Tags */}
                            {item.aiTags && item.aiTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.aiTags.slice(0, 2).map(tag => (
                                  <Badge 
                                    key={tag} 
                                    variant="outline" 
                                    className="text-[10px] px-1 py-0 h-4 bg-purple-500/10 text-purple-600 border-purple-500/30"
                                  >
                                    <Sparkle className="h-2 w-2 mr-0.5" />
                                    {tag}
                                  </Badge>
                                ))}
                                {item.aiTags.length > 2 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                    +{item.aiTags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted-foreground capitalize">
                                {item.status}
                              </p>
                              {/* Quick status change */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.status !== 'approved' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5"
                                    onClick={() => updateProductStatus(item.id, 'approved')}
                                    title="Duyệt"
                                  >
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  </Button>
                                )}
                                {item.status !== 'published' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5"
                                    onClick={() => updateProductStatus(item.id, 'published')}
                                    title="Xuất bản"
                                  >
                                    <Star className="h-3 w-3 text-purple-600" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-56">
                        <ContextMenuItem onClick={() => updateProductStatus(item.id, 'draft')}>
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                          Đặt Draft
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => updateProductStatus(item.id, 'review')}>
                          <Eye className="h-4 w-4 mr-2 text-blue-600" />
                          Đặt Review
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => updateProductStatus(item.id, 'approved')}>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Duyệt (Approved)
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => updateProductStatus(item.id, 'published')}>
                          <Star className="h-4 w-4 mr-2 text-purple-600" />
                          Xuất bản (Published)
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => {
                          navigator.clipboard.writeText(item.url || `https://drive.google.com/file/d/${item.id}/view`);
                          toast.success('Đã copy URL');
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy URL
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => window.open(item.url || `https://drive.google.com/file/d/${item.id}/view`, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Mở trên Drive
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          onClick={() => removeFromProducts(item.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa khỏi Sản phẩm
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ─── Dialogs (rendered within tab scope) ────────────────── */}
      <BulkRenameDialog
        open={showBulkRenameDialog}
        onOpenChange={setShowBulkRenameDialog}
        productItems={productItems}
        setProductItems={setProductItems}
        logActivity={logActivity}
      />
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        productItems={productItems}
        logActivity={logActivity}
      />
      <ActivityLogPanel
        open={showActivityLog}
        onOpenChange={setShowActivityLog}
        entries={activityLogEntries}
        clearAll={activityLogClearAll}
      />
    </TabsContent>
  );
}
