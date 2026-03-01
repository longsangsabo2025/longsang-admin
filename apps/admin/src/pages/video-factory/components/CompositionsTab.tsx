import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Download,
  Film,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Scissors,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Video,
} from 'lucide-react';

import {
  videoFactoryService,
  type Composition,
  type CompositionClip,
  type CompositionStatus,
  type ClipReviewStatus,
  type PendingClip,
  type VideoJob,
} from '@/services/video-factory.service';

// ─── Compositions Tab ─────────────────────────────────────────────────────────

const CompStatusBadge = ({ status }: { status: CompositionStatus }) => {
  const config: Record<CompositionStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    draft: { variant: 'secondary', label: '📝 Draft' },
    ready: { variant: 'outline', label: '✅ Ready' },
    composing: { variant: 'default', label: '⏳ Composing' },
    completed: { variant: 'default', label: '🎬 Done' },
    failed: { variant: 'destructive', label: '❌ Failed' },
  };
  const { variant, label } = config[status] || config.draft;
  return <Badge variant={variant}>{label}</Badge>;
};

const ClipReviewBadge = ({ status }: { status: ClipReviewStatus }) => {
  const config: Record<ClipReviewStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { variant: 'secondary', label: 'Pending' },
    approved: { variant: 'default', label: '✅ Approved' },
    rejected: { variant: 'destructive', label: '❌ Rejected' },
    needs_regen: { variant: 'outline', label: '🔄 Regen' },
  };
  const { variant, label } = config[status] || config.pending;
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
};

export const CompositionsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [addClipOpen, setAddClipOpen] = useState(false);
  const [newComp, setNewComp] = useState({
    name: '',
    description: '',
    channel_id: '',
    aspect_ratio: '9:16',
    transition_type: 'crossfade',
    transition_duration: 0.5,
  });

  const { data: compositions, isLoading } = useQuery({
    queryKey: ['video-factory', 'compositions'],
    queryFn: () => videoFactoryService.listCompositions(),
    refetchInterval: 5000,
  });

  const { data: selectedComp, isLoading: compLoading } = useQuery({
    queryKey: ['video-factory', 'composition', selectedCompId],
    queryFn: () => videoFactoryService.getComposition(selectedCompId!),
    enabled: !!selectedCompId,
    refetchInterval: 3000,
  });

  const { data: pendingClips } = useQuery({
    queryKey: ['video-factory', 'pending-clips'],
    queryFn: () => videoFactoryService.getPendingClips(),
  });

  const { data: channelsData } = useQuery({
    queryKey: ['video-factory', 'channels'],
    queryFn: () => videoFactoryService.listChannels(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newComp) => videoFactoryService.createComposition(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'compositions'] });
      toast({ title: '✅ Composition Created' });
      setCreateOpen(false);
      setSelectedCompId(res.id);
      setNewComp({ name: '', description: '', channel_id: '', aspect_ratio: '9:16', transition_type: 'crossfade', transition_duration: 0.5 });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const addClipMutation = useMutation({
    mutationFn: ({ compId, data }: { compId: string; data: { video_queue_id?: string; video_url?: string; name?: string } }) =>
      videoFactoryService.addClipToComposition(compId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'composition', selectedCompId] });
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'pending-clips'] });
      toast({ title: '✅ Clip Added' });
      setAddClipOpen(false);
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ compId, clipId, review }: { compId: string; clipId: string; review: { review_status: ClipReviewStatus; review_notes?: string } }) =>
      videoFactoryService.reviewClip(compId, clipId, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'composition', selectedCompId] });
      toast({ title: 'Review Updated' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ compId, clipId, newOrder }: { compId: string; clipId: string; newOrder: number }) =>
      videoFactoryService.reorderClip(compId, clipId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'composition', selectedCompId] });
    },
  });

  const removeClipMutation = useMutation({
    mutationFn: ({ compId, clipId }: { compId: string; clipId: string }) =>
      videoFactoryService.removeClip(compId, clipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'composition', selectedCompId] });
      toast({ title: 'Clip Removed' });
    },
  });

  const composeMutation = useMutation({
    mutationFn: (compId: string) => videoFactoryService.startComposition(compId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'compositions'] });
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'composition', selectedCompId] });
      toast({ title: '🚀 Composition Started', description: 'Merging clips into final video...' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const channels = channelsData?.channels || [];
  const comps = compositions || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  // Composition detail view
  if (selectedCompId && selectedComp) {
    const clips = (selectedComp.clips || []).sort((a, b) => a.sequence_order - b.sequence_order);
    const approvedCount = clips.filter(c => c.review_status === 'approved').length;
    const canCompose = approvedCount >= 1 && selectedComp.status === 'draft' || selectedComp.status === 'ready';

    return (
      <div className="space-y-4">
        {/* Back + Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCompId(null)} className="gap-1">
            ← Back to list
          </Button>
          <div className="flex items-center gap-2">
            <CompStatusBadge status={selectedComp.status} />
            {canCompose && (
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700"
                size="sm"
                disabled={composeMutation.isPending}
                onClick={() => composeMutation.mutate(selectedCompId)}
              >
                {composeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                Compose Final Video
              </Button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold">{selectedComp.name}</h3>
          {selectedComp.description && <p className="text-sm text-muted-foreground">{selectedComp.description}</p>}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{selectedComp.aspect_ratio}</span>
            <span>•</span>
            <span>Transition: {selectedComp.transition_type} ({selectedComp.transition_duration}s)</span>
            <span>•</span>
            <span>{clips.length} clips ({approvedCount} approved)</span>
          </div>
        </div>

        {/* Result video if completed */}
        {selectedComp.status === 'completed' && selectedComp.output_url && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4">
              <video src={selectedComp.output_url} controls className="w-full max-h-[400px] rounded-lg" />
              <div className="flex justify-end mt-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => window.open(selectedComp.output_url!, '_blank')}>
                  <Download className="h-3 w-3" /> Download
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedComp.status === 'failed' && selectedComp.error_message && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-4 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 inline mr-2" />{selectedComp.error_message}
            </CardContent>
          </Card>
        )}

        {/* Clips Timeline */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Clips Timeline</h4>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddClipOpen(true)}>
            <Plus className="h-3 w-3" /> Add Clip
          </Button>
        </div>

        {clips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No clips yet. Add completed videos as clips.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clips.map((clip, idx) => (
              <Card key={clip.id} className={`border transition-colors ${
                clip.review_status === 'approved' ? 'border-green-500/30' :
                clip.review_status === 'rejected' ? 'border-red-500/30' : ''
              }`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {/* Order */}
                    <div className="flex flex-col items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={idx === 0 || reorderMutation.isPending}
                        onClick={() => reorderMutation.mutate({ compId: selectedCompId, clipId: clip.id, newOrder: clip.sequence_order - 1 })}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-mono text-muted-foreground">{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        disabled={idx === clips.length - 1 || reorderMutation.isPending}
                        onClick={() => reorderMutation.mutate({ compId: selectedCompId, clipId: clip.id, newOrder: clip.sequence_order + 1 })}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-24 h-14 rounded bg-muted overflow-hidden shrink-0">
                      {clip.thumbnail_url ? (
                        <img src={clip.thumbnail_url} className="w-full h-full object-cover" />
                      ) : clip.video_url ? (
                        <video src={clip.video_url} muted className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full"><Film className="h-5 w-5 text-muted-foreground/40" /></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{clip.name || `Clip ${idx + 1}`}</span>
                        <ClipReviewBadge status={clip.review_status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {clip.duration ? `${clip.duration}s` : 'Unknown duration'}
                        {clip.trim_start > 0 && ` • Trim: ${clip.trim_start}s`}
                        {clip.trim_end && ` → ${clip.trim_end}s`}
                      </div>
                    </div>

                    {/* Review Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                        title="Approve"
                        disabled={clip.review_status === 'approved' || reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ compId: selectedCompId, clipId: clip.id, review: { review_status: 'approved' } })}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                        title="Reject"
                        disabled={clip.review_status === 'rejected' || reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ compId: selectedCompId, clipId: clip.id, review: { review_status: 'rejected' } })}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900"
                        title="Need Regen"
                        disabled={clip.review_status === 'needs_regen' || reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ compId: selectedCompId, clipId: clip.id, review: { review_status: 'needs_regen' } })}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                        title="Remove"
                        disabled={removeClipMutation.isPending}
                        onClick={() => removeClipMutation.mutate({ compId: selectedCompId, clipId: clip.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Clip Dialog */}
        <Dialog open={addClipOpen} onOpenChange={setAddClipOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Clip to Composition</DialogTitle>
              <DialogDescription>Select from completed videos or paste a URL</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* From completed queue */}
              {pendingClips && pendingClips.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">From Completed Queue</Label>
                  <ScrollArea className="h-[250px] rounded border p-2">
                    <div className="space-y-2">
                      {pendingClips.map((clip: PendingClip) => (
                        <div
                          key={clip.id}
                          className="flex items-center gap-3 p-2 rounded-lg border hover:border-primary/40 cursor-pointer transition-colors"
                          onClick={() => addClipMutation.mutate({ compId: selectedCompId, data: { video_queue_id: clip.id, name: clip.title || clip.prompt.slice(0, 40) } })}
                        >
                          <div className="w-16 h-10 rounded bg-muted overflow-hidden shrink-0">
                            {clip.thumbnail_url ? <img src={clip.thumbnail_url} className="w-full h-full object-cover" /> : <Video className="h-4 w-4 m-auto mt-3 text-muted-foreground/40" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{clip.prompt}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] px-1">{clip.model}</Badge>
                              <span>{new Date(clip.completed_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-primary shrink-0" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Or paste URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Or paste video URL directly</Label>
                <div className="flex gap-2">
                  <Input
                    id="clip-url"
                    placeholder="https://example.com/video.mp4"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    disabled={addClipMutation.isPending}
                    onClick={() => {
                      const urlInput = document.querySelector('#clip-url') as HTMLInputElement;
                      if (urlInput?.value) {
                        addClipMutation.mutate({ compId: selectedCompId, data: { video_url: urlInput.value, name: 'External clip' } });
                      }
                    }}
                  >
                    {addClipMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Compositions list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{comps.length} compositions</Badge>
        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Composition
        </Button>
      </div>

      {comps.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Scissors className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p>No compositions yet</p>
          <p className="text-sm">Create a composition to merge clips into a final video</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {comps.map((comp: Composition) => (
            <Card
              key={comp.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setSelectedCompId(comp.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{comp.name}</CardTitle>
                  <CompStatusBadge status={comp.status} />
                </div>
                {comp.description && <CardDescription className="line-clamp-1">{comp.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{comp.aspect_ratio} • {comp.transition_type}</span>
                  <span>{new Date(comp.updated_at || comp.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                {comp.status === 'composing' && (
                  <Progress value={50} className="mt-2 h-1.5" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Composition</DialogTitle>
            <DialogDescription>Merge multiple clips into one final video</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })} placeholder="e.g. AI Facts Compilation #1" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newComp.description} onChange={e => setNewComp({ ...newComp, description: e.target.value })} placeholder="Optional description..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value={newComp.aspect_ratio} onValueChange={v => setNewComp({ ...newComp, aspect_ratio: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">📱 9:16 (TikTok/Shorts)</SelectItem>
                    <SelectItem value="16:9">🖥️ 16:9 (YouTube)</SelectItem>
                    <SelectItem value="1:1">⬜ 1:1 (Instagram)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transition</Label>
                <Select value={newComp.transition_type} onValueChange={v => setNewComp({ ...newComp, transition_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crossfade">🌊 Crossfade</SelectItem>
                    <SelectItem value="cut">✂️ Hard Cut</SelectItem>
                    <SelectItem value="fade">🌑 Fade</SelectItem>
                    <SelectItem value="slide">➡️ Slide</SelectItem>
                    <SelectItem value="zoom">🔍 Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Channel (optional)</Label>
                <Select value={newComp.channel_id || '__none__'} onValueChange={v => setNewComp({ ...newComp, channel_id: v === '__none__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="No channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No channel</SelectItem>
                    {channels.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transition Duration (s)</Label>
                <Input
                  type="number"
                  min={0}
                  max={3}
                  step={0.1}
                  value={newComp.transition_duration}
                  onChange={e => setNewComp({ ...newComp, transition_duration: parseFloat(e.target.value) || 0.5 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!newComp.name || createMutation.isPending} onClick={() => createMutation.mutate(newComp)}>
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
