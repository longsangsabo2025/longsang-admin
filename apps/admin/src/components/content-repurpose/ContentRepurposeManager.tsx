/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTENT REPURPOSE MANAGER
 * Quản lý nội dung đa ngôn ngữ - Import, Dịch, Đăng bài
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Image,
  Languages,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import { ContentRepurposeSettings } from './ContentRepurposeSettings';
import { useCallback, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types
interface ContentSource {
  id: string;
  original_content: string;
  original_language: string;
  media_urls: { type: string; url: string }[];
  source_platform: string;
  source_page_name?: string;
  source_url?: string;
  status: string;
  tags: string[];
  category?: string;
  created_at: string;
  content_translations?: ContentTranslation[];
}

interface ContentTranslation {
  id: string;
  source_id: string;
  target_language: string;
  translated_content: string;
  is_manually_edited: boolean;
  ai_model?: string;
  status: string;
  created_at: string;
}

interface Stats {
  total_sources: number;
  pending_sources: number;
  translated_sources: number;
  published_sources: number;
  total_translations: number;
  approved_translations: number;
  queue_pending: number;
  queue_published: number;
}

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  translating: 'bg-blue-500/20 text-blue-500',
  translated: 'bg-green-500/20 text-green-500',
  scheduled: 'bg-purple-500/20 text-purple-500',
  published: 'bg-emerald-500/20 text-emerald-500',
  failed: 'bg-red-500/20 text-red-500',
  draft: 'bg-gray-500/20 text-gray-500',
  approved: 'bg-teal-500/20 text-teal-500',
};

export const ContentRepurposeManager = () => {
  const { toast } = useToast();
  
  // State
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newMediaUrls, setNewMediaUrls] = useState('');
  const [newSourcePage, setNewSourcePage] = useState('0xSojalSec');
  const [newCategory, setNewCategory] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  // Fetch sources
  const fetchSources = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/content-repurpose/sources`);
      const data = await response.json();
      if (data.success) {
        setSources(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/content-repurpose/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSources(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [fetchSources, fetchStats]);

  // Import new content
  const handleImport = async () => {
    if (!newContent.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập nội dung',
        variant: 'destructive',
      });
      return;
    }

    setImportLoading(true);
    try {
      // Parse media URLs
      const mediaUrls = newMediaUrls
        .split('\n')
        .filter(url => url.trim())
        .map(url => ({ type: 'image', url: url.trim() }));

      const response = await fetch(`${API_BASE}/api/content-repurpose/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_content: newContent,
          original_language: 'en',
          media_urls: mediaUrls,
          source_platform: 'facebook',
          source_page_name: newSourcePage,
          category: newCategory || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: 'Đã import nội dung mới',
        });
        setImportDialogOpen(false);
        setNewContent('');
        setNewMediaUrls('');
        setNewCategory('');
        fetchSources();
        fetchStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Import thất bại',
        variant: 'destructive',
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Translate single content
  const handleTranslate = async (sourceId: string) => {
    setTranslating(sourceId);
    try {
      const response = await fetch(`${API_BASE}/api/content-repurpose/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          target_language: 'vi',
          style: 'professional',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: 'Đã dịch nội dung sang tiếng Việt',
        });
        fetchSources();
        fetchStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Lỗi dịch',
        description: error instanceof Error ? error.message : 'Dịch thất bại',
        variant: 'destructive',
      });
    } finally {
      setTranslating(null);
    }
  };

  // Bulk translate
  const handleBulkTranslate = async () => {
    if (selectedSources.size === 0) {
      toast({
        title: 'Chưa chọn nội dung',
        description: 'Vui lòng chọn ít nhất 1 nội dung để dịch',
        variant: 'destructive',
      });
      return;
    }

    setTranslating('bulk');
    try {
      const response = await fetch(`${API_BASE}/api/content-repurpose/translate/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_ids: Array.from(selectedSources),
          target_language: 'vi',
          style: 'professional',
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Hoàn thành',
          description: `Đã dịch ${data.data.summary.success}/${data.data.summary.total} nội dung`,
        });
        setSelectedSources(new Set());
        fetchSources();
        fetchStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Dịch hàng loạt thất bại',
        variant: 'destructive',
      });
    } finally {
      setTranslating(null);
    }
  };

  // Delete content
  const handleDelete = async (sourceId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/content-repurpose/sources/${sourceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Đã xóa',
          description: 'Nội dung đã được xóa',
        });
        fetchSources();
        fetchStats();
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa nội dung',
        variant: 'destructive',
      });
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedSources);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSources(newSet);
  };

  // Select all pending
  const selectAllPending = () => {
    const pendingIds = sources
      .filter(s => s.status === 'pending')
      .map(s => s.id);
    setSelectedSources(new Set(pendingIds));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Languages className="w-7 h-7" />
            Content Repurpose Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Import nội dung từ page cũ, dịch sang tiếng Việt và đăng lên page mới
          </p>
        </div>
        <div className="flex gap-2">
          <ContentRepurposeSettings />
          <Button variant="outline" onClick={() => { fetchSources(); fetchStats(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Import nội dung
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import nội dung mới</DialogTitle>
                <DialogDescription>
                  Copy nội dung từ bài viết Facebook và paste vào đây
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nội dung gốc (tiếng Anh)</Label>
                  <Textarea
                    placeholder="Paste nội dung bài viết vào đây..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URLs hình ảnh (mỗi URL một dòng)</Label>
                  <Textarea
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    value={newMediaUrls}
                    onChange={(e) => setNewMediaUrls(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nguồn (Page name)</Label>
                    <Input
                      value={newSourcePage}
                      onChange={(e) => setNewSourcePage(e.target.value)}
                      placeholder="0xSojalSec"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Danh mục</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="hacking">Hacking</SelectItem>
                        <SelectItem value="programming">Programming</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleImport} disabled={importLoading}>
                  {importLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang import...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng nội dung</p>
                  <p className="text-2xl font-bold">{stats.total_sources}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chờ dịch</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pending_sources}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đã dịch</p>
                  <p className="text-2xl font-bold text-green-500">{stats.translated_sources}</p>
                </div>
                <Globe className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đã đăng</p>
                  <p className="text-2xl font-bold text-emerald-500">{stats.published_sources}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="pending">Chờ dịch</TabsTrigger>
            <TabsTrigger value="translated">Đã dịch</TabsTrigger>
            <TabsTrigger value="published">Đã đăng</TabsTrigger>
          </TabsList>

          {selectedSources.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Đã chọn: {selectedSources.size}
              </span>
              <Button
                size="sm"
                onClick={handleBulkTranslate}
                disabled={translating === 'bulk'}
              >
                {translating === 'bulk' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang dịch...
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4 mr-2" />
                    Dịch tất cả
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="all" className="space-y-4">
          {sources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Chưa có nội dung nào</h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu import nội dung từ page cũ của bạn
                </p>
                <Button onClick={() => setImportDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Import nội dung đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={selectAllPending}>
                  Chọn tất cả chờ dịch
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedSources(new Set())}>
                  Bỏ chọn tất cả
                </Button>
              </div>
              <ContentList
                sources={sources}
                selectedSources={selectedSources}
                onToggleSelection={toggleSelection}
                onTranslate={handleTranslate}
                onDelete={handleDelete}
                translating={translating}
                fetchSources={fetchSources}
                fetchStats={fetchStats}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="pending">
          <ContentList
            sources={sources.filter(s => s.status === 'pending')}
            selectedSources={selectedSources}
            onToggleSelection={toggleSelection}
            onTranslate={handleTranslate}
            onDelete={handleDelete}
            translating={translating}
            fetchSources={fetchSources}
            fetchStats={fetchStats}
          />
        </TabsContent>

        <TabsContent value="translated">
          <ContentList
            sources={sources.filter(s => s.status === 'translated')}
            selectedSources={selectedSources}
            onToggleSelection={toggleSelection}
            onTranslate={handleTranslate}
            onDelete={handleDelete}
            translating={translating}
            showTranslation
            fetchSources={fetchSources}
            fetchStats={fetchStats}
          />
        </TabsContent>

        <TabsContent value="published">
          <ContentList
            sources={sources.filter(s => s.status === 'published')}
            selectedSources={selectedSources}
            onToggleSelection={toggleSelection}
            onTranslate={handleTranslate}
            onDelete={handleDelete}
            translating={translating}
            showTranslation
            fetchSources={fetchSources}
            fetchStats={fetchStats}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Publish Button Component
interface PublishButtonProps {
  translationId: string;
  onSuccess: () => void;
}

const PublishButton = ({ translationId, onSuccess }: PublishButtonProps) => {
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const response = await fetch(`${API_BASE}/api/content-repurpose/publish/${translationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Will use settings from DB
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Đăng bài thành công!',
          description: (
            <a 
              href={data.data.post_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Xem bài đăng trên Facebook
            </a>
          ),
        });
        onSuccess();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Lỗi đăng bài',
        description: error instanceof Error ? error.message : 'Không thể đăng bài',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Button size="sm" onClick={handlePublish} disabled={publishing}>
      {publishing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Đang đăng...
        </>
      ) : (
        <>
          <Send className="w-4 h-4 mr-2" />
          Đăng ngay
        </>
      )}
    </Button>
  );
};

// Content List Component
interface ContentListProps {
  sources: ContentSource[];
  selectedSources: Set<string>;
  onToggleSelection: (id: string) => void;
  onTranslate: (id: string) => void;
  onDelete: (id: string) => void;
  translating: string | null;
  showTranslation?: boolean;
  fetchSources: () => void;
  fetchStats: () => void;
}

const ContentList = ({
  sources,
  selectedSources,
  onToggleSelection,
  onTranslate,
  onDelete,
  translating,
  showTranslation,
  fetchSources,
  fetchStats,
}: ContentListProps) => {
  if (sources.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Không có nội dung nào trong danh mục này
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <Card
          key={source.id}
          className={`transition-all ${
            selectedSources.has(source.id)
              ? 'ring-2 ring-primary'
              : 'hover:shadow-md'
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedSources.has(source.id)}
                  onChange={() => onToggleSelection(source.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FaFacebook className="w-4 h-4 text-blue-500" />
                    {source.source_page_name || 'Unknown Page'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(source.created_at).toLocaleDateString('vi-VN')} •{' '}
                    {source.category || 'Chưa phân loại'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[source.status] || 'bg-gray-500/20'}>
                  {source.status}
                </Badge>
                {source.media_urls.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Image className="w-3 h-3" />
                    {source.media_urls.length}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={showTranslation && source.content_translations?.length ? 'grid md:grid-cols-2 gap-4' : ''}>
              {/* Original Content */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Nội dung gốc ({source.original_language.toUpperCase()})
                </Label>
                <div className="text-sm bg-muted/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  {source.original_content}
                </div>
              </div>

              {/* Translation */}
              {showTranslation && source.content_translations?.[0] && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Languages className="w-3 h-3" />
                    Bản dịch (VI)
                    {source.content_translations[0].is_manually_edited && (
                      <Badge variant="outline" className="text-xs ml-1">Đã chỉnh sửa</Badge>
                    )}
                  </Label>
                  <div className="text-sm bg-green-500/10 p-3 rounded-lg max-h-32 overflow-y-auto">
                    {source.content_translations[0].translated_content}
                  </div>
                </div>
              )}
            </div>

            {/* Media Preview */}
            {source.media_urls.length > 0 && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Hình ảnh đính kèm
                </Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {source.media_urls.map((media) => (
                    <img
                      key={media.url}
                      src={media.url}
                      alt="Media"
                      className="w-20 h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
              {source.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => onTranslate(source.id)}
                  disabled={translating === source.id}
                >
                  {translating === source.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang dịch...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 mr-2" />
                      Dịch sang tiếng Việt
                    </>
                  )}
                </Button>
              )}
              {source.status === 'translated' && source.content_translations?.[0] && (
                <>
                  <Button size="sm" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Lên lịch đăng
                  </Button>
                  <PublishButton 
                    translationId={source.content_translations[0].id}
                    onSuccess={() => {
                      fetchSources();
                      fetchStats();
                    }}
                  />
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(source.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ContentRepurposeManager;
