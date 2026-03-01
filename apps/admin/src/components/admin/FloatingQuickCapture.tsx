/**
 * 🚀 Floating Quick Capture Button
 *
 * Floating button để capture ideas từ bất kỳ đâu trong admin
 * - Hiển thị ở góc dưới bên phải
 * - Click để mở quick capture dialog
 * - Keyboard shortcut: Ctrl+K → type "idea"
 */

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function FloatingQuickCapture() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Quick capture mutation
  const captureMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      const { error } = await supabase.from('admin_ideas').insert({
        title: title.trim(),
        content: content.trim() || null,
        category,
        priority,
        status: 'idea',
        tags: [],
        user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ideas'] });
      toast({
        title: 'Idea captured! 🚀',
        description: 'Your idea has been saved',
      });
      // Reset form
      setTitle('');
      setContent('');
      setCategory('general');
      setPriority('medium');
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error capturing idea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCapture = () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter at least a title',
        variant: 'destructive',
      });
      return;
    }
    captureMutation.mutate();
  };

  // Keyboard shortcut: Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCapture();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
        size="icon"
        title="Quick Capture Idea (Ctrl+K → idea)"
      >
        <Lightbulb className="h-6 w-6" />
      </Button>

      {/* Quick Capture Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" onKeyDown={handleKeyDown}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Quick Capture Idea
            </DialogTitle>
            <DialogDescription>
              Capture your idea in seconds. Press Ctrl+Enter to save.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="What's your idea? *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleCapture();
                  }
                }}
                autoFocus
                className="text-lg"
              />
            </div>
            <div>
              <Textarea
                placeholder="Details (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCapture} disabled={captureMutation.isPending}>
                <Zap className="h-4 w-4 mr-2" />
                {captureMutation.isPending ? 'Capturing...' : 'Capture'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>💡 Tip: Ctrl+Enter to save quickly</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  navigate('/admin/ideas');
                }}
                className="h-6 text-xs"
              >
                View All Ideas →
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
