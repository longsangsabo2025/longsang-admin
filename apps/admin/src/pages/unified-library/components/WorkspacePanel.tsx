/**
 * 🗂️ WorkspacePanel — Workspace tab content with drag/drop, context menus
 */

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { TabsContent } from '@/components/ui/tabs';
import {
  Briefcase, Copy, Trash2, X, GripVertical,
  Play, FileText, ExternalLink, Package,
  Wand2, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import type { MediaItem } from '@/components/media/MediaGallery';
import type { WorkspaceItem, ProductStatus } from '@/hooks/library';

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

type WorkspaceItemWithMeta = WorkspaceItem & { description?: string; tags?: string[] };

export interface WorkspacePanelProps {
  workspaceItems: WorkspaceItem[];
  clearWorkspace: () => void;
  removeFromWorkspace: (id: string) => void;
  handleDragStart: (e: React.DragEvent, items: MediaItem[]) => void;
  addToProducts: (items: MediaItem[], status: ProductStatus) => void;
  navigate: (path: string, options?: { state?: unknown }) => void;
  setScheduleImage: (img: { url: string; name?: string; description?: string; tags?: string[] } | null) => void;
  setScheduleModalOpen: (open: boolean) => void;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function WorkspacePanel({
  workspaceItems,
  clearWorkspace,
  removeFromWorkspace,
  handleDragStart,
  addToProducts,
  navigate,
  setScheduleImage,
  setScheduleModalOpen,
}: WorkspacePanelProps) {
  return (
    <TabsContent value="workspace" className="flex-1 mt-2">
      <Card className="h-[calc(100vh-140px)] min-h-[700px]">
        <CardContent className="p-4 h-full">
          {/* Header with actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Workspace ({workspaceItems.length} files)</h3>
            </div>
            {workspaceItems.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  const urls = workspaceItems.map(f => f.url || `https://drive.google.com/file/d/${f.id}/view`).join('\n');
                  navigator.clipboard.writeText(urls);
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URLs
                </Button>
                <Button size="sm" variant="destructive" onClick={clearWorkspace}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa tất cả
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="h-[calc(100%-60px)]">
            {workspaceItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Workspace trống</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Chọn files từ các tab khác để thêm vào workspace. <br />
                  Bạn có thể thu thập files từ nhiều nguồn khác nhau để làm việc.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {workspaceItems.map((rawItem) => {
                  const item = rawItem as WorkspaceItemWithMeta;
                  return (
                    <ContextMenu key={item.id}>
                      <ContextMenuTrigger>
                        <div 
                          className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, [item])}
                        >
                          {/* Drag handle indicator */}
                          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-70 transition-opacity">
                            <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
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
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFromWorkspace(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>

                            {/* Type badge */}
                            <Badge 
                              variant="secondary" 
                              className="absolute bottom-2 left-2 text-xs capitalize"
                            >
                              {item.type}
                            </Badge>
                          </div>

                          {/* Info */}
                          <div className="p-2">
                            <p className="text-xs font-medium truncate" title={item.name}>
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Thêm lúc {format(new Date(item.addedAt), 'HH:mm dd/MM', { locale: vi })}
                            </p>
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <ContextMenuItem onClick={() => {
                          navigate('/admin/ai-generator', { state: { selectedImage: item } });
                          toast.success('Đang mở AI Image Generator...');
                        }}>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Mở với AI Generator
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => {
                          setScheduleImage({
                            url: item.url || `https://drive.google.com/file/d/${item.id}/view`,
                            name: item.name,
                            description: item.description,
                            tags: item.tags,
                          });
                          setScheduleModalOpen(true);
                        }}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Thêm vào Lịch đăng bài
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => addToProducts([item], 'draft')}>
                          <Package className="h-4 w-4 mr-2" />
                          Chuyển sang Sản phẩm
                        </ContextMenuItem>
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
                          onClick={() => removeFromWorkspace(item.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa khỏi Workspace
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
    </TabsContent>
  );
}
