import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Briefcase, Package, ChevronRight,
  Download, Copy, FolderInput, Trash2, X,
  FolderPlus as FolderPlusIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MediaItem, ProjectInfo } from './types';
import { LazyImage } from './LazyImage';
import { getPreviewUrl, typeConfig } from './utils';

export interface BulkActionsBarProps {
  selectedItems: MediaItem[];
  clearSelection: () => void;
  onAddToWorkspace?: (files: MediaItem[]) => void;
  onAddToProducts?: (files: MediaItem[]) => void;
  projects?: ProjectInfo[];
  onAddToProject?: (files: MediaItem[], project: ProjectInfo) => void;
  onDownload: (item: MediaItem) => Promise<void>;
  onOpenDeleteDialog: () => void;
  onOpenMoveDialog: () => void;
}

export function BulkActionsBar({
  selectedItems, clearSelection,
  onAddToWorkspace, onAddToProducts,
  projects, onAddToProject,
  onDownload, onOpenDeleteDialog, onOpenMoveDialog,
}: BulkActionsBarProps) {
  return (
    <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Selected count */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {selectedItems.slice(0, 3).map(item => (
              <div key={item.id} className="h-8 w-8 rounded-md border-2 border-background overflow-hidden shadow-sm">
                {item.type === 'image' || item.type === 'video' ? (
                  <LazyImage
                    src={getPreviewUrl(item, 'small')}
                    className="h-full w-full"
                    fallbackIcon={(() => { const I = typeConfig[item.type].icon; return <I className="h-4 w-4 text-muted-foreground/40" />; })()}
                  />
                ) : (
                  <div className={cn('h-full w-full flex items-center justify-center', typeConfig[item.type].bg)}>
                    {(() => { const I = typeConfig[item.type].icon; return <I className="h-4 w-4" />; })()}
                  </div>
                )}
              </div>
            ))}
            {selectedItems.length > 3 && (
              <div className="h-8 w-8 rounded-md border-2 border-background bg-muted flex items-center justify-center text-xs font-medium shadow-sm">
                +{selectedItems.length - 3}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">Đã chọn {selectedItems.length} files</p>
            <p className="text-xs text-muted-foreground">Chọn thao tác bên dưới</p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {onAddToWorkspace && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-blue-500/10 border-blue-500/30 text-blue-600 hover:bg-blue-500/20" onClick={() => { onAddToWorkspace(selectedItems); clearSelection(); }}>
                  <Briefcase className="h-3.5 w-3.5" /><span className="hidden sm:inline">Workspace</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Thêm vào Workspace</TooltipContent>
            </Tooltip>
          )}

          {onAddToProducts && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20" onClick={() => { onAddToProducts(selectedItems); clearSelection(); }}>
                  <Package className="h-3.5 w-3.5" /><span className="hidden sm:inline">Sản phẩm</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Thêm vào Sản phẩm</TooltipContent>
            </Tooltip>
          )}

          {projects && projects.length > 0 && onAddToProject && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-orange-500/10 border-orange-500/30 text-orange-600 hover:bg-orange-500/20">
                  <FolderPlusIcon className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dự án</span><ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">📁 Chọn dự án</div>
                <DropdownMenuSeparator />
                {projects.map(project => (
                  <DropdownMenuItem key={project.slug} onClick={() => { onAddToProject(selectedItems, project); clearSelection(); }} className="gap-2 cursor-pointer">
                    <span>{project.icon}</span><span className="flex-1 truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={async () => {
                toast.info(`Đang tải ${selectedItems.length} files...`);
                for (const item of selectedItems) await onDownload(item);
                toast.success(`Đã tải xong ${selectedItems.length} files`);
              }}>
                <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Tải xuống</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tải xuống tất cả</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => {
                const urls = selectedItems.map(item =>
                  item.type === 'image' ? `https://drive.google.com/thumbnail?id=${item.id}&sz=w1000` : item.url,
                ).join('\n');
                navigator.clipboard.writeText(urls);
                toast.success(`Đã copy ${selectedItems.length} URLs`);
              }}>
                <Copy className="h-3.5 w-3.5" /><span className="hidden sm:inline">Copy URLs</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy tất cả URLs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onOpenMoveDialog}>
                <FolderInput className="h-3.5 w-3.5" /><span className="hidden sm:inline">Di chuyển</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Di chuyển đến folder khác</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="destructive" className="h-8 gap-1.5" onClick={onOpenDeleteDialog}>
                <Trash2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Xóa</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xóa tất cả đã chọn</TooltipContent>
          </Tooltip>

          <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={clearSelection}>
            <X className="h-3.5 w-3.5" /><span className="hidden sm:inline">Bỏ chọn</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
