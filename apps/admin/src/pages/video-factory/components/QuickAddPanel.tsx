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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import {
  videoFactoryService,
  type CreateVideoRequest,
  type VideoModel,
} from '@/services/video-factory.service';

export const QuickAddPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<VideoModel>('minimax-hailuo');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: capacity } = useQuery({
    queryKey: ['video-factory', 'capacity'],
    queryFn: () => videoFactoryService.getCapacity(),
    refetchInterval: 3000,
  });

  const { data: aiStatus } = useQuery({
    queryKey: ['video-factory', 'ai-status'],
    queryFn: () => videoFactoryService.getAIStatus(),
    staleTime: 60000,
  });

  const addMutation = useMutation({
    mutationFn: (data: CreateVideoRequest) => videoFactoryService.addToQueue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory'] });
      toast({ title: '✅ Added to Queue', description: 'Video will be generated when slot is available' });
      setPrompt('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const videoModels = [
    { value: 'minimax-hailuo' as VideoModel, label: '🎬 Minimax Hailuo', desc: 'Best quality' },
    { value: 'higgsfield-soul' as VideoModel, label: '✨ Higgsfield Soul', desc: 'Artistic' },
    { value: 'higgsfield-popcorn' as VideoModel, label: '🍿 Popcorn', desc: 'Fast' },
    { value: 'reve' as VideoModel, label: '🌊 Reve', desc: 'Smooth' },
  ];
  
  const imageModels = [
    { value: 'seedream-v5' as VideoModel, label: '🎨 Seedream V5', desc: 'HD Images' },
    { value: 'flux2-pro' as VideoModel, label: '⚡ FLUX.2 Pro', desc: 'Fast' },
    { value: 'gpt-image' as VideoModel, label: '🤖 GPT Image', desc: 'Creative' },
  ];

  const isImageModel = imageModels.some(m => m.value === model);
  const canSubmit = prompt.trim().length > 0;
  const isAtCapacity = isImageModel 
    ? (capacity?.image?.available || 0) === 0 
    : (capacity?.video?.available || 0) === 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addMutation.mutate({
      prompt: prompt.trim(),
      model,
      aspect_ratio: aspectRatio,
      resolution: '720p',
      duration: 5,
      priority: 5,
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5 text-primary" />
          Quick Generate
        </CardTitle>
        <CardDescription>Enter prompt, select model, click Run</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Textarea
              placeholder="Describe your video... or type a topic and click ✨ AI to generate prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none flex-1"
            />
          </div>
          {aiStatus?.available && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-purple-600 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-950"
                disabled={aiLoading || !prompt.trim()}
                onClick={async () => {
                  setAiLoading(true);
                  try {
                    const result = await videoFactoryService.generateAIPrompt({
                      topic: prompt.trim(),
                      media_type: isImageModel ? 'image' : 'video',
                      model,
                    });
                    setPrompt(result.prompt);
                    toast({
                      title: '✨ AI Prompt Generated',
                      description: `Style: ${result.style} | ${result.tip}`,
                    });
                  } catch (error: unknown) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    toast({ title: 'AI Generation Failed', description: errorMsg, variant: 'destructive' });
                  } finally {
                    setAiLoading(false);
                  }
                }}
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {aiLoading ? 'Generating...' : 'AI Generate'}
              </Button>
              <span className="text-xs text-muted-foreground">
                Gemini 2.0 Flash • Type a topic → click AI → get optimized prompt
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select value={model} onValueChange={(v) => setModel(v as VideoModel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_video_header" disabled className="font-semibold text-primary">
                  ── VIDEO MODELS ──
                </SelectItem>
                {videoModels.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label} <span className="text-muted-foreground text-xs ml-2">{m.desc}</span>
                  </SelectItem>
                ))}
                <SelectItem value="_image_header" disabled className="font-semibold text-purple-500 mt-2">
                  ── IMAGE MODELS ──
                </SelectItem>
                {imageModels.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label} <span className="text-muted-foreground text-xs ml-2">{m.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9:16">📱 9:16 (TikTok/Shorts)</SelectItem>
                <SelectItem value="16:9">🖥️ 16:9 (YouTube)</SelectItem>
                <SelectItem value="1:1">⬜ 1:1 (Instagram)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {isAtCapacity ? (
              <span className="text-yellow-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                At capacity - will queue
              </span>
            ) : (
              <span className="text-green-500">
                {isImageModel ? `${capacity?.image?.available} image slots` : `${capacity?.video?.available} video slots`} available
              </span>
            )}
          </div>
          
          <Button 
            size="lg" 
            className="gap-2 px-8" 
            disabled={!canSubmit || addMutation.isPending}
            onClick={handleSubmit}
          >
            {addMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
