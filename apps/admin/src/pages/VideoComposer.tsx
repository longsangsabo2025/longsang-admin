/**
 * 🎞️ Video Composer - Review & Stitch Workflow
 * Review completed videos, approve/reject, compose into final short
 * LongSang AI Empire
 */

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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  GripVertical,
  Loader2,
  Music,
  Play,
  Plus,
  RefreshCw,
  Scissors,
  Trash2,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  videoFactoryService,
  type ClipReviewStatus,
  type Composition,
  type CompositionClip,
  type PendingClip,
} from '@/services/video-factory.service';

// ─── Review Status Badge ──────────────────────────────────────────────────────

const ReviewBadge = ({ status }: { status: ClipReviewStatus }) => {
  const config: Record<ClipReviewStatus, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-500/20 text-yellow-400', label: '⏳ Pending' },
    approved: { color: 'bg-green-500/20 text-green-400', label: '✅ Approved' },
    rejected: { color: 'bg-red-500/20 text-red-400', label: '❌ Rejected' },
    needs_regen: { color: 'bg-orange-500/20 text-orange-400', label: '🔄 Needs Regen' },
  };

  const { color, label } = config[status] || config.pending;
  return <Badge className={color}>{label}</Badge>;
};

// ─── Pending Clips Panel (Unreviewed Videos) ──────────────────────────────────

const PendingClipsPanel = ({ onAddToComposition }: { onAddToComposition: (clip: PendingClip) => void }) => {
  const { data: clips = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-clips'],
    queryFn: () => videoFactoryService.getPendingClips(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Completed Videos
          </CardTitle>
          <CardDescription>Videos ready for review ({clips.length})</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {clips.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No completed videos yet. Start generating!
          </div>
        ) : (
          <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-24 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                  {clip.thumbnail_url ? (
                    <img src={clip.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={clip.video_url} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{clip.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{clip.model}</p>
                </div>

                {/* Actions */}
                <Button size="sm" onClick={() => onAddToComposition(clip)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Clip Card (In Composition) ───────────────────────────────────────────────

interface ClipCardProps {
  clip: CompositionClip;
  compId: string;
  onReview: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ClipCard = ({ clip, onReview, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: ClipCardProps) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card">
      {/* Drag Handle & Order */}
      <div className="flex flex-col items-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={isFirst}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground font-mono">{clip.sequence_order + 1}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={isLast}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Video Preview */}
      <div
        className="w-32 h-18 bg-muted rounded overflow-hidden flex-shrink-0 relative cursor-pointer"
        onClick={() => setShowPreview(true)}
      >
        <video src={clip.video_url} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
          <Play className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{clip.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <ReviewBadge status={clip.review_status} />
          {clip.duration && (
            <span className="text-xs text-muted-foreground">{clip.duration.toFixed(1)}s</span>
          )}
        </div>
        {clip.review_notes && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{clip.review_notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <Button variant="outline" size="sm" className="gap-1" onClick={onReview}>
          <Scissors className="h-3 w-3" />
          Review
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Full Preview Dialog */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{clip.name}</DialogTitle>
            </DialogHeader>
            <video src={clip.video_url} controls autoPlay className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// ─── Review Dialog ────────────────────────────────────────────────────────────

interface ReviewDialogProps {
  clip: CompositionClip | null;
  compId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReviewDialog = ({ clip, compId, open, onOpenChange }: ReviewDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const reviewMutation = useMutation({
    mutationFn: (status: ClipReviewStatus) =>
      videoFactoryService.reviewClip(compId, clip!.id, { review_status: status, review_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composition', compId] });
      toast({ title: 'Review saved' });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  if (!clip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review: {clip.name}</DialogTitle>
          <DialogDescription>Watch the video and approve or reject for composition</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <video src={clip.video_url} controls autoPlay className="w-full rounded-lg" />

          <div>
            <Label>Review Notes (optional)</Label>
            <Textarea
              placeholder="Any notes about this clip..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            onClick={() => reviewMutation.mutate('rejected')}
            disabled={reviewMutation.isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            variant="outline"
            onClick={() => reviewMutation.mutate('needs_regen')}
            disabled={reviewMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerate
          </Button>
          <Button onClick={() => reviewMutation.mutate('approved')} disabled={reviewMutation.isPending}>
            {reviewMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Composition Editor ───────────────────────────────────────────────────────

interface CompositionEditorProps {
  composition: Composition;
}

const CompositionEditor = ({ composition }: CompositionEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewClip, setReviewClip] = useState<CompositionClip | null>(null);

  const clips = composition.clips || [];
  const approvedCount = clips.filter((c) => c.review_status === 'approved').length;
  const pendingCount = clips.filter((c) => c.review_status === 'pending').length;

  // Mutations
  const removeMutation = useMutation({
    mutationFn: (clipId: string) => videoFactoryService.removeClip(composition.id, clipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composition', composition.id] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ clipId, newOrder }: { clipId: string; newOrder: number }) =>
      videoFactoryService.reorderClip(composition.id, clipId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composition', composition.id] });
    },
  });

  const composeMutation = useMutation({
    mutationFn: () => videoFactoryService.startComposition(composition.id),
    onSuccess: () => {
      toast({ title: '🎬 Composition started!', description: 'FFmpeg is stitching your video...' });
      queryClient.invalidateQueries({ queryKey: ['composition', composition.id] });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const handleMoveClip = (clip: CompositionClip, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? clip.sequence_order - 1 : clip.sequence_order + 1;
    reorderMutation.mutate({ clipId: clip.id, newOrder });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              {composition.name}
            </CardTitle>
            <CardDescription>
              {clips.length} clips • {approvedCount} approved • {pendingCount} pending review
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Badge variant={composition.status === 'completed' ? 'default' : 'outline'}>
              {composition.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeline */}
        <div className="space-y-2">
          {clips.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
              No clips yet. Add videos from the left panel.
            </div>
          ) : (
            clips
              .sort((a, b) => a.sequence_order - b.sequence_order)
              .map((clip, idx) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  compId={composition.id}
                  onReview={() => setReviewClip(clip)}
                  onRemove={() => removeMutation.mutate(clip.id)}
                  onMoveUp={() => handleMoveClip(clip, 'up')}
                  onMoveDown={() => handleMoveClip(clip, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === clips.length - 1}
                />
              ))
          )}
        </div>

        <Separator />

        {/* Compose Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {approvedCount === 0 ? (
              'Approve at least 1 clip to compose'
            ) : (
              <>
                Ready to compose <strong>{approvedCount}</strong> clips into final video
              </>
            )}
          </div>

          <Button
            size="lg"
            className="gap-2"
            disabled={approvedCount === 0 || composeMutation.isPending || composition.status === 'composing'}
            onClick={() => composeMutation.mutate()}
          >
            {composeMutation.isPending || composition.status === 'composing' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Composing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Compose Video
              </>
            )}
          </Button>
        </div>

        {/* Output Preview */}
        {composition.status === 'completed' && composition.output_url && (
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="pt-4">
              <h4 className="font-medium text-green-400 mb-2">✅ Final Video Ready!</h4>
              <video src={composition.output_url} controls className="w-full rounded-lg" />
            </CardContent>
          </Card>
        )}
      </CardContent>

      {/* Review Dialog */}
      <ReviewDialog
        clip={reviewClip}
        compId={composition.id}
        open={!!reviewClip}
        onOpenChange={(open) => !open && setReviewClip(null)}
      />
    </Card>
  );
};

// ─── Create Composition Dialog ────────────────────────────────────────────────

const CreateCompositionDialog = ({ onCreated }: { onCreated: (id: string) => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');

  const createMutation = useMutation({
    mutationFn: () =>
      videoFactoryService.createComposition({
        name: name || `Short ${new Date().toLocaleDateString()}`,
        aspect_ratio: aspectRatio,
      }),
    onSuccess: (data) => {
      toast({ title: '✅ Composition created!' });
      setOpen(false);
      onCreated(data.id);
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Composition
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Composition</DialogTitle>
          <DialogDescription>Start a new project to stitch videos together</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              placeholder="My Short Video"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9:16">9:16 (TikTok/Shorts)</SelectItem>
                <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                <SelectItem value="1:1">1:1 (Instagram)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function VideoComposer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  // Queries
  const { data: compositions = [], isLoading: loadingComps } = useQuery({
    queryKey: ['compositions'],
    queryFn: () => videoFactoryService.listCompositions(),
  });

  const { data: composition, isLoading: loadingComp } = useQuery({
    queryKey: ['composition', selectedCompId],
    queryFn: () => videoFactoryService.getComposition(selectedCompId!),
    enabled: !!selectedCompId,
  });

  // Add clip to composition mutation
  const addClipMutation = useMutation({
    mutationFn: (clip: PendingClip) =>
      videoFactoryService.addClipToComposition(selectedCompId!, {
        video_queue_id: clip.id,
        video_url: clip.video_url,
        name: clip.title,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composition', selectedCompId] });
      queryClient.invalidateQueries({ queryKey: ['pending-clips'] });
      toast({ title: 'Clip added!' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });

  const handleAddClip = (clip: PendingClip) => {
    if (!selectedCompId) {
      toast({ title: 'Select a composition first', variant: 'destructive' });
      return;
    }
    addClipMutation.mutate(clip);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Film className="h-6 w-6" />
            Video Composer
          </h2>
          <p className="text-muted-foreground">Review clips, approve, and compose into final shorts</p>
        </div>

        <CreateCompositionDialog onCreated={(id) => setSelectedCompId(id)} />
      </div>

      {/* Composition Selector */}
      <div className="flex gap-2 flex-wrap">
        {compositions.map((comp) => (
          <Button
            key={comp.id}
            variant={selectedCompId === comp.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCompId(comp.id)}
          >
            {comp.name}
            <Badge variant="secondary" className="ml-2">
              {comp.status}
            </Badge>
          </Button>
        ))}
        {compositions.length === 0 && !loadingComps && (
          <span className="text-muted-foreground">No compositions yet. Create one to start!</span>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Clips */}
        <div className="lg:col-span-1">
          <PendingClipsPanel onAddToComposition={handleAddClip} />
        </div>

        {/* Right: Composition Editor */}
        <div className="lg:col-span-2">
          {loadingComp && (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {!selectedCompId && !loadingComp && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Film className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Select or Create a Composition</h3>
                <p className="text-muted-foreground">
                  Choose an existing project or create a new one to start composing
                </p>
              </CardContent>
            </Card>
          )}

          {composition && !loadingComp && <CompositionEditor composition={composition} />}
        </div>
      </div>
    </div>
  );
}

export default VideoComposer;
