/**
 * YouTube Harvester — Channel Panel
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  ExternalLink,
  ListVideo,
  Loader2,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { API_BASE } from './constants';
import type { ChannelInfo, SavedChannel } from './types';
import { extractChannelId, formatNumber } from './utils';

export function ChannelPanel() {
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [savedChannels, setSavedChannels] = useState<SavedChannel[]>([]);
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved channels
  useEffect(() => {
    const saved = localStorage.getItem('youtube-saved-channels');
    if (saved) {
      setSavedChannels(JSON.parse(saved));
    }
  }, []);

  // Fetch channel info
  const fetchChannelInfo = async () => {
    const extracted = extractChannelId(channelUrl);
    if (!extracted) {
      setError('URL không hợp lệ. Hỗ trợ: youtube.com/channel/UC..., youtube.com/@handle, hoặc @handle');
      return;
    }

    setLoading(true);
    setError(null);
    setChannelInfo(null);

    try {
      const response = await fetch(`${API_BASE}/api/brain/youtube/channel/${extracted.value}?type=${extracted.type}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Không thể lấy thông tin channel');
      }

      setChannelInfo(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  // Save channel to list
  const saveChannel = () => {
    if (!channelInfo) return;

    const newChannel: SavedChannel = {
      id: Date.now().toString(),
      channelId: channelInfo.id,
      title: channelInfo.title,
      thumbnail: channelInfo.thumbnail,
      addedAt: new Date().toISOString(),
      videosImported: 0,
    };

    const updated = [newChannel, ...savedChannels.filter(c => c.channelId !== channelInfo.id)];
    setSavedChannels(updated);
    localStorage.setItem('youtube-saved-channels', JSON.stringify(updated));

    setChannelInfo(null);
    setChannelUrl('');
  };

  // Remove channel
  const removeChannel = (channelId: string) => {
    const updated = savedChannels.filter(c => c.channelId !== channelId);
    setSavedChannels(updated);
    localStorage.setItem('youtube-saved-channels', JSON.stringify(updated));
  };

  // Fetch channel videos
  const fetchChannelVideos = async (channelId: string) => {
    setLoadingVideos(true);
    try {
      const response = await fetch(`${API_BASE}/api/brain/youtube/channel/${channelId}/videos?limit=10`);
      const data = await response.json();
      if (data.success) {
        setChannelVideos(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <CardTitle>Channel Subscriptions</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Theo dõi các kênh YouTube yêu thích và import video mới
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Channel */}
        <div className="space-y-2">
          <Label>Thêm Channel</Label>
          <div className="flex gap-2">
            <Input
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="youtube.com/@channel hoặc @handle"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && fetchChannelInfo()}
            />
            <Button onClick={fetchChannelInfo} disabled={!channelUrl || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Channel Preview */}
        {channelInfo && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-4 items-start">
                <img
                  src={channelInfo.thumbnail}
                  alt={channelInfo.title}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{channelInfo.title}</h3>
                  {channelInfo.customUrl && (
                    <p className="text-sm text-muted-foreground">@{channelInfo.customUrl}</p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>{formatNumber(channelInfo.subscriberCount)} subscribers</span>
                    <span>{formatNumber(channelInfo.videoCount)} videos</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {channelInfo.description}
                  </p>
                </div>
                <Button onClick={saveChannel} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Theo dõi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Channels */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Channels đang theo dõi</Label>
            <Badge variant="outline">{savedChannels.length}</Badge>
          </div>

          {savedChannels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có channel nào</p>
              <p className="text-xs mt-1">Thêm channel để theo dõi video mới</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {savedChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <img
                    src={channel.thumbnail}
                    alt={channel.title}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{channel.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {channel.videosImported} videos imported
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchChannelVideos(channel.channelId)}
                    >
                      <ListVideo className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://youtube.com/channel/${channel.channelId}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeChannel(channel.channelId)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel Videos Preview */}
        {channelVideos.length > 0 && (
          <div className="space-y-2">
            <Label>Videos gần đây</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {channelVideos.map((video) => (
                <div
                  key={video.id}
                  className="p-2 rounded border hover:bg-muted/50 cursor-pointer"
                  onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                >
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full aspect-video object-cover rounded"
                  />
                  <p className="text-xs font-medium mt-1 line-clamp-2">{video.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
