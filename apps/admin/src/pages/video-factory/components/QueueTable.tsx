import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, RefreshCw, RotateCcw, Trash2, Video } from 'lucide-react';
import {
  videoFactoryService,
  type JobStatus,
  type VideoJob,
} from '@/services/video-factory.service';
import { StatusBadge } from './StatusBadge';
import { PreviewDialog } from './PreviewDialog';

export const QueueTable = ({ statusFilter }: { statusFilter?: JobStatus }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['video-factory', 'queue', statusFilter],
    queryFn: () => videoFactoryService.listQueue({ status: statusFilter, limit: 50 }),
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: (jobId: string) => videoFactoryService.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory'] });
      toast({ title: 'Job Cancelled' });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => videoFactoryService.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-factory'] });
      toast({ title: 'Job Queued for Retry' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const jobs = data?.items || [];

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Video className="h-12 w-12 mb-4" />
        <p>No videos in queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead>Prompt</TableHead>
              <TableHead className="w-[120px]">Model</TableHead>
              <TableHead className="w-[100px]">Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job: VideoJob) => (
              <TableRow key={job.id}>
                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell>
                  <div className="max-w-[400px] truncate" title={job.prompt}>
                    {job.prompt}
                  </div>
                  {job.error_message && (
                    <div className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {job.error_message.slice(0, 50)}...
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{job.model}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(job.created_at).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {job.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancelMutation.mutate(job.id)}
                        disabled={cancelMutation.isPending}
                        title="Cancel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {job.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => retryMutation.mutate(job.id)}
                        disabled={retryMutation.isPending}
                        title="Retry"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {job.status === 'completed' && job.output_url && (
                      <PreviewDialog job={job} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
