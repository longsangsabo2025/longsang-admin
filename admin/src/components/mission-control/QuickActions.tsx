import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Globe, Loader2, Play, RefreshCw, Rocket, Server, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  onCheckAllServices?: () => void;
  isCheckingServices?: boolean;
}

export function QuickActions({ onCheckAllServices, isCheckingServices }: QuickActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const triggerYoutube = useMutation({
    mutationFn: async () => {
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/youtube-pipeline-trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ auto: true, source: 'manual' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'YouTube Pipeline triggered ✅' });
      queryClient.invalidateQueries({ queryKey: ['mission-control'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Pipeline trigger failed', description: err.message, variant: 'destructive' });
    },
  });

  const triggerShorts = useMutation({
    mutationFn: async () => {
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/youtube-pipeline-trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ auto: true, mode: 'shorts', source: 'manual' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => toast({ title: 'Shorts batch triggered ✅' }),
    onError: (err: Error) =>
      toast({ title: 'Shorts batch failed', description: err.message, variant: 'destructive' }),
  });

  const triggerSeed = useMutation({
    mutationFn: async () => {
      // TODO: Create Edge Function for VT Homes content seeding when needed
      const res = await fetch('http://localhost:3002/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => toast({ title: 'VT Homes content seeded ✅' }),
    onError: (err: Error) =>
      toast({ title: 'Seed failed', description: err.message, variant: 'destructive' }),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() => triggerYoutube.mutate()}
        disabled={triggerYoutube.isPending}
        className="gap-2"
      >
        {triggerYoutube.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        Run YouTube Pipeline
      </Button>

      <Button
        onClick={() => triggerShorts.mutate()}
        disabled={triggerShorts.isPending}
        variant="secondary"
        className="gap-2"
      >
        {triggerShorts.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Video className="h-4 w-4" />
        )}
        Run Shorts Batch
      </Button>

      <Button
        onClick={() => triggerSeed.mutate()}
        disabled={triggerSeed.isPending}
        variant="secondary"
        className="gap-2"
      >
        {triggerSeed.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Globe className="h-4 w-4" />
        )}
        Seed VT Homes Content
      </Button>

      <Button onClick={onCheckAllServices} variant="outline" className="gap-2">
        <RefreshCw className={`h-4 w-4 ${isCheckingServices ? 'animate-spin' : ''}`} />
        Check All Services
      </Button>

      <Button
        variant="outline"
        className="gap-2"
        onClick={() =>
          copyToClipboard(
            'cd d:\\0.PROJECTS\\01-MAIN-PRODUCTS\\ainewbie-web && npm run build && npm run deploy',
            'Deploy command'
          )
        }
      >
        <Rocket className="h-4 w-4" />
        Deploy AINewbie
        <Copy className="h-3 w-3 ml-1 opacity-50" />
      </Button>

      <Button
        variant="outline"
        className="gap-2"
        onClick={() => copyToClipboard('pm2 start ecosystem.config.js', 'PM2 command')}
      >
        <Server className="h-4 w-4" />
        Start All Services
        <Copy className="h-3 w-3 ml-1 opacity-50" />
      </Button>
    </div>
  );
}
