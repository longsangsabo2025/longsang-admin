/**
 * 🖼️ ImageLibraryPanel — Browse, search, and manage the image reuse library
 *
 * Shows all indexed images from completed pipeline runs.
 * Allows searching by prompt keywords to find reusable images.
 * Provides rebuild/clear actions for library management.
 */

import {
  Database,
  HardDriveDownload,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  clearLibrary,
  getLibrary,
  getLibraryStats,
  type LibraryImage,
  rebuildLibraryFromRuns,
  searchLibrary,
} from '@/services/pipeline/image-library';

interface ImageLibraryPanelProps {
  channelId: string;
}

const PAGE_SIZE = 60;

export default function ImageLibraryPanel({ channelId }: ImageLibraryPanelProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    (LibraryImage & { similarity: number })[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<LibraryImage | null>(null);
  const [filterChannel, setFilterChannel] = useState<string | null>(null);

  // Load library on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const lib = await getLibrary();
      setImages(lib);
      setStats(getLibraryStats());
      setLoading(false);
    })();
  }, []);

  // ─── Rebuild ───
  const handleRebuild = useCallback(async () => {
    setRebuilding(true);
    try {
      const added = rebuildLibraryFromRuns();
      const lib = await getLibrary();
      setImages(lib);
      setStats(getLibraryStats());
      toast({
        title: `📚 Library rebuilt`,
        description: `${added} new images indexed. Total: ${lib.length}`,
      });
    } finally {
      setRebuilding(false);
    }
  }, [toast]);

  // ─── Clear ───
  const handleClear = useCallback(() => {
    if (!confirm('Xóa toàn bộ Image Library? (Hình ảnh gốc vẫn còn trong Supabase Storage)'))
      return;
    clearLibrary();
    setImages([]);
    setStats({ total: 0 });
    setSearchResults(null);
    setSelectedImage(null);
    toast({ title: '🗑️ Library cleared', description: 'Index đã xóa. Rebuild để tạo lại.' });
  }, [toast]);

  // ─── Search ───
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const results = searchLibrary(searchQuery, channelId, 0.15, 50);
    setSearchResults(results);
    setPage(1);
  }, [searchQuery, channelId]);

  // ─── Filtered + paginated images ───
  const displayImages =
    searchResults ??
    (() => {
      let filtered = images;
      if (filterChannel) {
        filtered = filtered.filter((img) => img.channelId === filterChannel);
      }
      return filtered;
    })();

  const totalPages = Math.ceil(displayImages.length / PAGE_SIZE);
  const paginatedImages = displayImages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Channel list for filter
  const channelIds = Array.from(new Set(images.map((i) => i.channelId))).sort();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải Image Library...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── STATS BAR ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              Image Library
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {stats.total || 0} images
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleRebuild}
                      disabled={rebuilding}
                    >
                      {rebuilding ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <HardDriveDownload className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rebuild: quét tất cả runs để index hình ảnh</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={handleClear}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Xóa index (hình gốc vẫn còn)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Per-channel stats */}
          {channelIds.length > 1 && (
            <div className="flex flex-wrap gap-1">
              <Badge
                variant={filterChannel === null ? 'default' : 'outline'}
                className="cursor-pointer text-[10px]"
                onClick={() => {
                  setFilterChannel(null);
                  setPage(1);
                }}
              >
                Tất cả ({stats.total || 0})
              </Badge>
              {channelIds.map((cid) => (
                <Badge
                  key={cid}
                  variant={filterChannel === cid ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px]"
                  onClick={() => {
                    setFilterChannel(filterChannel === cid ? null : cid);
                    setPage(1);
                  }}
                >
                  {cid} ({stats[cid] || 0})
                </Badge>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Tìm hình theo prompt... VD: dark forest, lonely person, city night"
                className="h-8 text-xs pl-7 pr-7"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={handleSearch}
            >
              <Search className="h-3 w-3" />
              Tìm
            </Button>
          </div>

          {searchResults && (
            <div className="text-[10px] text-muted-foreground">
              Tìm thấy {searchResults.length} kết quả cho &quot;{searchQuery}&quot;
              {searchResults.length > 0 && (
                <span className="ml-2">
                  (Similarity: {(searchResults[0].similarity * 100).toFixed(0)}% —{' '}
                  {(searchResults[searchResults.length - 1].similarity * 100).toFixed(0)}%)
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── IMAGE GRID ─── */}
      {displayImages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
            {images.length === 0 ? (
              <>
                <p>Chưa có hình ảnh nào trong thư viện.</p>
                <p className="text-xs mt-1">
                  Chạy pipeline hoặc bấm <strong>Rebuild</strong> để index hình từ các runs đã hoàn
                  thành.
                </p>
              </>
            ) : (
              <p>Không tìm thấy kết quả. Thử từ khóa khác.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {paginatedImages.map((img) => {
                  const sim =
                    'similarity' in img
                      ? (img as LibraryImage & { similarity: number }).similarity
                      : undefined;
                  return (
                    <div
                      key={img.id}
                      className={`group relative aspect-square rounded-md overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all ${
                        selectedImage?.id === img.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedImage(selectedImage?.id === img.id ? null : img)}
                    >
                      <img
                        src={img.url}
                        alt={img.prompt.substring(0, 60)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Similarity badge */}
                      {sim !== undefined && (
                        <div className="absolute top-1 right-1">
                          <Badge
                            variant="secondary"
                            className={`text-[8px] px-1 py-0 ${
                              sim >= 0.5
                                ? 'bg-green-500/80 text-white'
                                : sim >= 0.35
                                  ? 'bg-yellow-500/80 text-white'
                                  : 'bg-orange-500/80 text-white'
                            }`}
                          >
                            {(sim * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      )}
                      {/* Scene number */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        S{img.scene}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px]"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Trước
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  {page}/{totalPages} ({displayImages.length} images)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px]"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── SELECTED IMAGE DETAIL ─── */}
      {selectedImage && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Chi tiết hình ảnh</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4">
              {/* Preview */}
              <div className="w-48 h-48 rounded-lg overflow-hidden border shrink-0 bg-black">
                <img
                  src={selectedImage.url}
                  alt="Selected"
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Info */}
              <div className="flex-1 space-y-2 min-w-0">
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Prompt:</p>
                  <p className="text-xs leading-relaxed">{selectedImage.prompt}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted-foreground">Channel:</span>{' '}
                    <span className="font-medium">{selectedImage.channelId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scene:</span>{' '}
                    <span className="font-medium">{selectedImage.scene}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Run:</span>{' '}
                    <span className="font-mono">{selectedImage.runId.substring(0, 12)}...</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span>{new Date(selectedImage.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedImage.keywords.slice(0, 20).map((kw) => (
                      <Badge key={kw} variant="outline" className="text-[9px]">
                        {kw}
                      </Badge>
                    ))}
                    {selectedImage.keywords.length > 20 && (
                      <Badge variant="secondary" className="text-[9px]">
                        +{selectedImage.keywords.length - 20}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => window.open(selectedImage.url, '_blank')}
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    Mở full
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedImage.url);
                      toast({ title: '📋 Đã copy URL' });
                    }}
                  >
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedImage.prompt);
                      toast({ title: '📋 Đã copy Prompt' });
                    }}
                  >
                    Copy Prompt
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── USAGE INFO ─── */}
      <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
        <p className="font-medium">♻️ Cách Image Library hoạt động:</p>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>Mỗi hình ảnh đã tạo được lưu index kèm prompt + keywords</li>
          <li>
            Khi pipeline tạo hình mới, tự động tìm hình tương tự trong thư viện (similarity ≥ 35%)
          </li>
          <li>
            Nếu match — reuse hình cũ, <strong>không tốn API quota / chi phí</strong>
          </li>
          <li>Hình mới tạo sẽ tự động được thêm vào thư viện cho lần sau</li>
          <li>Thư viện persist qua localStorage + Supabase (max 5,000 hình)</li>
        </ul>
      </div>
    </div>
  );
}
