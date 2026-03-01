/**
 * YouTube Harvester — Import History Panel
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Loader2,
  Search,
  Youtube,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { API_BASE } from './constants';
import type { ImportHistoryItem } from './types';

export function ImportHistoryPanel() {
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load history from localStorage and API
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        // Load from localStorage first (recent imports in current session)
        const localHistory = localStorage.getItem('youtube-import-history');
        let items: ImportHistoryItem[] = localHistory ? JSON.parse(localHistory) : [];

        // Try to fetch from API (knowledge entries with videoId metadata)
        try {
          const response = await fetch(`${API_BASE}/api/brain/knowledge?contentType=video&limit=50`);
          const data = await response.json();
          if (data.success && data.data) {
            const apiItems: ImportHistoryItem[] = data.data.map((item: any) => ({
              id: item.id,
              videoId: item.metadata?.videoId || '',
              title: item.title,
              channelTitle: item.metadata?.channelTitle || 'Unknown',
              thumbnail: item.metadata?.videoId
                ? `https://img.youtube.com/vi/${item.metadata.videoId}/mqdefault.jpg`
                : undefined,
              importedAt: item.metadata?.importedAt || item.createdAt,
              domain: item.domainId,
              tags: item.tags || [],
            })).filter((item: ImportHistoryItem) => item.videoId);

            // Merge and deduplicate
            const merged = [...items];
            apiItems.forEach((apiItem: ImportHistoryItem) => {
              if (!merged.find(m => m.videoId === apiItem.videoId)) {
                merged.push(apiItem);
              }
            });
            items = merged;
          }
        } catch (apiErr) {
          console.log('[History] API fetch failed, using local only:', apiErr);
        }

        // Sort by import date (newest first)
        items.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
        setHistory(items);
      } catch (err) {
        console.error('[History] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredHistory = history.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openVideo = (videoId: string) => {
    window.open(`https://youtube.com/watch?v=${videoId}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-orange-500" />
            <CardTitle>Import History</CardTitle>
          </div>
          <Badge variant="secondary">{history.length} videos</Badge>
        </div>
        <CardDescription>
          Xem lại các video đã import vào Brain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm video..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Chưa có video nào được import</p>
            <p className="text-sm mt-1">Import video đầu tiên ở tab "Single Video"</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {filteredHistory.map((item) => (
              <div
                key={item.id || item.videoId}
                className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => openVideo(item.videoId)}
              >
                {/* Thumbnail */}
                <div className="relative w-28 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.channelTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.importedAt)}
                    </span>
                    {item.tags.slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0 h-4">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
