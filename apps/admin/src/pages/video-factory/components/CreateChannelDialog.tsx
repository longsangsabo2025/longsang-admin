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
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  videoFactoryService,
  type CreateChannelRequest,
  type VideoModel,
} from '@/services/video-factory.service';

export const CreateChannelDialog = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateChannelRequest>({
    name: '',
    platform: 'tiktok',
    niche: '',
    language: 'vi',
    videos_per_day: 5,
    preferred_model: 'minimax-hailuo',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateChannelRequest) => videoFactoryService.createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory', 'channels'] });
      toast({ title: '✅ Channel Created' });
      setOpen(false);
      setForm({ name: '', platform: 'tiktok', niche: '', language: 'vi', videos_per_day: 5, preferred_model: 'minimax-hailuo' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>Add a new content channel</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Channel Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. AI Facts Daily" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">📱 TikTok</SelectItem>
                  <SelectItem value="youtube">▶️ YouTube</SelectItem>
                  <SelectItem value="instagram">📷 Instagram</SelectItem>
                  <SelectItem value="facebook">📘 Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={form.language || 'vi'} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Niche *</Label>
              <Input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} placeholder="e.g. tech_facts, motivation" />
            </div>
            <div className="space-y-2">
              <Label>Videos/Day</Label>
              <Input type="number" min={1} max={50} value={form.videos_per_day} onChange={(e) => setForm({ ...form, videos_per_day: parseInt(e.target.value) || 5 })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Default Model</Label>
            <Select value={form.preferred_model || 'minimax-hailuo'} onValueChange={(v) => setForm({ ...form, preferred_model: v as VideoModel })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minimax-hailuo">🎬 Minimax Hailuo</SelectItem>
                <SelectItem value="higgsfield-soul">✨ Higgsfield Soul</SelectItem>
                <SelectItem value="higgsfield-popcorn">🍿 Popcorn</SelectItem>
                <SelectItem value="reve">🌊 Reve</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!form.name || !form.niche || createMutation.isPending} onClick={() => createMutation.mutate(form)}>
            {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Channel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
