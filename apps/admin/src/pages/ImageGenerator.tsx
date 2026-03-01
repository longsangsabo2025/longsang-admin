/**
 * Image Generator Page
 * AI-powered image transformation using Kie.ai
 * Connected via direct API (no n8n dependency for reliability)
 * 
 * Layout: 2-column with Library panel always visible
 * Features: Drag & Drop, History, Favorites, Multiple AI tools
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ImageToImage } from '@/components/ai/ImageToImage';
import { MultipleImagesToImage } from '@/components/ai/MultipleImagesToImage';
import { TextToImage } from '@/components/ai/TextToImage';
import { BackgroundRemoval } from '@/components/ai/BackgroundRemoval';
import { ImageUpscale } from '@/components/ai/ImageUpscale';
import { NanoBananaPro } from '@/components/ai/NanoBananaPro';
import { Imagen4 } from '@/components/ai/Imagen4';
import { ImageBrainLibrary } from '@/brain/components/ImageBrainLibrary';
import { SmartPromptAnalyzer } from '@/brain/components/SmartPromptAnalyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Image, Wand2, Images, FolderOpen, Search, RefreshCw, Loader2, ChevronLeft, ChevronRight, X, Video, History, Star, StarOff, Eraser, ZoomIn, GripVertical, Clock, Trash2, Upload, ExternalLink, FileText, Copy, CheckCircle, AlertCircle, Clock3, Film, Cloud, FolderPlus, Brain, Banana } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLibraryWorkspace, useLibraryProducts, libraryActions } from '@/hooks/library';
import type { MediaItem } from '@/hooks/library/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { listJobs, updateJob, type AIJob } from '@/services/ai-jobs';

// Storage keys
const HISTORY_KEY = 'ai-generator-history';
const FAVORITES_KEY = 'ai-generator-favorites';
const ACTIVITY_LOG_KEY = 'ai-generator-activity-log';

// History item type
interface HistoryItem {
  id: string;
  type: 'image-to-image' | 'multi-images' | 'text-to-image' | 'background-removal' | 'upscale';
  inputUrl?: string;
  outputUrl: string;
  prompt?: string;
  createdAt: string;
  isFavorite?: boolean;
}

// Activity Log item type - detailed task info
interface ActivityLogItem {
  id: string;
  taskId?: string; // Kie.ai task ID
  type: 'image' | 'video' | 'upscale' | 'background-removal';
  model?: string; // runway, veo3-fast, etc.
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputUrl?: string;
  outputUrl?: string;
  prompt?: string;
  cost?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Load/Save Activity Log
const loadActivityLog = (): ActivityLogItem[] => {
  try {
    const saved = localStorage.getItem(ACTIVITY_LOG_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveActivityLog = (items: ActivityLogItem[]) => {
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(items.slice(0, 100)));
};

// Load/Save helpers
const loadHistory = (): HistoryItem[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveHistory = (items: HistoryItem[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
};

const loadFavorites = (): string[] => {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveFavorites = (ids: string[]) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
};

export default function ImageGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedImages, setSelectedImages] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('image-to-image');
  const [searchQuery, setSearchQuery] = useState('');
  const [librarySource, setLibrarySource] = useState<'workspace' | 'products' | 'history' | 'favorites'>('workspace');
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  // Activity log state - setter used in callbacks
  const [, setActivityLog] = useState<ActivityLogItem[]>(() => loadActivityLog());
  
  // Database jobs for Activity Log tab
  const [dbJobs, setDbJobs] = useState<AIJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  // Fetch jobs from database
  const fetchDbJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const result = await listJobs({ limit: 50 });
      if (result.success) {
        setDbJobs(result.jobs);
      }
    } catch (error) {
      console.error('[Activity Log] Failed to fetch jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);
  
  // Load jobs when switching to activity-log tab
  useEffect(() => {
    if (activeTab === 'activity-log') {
      fetchDbJobs();
    }
  }, [activeTab, fetchDbJobs]);
  const [draggedItem, setDraggedItem] = useState<MediaItem | null>(null);
  
  // Library hooks
  const workspaceLib = useLibraryWorkspace();
  const productLib = useLibraryProducts();
  
  // Handle incoming image from Library page
  useEffect(() => {
    const state = location.state as { selectedImage?: MediaItem } | null;
    if (state?.selectedImage) {
      // Add to workspace if not already there
      const item = state.selectedImage;
      if (!workspaceLib.isInWorkspace(item.id)) {
        libraryActions.addToWorkspace(item, false);
      }
      // Auto-select the image
      setSelectedImages([item]);
      setLibrarySource('workspace');
      toast.success(`Đã chọn ảnh: ${item.name}`);
      // Clear the state to prevent re-adding on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);
  
  // Get items based on source - use MediaItem compatible format
  const libraryItems = useMemo((): MediaItem[] => {
    if (librarySource === 'history') {
      return history.map(h => ({
        id: h.id,
        name: h.prompt?.slice(0, 30) || 'Generated',
        url: h.outputUrl,
        type: 'image' as const,
        mimeType: 'image/png',
      }));
    }
    if (librarySource === 'favorites') {
      return history
        .filter(h => favorites.includes(h.id))
        .map(h => ({
          id: h.id,
          name: h.prompt?.slice(0, 30) || 'Favorite',
          url: h.outputUrl,
          type: 'image' as const,
          mimeType: 'image/png',
        }));
    }
    const items = librarySource === 'workspace' 
      ? workspaceLib.items 
      : productLib.items;
    return items.filter(item => item.type === 'image') as MediaItem[];
  }, [librarySource, workspaceLib.items, productLib.items, history, favorites]);
  
  // Filter by search
  const filteredItems = libraryItems.filter(item => 
    !searchQuery || 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle image selection (toggle)
  const handleToggleImage = useCallback((item: MediaItem) => {
    setSelectedImages(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);
  
  // Toggle favorite
  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id];
      saveFavorites(newFavorites);
      toast.success(prev.includes(id) ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
      return newFavorites;
    });
  }, []);
  
  // Add to history AND auto-upload to Google Drive (called from child components)
  const addToHistory = useCallback(async (item: { type: string; outputUrl: string; inputUrl?: string; prompt?: string }) => {
    const historyType = item.type as HistoryItem['type'];
    const newItem: HistoryItem = {
      type: historyType,
      outputUrl: item.outputUrl,
      inputUrl: item.inputUrl,
      prompt: item.prompt,
      id: `hist_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    // 1. Save to local history immediately (instant UI update)
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 50);
      saveHistory(updated);
      return updated;
    });
    
    // 2. Auto-upload to Google Drive (background)
    if (item.outputUrl) {
      const mediaItem: MediaItem = {
        id: newItem.id,
        name: `AI_${item.type}_${Date.now()}.png`,
        url: item.outputUrl,
        type: 'image',
        mimeType: 'image/png',
      };
      
      try {
        await libraryActions.addToWorkspace(mediaItem, true);
        toast.success('✅ Đã lưu vào Google Drive', { duration: 2000 });
      } catch (error) {
        console.error('[ImageGenerator] Drive upload failed:', error);
        toast.error('Lưu Drive thất bại - ảnh vẫn ở local');
      }
    }
  }, []);
  
  // Clear history
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
    toast.success('Đã xóa lịch sử');
  }, []);
  
  // Add to Activity Log (for detailed task tracking)
  const addToActivityLog = useCallback((item: Omit<ActivityLogItem, 'id' | 'createdAt'>) => {
    const newItem: ActivityLogItem = {
      ...item,
      id: `log_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setActivityLog(prev => {
      const updated = [newItem, ...prev].slice(0, 100);
      saveActivityLog(updated);
      return updated;
    });
    return newItem.id;
  }, []);

  // Update Activity Log item (for status updates)
  const updateActivityLog = useCallback((id: string, updates: Partial<ActivityLogItem>) => {
    setActivityLog(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      saveActivityLog(updated);
      return updated;
    });
  }, []);
  
  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setSelectedImages([]);
  }, []);
  
  // Drag handlers
  const handleDragStart = useCallback((item: MediaItem) => {
    setDraggedItem(item);
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);
  
  // Refresh library
  const handleRefresh = useCallback(() => {
    if (librarySource === 'workspace') {
      workspaceLib.refetch();
    } else if (librarySource === 'products') {
      productLib.refetch();
    }
    toast.success('Đã làm mới thư viện');
  }, [librarySource, workspaceLib, productLib]);

  const isLoading = workspaceLib.loading || productLib.loading;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Image Generator
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo và chỉnh sửa ảnh với AI - Powered by Kie.ai
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {selectedImages.length > 0 && (
            <Badge variant="secondary">
              {selectedImages.length} ảnh đã chọn
            </Badge>
          )}
          <Badge variant="outline" className="text-green-600 border-green-600">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
            API Connected
          </Badge>
        </div>
      </div>

      {/* Main Layout: Library + Generator */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Library Panel - Left Side */}
        <div className={cn(
          "border-r bg-muted/30 transition-all duration-300 flex flex-col shrink-0",
          libraryCollapsed ? "w-12" : "w-80"
        )}>
          {/* Library Header */}
          <div className="border-b shrink-0">
            {!libraryCollapsed ? (
              <div className="p-3 space-y-3">
                {/* Title row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Thư viện</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} title="Làm mới">
                      <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => setLibraryCollapsed(true)}
                      title="Thu gọn"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Source tabs - styled nicely */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant={librarySource === 'workspace' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "flex-1 h-8 text-xs font-medium transition-all",
                      librarySource === 'workspace' && "bg-background shadow-sm"
                    )}
                    onClick={() => setLibrarySource('workspace')}
                    title="Workspace"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={librarySource === 'products' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "flex-1 h-8 text-xs font-medium transition-all",
                      librarySource === 'products' && "bg-background shadow-sm"
                    )}
                    onClick={() => setLibrarySource('products')}
                    title="Products"
                  >
                    <Images className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={librarySource === 'history' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "flex-1 h-8 text-xs font-medium transition-all",
                      librarySource === 'history' && "bg-background shadow-sm"
                    )}
                    onClick={() => setLibrarySource('history')}
                    title="Lịch sử"
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={librarySource === 'favorites' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      "flex-1 h-8 text-xs font-medium transition-all",
                      librarySource === 'favorites' && "bg-background shadow-sm"
                    )}
                    onClick={() => setLibrarySource('favorites')}
                    title="Yêu thích"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-2 flex justify-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setLibraryCollapsed(false)}
                  title="Mở rộng"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {!libraryCollapsed && (
            <>
              {/* Search */}
              <div className="px-3 py-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm ảnh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons - Upload & Import */}
              <div className="px-3 pb-2 flex gap-2 shrink-0">
                {/* Upload from PC */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  disabled={isUploading}
                  onClick={() => document.getElementById('library-upload-input')?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Upload
                </Button>
                <input
                  id="library-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  title="Upload images to library"
                  aria-label="Upload images to library"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    
                    setIsUploading(true);
                    try {
                      for (const file of Array.from(files)) {
                        // First upload to ImgBB for stable URL
                        const formData = new FormData();
                        formData.append('image', file);
                        formData.append('key', '2c3d34ab82d9b3b679cc9303087a7769');
                        
                        const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        
                        let imageUrl: string;
                        if (uploadRes.ok) {
                          const uploadData = await uploadRes.json();
                          imageUrl = uploadData.data.url;
                        } else {
                          // Fallback to blob URL (temporary)
                          imageUrl = URL.createObjectURL(file);
                          toast.warning('Upload cloud failed - using local preview');
                        }
                        
                        const mediaItem: MediaItem = {
                          id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                          name: file.name,
                          url: imageUrl,
                          mimeType: file.type || 'image/jpeg',
                          type: 'image',
                        };
                        await libraryActions.addToWorkspace(mediaItem, true); // Upload to Drive too
                      }
                      toast.success(`Đã thêm ${files.length} ảnh vào thư viện`);
                    } catch (error) {
                      console.error('Upload error:', error);
                      toast.error('Upload thất bại');
                    } finally {
                      setIsUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
                
                {/* Go to Main Library */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => navigate('/admin/library')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Thư viện
                </Button>
              </div>

              {/* Library Grid */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {/* History actions */}
                  {librarySource === 'history' && history.length > 0 && (
                    <div className="flex justify-end mb-2">
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={handleClearHistory}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Xóa lịch sử
                      </Button>
                    </div>
                  )}
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-center">
                      {librarySource === 'history' ? (
                        <>
                          <History className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-xs">Chưa có lịch sử</p>
                        </>
                      ) : librarySource === 'favorites' ? (
                        <>
                          <Star className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-xs">Chưa có yêu thích</p>
                        </>
                      ) : (
                        <>
                          <FolderOpen className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-xs">Chưa có ảnh</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {filteredItems.map((item) => {
                        const isSelected = selectedImages.some(i => i.id === item.id);
                        const selectionIndex = selectedImages.findIndex(i => i.id === item.id);
                        const isFavorite = favorites.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            draggable
                            onDragStart={() => handleDragStart(item)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "relative group cursor-grab active:cursor-grabbing rounded-md overflow-hidden border-2 transition-all aspect-square",
                              isSelected
                                ? "border-primary ring-2 ring-primary/20" 
                                : "border-transparent hover:border-muted-foreground/30",
                              draggedItem?.id === item.id && "opacity-50"
                            )}
                            onClick={() => handleToggleImage(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleToggleImage(item);
                              }
                            }}
                            aria-label={`Select image: ${item.name}`}
                          >
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                            {/* Drag indicator */}
                            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
                            </div>
                            {/* Selection badge */}
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                {selectionIndex + 1}
                              </div>
                            )}
                            {/* Favorite button */}
                            {(librarySource === 'history' || librarySource === 'favorites') && (
                              <button
                                className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-black/50 hover:bg-black/70"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(item.id);
                                }}
                              >
                                {isFavorite ? (
                                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                ) : (
                                  <StarOff className="h-3 w-3 text-white" />
                                )}
                              </button>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1 pointer-events-none">
                              <span className="text-white text-[10px] truncate">{item.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Selected Images Bar */}
              {selectedImages.length > 0 && (
                <div className="p-2 border-t bg-muted/50 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{selectedImages.length} đã chọn</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleClearSelection}>
                      <X className="h-3 w-3 mr-1" />
                      Xóa
                    </Button>
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {selectedImages.map((item, idx) => (
                      <div key={item.id} className="relative shrink-0">
                        <img 
                          src={item.url} 
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Generator Panel - Right Side */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="border-b px-4 shrink-0 overflow-x-auto">
              <TabsList className="h-12 w-max">
                <TabsTrigger value="image-to-image" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image to Image
                </TabsTrigger>
                <TabsTrigger value="multiple-images" className="flex items-center gap-2">
                  <Images className="h-4 w-4" />
                  Multi Images
                  {selectedImages.length > 1 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {selectedImages.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="text-to-image" className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Text to Image
                </TabsTrigger>
                <TabsTrigger value="nano-banana" className="flex items-center gap-2">
                  <Banana className="h-4 w-4 text-yellow-500" />
                  Nano Banana 🍌
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-yellow-600 border-yellow-500 bg-yellow-50">
                    NEW
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="imagen-4" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Imagen 4
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-blue-600 border-blue-500 bg-blue-50">
                    NEW
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="background-removal" className="flex items-center gap-2">
                  <Eraser className="h-4 w-4" />
                  Xóa nền
                </TabsTrigger>
                <TabsTrigger value="upscale" className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Upscale
                </TabsTrigger>
                <TabsTrigger value="activity-log" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Activity Log
                  {dbJobs.some(j => j.status === 'processing') && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-yellow-100 text-yellow-700">
                      {dbJobs.filter(j => j.status === 'processing').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="brain-library" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Brain Library
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-purple-600 border-purple-600 bg-purple-50">
                    🧠 NEW
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Native scroll - simple and works */}
            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="image-to-image" className="mt-0">
                <ImageToImage selectedLibraryImage={selectedImages[0]} />
              </TabsContent>

              <TabsContent value="multiple-images" className="mt-0">
                <MultipleImagesToImage selectedLibraryImages={selectedImages} />
              </TabsContent>

              <TabsContent value="text-to-image" className="mt-0">
                <TextToImage onGenerated={addToHistory} />
              </TabsContent>

              <TabsContent value="background-removal" className="mt-0">
                <BackgroundRemoval 
                  selectedLibraryImage={selectedImages[0]} 
                  onGenerated={addToHistory}
                  draggedItem={draggedItem}
                />
              </TabsContent>

              <TabsContent value="upscale" className="mt-0">
                <ImageUpscale 
                  selectedLibraryImage={selectedImages[0]} 
                  onGenerated={addToHistory}
                  draggedItem={draggedItem}
                />
              </TabsContent>

              <TabsContent value="nano-banana" className="mt-0">
                <NanoBananaPro onGenerated={addToHistory} />
              </TabsContent>

              <TabsContent value="imagen-4" className="mt-0">
                <Imagen4 onGenerated={(url, prompt) => addToHistory({ type: 'imagen-4', outputUrl: url, prompt })} />
              </TabsContent>

              <TabsContent value="activity-log" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Activity Log
                        </CardTitle>
                        <CardDescription>Lịch sử các task AI từ Database</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={fetchDbJobs}
                        disabled={isLoadingJobs}
                      >
                        {isLoadingJobs ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingJobs ? (
                      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="h-12 w-12 mb-3 animate-spin opacity-30" />
                        <p>Đang tải...</p>
                      </div>
                    ) : dbJobs.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                        <Clock3 className="h-12 w-12 mb-3 opacity-30" />
                        <p>Chưa có job nào trong database</p>
                        <p className="text-xs mt-1">Tạo ảnh/video để xem log tại đây</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {dbJobs.map((job) => (
                          <div 
                            key={job.id} 
                            className={cn(
                              "p-3 rounded-lg border",
                              job.status === 'success' && "bg-green-950/30 border-green-800",
                              job.status === 'processing' && "bg-yellow-950/30 border-yellow-800",
                              job.status === 'failed' && "bg-red-950/30 border-red-800",
                              job.status === 'pending' && "bg-muted/50 border-border"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {job.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                  {job.status === 'processing' && <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />}
                                  {job.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                  {job.status === 'pending' && <Clock3 className="h-4 w-4 text-gray-500" />}
                                  <span className="font-medium text-sm">{job.job_type.toUpperCase()}</span>
                                  {job.model && <Badge variant="outline" className="text-xs">{job.model}</Badge>}
                                  {job.provider && <Badge variant="secondary" className="text-xs">{job.provider}</Badge>}
                                  {job.cost_usd !== undefined && Number(job.cost_usd) > 0 && (
                                    <Badge variant="secondary" className="text-xs">${Number(job.cost_usd).toFixed(2)}</Badge>
                                  )}
                                </div>
                                {job.original_prompt && (
                                  <p className="text-xs text-muted-foreground truncate mb-1" title={job.original_prompt}>
                                    Prompt: {job.original_prompt.substring(0, 100)}...
                                  </p>
                                )}
                                {job.external_task_id && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>Task ID:</span>
                                    <code className="bg-muted px-1 rounded">{job.external_task_id}</code>
                                    <button
                                      className="hover:text-foreground"
                                      onClick={() => {
                                        navigator.clipboard.writeText(job.external_task_id!);
                                        toast.success('Copied!');
                                      }}
                                      title="Copy Task ID"
                                      aria-label="Copy Task ID"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                                {job.output_url && (
                                  <div className="flex items-center flex-wrap gap-2 mt-2">
                                    <a 
                                      href={job.output_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Xem kết quả
                                    </a>
                                    <button
                                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                      onClick={() => {
                                        navigator.clipboard.writeText(job.output_url!);
                                        toast.success('Copied URL!');
                                      }}
                                      title="Copy URL"
                                    >
                                      <Copy className="h-3 w-3" />
                                      Copy
                                    </button>
                                    {/* Save to Cloudinary button - only show if not already saved */}
                                    {!job.cloudinary_url && (
                                      <button
                                        className="text-xs text-purple-500 hover:text-purple-400 flex items-center gap-1"
                                        onClick={async () => {
                                          toast.loading('Đang lưu vào Cloud...');
                                          try {
                                            const res = await fetch('/api/cloudinary/upload-url', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                url: job.output_url,
                                                folder: job.job_type.includes('video') ? 'ai-videos' : 'ai-images',
                                                resourceType: job.job_type.includes('video') ? 'video' : 'image',
                                                tags: ['ai-generated', job.model || 'unknown'],
                                                metadata: {
                                                  taskId: job.external_task_id,
                                                  jobId: job.id,
                                                  prompt: job.original_prompt?.substring(0, 200),
                                                },
                                              }),
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                              toast.dismiss();
                                              toast.success('☁️ Đã lưu vào Cloudinary!');
                                              // Update job in DB
                                              if (job.id) {
                                                await updateJob(job.id, {
                                                  cloudinary_id: data.data.publicId,
                                                  cloudinary_url: data.data.url,
                                                });
                                              }
                                              fetchDbJobs(); // Refresh list
                                            } else {
                                              throw new Error(data.error);
                                            }
                                          } catch (err) {
                                            toast.dismiss();
                                            toast.error('Lưu Cloud thất bại');
                                          }
                                        }}
                                        title="Lưu vào Cloudinary"
                                      >
                                        <Cloud className="h-3 w-3" />
                                        Lưu Cloud
                                      </button>
                                    )}
                                    {/* Show Cloudinary link if saved */}
                                    {job.cloudinary_url && (
                                      <a
                                        href={job.cloudinary_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-purple-500 hover:text-purple-400 flex items-center gap-1"
                                        title="Xem trên Cloudinary"
                                      >
                                        <Cloud className="h-3 w-3" />
                                        Cloud ✓
                                      </a>
                                    )}
                                    {/* Save to Library Workspace */}
                                    <button
                                      className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1"
                                      onClick={async () => {
                                        const mediaItem: MediaItem = {
                                          id: `job_${job.id}_${Date.now()}`,
                                          name: `AI_${job.job_type}_${job.external_task_id || job.id}.${job.job_type.includes('video') ? 'mp4' : 'png'}`,
                                          url: job.cloudinary_url || job.output_url!,
                                          type: job.job_type.includes('video') ? 'video' : 'image',
                                          mimeType: job.job_type.includes('video') ? 'video/mp4' : 'image/png',
                                        };
                                        const success = await libraryActions.addToWorkspace(mediaItem, true);
                                        if (success) {
                                          toast.success('✅ Đã lưu vào Thư Viện!');
                                        } else {
                                          toast.info('Đã có trong Thư Viện');
                                        }
                                      }}
                                      title="Lưu vào Thư viện"
                                    >
                                      <FolderPlus className="h-3 w-3" />
                                      Thư viện
                                    </button>
                                  </div>
                                )}
                                {job.processing_time_ms && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ⏱️ {(job.processing_time_ms / 1000).toFixed(1)}s
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(job.created_at!).toLocaleTimeString('vi-VN')}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(job.created_at!).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 🧠 BRAIN IMAGE LIBRARY - THE MAGIC! */}
              <TabsContent value="brain-library" className="mt-0 h-[calc(100vh-12rem)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  {/* Smart Prompt Analyzer */}
                  <div className="lg:col-span-1">
                    <SmartPromptAnalyzer
                      onContextReady={(context) => {
                        console.log('[Brain] Context ready:', context);
                        toast.success(`Brain tìm thấy ${context.referenceImages.length} ảnh tham chiếu!`);
                      }}
                      onEnhancedPromptReady={(prompt, refs) => {
                        console.log('[Brain] Enhanced prompt:', prompt, refs);
                        // TODO: Auto-fill to Text-to-Image or Image-to-Image
                      }}
                    />
                  </div>
                  
                  {/* Image Brain Library */}
                  <div className="lg:col-span-2 h-full border rounded-lg overflow-hidden">
                    <ImageBrainLibrary
                      selectionMode={false}
                      onSelectImages={(images) => {
                        console.log('[Brain] Selected images:', images);
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
