import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { googleDriveAPI, type DriveFile, type DriveFolder } from '@/lib/api/google-drive-http';
import { cn } from '@/lib/utils';
import {
  Upload, Image as ImageIcon, Video,
  FolderOpen, Loader2, Check, Eye, Copy, ExternalLink,
  Sparkles, Zap, Play, Maximize2, MoreVertical,
  Trash2, Download, Pencil, FolderInput, Info,
  Square, ChevronDown, ChevronRight,
  Briefcase, Package, FolderPlus as FolderPlusIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  MediaItem, ProjectInfo, MediaGalleryProps,
  DeleteDialogState, RenameDialogState,
  CreateFolderDialogState, MoveDialogState, InfoDialogState,
} from './media-gallery/types';
import { driveFileToMediaItem, getPreviewUrl, formatSize, formatDate, typeConfig } from './media-gallery/utils';
import { LazyImage } from './media-gallery/LazyImage';
import { MediaGalleryHeader } from './media-gallery/MediaGalleryHeader';
import { BulkActionsBar } from './media-gallery/BulkActionsBar';
import { MediaPreviewDialog } from './media-gallery/MediaPreviewDialog';
import { MediaDialogs } from './media-gallery/MediaDialogs';

// Re-export types for consumers
export type { ProjectInfo, MediaItem } from './media-gallery/types';

export function MediaGallery({
  projectSlug, projectFolderId,
  onSelectMedia, selectionMode = false, maxSelection = 10,
  filterType: externalFilterType, hideFilter = false,
  onAddToWorkspace, onAddToProducts, projects, onAddToProject,
}: MediaGalleryProps) {
  // ── State ──────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'large' | 'list'>('large');
  const [internalFilterType, setInternalFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  const filterType = externalFilterType ?? internalFilterType;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(projectFolderId || 'root');
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: projectFolderId || 'root', name: projectSlug || 'Thư Viện' },
  ]);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, item: null, permanent: false, bulk: false });
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({ open: false, item: null, newName: '' });
  const [createFolderDialog, setCreateFolderDialog] = useState<CreateFolderDialogState>({ open: false, name: '' });
  const [moveDialog, setMoveDialog] = useState<MoveDialogState>({ open: false, item: null, bulk: false });
  const [infoDialog, setInfoDialog] = useState<InfoDialogState>({ open: false, item: null });
  const [operationLoading, setOperationLoading] = useState(false);
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // ── Data loading ───────────────────────────────────────────
  useEffect(() => {
    if (projectFolderId) {
      setCurrentFolderId(projectFolderId);
      setFolderPath([{ id: projectFolderId, name: projectSlug || 'Thư Viện' }]);
    }
  }, [projectFolderId, projectSlug]);

  const loadFilesByType = useCallback(async (type: string, folderId?: string, useRecursive?: boolean) => {
    setLoading(true);
    try {
      const endpoint = useRecursive ? 'search-recursive' : 'search-by-type';
      const url = folderId
        ? `${API_BASE}/api/drive/${endpoint}/${type}?folderId=${folderId}&limit=200`
        : `${API_BASE}/api/drive/${endpoint}/${type}?limit=200`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.files) {
        setFiles(data.files.map((f: DriveFile) => driveFileToMediaItem(f)));
        setFolders([]);
      } else { setFiles([]); setFolders([]); }
    } catch { toast.error('Không thể tải media theo loại'); setFiles([]); setFolders([]); }
    finally { setLoading(false); }
  }, [API_BASE]);

  const loadFiles = useCallback(async (folderId: string) => {
    setLoading(true);
    try {
      const result = await googleDriveAPI.listFiles(folderId);
      setFiles((result.files || []).map(driveFileToMediaItem));
      setFolders(result.folders || []);
    } catch { toast.error('Không thể tải thư viện media'); }
    finally { setLoading(false); }
  }, []);

  const useRecursiveSearch = !projectSlug && !!projectFolderId;
  useEffect(() => {
    if (useRecursiveSearch) {
      loadFilesByType(externalFilterType && externalFilterType !== 'all' ? externalFilterType : 'all', projectFolderId, true);
    } else if (externalFilterType && externalFilterType !== 'all') {
      loadFilesByType(externalFilterType, projectFolderId, false);
    } else { loadFiles(currentFolderId); }
  }, [currentFolderId, externalFilterType, projectFolderId, projectSlug]);

  // ── Navigation ─────────────────────────────────────────────
  const navigateToFolder = (folder: DriveFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
  };
  const goBack = () => {
    if (folderPath.length > 1) {
      const newPath = [...folderPath]; newPath.pop();
      setFolderPath(newPath); setCurrentFolderId(newPath[newPath.length - 1].id);
    }
  };
  const navigateToPath = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath); setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  // ── Selection & interaction ────────────────────────────────
  const toggleSelection = (item: MediaItem) => {
    if (!selectionMode && !onSelectMedia) { setPreviewItem(item); return; }
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      if (prev.length >= maxSelection) { toast.error(`Chỉ có thể chọn tối đa ${maxSelection} items`); return prev; }
      return [...prev, item];
    });
  };
  const clearSelection = () => { setSelectedItems([]); setSelectionModeActive(false); };

  const handleUpload = async (uploadFiles: FileList | null) => {
    if (!uploadFiles?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(uploadFiles)) { await googleDriveAPI.uploadFile(file, currentFolderId); toast.success(`✓ ${file.name}`); }
      loadFiles(currentFolderId);
    } catch { toast.error('Upload thất bại'); }
    finally { setUploading(false); setIsDragging(false); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleUpload(e.dataTransfer.files); };

  const copyUrl = (item: MediaItem) => {
    const directUrl = item.type === 'image' ? `https://drive.google.com/thumbnail?id=${item.id}&sz=w1000` : item.url;
    navigator.clipboard.writeText(directUrl);
    toast.success('Đã copy URL');
  };

  // ── File operations ────────────────────────────────────────
  const handleDownload = async (item: MediaItem) => {
    try {
      toast.info(`Đang tải ${item.name}...`);
      const blob = await googleDriveAPI.downloadFile(item.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = item.name;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('Tải xuống thành công');
    } catch { toast.error('Không thể tải xuống'); }
  };

  const handleDelete = async () => {
    if (deleteDialog.bulk) {
      setOperationLoading(true);
      const deletedIds = new Set<string>();
      try {
        let ok = 0, fail = 0;
        for (const item of selectedItems) {
          try { await googleDriveAPI.trashFile(item.id, deleteDialog.permanent); deletedIds.add(item.id); ok++; } catch { fail++; }
        }
        if (deletedIds.size > 0) setFiles(prev => prev.filter(f => !deletedIds.has(f.id)));
        if (ok > 0) toast.success(`Đã ${deleteDialog.permanent ? 'xóa vĩnh viễn' : 'chuyển vào thùng rác'} ${ok} files`);
        if (fail > 0) toast.error(`Không thể xóa ${fail} files`);
        setDeleteDialog({ open: false, item: null, permanent: false, bulk: false }); clearSelection();
      } catch { toast.error('Không thể xóa files'); }
      finally { setOperationLoading(false); }
      return;
    }
    if (!deleteDialog.item) return;
    setOperationLoading(true);
    try {
      await googleDriveAPI.trashFile(deleteDialog.item.id, deleteDialog.permanent);
      setFiles(prev => prev.filter(f => f.id !== deleteDialog.item!.id));
      toast.success(deleteDialog.permanent ? 'Đã xóa vĩnh viễn' : 'Đã chuyển vào thùng rác');
      setDeleteDialog({ open: false, item: null, permanent: false, bulk: false });
    } catch { toast.error('Không thể xóa file'); }
    finally { setOperationLoading(false); }
  };

  const handleRename = async () => {
    if (!renameDialog.item || !renameDialog.newName.trim()) return;
    setOperationLoading(true);
    try {
      await googleDriveAPI.renameFile(renameDialog.item.id, renameDialog.newName.trim());
      setFiles(prev => prev.map(f => f.id === renameDialog.item!.id ? { ...f, name: renameDialog.newName.trim() } : f));
      toast.success('Đã đổi tên thành công');
      setRenameDialog({ open: false, item: null, newName: '' });
    } catch { toast.error('Không thể đổi tên'); }
    finally { setOperationLoading(false); }
  };

  const handleCreateFolder = async () => {
    if (!createFolderDialog.name.trim()) return;
    setOperationLoading(true);
    try {
      const result: DriveFolder & { existed?: boolean } = await googleDriveAPI.createFolder(createFolderDialog.name.trim(), currentFolderId);
      if (result.existed) {
        toast.info(`Folder "${result.name}" đã tồn tại`);
      } else {
        toast.success(`Đã tạo folder "${result.name}"`);
      }
      setCreateFolderDialog({ open: false, name: '' });
      loadFiles(currentFolderId);
    } catch { toast.error('Không thể tạo folder'); }
    finally { setOperationLoading(false); }
  };

  const handleMove = async (destinationId: string) => {
    setOperationLoading(true);
    try {
      if (moveDialog.bulk && selectedItems.length > 0) {
        const movedIds = new Set<string>(); let ok = 0, fail = 0;
        for (const item of selectedItems) { try { await googleDriveAPI.moveFile(item.id, destinationId); movedIds.add(item.id); ok++; } catch { fail++; } }
        if (movedIds.size > 0) setFiles(prev => prev.filter(f => !movedIds.has(f.id)));
        if (ok > 0) toast.success(`Đã di chuyển ${ok} files`);
        if (fail > 0) toast.error(`Không thể di chuyển ${fail} files`);
        clearSelection();
      } else if (moveDialog.item) {
        await googleDriveAPI.moveFile(moveDialog.item.id, destinationId);
        setFiles(prev => prev.filter(f => f.id !== moveDialog.item!.id));
        toast.success('Đã di chuyển thành công');
      }
      setMoveDialog({ open: false, item: null, bulk: false });
    } catch { toast.error('Không thể di chuyển'); }
    finally { setOperationLoading(false); }
  };

  const openRenameDialog = (item: MediaItem) => {
    setRenameDialog({ open: true, item, newName: item.name });
  };

  // ── Computed values ────────────────────────────────────────
  const getFileProject = (file: MediaItem): ProjectInfo | null =>
    file.parentFolderId && projects ? projects.find(p => p.folderId === file.parentFolderId) || null : null;

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || f.type === filterType));

  const sortedFiles = !projectSlug && projects
    ? [...filteredFiles].sort((a, b) => {
        const pA = getFileProject(a), pB = getFileProject(b);
        if (!pA && pB) return -1; if (pA && !pB) return 1;
        if (pA && pB) return pA.name.localeCompare(pB.name);
        return 0;
      })
    : filteredFiles;

  const handleToggleSelectAll = () =>
    setSelectedItems(selectedItems.length === sortedFiles.length ? [] : [...sortedFiles]);

  const filteredFolders = filterType === 'all'
    ? folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const stats = {
    images: files.filter(f => f.type === 'image').length,
    videos: files.filter(f => f.type === 'video').length,
    documents: files.filter(f => f.type === 'document').length,
    folders: folders.length,
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="h-full flex flex-col relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/5 border-2 border-dashed border-primary rounded-xl flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-10 w-10 text-primary animate-bounce" />
              </div>
              <p className="text-xl font-semibold">Thả files vào đây</p>
              <p className="text-muted-foreground">Để upload lên thư viện</p>
            </div>
          </div>
        )}

        {/* Header toolbar */}
        <MediaGalleryHeader
          folderPath={folderPath} navigateToPath={navigateToPath} goBack={goBack}
          selectionModeActive={selectionModeActive} setSelectionModeActive={setSelectionModeActive}
          setSelectedItems={setSelectedItems}
          sortedFilesCount={sortedFiles.length} allSelected={selectedItems.length === sortedFiles.length && sortedFiles.length > 0}
          handleToggleSelectAll={handleToggleSelectAll}
          stats={stats} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          filterType={filterType} setFilterType={setInternalFilterType} hideFilter={hideFilter}
          viewMode={viewMode} setViewMode={setViewMode}
          loading={loading} uploading={uploading}
          onRefresh={() => loadFiles(currentFolderId)}
          onCreateFolder={() => setCreateFolderDialog({ open: true, name: '' })}
          onUpload={handleUpload}
        />

        {/* Bulk actions bar */}
        {selectionModeActive && selectedItems.length > 0 && (
          <BulkActionsBar
            selectedItems={selectedItems} clearSelection={clearSelection}
            onAddToWorkspace={onAddToWorkspace} onAddToProducts={onAddToProducts}
            projects={projects} onAddToProject={onAddToProject}
            onDownload={handleDownload}
            onOpenDeleteDialog={() => setDeleteDialog({ open: true, item: null, permanent: false, bulk: true })}
            onOpenMoveDialog={() => setMoveDialog({ open: true, item: null, bulk: true })}
          />
        )}

        {/* ── Content grid ──────────────────────────────────── */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <Sparkles className="h-5 w-5 absolute -top-1 -right-1 text-amber-500 animate-pulse" />
              </div>
              <p className="text-muted-foreground">Đang tải thư viện...</p>
            </div>
          ) : (
            <div className={cn(
              'animate-in fade-in duration-300',
              viewMode === 'grid' && 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2',
              viewMode === 'large' && 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3',
              viewMode === 'list' && 'space-y-1',
            )}>
              {/* Folders */}
              {filteredFolders.map(folder => (
                <div key={folder.id}
                  className={cn(
                    'group cursor-pointer rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                    'bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-orange-500/5',
                    'border border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10',
                    viewMode === 'list' ? 'flex items-center gap-3 p-3' : 'p-3 relative',
                  )}
                  onClick={() => navigateToFolder(folder)} role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigateToFolder(folder)}>
                  <div className={cn('flex items-center justify-center', viewMode !== 'list' && 'mb-2')}>
                    <div className="relative">
                      <FolderOpen className={cn('text-amber-500 transition-transform duration-200 group-hover:scale-110', viewMode === 'large' ? 'h-14 w-14' : viewMode === 'grid' ? 'h-10 w-10' : 'h-8 w-8')} />
                      <Zap className="h-3 w-3 absolute -top-1 -right-1 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('font-medium truncate', viewMode === 'large' ? 'text-sm' : 'text-xs')}>{folder.name}</p>
                    {viewMode === 'list' && <p className="text-xs text-muted-foreground">Folder</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"
                        className={cn('h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity', viewMode !== 'list' ? 'absolute top-2 right-2' : '')}
                        onClick={e => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); setRenameDialog({ open: true, item: { id: folder.id, name: folder.name, url: '', mimeType: 'folder', type: 'folder' }, newName: folder.name }); }} className="gap-2">
                        <Pencil className="h-4 w-4" /> Đổi tên
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteDialog({ open: true, item: { id: folder.id, name: folder.name, url: '', mimeType: 'folder', type: 'folder' }, permanent: false }); }} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Xóa folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {/* Files */}
              {sortedFiles.map(file => {
                const isSelected = selectedItems.some(i => i.id === file.id);
                const config = typeConfig[file.type];
                const Icon = config.icon;
                const fileProject = getFileProject(file);
                return (
                  <div key={file.id}
                    className={cn(
                      'group cursor-pointer rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                      viewMode === 'list' && 'flex items-center gap-3 p-2 hover:bg-muted/50',
                      viewMode !== 'list' && 'hover:shadow-xl',
                      isSelected ? `ring-2 ring-primary shadow-lg shadow-primary/20 ${config.border} border` : 'border border-transparent hover:border-primary/20',
                    )}
                    onClick={() => toggleSelection(file)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && toggleSelection(file)}>
                    {/* Thumbnail (grid/large) */}
                    {viewMode !== 'list' ? (
                      <div className={cn('relative bg-muted/30 overflow-hidden', viewMode === 'large' ? 'aspect-[4/3]' : 'aspect-square')}>
                        {file.type === 'image' ? (
                          <LazyImage src={getPreviewUrl(file, viewMode === 'large' ? 'medium' : 'small')} alt={file.name} className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                            fallbackIcon={<ImageIcon className={cn(viewMode === 'large' ? 'h-10 w-10' : 'h-6 w-6', 'text-muted-foreground/40')} />} />
                        ) : file.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <LazyImage src={getPreviewUrl(file, viewMode === 'large' ? 'medium' : 'small')} alt={file.name} className="w-full h-full"
                              fallbackIcon={<Video className={cn(viewMode === 'large' ? 'h-10 w-10' : 'h-6 w-6', 'text-purple-500/40')} />} />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg"><Play className="h-5 w-5 text-purple-600 fill-purple-600 ml-0.5" /></div>
                            </div>
                          </div>
                        ) : (
                          <div className={cn('w-full h-full flex flex-col items-center justify-center gap-2', config.bg)}>
                            <Icon className={cn(viewMode === 'large' ? 'h-12 w-12' : 'h-8 w-8', config.color)} />
                          </div>
                        )}

                        {/* Selection checkbox */}
                        {selectionModeActive && (
                          <div className={cn('absolute top-2 left-2 h-6 w-6 rounded-md flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer z-10',
                            isSelected ? 'bg-primary text-white' : 'bg-white/90 hover:bg-white border border-gray-300')}
                            onClick={e => { e.stopPropagation(); toggleSelection(file); }}>
                            {isSelected ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4 text-gray-400" />}
                          </div>
                        )}
                        {!selectionModeActive && isSelected && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}

                        {/* Project color dot */}
                        {!projectSlug && fileProject && !isSelected && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn('absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white/80 cursor-help', fileProject.color)}>
                                <span className="text-[8px]">{fileProject.icon}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs"><p>{fileProject.name}</p></TooltipContent>
                          </Tooltip>
                        )}

                        {/* Type badge */}
                        <div className="absolute bottom-2 left-2">
                          <Badge className={cn('text-[10px] px-1.5 py-0 shadow-sm backdrop-blur-sm', config.bg, config.color, 'border', config.border)}>{config.label}</Badge>
                        </div>

                        {/* Hover actions overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                            {projects && projects.length > 0 && onAddToProject && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg shadow-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white" onClick={e => e.stopPropagation()}>
                                    <FolderPlusIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right" align="start" className="w-48">
                                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">📁 Thêm vào dự án</div>
                                  <DropdownMenuSeparator />
                                  {projects.map(p => (
                                    <DropdownMenuItem key={p.slug} onClick={e => { e.stopPropagation(); onAddToProject([file], p); }} className="gap-2 cursor-pointer text-xs">
                                      <span>{p.icon}</span><span className="flex-1 truncate">{p.name}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            {onAddToWorkspace && (
                              <TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild>
                                <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg shadow-lg bg-blue-500 hover:bg-blue-600 text-white" onClick={e => { e.stopPropagation(); onAddToWorkspace([file]); }}>
                                  <Briefcase className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger><TooltipContent side="right"><p>Workspace</p></TooltipContent></Tooltip></TooltipProvider>
                            )}
                            {onAddToProducts && (
                              <TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild>
                                <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg shadow-lg bg-green-500 hover:bg-green-600 text-white" onClick={e => { e.stopPropagation(); onAddToProducts([file]); }}>
                                  <Package className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger><TooltipContent side="right"><p>Sản phẩm</p></TooltipContent></Tooltip></TooltipProvider>
                            )}
                          </div>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                            <TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild>
                              <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg shadow-lg" onClick={e => { e.stopPropagation(); setPreviewItem(file); }}>
                                <Maximize2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger><TooltipContent side="left"><p>Xem</p></TooltipContent></Tooltip></TooltipProvider>
                            <TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild>
                              <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg shadow-lg" onClick={e => { e.stopPropagation(); copyUrl(file); }}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger><TooltipContent side="left"><p>Copy URL</p></TooltipContent></Tooltip></TooltipProvider>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="left" align="start" className="w-44">
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDownload(file); }} className="gap-2 text-xs"><Download className="h-3.5 w-3.5" /> Tải xuống</DropdownMenuItem>
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); openRenameDialog(file); }} className="gap-2 text-xs"><Pencil className="h-3.5 w-3.5" /> Đổi tên</DropdownMenuItem>
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); setMoveDialog({ open: true, item: file }); }} className="gap-2 text-xs"><FolderInput className="h-3.5 w-3.5" /> Di chuyển</DropdownMenuItem>
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); setInfoDialog({ open: true, item: file }); }} className="gap-2 text-xs"><Info className="h-3.5 w-3.5" /> Thông tin</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); window.open(file.url, '_blank'); }} className="gap-2 text-xs"><ExternalLink className="h-3.5 w-3.5" /> Mở trong Drive</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteDialog({ open: true, item: file, permanent: false }); }} className="gap-2 text-xs text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Xóa</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* List view thumbnail */
                      <div className={cn('h-11 w-11 rounded-lg flex-shrink-0 overflow-hidden', config.bg, 'border', config.border)}>
                        {(file.type === 'image' || file.type === 'video') ? (
                          <LazyImage src={getPreviewUrl(file, 'small')} className="h-full w-full" fallbackIcon={<Icon className={cn('h-5 w-5', config.color)} />} />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><Icon className={cn('h-5 w-5', config.color)} /></div>
                        )}
                      </div>
                    )}

                    {/* File info */}
                    <div className={cn('min-w-0', viewMode !== 'list' ? 'p-2' : 'flex-1')}>
                      <p className="font-medium truncate text-sm">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {file.size && <span>{formatSize(file.size)}</span>}
                        {file.modifiedTime && viewMode === 'list' && <span>• {formatDate(file.modifiedTime)}</span>}
                      </div>
                    </div>

                    {/* List view actions */}
                    {viewMode === 'list' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setPreviewItem(file); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); handleDownload(file); }}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); copyUrl(file); }}><Copy className="h-4 w-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); openRenameDialog(file); }} className="gap-2"><Pencil className="h-4 w-4" /> Đổi tên</DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setMoveDialog({ open: true, item: file }); }} className="gap-2"><FolderInput className="h-4 w-4" /> Di chuyển</DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setInfoDialog({ open: true, item: file }); }} className="gap-2"><Info className="h-4 w-4" /> Thông tin</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); window.open(file.url, '_blank'); }} className="gap-2"><ExternalLink className="h-4 w-4" /> Mở trong Drive</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteDialog({ open: true, item: file, permanent: false }); }} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" /> Xóa</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {sortedFiles.length === 0 && filteredFolders.length === 0 && (
                <div className="col-span-full text-center py-16 animate-in fade-in duration-300">
                  <div className="relative inline-block mb-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"><FolderOpen className="h-12 w-12 text-muted-foreground/50" /></div>
                    <Sparkles className="h-6 w-6 absolute -top-1 -right-1 text-amber-500/60" />
                  </div>
                  <p className="text-lg font-medium mb-2">Thư viện trống</p>
                  <p className="text-muted-foreground mb-6">Kéo thả hoặc click để upload files</p>
                  <label>
                    <input type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
                    <Button asChild size="lg" className="gap-2 shadow-lg"><span><Upload className="h-5 w-5" /> Upload ngay</span></Button>
                  </label>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Selection footer */}
        {(selectionMode || onSelectMedia) && selectedItems.length > 0 && (
          <div className="mt-4 pt-4 border-t bg-gradient-to-r from-primary/5 to-primary/10 -mx-4 px-4 pb-2 rounded-b-xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {selectedItems.slice(0, 4).map(item => (
                    <div key={item.id} className="h-10 w-10 rounded-lg border-2 border-background overflow-hidden shadow-sm">
                      {(item.type === 'image' || item.type === 'video') ? (
                        <LazyImage src={getPreviewUrl(item, 'small')} className="h-full w-full"
                          fallbackIcon={(() => { const I = typeConfig[item.type].icon; return <I className="h-5 w-5 text-muted-foreground/40" />; })()} />
                      ) : (
                        <div className={cn('h-full w-full flex items-center justify-center', typeConfig[item.type].bg)}>
                          {(() => { const I = typeConfig[item.type].icon; return <I className="h-5 w-5" />; })()}
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedItems.length > 4 && <div className="h-10 w-10 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-sm font-medium shadow-sm">+{selectedItems.length - 4}</div>}
                </div>
                <div><p className="font-medium">Đã chọn {selectedItems.length} files</p><p className="text-xs text-muted-foreground">Sẵn sàng sử dụng</p></div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelectedItems([])}>Bỏ chọn</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2 shadow-lg"><Zap className="h-4 w-4" /> Thao tác<ChevronDown className="h-3 w-3 ml-1" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {onSelectMedia && (
                      <><DropdownMenuItem onClick={() => { onSelectMedia(selectedItems); setSelectedItems([]); }} className="gap-2"><Check className="h-4 w-4 text-green-500" /> Sử dụng ({selectedItems.length})</DropdownMenuItem><DropdownMenuSeparator /></>
                    )}
                    <DropdownMenuItem onClick={async () => { toast.info(`Đang tải ${selectedItems.length} files...`); for (const item of selectedItems) await handleDownload(item); toast.success(`Đã tải xong ${selectedItems.length} files`); }} className="gap-2">
                      <Download className="h-4 w-4 text-blue-500" /> Tải xuống
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { const urls = selectedItems.map(i => i.type === 'image' ? `https://drive.google.com/thumbnail?id=${i.id}&sz=w1000` : i.url).join('\n'); navigator.clipboard.writeText(urls); toast.success(`Đã copy ${selectedItems.length} URLs`); }} className="gap-2">
                      <Copy className="h-4 w-4 text-cyan-500" /> Copy URLs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMoveDialog({ open: true, item: null, bulk: true })} className="gap-2"><FolderInput className="h-4 w-4 text-amber-500" /> Di chuyển</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, item: null, permanent: false, bulk: true })} className="gap-2 text-red-500 focus:text-red-500"><Trash2 className="h-4 w-4" /> Xóa</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}

        {/* Preview dialog */}
        <MediaPreviewDialog
          previewItem={previewItem} onClose={() => setPreviewItem(null)}
          onDownload={handleDownload} onCopyUrl={copyUrl}
          onSelectMedia={onSelectMedia} onToggleSelection={toggleSelection}
        />

        {/* Operation dialogs */}
        <MediaDialogs
          deleteDialog={deleteDialog} setDeleteDialog={setDeleteDialog} onDelete={handleDelete}
          selectedItems={selectedItems} operationLoading={operationLoading}
          renameDialog={renameDialog} setRenameDialog={setRenameDialog} onRename={handleRename}
          createFolderDialog={createFolderDialog} setCreateFolderDialog={setCreateFolderDialog} onCreateFolder={handleCreateFolder}
          moveDialog={moveDialog} setMoveDialog={setMoveDialog} onMove={handleMove}
          projects={projects} projectFolderId={projectFolderId}
          infoDialog={infoDialog} setInfoDialog={setInfoDialog} onCopyUrl={copyUrl}
        />
      </div>
    </TooltipProvider>
  );
}

export default MediaGallery;
