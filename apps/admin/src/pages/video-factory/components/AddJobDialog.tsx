import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Calendar, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  videoFactoryService,
  type CreateVideoRequest,
  type VideoModel,
} from '@/services/video-factory.service';
import { IMAGE_MODELS_SET } from '../shared-data';

export const AddJobDialog = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState<CreateVideoRequest>({
    prompt: '',
    model: 'minimax-hailuo',
    resolution: '720p',
    duration: 5,
    aspect_ratio: '9:16',
    priority: 5,
  });

  const { data: channels } = useQuery({
    queryKey: ['video-factory', 'channels'],
    queryFn: () => videoFactoryService.listChannels(),
  });

  const addMutation = useMutation({
    mutationFn: (data: CreateVideoRequest) => videoFactoryService.addToQueue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory'] });
      toast({ title: 'Job Added', description: 'Video added to production queue' });
      setOpen(false);
      setFormData({ prompt: '', model: 'minimax-hailuo', resolution: '720p', duration: 5, aspect_ratio: '9:16', priority: 5 });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const videoModels: { value: VideoModel; label: string; unlimited: boolean }[] = [
    { value: 'minimax-hailuo', label: '🎬 Minimax Hailuo 2.3', unlimited: true },
    { value: 'higgsfield-soul', label: '✨ Higgsfield Soul', unlimited: true },
    { value: 'higgsfield-popcorn', label: '🍿 Higgsfield Popcorn', unlimited: true },
    { value: 'reve', label: '🌊 Reve', unlimited: true },
  ];
  const imageModels: { value: VideoModel; label: string; unlimited: boolean }[] = [
    { value: 'seedream-v5', label: '🎨 Seedream V5 Lite', unlimited: true },
    { value: 'flux2-pro', label: '⚡ FLUX.2 Pro', unlimited: true },
    { value: 'nano-banana-pro', label: '🍌 Nano Banana Pro', unlimited: true },
    { value: 'gpt-image', label: '🤖 GPT Image', unlimited: true },
    { value: 'z-image', label: '🖼️ Z Image', unlimited: true },
    { value: 'seedream-4.5', label: '🎨 Seedream 4.5', unlimited: true },
    { value: 'kling-o1-image', label: '📸 Kling O1 Image', unlimited: true },
    { value: 'flux-kontext', label: '🔗 Flux Kontext', unlimited: true },
    { value: 'nano-banana', label: '🍌 Nano Banana', unlimited: true },
    { value: 'seedream-4.0', label: '🎨 Seedream 4.0', unlimited: true },
    { value: 'higgsfield-faceswap', label: '👤 Higgsfield Face Swap', unlimited: true },
  ];
  const models = [...videoModels, ...imageModels];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Video to Queue</DialogTitle>
          <DialogDescription>
            Create a new video generation job
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">Prompt *</Label>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950 h-7 px-2"
                disabled={aiLoading || !formData.prompt?.trim()}
                onClick={async () => {
                  setAiLoading(true);
                  try {
                    const isImgModel = IMAGE_MODELS_SET.has(formData.model || '');
                    const result = await videoFactoryService.generateAIPrompt({
                      topic: formData.prompt.trim(),
                      media_type: isImgModel ? 'image' : 'video',
                      model: formData.model,
                    });
                    setFormData({ ...formData, prompt: result.prompt });
                    toast({
                      title: '✨ AI Prompt Generated',
                      description: `Style: ${result.style} | ${result.tip}`,
                    });
                  } catch (error: unknown) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    toast({ title: 'AI Failed', description: errorMsg, variant: 'destructive' });
                  } finally {
                    setAiLoading(false);
                  }
                }}
              >
                {aiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Bot className="h-3 w-3" />
                )}
                {aiLoading ? 'Generating...' : '✨ AI Enhance'}
              </Button>
            </div>
            <Textarea
              id="prompt"
              placeholder="Type a topic (e.g. 'cat in forest') → click ✨ AI Enhance to get an optimized prompt"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value as VideoModel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select
                value={formData.resolution}
                onValueChange={(value) => setFormData({ ...formData, resolution: value as '720p' | '1080p' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="4k">4K</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                min={3}
                max={60}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 5 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select
                value={formData.aspect_ratio}
                onValueChange={(value) => setFormData({ ...formData, aspect_ratio: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 (Vertical/TikTok)</SelectItem>
                  <SelectItem value="16:9">16:9 (Horizontal/YouTube)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {channels?.channels && channels.channels.length > 0 && (
            <div className="space-y-2">
              <Label>Channel (optional)</Label>
              <Select
                value={formData.channel_id || ''}
                onValueChange={(value) => setFormData({ ...formData, channel_id: value === '__none__' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No channel</SelectItem>
                  {channels.channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name} ({channel.platform})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority (1-10)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Schedule (optional)
              </Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_at || ''}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value || undefined })}
              />
              <p className="text-[10px] text-muted-foreground">Leave empty to start immediately</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => addMutation.mutate(formData)}
            disabled={!formData.prompt || addMutation.isPending}
          >
            {addMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Queue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
