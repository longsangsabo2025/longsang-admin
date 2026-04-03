import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  ContentItem,
  ContentMetrics,
  ContentStage,
  ContentStats,
} from '@/types/content-pipeline';
import { CHANNELS } from '@/types/content-pipeline';

const TABLE = 'content_pipeline';

// Generate a temporary ID for optimistic local items
const tempId = () => crypto.randomUUID();

// Default new item values
const DEFAULT_ITEM: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'> = {
  title: '',
  description: '',
  stage: 'idea',
  channel: 'longsang',
  content_type: 'youtube-long',
  priority: 'medium',
  tags: [],
  assigned_agent: '',
  due_date: null,
  scheduled_for: null,
  published_at: null,
  checklist: [],
  ai_suggestions: [],
  thumbnail_url: null,
  metrics: null,
  notes: '',
};

export function useContentPipeline() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all items ──────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from(TABLE)
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (err) {
        // Table might not exist yet — seed with demo data locally
        console.warn('[ContentPipeline] Table not found, using demo data:', err.message);
        setItems(generateDemoData());
      } else {
        setItems((data as ContentItem[]) || []);
      }
    } catch (e: any) {
      console.warn('[ContentPipeline] Fetch error, using demo data:', e.message);
      setItems(generateDemoData());
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Create ───────────────────────────────────────────────────
  const createItem = useCallback(async (partial: Partial<ContentItem>): Promise<ContentItem> => {
    const now = new Date().toISOString();
    const newItem: ContentItem = {
      ...DEFAULT_ITEM,
      ...partial,
      id: tempId(),
      created_at: now,
      updated_at: now,
    };

    // Optimistic update
    setItems((prev) => [newItem, ...prev]);

    try {
      const { data, error: err } = await supabase
        .from(TABLE)
        .insert([{ ...newItem }])
        .select()
        .single();

      if (err) {
        console.warn('[ContentPipeline] Insert skipped (table may not exist):', err.message);
        return newItem; // keep optimistic item
      }

      // Replace optimistic item with server item
      setItems((prev) => prev.map((i) => (i.id === newItem.id ? (data as ContentItem) : i)));
      return data as ContentItem;
    } catch {
      return newItem;
    }
  }, []);

  // ── Update ───────────────────────────────────────────────────
  const updateItem = useCallback(
    async (id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> => {
      const patched = { ...updates, updated_at: new Date().toISOString() };

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === id ? ({ ...i, ...patched } as ContentItem) : i))
      );

      try {
        const { data, error: err } = await supabase
          .from(TABLE)
          .update(patched)
          .eq('id', id)
          .select()
          .single();

        if (err) {
          console.warn('[ContentPipeline] Update skipped:', err.message);
          return null;
        }
        setItems((prev) => prev.map((i) => (i.id === id ? (data as ContentItem) : i)));
        return data as ContentItem;
      } catch {
        return null;
      }
    },
    []
  );

  // ── Move stage (drag-and-drop) ───────────────────────────────
  const moveToStage = useCallback(
    async (id: string, stage: ContentStage) => {
      const extra: Partial<ContentItem> = {};
      if (stage === 'published') {
        extra.published_at = new Date().toISOString();
      }
      return updateItem(id, { stage, ...extra });
    },
    [updateItem]
  );

  // ── Delete ───────────────────────────────────────────────────
  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await supabase.from(TABLE).delete().eq('id', id);
    } catch {
      /* ignore if table not exists */
    }
  }, []);

  // ── Stats ────────────────────────────────────────────────────
  const stats: ContentStats = useMemo(() => {
    const byStage = { idea: 0, script: 0, visual: 0, production: 0, review: 0, published: 0 };
    const byChannel: Record<string, number> = {};
    const byPriority = { urgent: 0, high: 0, medium: 0, low: 0 };
    let publishedThisWeek = 0;
    let overdueCount = 0;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const now = new Date().toISOString();

    for (const item of items) {
      byStage[item.stage] = (byStage[item.stage] || 0) + 1;
      byChannel[item.channel] = (byChannel[item.channel] || 0) + 1;
      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
      if (item.published_at && item.published_at >= weekAgo) publishedThisWeek++;
      if (item.due_date && item.due_date < now && item.stage !== 'published') overdueCount++;
    }

    return { total: items.length, byStage, byChannel, byPriority, publishedThisWeek, overdueCount };
  }, [items]);

  // ── Realtime subscription ────────────────────────────────────
  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel('content-pipeline-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  // ── Publish to social media ──────────────────────────────
  const publishToSocial = useCallback(
    async (item: ContentItem): Promise<{ success: boolean; results: Record<string, any> }> => {
      const channelMap: Record<string, string> = {
        lyblack: 'Lý Blạck',
        ainewbie: 'AI Newbie',
        dungdaydi: 'Đứng Dậy Đi',
        vtdreamhomes: 'VT Dream Homes',
        longsang: 'LongSang',
      };
      const priorityEmoji: Record<string, string> = {
        urgent: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      };
      const channelCfg = CHANNELS.find((c) => c.key === item.channel);

      const telegramContent = [
        `🎬 <b>NEW CONTENT PUBLISHED</b>`,
        ``,
        `${priorityEmoji[item.priority] || '🔵'} <b>${item.title}</b>`,
        ``,
        `📝 ${item.description}`,
        ``,
        `📺 Channel: <b>${channelMap[item.channel] || item.channel}</b>`,
        `🎯 Type: ${item.content_type}`,
        `🏷️ Tags: ${(item.tags || []).map((t) => `#${t.replace(/-/g, '_')}`).join(' ')}`,
        ``,
        `✅ Pipeline: ${item.checklist?.filter((c) => c.done).length}/${item.checklist?.length} tasks`,
        `📅 ${new Date().toLocaleString('vi-VN')}`,
        ``,
        `🤖 <i>Auto-posted by Content Command OS</i>`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `<b>LongSang AI Empire</b> 🏰`,
      ].join('\n');

      const results: Record<string, any> = {};

      // Post to Telegram
      try {
        const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
        if (botToken && chatId) {
          const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: telegramContent, parse_mode: 'HTML' }),
          });
          const data = await resp.json();
          results.telegram = data.ok
            ? {
                success: true,
                postId: String(data.result.message_id),
                url: `https://t.me/c/${chatId}/${data.result.message_id}`,
              }
            : { success: false, error: data.description };
        } else {
          results.telegram = { success: false, error: 'Telegram not configured' };
        }
      } catch (e: any) {
        results.telegram = { success: false, error: e.message };
      }

      // Update metrics in DB
      const metrics: ContentMetrics = {
        ...((item.metrics as ContentMetrics) || {}),
        platforms_posted: Object.keys(results).filter((k) => results[k]?.success),
        post_results: results,
        posted_at: new Date().toISOString(),
      };

      await updateItem(item.id, {
        stage: 'published',
        published_at: new Date().toISOString(),
        metrics,
        notes:
          item.notes +
          `\n\n📡 Auto-posted ${new Date().toLocaleString('vi-VN')}: ${
            Object.keys(results)
              .filter((k) => results[k]?.success)
              .map((k) => k + ' ✅')
              .join(', ') || 'none'
          }`,
      });

      const anySuccess = Object.values(results).some((r: any) => r.success);
      return { success: anySuccess, results };
    },
    [updateItem]
  );

  return {
    items,
    loading,
    error,
    stats,
    refresh: fetchItems,
    createItem,
    updateItem,
    moveToStage,
    deleteItem,
    publishToSocial,
  };
}

// ── Demo data for when Supabase table doesn't exist ──────────
function generateDemoData(): ContentItem[] {
  const now = new Date().toISOString();
  const items: ContentItem[] = [
    {
      id: 'demo-1',
      title: '10 Công Cụ AI Miễn Phí Cho Freelancer 2026',
      description: 'Video review 10 AI tools tốt nhất, miễn phí, dành cho freelancer việt nam',
      stage: 'idea',
      channel: 'lyblack',
      content_type: 'youtube-long',
      priority: 'high',
      tags: ['ai-tools', 'freelancer', 'review'],
      assigned_agent: 'travis-ai',
      due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
      scheduled_for: null,
      published_at: null,
      checklist: [
        { id: '1', label: 'Research tools', done: true },
        { id: '2', label: 'Viết outline', done: false },
        { id: '3', label: 'Draft script', done: false },
      ],
      ai_suggestions: ['Thêm so sánh giá', 'Hook mạnh hơn', 'Thêm demo thực tế'],
      thumbnail_url: null,
      metrics: null,
      notes: '',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-2',
      title: 'Thơ Chế: ChatGPT vs Gemini — Cuộc Chiến Thế Kỷ',
      description: 'Lý Blạck phân tích 2 ông lớn AI bằng thơ lục bát remix',
      stage: 'script',
      channel: 'lyblack',
      content_type: 'youtube-short',
      priority: 'urgent',
      tags: ['thơ-chế', 'ai-comparison', 'viral'],
      assigned_agent: 'script-writer',
      due_date: new Date(Date.now() + 1 * 86400000).toISOString(),
      scheduled_for: null,
      published_at: null,
      checklist: [
        { id: '1', label: 'Viết thơ', done: true },
        { id: '2', label: 'Review tone', done: true },
        { id: '3', label: 'Record voice', done: false },
      ],
      ai_suggestions: ['Thêm punch line cuối', 'Dùng meme format'],
      thumbnail_url: null,
      metrics: null,
      notes: 'Viral potential cao — cần publish ASAP',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-3',
      title: 'Bí Quyết Kiếm $10K/Tháng Với AI — Hormozi Style',
      description:
        'Video podcast dài theo phong cách Alex Hormozi, chia sẻ framework kiếm tiền với AI',
      stage: 'production',
      channel: 'dungdaydi',
      content_type: 'podcast',
      priority: 'high',
      tags: ['money', 'ai-business', 'hormozi'],
      assigned_agent: 'youtube-crew',
      due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      scheduled_for: new Date(Date.now() + 7 * 86400000).toISOString(),
      published_at: null,
      checklist: [
        { id: '1', label: 'Script approved', done: true },
        { id: '2', label: 'Voice recording', done: true },
        { id: '3', label: 'Video assembly', done: false },
        { id: '4', label: 'Thumbnail', done: false },
      ],
      ai_suggestions: [],
      thumbnail_url: null,
      metrics: null,
      notes: '',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-4',
      title: 'Vũng Tàu — 5 Căn Hộ View Biển Đáng Mua Nhất 2026',
      description: 'Content SEO cho VT Dream Homes, review 5 căn hộ view biển giá tốt',
      stage: 'review',
      channel: 'vtdreamhomes',
      content_type: 'blog',
      priority: 'medium',
      tags: ['real-estate', 'vung-tau', 'seo'],
      assigned_agent: 'content-repurposer',
      due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      scheduled_for: null,
      published_at: null,
      checklist: [
        { id: '1', label: 'Draft viết xong', done: true },
        { id: '2', label: 'SEO check', done: true },
        { id: '3', label: 'Review nội dung', done: false },
      ],
      ai_suggestions: ['Optimize H2 tags', 'Thêm internal links'],
      thumbnail_url: null,
      metrics: null,
      notes: '',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-5',
      title: 'AI Cho Người Mới Bắt Đầu — Ep.1: Prompt Engineering',
      description: 'Series giáo dục AI cơ bản cho community AINewbie',
      stage: 'published',
      channel: 'ainewbie',
      content_type: 'youtube-long',
      priority: 'medium',
      tags: ['education', 'prompt-engineering', 'beginner'],
      assigned_agent: 'youtube-crew',
      due_date: null,
      scheduled_for: null,
      published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      checklist: [
        { id: '1', label: 'Script', done: true },
        { id: '2', label: 'Record', done: true },
        { id: '3', label: 'Edit', done: true },
        { id: '4', label: 'Upload', done: true },
      ],
      ai_suggestions: [],
      thumbnail_url: null,
      metrics: { views: 1250, likes: 89, shares: 23, comments: 15, revenue: 3.5 },
      notes: 'Engagement tốt, tiếp tục series',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: now,
    },
    {
      id: 'demo-6',
      title: 'Newsletter: Top 5 AI Updates Tuần Này',
      description: 'Weekly newsletter tổng hợp tin AI cho subscribers',
      stage: 'idea',
      channel: 'longsang',
      content_type: 'newsletter',
      priority: 'low',
      tags: ['newsletter', 'weekly', 'ai-news'],
      assigned_agent: 'travis-ai',
      due_date: new Date(Date.now() + 4 * 86400000).toISOString(),
      scheduled_for: null,
      published_at: null,
      checklist: [
        { id: '1', label: 'Thu thập tin', done: false },
        { id: '2', label: 'Viết summary', done: false },
      ],
      ai_suggestions: ['Auto-fetch từ RSS', 'Thêm section "Tool of the week"'],
      thumbnail_url: null,
      metrics: null,
      notes: '',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-7',
      title: 'TikTok: 3 Mẹo Dùng AI Mà Ít Ai Biết',
      description: 'Short-form viral content cho TikTok — hook + tips format',
      stage: 'visual',
      channel: 'lyblack',
      content_type: 'tiktok',
      priority: 'medium',
      tags: ['tiktok', 'tips', 'viral'],
      assigned_agent: 'visual-director',
      due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      scheduled_for: null,
      published_at: null,
      checklist: [
        { id: '1', label: 'Script viết xong', done: true },
        { id: '2', label: 'Storyboard', done: false },
        { id: '3', label: 'Visual assets', done: false },
      ],
      ai_suggestions: ['Dùng trending audio', 'Text overlay style'],
      thumbnail_url: null,
      metrics: null,
      notes: '',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-8',
      title: 'Social: Tuần này tôi đã dùng AI để...',
      description: 'Personal story sharing trên Facebook/LinkedIn — engagement bait',
      stage: 'script',
      channel: 'longsang',
      content_type: 'social',
      priority: 'low',
      tags: ['social', 'personal', 'storytelling'],
      assigned_agent: 'travis-ai',
      due_date: null,
      scheduled_for: new Date(Date.now() + 1 * 86400000).toISOString(),
      published_at: null,
      checklist: [
        { id: '1', label: 'Draft caption', done: true },
        { id: '2', label: 'Chọn ảnh', done: false },
      ],
      ai_suggestions: ['Thêm CTA cuối bài', 'Tag relevant people'],
      thumbnail_url: null,
      metrics: null,
      notes: '',
      created_at: now,
      updated_at: now,
    },
  ];
  return items;
}
