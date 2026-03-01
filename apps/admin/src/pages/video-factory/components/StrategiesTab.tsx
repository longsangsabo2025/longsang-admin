import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  videoFactoryService,
  type ContentStrategy,
} from '@/services/video-factory.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  BookOpen,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';

// ─── Content Strategies Tab Component ─────────────────────────────────────────

export const StrategiesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [genStrategyId, setGenStrategyId] = useState<string | null>(null);
  const [genCount, setGenCount] = useState(3);
  const [filterChannel, setFilterChannel] = useState<string>('');

  const [newStrategy, setNewStrategy] = useState({
    channel_id: '',
    name: '',
    content_type: 'story',
    prompt_template: '',
    style_preset: '',
    priority: 5,
    frequency: 'daily',
  });

  const { data: strategiesData, isLoading } = useQuery({
    queryKey: ['video-factory', 'strategies', filterChannel],
    queryFn: () => videoFactoryService.listStrategies(filterChannel || undefined),
  });

  const { data: channelsData } = useQuery({
    queryKey: ['video-factory', 'channels'],
    queryFn: () => videoFactoryService.listChannels(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newStrategy) => videoFactoryService.createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'strategies'] });
      toast({ title: '✅ Strategy Created' });
      setCreateOpen(false);
      setNewStrategy({ channel_id: '', name: '', content_type: 'story', prompt_template: '', style_preset: '', priority: 5, frequency: 'daily' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const generateMutation = useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) => videoFactoryService.generateFromStrategy(id, count),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['video-factory'] });
      toast({ title: `🚀 Generated ${data.generated} jobs`, description: 'Added to production queue' });
      setGenStrategyId(null);
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const [enhancingId, setEnhancingId] = useState<string | null>(null);
  const enhanceMutation = useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) => videoFactoryService.enhanceStrategy(id, count),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['video-factory'] });
      toast({ title: `🧠 AI Enhanced — ${data.count || 0} prompts created`, description: data.strategy_name || '' });
      setEnhancingId(null);
    },
    onError: (err: Error) => toast({ title: 'Enhance Error', description: err.message, variant: 'destructive' }),
  });

  const channels = channelsData?.channels || [];
  const strategies = strategiesData?.strategies || [];

  const contentTypeConfig: Record<string, { icon: string; color: string }> = {
    quote: { icon: '💬', color: 'bg-blue-500/10 text-blue-600' },
    story: { icon: '📖', color: 'bg-purple-500/10 text-purple-600' },
    tutorial: { icon: '📚', color: 'bg-green-500/10 text-green-600' },
    reaction: { icon: '😱', color: 'bg-orange-500/10 text-orange-600' },
    trend: { icon: '🔥', color: 'bg-red-500/10 text-red-600' },
  };

  const frequencyConfig: Record<string, { label: string; color: string }> = {
    hourly: { label: 'Every hour', color: 'text-red-500' },
    daily: { label: 'Daily', color: 'text-blue-500' },
    weekly: { label: 'Weekly', color: 'text-green-500' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={filterChannel || '__none__'} onValueChange={(v) => setFilterChannel(v === '__none__' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">All Channels</SelectItem>
              {channels.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">{strategies.length} strategies</Badge>
        </div>
        <Button className="gap-2" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Strategy
        </Button>
      </div>

      {/* Strategy Cards */}
      {strategies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mb-4" />
          <p>No strategies configured</p>
          <p className="text-sm">Create a content strategy to auto-generate videos</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {strategies.map((strategy: ContentStrategy) => {
            const channelName = channels.find(c => c.id === strategy.channel_id)?.name || 'Unknown';
            const typeConf = contentTypeConfig[strategy.content_type] || { icon: '📝', color: 'bg-gray-500/10 text-gray-600' };
            const freqConf = frequencyConfig[strategy.frequency] || { label: strategy.frequency, color: 'text-muted-foreground' };

            return (
              <Card key={strategy.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeConf.icon}</span>
                      <CardTitle className="text-base">{strategy.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={strategy.is_active ? 'default' : 'secondary'}>
                        {strategy.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>{channelName}</span>
                    <span>•</span>
                    <span className={freqConf.color}>{freqConf.label}</span>
                    <span>•</span>
                    <span>Priority {strategy.priority}/10</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Prompt Template */}
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Prompt Template</p>
                    <p className="text-sm font-mono leading-relaxed line-clamp-3">{strategy.prompt_template}</p>
                  </div>

                  {strategy.style_preset && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">Style: {strategy.style_preset}</span>
                    </div>
                  )}

                  {/* Generate Button */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant="outline" className={typeConf.color}>
                      {strategy.content_type}
                    </Badge>
                    
                    {genStrategyId === strategy.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={genCount}
                          onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-center"
                        />
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={generateMutation.isPending}
                          onClick={() => generateMutation.mutate({ id: strategy.id, count: genCount })}
                        >
                          {generateMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Rocket className="h-3 w-3" />
                          )}
                          Go
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setGenStrategyId(null)}>✕</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => { setGenStrategyId(strategy.id); setGenCount(3); }}
                        >
                          <Zap className="h-3 w-3" />
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-purple-600 border-purple-500/30 hover:bg-purple-500/10"
                          disabled={enhanceMutation.isPending}
                          onClick={() => {
                            setEnhancingId(strategy.id);
                            enhanceMutation.mutate({ id: strategy.id, count: 5 });
                          }}
                        >
                          {enhanceMutation.isPending && enhancingId === strategy.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          AI Enhance
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Strategy Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Content Strategy</DialogTitle>
            <DialogDescription>Define a reusable prompt template for batch content generation</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Strategy Name *</Label>
                <Input
                  value={newStrategy.name}
                  onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                  placeholder="e.g. Daily Motivation Quote"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel *</Label>
                <Select value={newStrategy.channel_id} onValueChange={(v) => setNewStrategy({ ...newStrategy, channel_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select channel..." /></SelectTrigger>
                  <SelectContent>
                    {channels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>{ch.name} ({ch.platform})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prompt Template *</Label>
              <Textarea
                value={newStrategy.prompt_template}
                onChange={(e) => setNewStrategy({ ...newStrategy, prompt_template: e.target.value })}
                placeholder="A cinematic shot of {subject} in {setting}, dramatic lighting, 4K quality"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Use {'{variable}'} for dynamic parts. Variables will be filled when generating.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={newStrategy.content_type} onValueChange={(v) => setNewStrategy({ ...newStrategy, content_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quote">💬 Quote</SelectItem>
                    <SelectItem value="story">📖 Story</SelectItem>
                    <SelectItem value="tutorial">📚 Tutorial</SelectItem>
                    <SelectItem value="reaction">😱 Reaction</SelectItem>
                    <SelectItem value="trend">🔥 Trend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={newStrategy.frequency} onValueChange={(v) => setNewStrategy({ ...newStrategy, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">⏰ Hourly</SelectItem>
                    <SelectItem value="daily">📅 Daily</SelectItem>
                    <SelectItem value="weekly">🗓️ Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newStrategy.priority}
                  onChange={(e) => setNewStrategy({ ...newStrategy, priority: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Style Preset (optional)</Label>
              <Input
                value={newStrategy.style_preset}
                onChange={(e) => setNewStrategy({ ...newStrategy, style_preset: e.target.value })}
                placeholder="e.g. cinematic, anime, photorealistic"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={!newStrategy.name || !newStrategy.channel_id || !newStrategy.prompt_template || createMutation.isPending}
              onClick={() => createMutation.mutate(newStrategy)}
            >
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Strategy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
