import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineRun } from './mission-control.types';

export function RecentActivity() {
  const queryClient = useQueryClient();

  // ── Pipeline runs from Supabase
  const { data: pipelineRuns = [], isLoading: runsLoading } = useQuery<PipelineRun[]>({
    queryKey: ['mission-control', 'pipeline-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('id, created_at, input_data, status, total_cost, duration_ms')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) {
        console.warn('pipeline_runs query error:', error.message);
        return [];
      }
      return (data ?? []) as PipelineRun[];
    },
  });

  // ── Supabase Realtime: instant pipeline updates
  useEffect(() => {
    const channel = supabase
      .channel('pipeline-runs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_runs' },
        (payload) => {
          console.log('🔄 Realtime pipeline update:', payload.eventType, (payload.new as any)?.id);
          // Invalidate both queries → React Query auto-refetches
          queryClient.invalidateQueries({ queryKey: ['mission-control', 'pipeline-runs'] });
          queryClient.invalidateQueries({ queryKey: ['mission-control', 'cost-stats'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading pipeline runs…
                </TableCell>
              </TableRow>
            ) : pipelineRuns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  No pipeline runs found. The <code className="text-xs">pipeline_runs</code> table
                  may not exist yet.
                </TableCell>
              </TableRow>
            ) : (
              pipelineRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(run.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {(run.input_data as any)?.topic || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        run.status === 'completed'
                          ? 'default'
                          : run.status === 'running'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-[10px]"
                    >
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {run.total_cost != null ? `$${Number(run.total_cost).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {run.duration_ms != null ? `${Math.round(run.duration_ms / 1000)}s` : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
