/**
 * 🎯 CONTENT COMMAND OS — Multi-View Content Pipeline Dashboard
 * Kanban · Calendar · Table — unified content management for all channels.
 */

import {
  CalendarDays,
  Filter,
  KanbanSquare,
  List,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ContentCalendar } from '@/components/content-os/ContentCalendar';
import { ContentDetailPanel } from '@/components/content-os/ContentDetailPanel';
import { ContentKanban } from '@/components/content-os/ContentKanban';
import { ContentQuickAdd } from '@/components/content-os/ContentQuickAdd';
import { ContentStatsBar } from '@/components/content-os/ContentStatsBar';
import { ContentTable } from '@/components/content-os/ContentTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContentPipeline } from '@/hooks/useContentPipeline';
import { usePersistedState } from '@/hooks/usePersistedState';
import { cn } from '@/lib/utils';
import type { ContentChannel, ContentItem, ContentStage } from '@/types/content-pipeline';
import { CHANNELS, STAGES } from '@/types/content-pipeline';

type ViewTab = 'kanban' | 'calendar' | 'table';

export default function ContentCommandOS() {
  const {
    items,
    loading,
    stats,
    refresh,
    createItem,
    updateItem,
    moveToStage,
    deleteItem,
    publishToSocial,
  } = useContentPipeline();

  // View tab (persisted)
  const [activeTab, setActiveTab] = usePersistedState<ViewTab>('content-os-tab', 'kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<ContentChannel | 'all'>('all');
  const [filterStage, setFilterStage] = useState<ContentStage | 'all'>('all');

  // Detail panel
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Quick add dialog
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDefaultStage, setQuickAddDefaultStage] = useState<ContentStage>('idea');

  // ── Filtered items ──────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterChannel !== 'all' && item.channel !== filterChannel) return false;
      if (filterStage !== 'all' && item.stage !== filterStage) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, filterChannel, filterStage, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────
  const handleSelect = useCallback((item: ContentItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  }, []);

  const handleQuickAdd = useCallback((stage: ContentStage) => {
    setQuickAddDefaultStage(stage);
    setQuickAddOpen(true);
  }, []);

  const handleCreate = useCallback(
    (partial: Partial<ContentItem>) => {
      createItem(partial);
    },
    [createItem]
  );

  const activeFilters =
    (filterChannel !== 'all' ? 1 : 0) + (filterStage !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Content Command OS
          </h1>
          <p className="text-muted-foreground mt-1">
            Pipeline nội dung đa kênh — từ ý tưởng đến xuất bản
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => handleQuickAdd('idea')}>
            <Plus className="h-4 w-4" />
            Thêm mới
          </Button>
        </div>
      </div>

      <Separator />

      {/* ── STATS BAR ── */}
      <ContentStatsBar stats={stats} />

      {/* ── FILTERS + TABS ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 pl-8 text-sm"
            />
          </div>
          <Select
            value={filterChannel}
            onValueChange={(v) => setFilterChannel(v as ContentChannel | 'all')}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Kênh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kênh</SelectItem>
              {CHANNELS.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.icon} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterStage}
            onValueChange={(v) => setFilterStage(v as ContentStage | 'all')}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Giai đoạn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giai đoạn</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.icon} {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => {
                setSearchQuery('');
                setFilterChannel('all');
                setFilterStage('all');
              }}
            >
              Xoá bộ lọc ({activeFilters})
            </Button>
          )}
        </div>

        {/* Results count */}
        <span className="text-xs text-muted-foreground">
          {filteredItems.length}/{items.length} nội dung
        </span>
      </div>

      {/* ── VIEW TABS ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
        <TabsList className="bg-muted/30">
          <TabsTrigger value="kanban" className="gap-1.5 text-xs">
            <KanbanSquare className="h-3.5 w-3.5" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            Lịch
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-1.5 text-xs">
            <List className="h-3.5 w-3.5" />
            Bảng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <ContentKanban
            items={filteredItems}
            onMoveStage={moveToStage}
            onSelect={handleSelect}
            onQuickAdd={handleQuickAdd}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <ContentCalendar
            items={filteredItems}
            onSelect={handleSelect}
            onQuickAdd={handleQuickAdd}
          />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <ContentTable
            items={filteredItems}
            onSelect={handleSelect}
            onMoveStage={moveToStage}
            onDelete={deleteItem}
          />
        </TabsContent>
      </Tabs>

      {/* ── DETAIL PANEL (Sheet) ── */}
      <ContentDetailPanel
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={updateItem}
        onMoveStage={moveToStage}
        onDelete={deleteItem}
        onPublishToSocial={async (item) => {
          const res = await publishToSocial(item);
          if (res.success) {
            const platforms = Object.keys(res.results).filter((k) => res.results[k]?.success);
            toast.success(`Đã đăng lên: ${platforms.join(', ')}`, { duration: 5000 });
          } else {
            toast.error('Không có platform nào đăng thành công');
          }
          return res;
        }}
      />

      {/* ── QUICK ADD DIALOG ── */}
      <ContentQuickAdd
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultStage={quickAddDefaultStage}
        onCreate={handleCreate}
      />
    </div>
  );
}
