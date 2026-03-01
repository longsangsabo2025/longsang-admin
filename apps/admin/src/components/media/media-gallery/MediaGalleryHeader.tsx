import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Search, Grid3X3, LayoutGrid, List,
  Image as ImageIcon, Video, FileText, Folder,
  FolderPlus, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, Filter, Sparkles,
  Home, X, Upload, MousePointerClick, CheckSquare, Square,
} from 'lucide-react';
import type { MediaItem } from './types';
import { typeConfig } from './utils';

export interface MediaGalleryHeaderProps {
  folderPath: { id: string; name: string }[];
  navigateToPath: (index: number) => void;
  goBack: () => void;
  selectionModeActive: boolean;
  setSelectionModeActive: (v: boolean) => void;
  setSelectedItems: (items: MediaItem[]) => void;
  sortedFilesCount: number;
  allSelected: boolean;
  handleToggleSelectAll: () => void;
  stats: { images: number; videos: number; documents: number; folders: number };
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: string;
  setFilterType: (v: 'all' | 'image' | 'video' | 'audio' | 'document') => void;
  hideFilter: boolean;
  viewMode: 'grid' | 'large' | 'list';
  setViewMode: (v: 'grid' | 'large' | 'list') => void;
  loading: boolean;
  uploading: boolean;
  onRefresh: () => void;
  onCreateFolder: () => void;
  onUpload: (files: FileList | null) => void;
}

export function MediaGalleryHeader({
  folderPath, navigateToPath, goBack,
  selectionModeActive, setSelectionModeActive, setSelectedItems,
  sortedFilesCount, allSelected, handleToggleSelectAll,
  stats, searchQuery, setSearchQuery,
  filterType, setFilterType, hideFilter,
  viewMode, setViewMode,
  loading, uploading, onRefresh, onCreateFolder, onUpload,
}: MediaGalleryHeaderProps) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigateToPath(0)}>
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Về đầu</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-hide">
            {folderPath.map((item, index) => (
              <div key={item.id} className="flex items-center flex-shrink-0">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-0.5" />}
                <button
                  onClick={() => navigateToPath(index)}
                  className={cn(
                    'px-2 py-1 rounded-md text-sm transition-all whitespace-nowrap',
                    index === folderPath.length - 1
                      ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.name}
                </button>
              </div>
            ))}
          </div>

          {folderPath.length > 1 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={goBack}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quay lại</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Multi-select toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectionModeActive ? 'default' : 'outline'}
                size="sm"
                className={cn('h-9 gap-2 border-0', selectionModeActive ? '' : 'bg-muted/50')}
                onClick={() => { setSelectionModeActive(!selectionModeActive); if (selectionModeActive) setSelectedItems([]); }}
              >
                <MousePointerClick className="h-4 w-4" />
                <span className="hidden sm:inline">Chọn nhiều</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bật/tắt chế độ chọn nhiều</TooltipContent>
          </Tooltip>

          {/* Select all */}
          {selectionModeActive && (
            <Button variant="outline" size="sm" className="h-9 gap-2 border-0 bg-muted/50" onClick={handleToggleSelectAll}>
              {allSelected
                ? <><CheckSquare className="h-4 w-4" /> Bỏ chọn tất cả</>
                : <><Square className="h-4 w-4" /> Chọn tất cả ({sortedFilesCount})</>}
            </Button>
          )}

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-1.5 mr-2 px-3 py-1.5 bg-muted/50 rounded-lg">
            {stats.images > 0 && <div className="flex items-center gap-1 text-emerald-600"><ImageIcon className="h-3.5 w-3.5" /><span className="text-xs font-medium">{stats.images}</span></div>}
            {stats.videos > 0 && <div className="flex items-center gap-1 text-purple-600 ml-2"><Video className="h-3.5 w-3.5" /><span className="text-xs font-medium">{stats.videos}</span></div>}
            {stats.folders > 0 && <div className="flex items-center gap-1 text-amber-600 ml-2"><Folder className="h-3.5 w-3.5" /><span className="text-xs font-medium">{stats.folders}</span></div>}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-[140px] md:w-[180px] h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchQuery('')}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filter */}
          {!hideFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-0 bg-muted/50">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{filterType === 'all' ? 'Tất cả' : typeConfig[filterType as keyof typeof typeConfig]?.label || filterType}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setFilterType('all')} className="gap-2"><Sparkles className="h-4 w-4" /> Tất cả</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterType('image')} className="gap-2"><ImageIcon className="h-4 w-4 text-emerald-500" /> Ảnh</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('video')} className="gap-2"><Video className="h-4 w-4 text-purple-500" /> Video</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('document')} className="gap-2"><FileText className="h-4 w-4 text-blue-500" /> Tài liệu</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* View mode */}
          <div className="flex items-center rounded-lg p-0.5 bg-muted/50">
            {([
              { mode: 'grid' as const, icon: Grid3X3, tip: 'Lưới nhỏ' },
              { mode: 'large' as const, icon: LayoutGrid, tip: 'Lưới lớn' },
              { mode: 'list' as const, icon: List, tip: 'Danh sách' },
            ]).map(({ mode, icon: Icon, tip }) => (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <Button variant={viewMode === mode ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode(mode)}>
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{tip}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRefresh} className="h-9 w-9" disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Làm mới</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onCreateFolder} className="h-9 w-9 border-0 bg-muted/50">
                <FolderPlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tạo folder mới</TooltipContent>
          </Tooltip>

          <label>
            <input type="file" multiple className="hidden" onChange={e => onUpload(e.target.files)} />
            <Button asChild disabled={uploading} className="h-9 gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="hidden sm:inline">Upload</span>
              </span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}
