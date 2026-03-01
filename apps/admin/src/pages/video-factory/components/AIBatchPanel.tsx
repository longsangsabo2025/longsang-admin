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
import { Bot, Loader2, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import {
  videoFactoryService,
  type VideoModel,
} from '@/services/video-factory.service';

export const AIBatchPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [mediaType, setMediaType] = useState<'mixed' | 'image' | 'video'>('mixed');
  const [niche, setNiche] = useState('');
  const [autoQueue, setAutoQueue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ prompt: string; style: string; hook: string; recommended_model: string; recommended_aspect: string }>>([]);

  const { data: aiStatus } = useQuery({
    queryKey: ['video-factory', 'ai-status'],
    queryFn: () => videoFactoryService.getAIStatus(),
    staleTime: 60000,
  });

  const { data: channels } = useQuery({
    queryKey: ['video-factory', 'channels'],
    queryFn: () => videoFactoryService.listChannels(),
  });

  const [channelId, setChannelId] = useState('');

  if (!aiStatus?.available) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const data = await videoFactoryService.generateAIBatch({
        topic: topic.trim(),
        count,
        media_type: mediaType,
        niche: niche || undefined,
        auto_queue: autoQueue,
        channel_id: channelId || undefined,
      });
      setResults(data.prompts);
      if (data.queued > 0) {
        queryClient.invalidateQueries({ queryKey: ['video-factory'] });
        toast({
          title: `🚀 ${data.queued} jobs queued!`,
          description: `Generated ${data.count} prompts, ${data.queued} auto-added to queue`,
        });
      } else {
        toast({
          title: `✨ ${data.count} prompts generated`,
          description: 'Click individual prompts to add them to queue',
        });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'AI Batch Failed', description: errorMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addSingleToQueue = async (item: { prompt: string; recommended_model?: string; recommended_aspect?: string }) => {
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
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-purple-500" />
          AI Batch Generator
          <Badge variant="outline" className="text-xs text-purple-500 border-purple-300">
            Gemini 2.0 Flash
          </Badge>
        </CardTitle>
        <CardDescription>
          Give AI a topic → auto-generate multiple optimized prompts → optional auto-queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 space-y-1">
            <Label className="text-xs">Topic / Idea</Label>
            <Input
              placeholder="e.g. futuristic cyberpunk city at night..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={mediaType} onValueChange={(v) => setMediaType(v as typeof mediaType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">🎯 Mixed (Image + Video)</SelectItem>
                <SelectItem value="video">🎬 Video Only</SelectItem>
                <SelectItem value="image">🎨 Image Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Count</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Niche (optional)</Label>
            <Select value={niche || '__none__'} onValueChange={(v) => setNiche(v === '__none__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Any niche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any</SelectItem>
                <SelectItem value="ai-facts">🤖 AI Facts</SelectItem>
                <SelectItem value="motivational">💪 Motivational</SelectItem>
                <SelectItem value="satisfying">✨ Satisfying</SelectItem>
                <SelectItem value="real-estate">🏡 Real Estate</SelectItem>
                <SelectItem value="nature">🌿 Nature</SelectItem>
                <SelectItem value="food">🍕 Food</SelectItem>
                <SelectItem value="tech">💻 Tech</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoQueue}
                onChange={(e) => setAutoQueue(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-queue</span>
            </label>
          </div>
          <div className="flex items-end">
            <Button
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
              disabled={loading || !topic.trim()}
              onClick={handleGenerate}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate {count} Prompts
                </>
              )}
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium text-purple-600">
              ✨ {results.length} AI-Generated Prompts
            </div>
            <div className="grid gap-2 max-h-[400px] overflow-auto">
              {results.map((item, i) => (
                <div
                  key={i}
                  className="group p-3 rounded-lg border bg-card hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.recommended_model || 'auto'}
                        </Badge>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {item.style}
                        </Badge>
                        {item.hook && (
                          <span className="text-xs text-muted-foreground truncate">
                            🔥 {item.hook}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
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
        )}
      </CardContent>
    </Card>
  );
};
