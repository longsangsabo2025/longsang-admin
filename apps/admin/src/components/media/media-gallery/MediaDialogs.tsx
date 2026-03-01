import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import {
  Loader2, Trash2, Pencil, FolderPlus, Check,
  ChevronRight, Briefcase, Copy, ExternalLink,
} from 'lucide-react';
import type {
  MediaItem, ProjectInfo,
  DeleteDialogState, RenameDialogState,
  CreateFolderDialogState, MoveDialogState, InfoDialogState,
} from './types';
import { formatSize, formatDate, typeConfig } from './utils';

export interface MediaDialogsProps {
  // Delete
  deleteDialog: DeleteDialogState;
  setDeleteDialog: (d: DeleteDialogState) => void;
  onDelete: () => void;
  selectedItems: MediaItem[];
  operationLoading: boolean;
  // Rename
  renameDialog: RenameDialogState;
  setRenameDialog: (d: RenameDialogState) => void;
  onRename: () => void;
  // Create folder
  createFolderDialog: CreateFolderDialogState;
  setCreateFolderDialog: (d: CreateFolderDialogState) => void;
  onCreateFolder: () => void;
  // Move
  moveDialog: MoveDialogState;
  setMoveDialog: (d: MoveDialogState) => void;
  onMove: (destinationId: string) => void;
  projects?: ProjectInfo[];
  projectFolderId?: string;
  // Info
  infoDialog: InfoDialogState;
  setInfoDialog: (d: InfoDialogState) => void;
  onCopyUrl: (item: MediaItem) => void;
}

export function MediaDialogs({
  deleteDialog, setDeleteDialog, onDelete, selectedItems, operationLoading,
  renameDialog, setRenameDialog, onRename,
  createFolderDialog, setCreateFolderDialog, onCreateFolder,
  moveDialog, setMoveDialog, onMove, projects, projectFolderId,
  infoDialog, setInfoDialog, onCopyUrl,
}: MediaDialogsProps) {
  return (
    <>
      {/* ── Delete Confirmation ─────────────────────────────── */}
      <AlertDialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog({ open: false, item: null, permanent: false, bulk: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Xác nhận xóa {deleteDialog.bulk ? `${selectedItems.length} files` : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.bulk ? (
                <>
                  Bạn có chắc muốn xóa <strong>{selectedItems.length} files</strong> đã chọn?
                  <div className="mt-2 max-h-32 overflow-y-auto text-sm bg-muted/50 rounded-lg p-2">
                    {selectedItems.slice(0, 10).map(item => <div key={item.id} className="truncate py-0.5">• {item.name}</div>)}
                    {selectedItems.length > 10 && <div className="text-muted-foreground">... và {selectedItems.length - 10} files khác</div>}
                  </div>
                </>
              ) : (
                <>Bạn có chắc muốn xóa <strong>"{deleteDialog.item?.name}"</strong>?</>
              )}
              <br />
              {deleteDialog.permanent
                ? <span className="text-destructive">File sẽ bị xóa vĩnh viễn và không thể khôi phục.</span>
                : 'File sẽ được chuyển vào thùng rác.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 mr-auto">
              <input type="checkbox" id="permanent-delete" checked={deleteDialog.permanent} onChange={e => setDeleteDialog({ ...deleteDialog, permanent: e.target.checked })} className="rounded" />
              <label htmlFor="permanent-delete" className="text-sm text-muted-foreground cursor-pointer">Xóa vĩnh viễn (không thể khôi phục)</label>
            </div>
            <div className="flex gap-2">
              <AlertDialogCancel disabled={operationLoading}>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} disabled={operationLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {operationLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Xóa {deleteDialog.bulk ? `${selectedItems.length} files` : ''}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Rename ──────────────────────────────────────────── */}
      <Dialog open={renameDialog.open} onOpenChange={open => !open && setRenameDialog({ open: false, item: null, newName: '' })}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden><DialogTitle>Đổi tên file</DialogTitle></VisuallyHidden>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Pencil className="h-5 w-5 text-primary" /></div>
              <div><h3 className="font-semibold">Đổi tên</h3><p className="text-sm text-muted-foreground">Nhập tên mới cho file</p></div>
            </div>
            <Input value={renameDialog.newName} onChange={e => setRenameDialog({ ...renameDialog, newName: e.target.value })} placeholder="Tên mới..." onKeyDown={e => e.key === 'Enter' && onRename()} autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDialog({ open: false, item: null, newName: '' })} disabled={operationLoading}>Hủy</Button>
              <Button onClick={onRename} disabled={operationLoading || !renameDialog.newName.trim()}>
                {operationLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}Lưu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Folder ───────────────────────────────────── */}
      <Dialog open={createFolderDialog.open} onOpenChange={open => !open && setCreateFolderDialog({ open: false, name: '' })}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden><DialogTitle>Tạo Folder mới</DialogTitle></VisuallyHidden>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><FolderPlus className="h-5 w-5 text-amber-500" /></div>
              <div><h3 className="font-semibold">Tạo Folder mới</h3><p className="text-sm text-muted-foreground">Folder sẽ được tạo trong thư mục hiện tại</p></div>
            </div>
            <Input value={createFolderDialog.name} onChange={e => setCreateFolderDialog({ ...createFolderDialog, name: e.target.value })} placeholder="Tên folder..." onKeyDown={e => e.key === 'Enter' && onCreateFolder()} autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateFolderDialog({ open: false, name: '' })} disabled={operationLoading}>Hủy</Button>
              <Button onClick={onCreateFolder} disabled={operationLoading || !createFolderDialog.name.trim()}>
                {operationLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FolderPlus className="h-4 w-4 mr-2" />}Tạo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Move ────────────────────────────────────────────── */}
      <Dialog open={moveDialog.open} onOpenChange={open => { if (!open) setMoveDialog({ open: false, item: null, bulk: false }); }}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden><DialogTitle>Di chuyển file vào Project</DialogTitle></VisuallyHidden>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Briefcase className="h-5 w-5 text-blue-500" /></div>
              <div>
                <h3 className="font-semibold">{moveDialog.bulk ? `Di chuyển ${selectedItems.length} files` : `Di chuyển "${moveDialog.item?.name}"`}</h3>
                <p className="text-sm text-muted-foreground">Chọn Project đích</p>
              </div>
            </div>
            <ScrollArea className="h-72 border rounded-lg">
              <div className="p-2 space-y-1">
                {projects && projects.length > 0 ? projects.map(project => (
                  <button key={project.id} onClick={() => onMove(project.folderId)} disabled={operationLoading || project.folderId === projectFolderId}
                    className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left disabled:opacity-50', project.folderId === projectFolderId ? 'bg-muted/50 cursor-not-allowed' : 'hover:bg-muted')}>
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-lg', project.color)}>{project.icon}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{project.name}</span>
                      {project.folderId === projectFolderId && <span className="text-xs text-muted-foreground">Project hiện tại</span>}
                    </div>
                    {project.folderId !== projectFolderId && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </button>
                )) : (
                  <div className="text-center py-8 text-muted-foreground text-sm"><Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Không có Project nào</p></div>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMoveDialog({ open: false, item: null, bulk: false })}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── File Info ────────────────────────────────────────── */}
      <Dialog open={infoDialog.open} onOpenChange={open => !open && setInfoDialog({ open: false, item: null })}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden><DialogTitle>Thông tin file</DialogTitle></VisuallyHidden>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', infoDialog.item ? typeConfig[infoDialog.item.type].bg : '')}>
                {infoDialog.item && (() => { const Icon = typeConfig[infoDialog.item.type].icon; return <Icon className={cn('h-6 w-6', typeConfig[infoDialog.item.type].color)} />; })()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{infoDialog.item?.name}</h3>
                <Badge className={cn('mt-1', infoDialog.item ? typeConfig[infoDialog.item.type].bg : '', infoDialog.item ? typeConfig[infoDialog.item.type].color : '')}>
                  {infoDialog.item ? typeConfig[infoDialog.item.type].label : ''}
                </Badge>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Loại file</span><span className="font-medium">{infoDialog.item?.mimeType || 'N/A'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Kích thước</span><span className="font-medium">{formatSize(infoDialog.item?.size) || 'N/A'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Ngày sửa đổi</span><span className="font-medium">{infoDialog.item?.modifiedTime ? formatDate(infoDialog.item.modifiedTime) : 'N/A'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{infoDialog.item?.id}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { if (infoDialog.item) onCopyUrl(infoDialog.item); }}><Copy className="h-4 w-4 mr-2" /> Copy URL</Button>
              <Button variant="outline" className="flex-1" onClick={() => infoDialog.item && window.open(infoDialog.item.url, '_blank')}><ExternalLink className="h-4 w-4 mr-2" /> Mở Drive</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
