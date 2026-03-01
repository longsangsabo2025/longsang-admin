/**
 * 📂 BrowserPanel — Media browser tabs (all/image/video/document/audio/file)
 */

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import {
  FileText, Music, Folder, FolderOpen,
  Eye, Copy, ExternalLink, Clock,
  Upload, Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MediaGallery, type MediaItem } from '@/components/media/MediaGallery';
import { PROJECTS_LIST, type ViewMode, type ProjectInfo } from '@/hooks/library';
import { getSourceIcon, type UnifiedAsset } from '../shared';

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

export interface BrowserPanelProps {
  selectedProject: string | null;
  projectFolderId: string;
  handleSelectMedia: (files: MediaItem[]) => void;
  addToWorkspace: (items: MediaItem[]) => void;
  addToProducts: (items: MediaItem[]) => void;
  handleAddToProject: (items: MediaItem[], project: ProjectInfo) => Promise<void>;
  viewMode: ViewMode;
  loading: boolean;
  filteredDocuments: UnifiedAsset[];
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function BrowserPanel({
  selectedProject,
  projectFolderId,
  handleSelectMedia,
  addToWorkspace,
  addToProducts,
  handleAddToProject,
  viewMode,
  loading,
  filteredDocuments,
}: BrowserPanelProps) {
  return (
    <>
      {/* ALL / IMAGES / VIDEOS TAB - Use MediaGallery */}
      <TabsContent value="all" className="flex-1 mt-2">
        <Card className="h-[calc(100vh-140px)] min-h-[700px]">
          <CardContent className="p-4 h-full">
            <MediaGallery
              projectSlug={selectedProject || undefined}
              projectFolderId={projectFolderId}
              onSelectMedia={handleSelectMedia}
              filterType="all"
              onAddToWorkspace={addToWorkspace}
              onAddToProducts={addToProducts}
              projects={PROJECTS_LIST}
              onAddToProject={handleAddToProject}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="image" className="flex-1 mt-2">
        <Card className="h-[calc(100vh-140px)] min-h-[700px]">
          <CardContent className="p-4 h-full">
            <MediaGallery
              projectSlug={selectedProject || undefined}
              projectFolderId={projectFolderId}
              onSelectMedia={handleSelectMedia}
              filterType="image"
              hideFilter
              onAddToWorkspace={addToWorkspace}
              onAddToProducts={addToProducts}
              projects={PROJECTS_LIST}
              onAddToProject={handleAddToProject}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="video" className="flex-1 mt-2">
        <Card className="h-[calc(100vh-140px)] min-h-[700px]">
          <CardContent className="p-4 h-full">
            <MediaGallery
              projectSlug={selectedProject || undefined}
              projectFolderId={projectFolderId}
              onSelectMedia={handleSelectMedia}
              filterType="video"
              hideFilter
              onAddToWorkspace={addToWorkspace}
              onAddToProducts={addToProducts}
              projects={PROJECTS_LIST}
              onAddToProject={handleAddToProject}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* DOCUMENTS TAB */}
      <TabsContent value="document" className="flex-1 mt-2">
        <Card className="h-[calc(100vh-140px)] min-h-[700px]">
          <CardContent className="p-4 h-full">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Chưa có tài liệu</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sử dụng Knowledge Harvesters để thu thập từ YouTube, News...
                  </p>
                  <Button className="mt-4" variant="outline" asChild>
                    <a href="/admin/brain">Đi đến AI Second Brain</a>
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
                  {filteredDocuments.map((doc) => {
                    const SourceIcon = getSourceIcon(doc.source);
                    
                    if (viewMode === 'grid') {
                      return (
                        <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                          <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center relative">
                            <FileText className="h-12 w-12 text-blue-500" />
                            <Badge className="absolute top-2 right-2 capitalize">
                              {doc.source}
                            </Badge>
                          </div>
                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm line-clamp-2">{doc.name}</h4>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(doc.createdAt), 'dd/MM/yyyy', { locale: vi })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-blue-500/20 shrink-0">
                            <SourceIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{doc.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="capitalize">{doc.source}</span>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="Xem">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Copy">
                              <Copy className="h-4 w-4" />
                            </Button>
                            {doc.url && (
                              <Button variant="ghost" size="icon" asChild title="Mở trên Drive">
                                <a href={doc.url} target="_blank" rel="noreferrer" title={`Mở ${doc.name} trên Drive`}>
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* AUDIO TAB */}
      <TabsContent value="audio" className="flex-1 mt-2">
        <Card className="h-[calc(100vh-140px)] min-h-[700px]">
          <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center">
            <Music className="h-16 w-16 text-pink-500 mb-4" />
            <h3 className="text-xl font-semibold">Audio Library</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Podcasts, Music, Voice recordings... Tính năng đang phát triển.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio
              </Button>
              <Button variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Từ YouTube
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* FILES TAB */}
      <TabsContent value="file" className="flex-1 mt-2">
        <Card className="h-[calc(100vh-140px)] min-h-[700px]">
          <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center">
            <Folder className="h-16 w-16 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold">All Files</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              PDFs, Spreadsheets, Presentations, Archives...
            </p>
            <Button className="mt-6" variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              Duyệt Google Drive
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
