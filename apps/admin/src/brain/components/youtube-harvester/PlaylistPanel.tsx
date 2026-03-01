/**
 * YouTube Harvester — Playlist Panel
 */

import { useDomains } from '@/brain/hooks/useDomains';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Brain,
  ListVideo,
  Loader2,
  Search,
} from 'lucide-react';
import { useState } from 'react';

import { API_BASE } from './constants';
import type { PlaylistInfo, PlaylistVideo } from './types';
import { extractPlaylistId } from './utils';

export function PlaylistPanel() {
  const { data: domains } = useDomains();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentTitle: '' });
  const [error, setError] = useState<string | null>(null);

  // Fetch playlist info
  const fetchPlaylistInfo = async () => {
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      setError('URL playlist không hợp lệ. Ví dụ: youtube.com/playlist?list=PLxxxxx');
      return;
    }

    setLoading(true);
    setError(null);
    setPlaylistInfo(null);
    setVideos([]);

    try {
      const response = await fetch(`${API_BASE}/api/brain/youtube/playlist/${playlistId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Không thể lấy thông tin playlist');
      }

      setPlaylistInfo(data.data.playlist);
      setVideos(data.data.videos.map((v: any) => ({
        ...v,
        selected: true,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  // Toggle video selection
  const toggleVideo = (videoId: string) => {
    setVideos(videos.map(v =>
      v.id === videoId ? { ...v, selected: !v.selected } : v
    ));
  };

  // Select/deselect all
  const toggleAll = (selected: boolean) => {
    setVideos(videos.map(v => ({ ...v, selected })));
  };

  // Import selected videos
  const importSelectedVideos = async () => {
    const selectedVideos = videos.filter(v => v.selected);
    if (selectedVideos.length === 0 || !selectedDomain) {
      setError('Vui lòng chọn ít nhất 1 video và domain');
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: selectedVideos.length, currentTitle: '' });

    for (let i = 0; i < selectedVideos.length; i++) {
      const video = selectedVideos[i];
      setImportProgress({
        current: i + 1,
        total: selectedVideos.length,
        currentTitle: video.title,
      });

      try {
        // Fetch transcript
        const transcriptRes = await fetch(`${API_BASE}/api/brain/youtube/transcript/${video.id}?lang=vi`);
        const transcriptData = await transcriptRes.json();

        const transcript = transcriptData.success ? transcriptData.data.text : '';

        // Analyze with AI
        const analyzeRes = await fetch(`${API_BASE}/api/brain/youtube/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            title: video.title,
            transcript: transcript,
          }),
        });
        const analyzeData = await analyzeRes.json();

        // Ingest to brain
        await fetch(`${API_BASE}/api/brain/knowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domainId: selectedDomain,
            title: video.title,
            content: analyzeData.success ? analyzeData.data.knowledgeDocument : transcript,
            contentType: 'video',
            sourceUrl: `https://youtube.com/watch?v=${video.id}`,
            metadata: {
              videoId: video.id,
              playlistId: playlistInfo?.id,
              importedAt: new Date().toISOString(),
            },
          }),
        });

        // Update video as imported
        setVideos(prev => prev.map(v =>
          v.id === video.id ? { ...v, selected: false } : v
        ));
      } catch (err) {
        console.error(`Failed to import ${video.title}:`, err);
      }

      // Small delay between imports
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setImporting(false);
    setImportProgress({ current: 0, total: 0, currentTitle: '' });
  };

  const selectedCount = videos.filter(v => v.selected).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-purple-500" />
            <CardTitle>Playlist Bulk Import</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Import toàn bộ playlist YouTube với xử lý hàng loạt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playlist URL Input */}
        <div className="space-y-2">
          <Label>Playlist URL</Label>
          <div className="flex gap-2">
            <Input
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="youtube.com/playlist?list=PLxxxxx"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && fetchPlaylistInfo()}
            />
            <Button onClick={fetchPlaylistInfo} disabled={!playlistUrl || loading}>
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

        {/* Playlist Info */}
        {playlistInfo && (
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-4 items-start">
                <img
                  src={playlistInfo.thumbnail}
                  alt={playlistInfo.title}
                  className="w-32 h-20 rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{playlistInfo.title}</h3>
                  <p className="text-sm text-muted-foreground">{playlistInfo.channelTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {playlistInfo.videoCount} videos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Domain Selection */}
        {videos.length > 0 && (
          <div className="space-y-2">
            <Label>Domain đích *</Label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn domain để lưu" />
              </SelectTrigger>
              <SelectContent>
                {domains?.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Video List */}
        {videos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Videos ({selectedCount}/{videos.length} đã chọn)</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
                  Chọn tất cả
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
                  Bỏ chọn
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors ${
                    video.selected ? 'bg-purple-500/10 border-purple-500/30' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleVideo(video.id)}
                >
                  <input
                    type="checkbox"
                    checked={video.selected}
                    onChange={() => toggleVideo(video.id)}
                    className="w-4 h-4"
                  />
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-20 h-12 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                    <p className="text-xs text-muted-foreground">{video.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Progress */}
        {importing && (
          <Alert className="border-purple-500/50 bg-purple-500/10">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Đang import...</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                {importProgress.current}/{importProgress.total}: {importProgress.currentTitle}
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Import Button */}
        {videos.length > 0 && !importing && (
          <Button
            onClick={importSelectedVideos}
            disabled={selectedCount === 0 || !selectedDomain}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Brain className="h-4 w-4 mr-2" />
            Import {selectedCount} videos vào Brain
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
