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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Link, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  videoFactoryService,
  type VideoModel,
} from '@/services/video-factory.service';

export const VideoAnalyzerPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [count, setCount] = useState(5);
  const [context, setContext] = useState('');
  const [autoQueue, setAutoQueue] = useState(false);
  const [channelId, setChannelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof videoFactoryService.analyzeVideo>> | null>(null);

  const { data: aiStatus } = useQuery({
    queryKey: ['video-factory', 'ai-status'],
    queryFn: () => videoFactoryService.getAIStatus(),
    staleTime: 60000,
  });

  const { data: channels } = useQuery({
    queryKey: ['video-factory', 'channels'],
    queryFn: () => videoFactoryService.listChannels(),
  });

  if (!aiStatus?.available) return null;

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await videoFactoryService.analyzeVideo({
        url: url.trim(),
        count,
        context: context.trim() || undefined,
        auto_queue: autoQueue,
        channel_id: channelId || undefined,
      });
      setResult(data);
      if (data.queued_count && data.queued_count > 0) {
        queryClient.invalidateQueries({ queryKey: ['video-factory'] });
        toast({
          title: `🚀 ${data.queued_count} jobs queued!`,
          description: `Analyzed ${data.media_type_detected} → ${data.prompts.length} prompts generated & queued`,
        });
      } else {
        toast({
          title: `🔍 Analysis complete`,
          description: `${data.prompts.length} recreation prompts generated`,
        });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Analysis Failed', description: errorMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addSingleToQueue = async (item: { prompt: string; recommended_model?: string; recommended_aspect?: string; media_type?: string }) => {
    try {
      await videoFactoryService.addToQueue({
        prompt: item.prompt,
        model: (item.recommended_model as VideoModel) || 'minimax-hailuo',
        aspect_ratio: item.recommended_aspect || '9:16',
        resolution: '720p',
        duration: 5,
        priority: 5,
        channel_id: channelId || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['video-factory'] });
      toast({ title: '✅ Added to Queue' });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    }
  };

  return (
    <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-cyan-500" />
          Video/Image Analyzer
          <Badge variant="outline" className="text-xs text-cyan-500 border-cyan-300">
            AI Vision
          </Badge>
        </CardTitle>
        <CardDescription>
          Paste a video/image URL → AI analyzes it → auto-generates recreation prompts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-3 space-y-1">
            <Label className="text-xs">Video / Image URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://example.com/sample-video.mp4 or image.jpg ..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Variations</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 space-y-1">
            <Label className="text-xs">Context / Instructions (optional)</Label>
            <Input
              placeholder="e.g. I want similar content for my AI Facts channel..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Channel (optional)</Label>
            <Select value={channelId || '__none__'} onValueChange={(v) => setChannelId(v === '__none__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="No channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No channel</SelectItem>
                {channels?.channels?.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoQueue}
                onChange={(e) => setAutoQueue(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-queue</span>
            </label>
            <Button
              className="flex-1 gap-2 bg-cyan-600 hover:bg-cyan-700"
              disabled={loading || !url.trim()}
              onClick={handleAnalyze}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-4 mt-4 pt-4 border-t border-cyan-500/20">
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-cyan-500" />
                <span className="font-medium text-sm text-cyan-700 dark:text-cyan-300">AI Analysis</span>
                <Badge variant="secondary" className="text-xs">
                  {result.media_type_detected}
                </Badge>
              </div>
              <p className="text-sm">{result.analysis.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span><strong>Style:</strong> {result.analysis.style}</span>
                <span>•</span>
                <span><strong>Mood:</strong> {result.analysis.mood}</span>
                <span>•</span>
                <span><strong>Camera:</strong> {result.analysis.camera_work}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>🔥 Viral Factor:</strong> {result.analysis.viral_factor}
              </p>
              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {result.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {result.tip && (
                <p className="text-xs text-cyan-600 dark:text-cyan-400 italic mt-1">💡 {result.tip}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-cyan-600">
                🎯 {result.prompts.length} Recreation Prompts
                {result.queued_count ? (
                  <span className="text-green-600 ml-2">({result.queued_count} auto-queued)</span>
                ) : null}
              </div>
              <div className="grid gap-2 max-h-[400px] overflow-auto">
                {result.prompts.map((item, i) => (
                  <div
                    key={i}
                    className="group p-3 rounded-lg border bg-card hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {item.recommended_model || 'auto'}
                          </Badge>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {item.media_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs shrink-0 text-cyan-600">
                            {item.variation}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.recommended_aspect}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {item.prompt}
                        </p>
                      </div>
                      {!autoQueue && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                          onClick={() => addSingleToQueue(item)}
                        >
                          <Plus className="h-3 w-3" />
                          Queue
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
