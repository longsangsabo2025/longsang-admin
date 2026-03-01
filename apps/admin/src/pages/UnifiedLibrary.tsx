/** 📚 UNIFIED LIBRARY HUB — Thin shell. Panels → unified-library/ */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Library, Search, Image, Video, FileText, Music, Folder,
  ExternalLink, Copy, RefreshCw, Grid3X3, List, Upload,
  Plus, Sparkles, Briefcase, Package, Clock, HardDrive,
  Keyboard, Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { MediaItem } from '@/components/media/MediaGallery';
import { AddToScheduleModal } from '@/components/library/AddToScheduleModal';

import {
  useLibraryWorkspace,
  useLibraryProducts,
  useActivityLog,
  type AssetType,
  type ViewMode,
  type ProductItem,
  type ActivityAction,
  PROJECT_FOLDERS,
  PROJECTS_ROOT,
} from '@/hooks/library';

import { API_BASE, type UnifiedAsset, type LibraryStats } from './unified-library/shared';
import { BrowserPanel } from './unified-library/components/BrowserPanel';
import { WorkspacePanel } from './unified-library/components/WorkspacePanel';
import { ProductsPanel } from './unified-library/components/ProductsPanel';

export default function UnifiedLibrary() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AssetType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [documents, setDocuments] = useState<UnifiedAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleImage, setScheduleImage] = useState<{url: string; name?: string; description?: string; tags?: string[]} | null>(null);
  const [draggedItems, setDraggedItems] = useState<MediaItem[]>([]);
  const [dragOverTarget, setDragOverTarget] = useState<'workspace' | 'products' | null>(null);

  const activityLog = useActivityLog();
  const logActivity = (action: ActivityAction, description: string, count?: number) => {
    activityLog.logAction(action, description, count);
  };

  const workspace = useLibraryWorkspace({ onActivityLog: logActivity });
  const workspaceItems = workspace.items;
  const addToWorkspace = workspace.addItems;
  const removeFromWorkspace = workspace.removeItem;
  const clearWorkspace = workspace.clearAll;

  const products = useLibraryProducts({ onActivityLog: logActivity });
  const productItems = products.items;
  const addToProducts = products.addItems;
  const removeFromProducts = products.removeItem;
  const updateProductStatus = products.updateStatus;
  const clearProducts = products.clearAll;

  const setProductItems = (itemsOrUpdater: ProductItem[] | ((prev: ProductItem[]) => ProductItem[])) => {
    if (typeof itemsOrUpdater === 'function') {
      products.updateAllItems(itemsOrUpdater(productItems));
    } else {
      products.updateAllItems(itemsOrUpdater);
    }
  };

  const handleAddToProject = async (items: MediaItem[], project: { name: string; folderId: string; icon: string }) => {
    const toastId = toast.loading(`Đang thêm ${items.length} files vào ${project.name}...`);
    try {
      const response = await fetch('http://localhost:3001/api/google-drive/copy-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: items.map(i => i.id),
          destinationFolderId: project.folderId,
        }),
      });
      if (!response.ok) throw new Error('Failed to copy files');
      const result = await response.json();
      logActivity('add_products', `Thêm ${items.length} files vào dự án ${project.name}`, items.length);
      toast.success(`${project.icon} Đã thêm ${result.copiedCount || items.length} files vào ${project.name}`, { id: toastId });
    } catch (error) {
      console.error('Error copying files to project:', error);
      toast.error(`Lỗi khi thêm vào ${project.name}`, { id: toastId });
    }
  };

  const handleDragStart = (e: React.DragEvent, items: MediaItem[]) => {
    setDraggedItems(items);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', items.map(i => i.id).join(','));
  };
  const handleDragOver = (e: React.DragEvent, target: 'workspace' | 'products') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverTarget(target);
  };
  const handleDragLeave = () => setDragOverTarget(null);
  const handleDrop = (e: React.DragEvent, target: 'workspace' | 'products') => {
    e.preventDefault();
    setDragOverTarget(null);
    if (draggedItems.length > 0) {
      if (target === 'workspace') addToWorkspace(draggedItems);
      else addToProducts(draggedItems, 'draft');
      setDraggedItems([]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey && e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        const tabs: AssetType[] = ['all', 'image', 'video', 'document', 'audio', 'file', 'workspace', 'products'];
        const idx = Number.parseInt(e.key) - 1;
        if (tabs[idx]) setActiveTab(tabs[idx]);
        return;
      }
      if (e.key === 'Escape') { setSelectedAssets([]); toast.info('Đã bỏ chọn tất cả'); return; }
      if (e.key === 'w' || e.key === 'W') { if (selectedAssets.length > 0) toast.info('Nhấn W trong Gallery để thêm vào Workspace'); return; }
      if (e.key === 'p' || e.key === 'P') { if (workspaceItems.length > 0 && activeTab === 'workspace') addToProducts(workspaceItems, 'draft'); return; }
      if (e.key === 'Delete') {
        if (activeTab === 'workspace' && workspaceItems.length > 0) clearWorkspace();
        else if (activeTab === 'products' && productItems.length > 0) clearProducts();
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedAssets, workspaceItems, productItems]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const folderId = selectedProject ? PROJECT_FOLDERS[selectedProject]?.id : undefined;
      const url = folderId ? `${API_BASE}/api/drive/stats?folderId=${folderId}` : `${API_BASE}/api/drive/stats`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({ total: 0, images: 0, videos: 0, documents: 0, audio: 0, files: 0, totalSize: '0 KB' });
    } finally {
      setStatsLoading(false);
    }
  }, [selectedProject]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/drive/library`);
      const data = await response.json();
      if (data.success && data.documents) {
        const docs: UnifiedAsset[] = data.documents.map((doc: Record<string, unknown>) => ({
          id: doc.id as string,
          name: (doc.title as string) || (doc.name as string),
          type: 'document' as AssetType,
          source: (doc.source as string) || 'drive',
          url: doc.webViewLink as string | undefined,
          createdAt: (doc.modifiedTime as string) || new Date().toISOString(),
          metadata: doc,
        }));
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); fetchDocuments(); }, [fetchStats, fetchDocuments]);

  const handleSelectMedia = (files: MediaItem[]) => {
    setSelectedAssets(files.map(f => f.id));
    if (files.length > 0) addToWorkspace(files);
  };

  const getSelectedProjectFolder = () => {
    if (!selectedProject) return PROJECTS_ROOT;
    return PROJECT_FOLDERS[selectedProject]?.id || PROJECTS_ROOT;
  };

  const filteredDocuments = documents.filter(doc =>
    !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Library className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Thư Viện</h1>
            <p className="text-sm text-muted-foreground">Tất cả assets: Images, Videos, Docs, Audio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { fetchStats(); fetchDocuments(); }}>
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />Làm mới
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open('https://drive.google.com/drive/my-drive', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />Drive
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Upload className="h-4 w-4 mr-2" />Upload
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {statsLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}><CardContent className="p-3 flex items-center gap-2"><Skeleton className="h-10 w-10 rounded-lg" /><div className="space-y-2"><Skeleton className="h-6 w-12" /><Skeleton className="h-3 w-16" /></div></CardContent></Card>
          ))
        ) : stats && (<>
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0">
            <CardContent className="p-3 flex items-center gap-2"><div className="p-2 rounded-lg bg-slate-500/20"><Folder className="h-5 w-5 text-slate-600 dark:text-slate-300" /></div><div><div className="text-xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Tổng assets</div></div></CardContent>
          </Card>
          {([
            { key: 'image' as const, icon: Image, color: 'green', value: stats.images, label: 'Images' },
            { key: 'video' as const, icon: Video, color: 'purple', value: stats.videos, label: 'Videos' },
            { key: 'document' as const, icon: FileText, color: 'blue', value: stats.documents, label: 'Docs' },
            { key: 'audio' as const, icon: Music, color: 'pink', value: stats.audio, label: 'Audio' },
            { key: 'file' as const, icon: Folder, color: 'orange', value: stats.files, label: 'Files' },
          ] as const).map(s => (
            <Card key={s.key} className={`cursor-pointer transition-all hover:scale-105 ${activeTab === s.key ? `ring-2 ring-${s.color}-500` : ''}`} onClick={() => setActiveTab(s.key)}>
              <CardContent className="p-3 flex items-center gap-2"><div className={`p-2 rounded-lg bg-${s.color}-500/20`}><s.icon className={`h-5 w-5 text-${s.color}-600`} /></div><div><div className="text-xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div></CardContent>
            </Card>
          ))}
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-0">
            <CardContent className="p-3 flex items-center gap-2"><div className="p-2 rounded-lg bg-indigo-500/20"><HardDrive className="h-5 w-5 text-indigo-600" /></div><div><div className="text-xl font-bold">{stats.totalSize}</div><div className="text-xs text-muted-foreground">Dung lượng</div></div></CardContent>
          </Card>
        </>)}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-9" />
          {searchQuery && <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7 p-0" onClick={() => setSearchQuery('')}>✕</Button>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')}><Grid3X3 className="h-4 w-4" /></Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => { setActiveTab('all'); setSelectedProject(null); setSearchQuery(''); }}>
          <RefreshCw className="h-4 w-4 mr-1" />Reset
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9" title="Phím tắt"><Keyboard className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-2 text-sm font-semibold border-b">⌨️ Phím tắt</div>
            <div className="p-2 space-y-2 text-sm">
              {[['Chuyển tab','Ctrl+1-8'],['Bỏ chọn','Esc'],['Workspace → Products','P'],['Xóa tất cả (tab hiện tại)','Delete']].map(([l,k])=>(
                <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}</span><kbd className="px-2 py-0.5 bg-muted rounded text-xs">{k}</kbd></div>
              ))}
            </div>
            <div className="p-2 border-t text-xs text-muted-foreground">💡 Kéo thả files vào tab Work hoặc Sản phẩm</div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* PROJECT FILTER */}
      <div className="flex flex-wrap gap-2">
        <Button variant={selectedProject === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedProject(null)}>
          <Folder className="h-4 w-4 mr-2" />Tất cả dự án
        </Button>
        {Object.entries(PROJECT_FOLDERS).map(([slug, info]) => (
          <Button key={slug} variant={selectedProject === slug ? 'default' : 'outline'} size="sm" onClick={() => setSelectedProject(slug)} className="gap-2">
            <span>{info.icon}</span><span>{info.name}</span>
          </Button>
        ))}
      </div>

      {/* MAIN CONTENT TABS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetType)} className="flex-1">
        <TabsList className="grid grid-cols-8 w-full max-w-4xl">
          <TabsTrigger value="all" className="gap-1 text-xs"><Sparkles className="h-4 w-4" /> Tất cả</TabsTrigger>
          <TabsTrigger value="image" className="gap-1 text-xs"><Image className="h-4 w-4" /> Images</TabsTrigger>
          <TabsTrigger value="video" className="gap-1 text-xs"><Video className="h-4 w-4" /> Videos</TabsTrigger>
          <TabsTrigger value="document" className="gap-1 text-xs"><FileText className="h-4 w-4" /> Docs</TabsTrigger>
          <TabsTrigger value="audio" className="gap-1 text-xs"><Music className="h-4 w-4" /> Audio</TabsTrigger>
          <TabsTrigger value="file" className="gap-1 text-xs"><Folder className="h-4 w-4" /> Files</TabsTrigger>
          <TabsTrigger
            value="workspace"
            className={`gap-1 text-xs relative transition-all ${dragOverTarget === 'workspace' ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'workspace')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'workspace')}
          >
            <Briefcase className="h-4 w-4" /> Work
            {workspaceItems.length > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">{workspaceItems.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className={`gap-1 text-xs relative transition-all ${dragOverTarget === 'products' ? 'ring-2 ring-green-500 bg-green-500/20' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'products')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'products')}
          >
            <Package className="h-4 w-4" /> Sản phẩm
            {productItems.length > 0 && <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-green-500">{productItems.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <BrowserPanel
          selectedProject={selectedProject}
          projectFolderId={getSelectedProjectFolder()}
          handleSelectMedia={handleSelectMedia}
          addToWorkspace={addToWorkspace}
          addToProducts={(items) => addToProducts(items, 'draft')}
          handleAddToProject={handleAddToProject}
          viewMode={viewMode}
          loading={loading}
          filteredDocuments={filteredDocuments}
        />

        <WorkspacePanel
          workspaceItems={workspaceItems}
          clearWorkspace={clearWorkspace}
          removeFromWorkspace={removeFromWorkspace}
          handleDragStart={handleDragStart}
          addToProducts={addToProducts}
          navigate={navigate}
          setScheduleImage={setScheduleImage}
          setScheduleModalOpen={setScheduleModalOpen}
        />

        <ProductsPanel
          productItems={productItems}
          setProductItems={setProductItems}
          workspaceItems={workspaceItems}
          addToProducts={addToProducts}
          removeFromProducts={removeFromProducts}
          updateProductStatus={updateProductStatus}
          clearProducts={clearProducts}
          clearWorkspace={clearWorkspace}
          handleDragStart={handleDragStart}
          logActivity={logActivity}
          activityLogEntries={activityLog.entries}
          activityLogClearAll={activityLog.clearAll}
        />
      </Tabs>

      {/* SELECTED ASSETS BAR */}
      {selectedAssets.length > 0 && (
        <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-2xl border-2">
          <CardContent className="p-4 flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">{selectedAssets.length} đã chọn</Badge>
            <div className="flex gap-2">
              <Button size="sm"><Copy className="h-4 w-4 mr-2" />Copy URLs</Button>
              <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-2" />Tải về</Button>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Thêm vào bài đăng</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedAssets([])}>Bỏ chọn</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SCHEDULE MODAL */}
      {scheduleImage && (
        <AddToScheduleModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          image={scheduleImage}
          onScheduled={(post) => {
            toast.success(`Đã lên lịch đăng bài lúc ${format(post.scheduledAt, 'HH:mm dd/MM/yyyy', { locale: vi })}`);
            logActivity('add_products', `Thêm vào lịch đăng bài: ${scheduleImage.name || 'Untitled'}`, 1);
          }}
        />
      )}
    </div>
  );
}
