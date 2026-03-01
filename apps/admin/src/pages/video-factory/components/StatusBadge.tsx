import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Loader2, Pause, XCircle } from 'lucide-react';
import type { JobStatus } from '@/services/video-factory.service';

export const StatusBadge = ({ status }: { status: JobStatus }) => {
  const config: Record<JobStatus, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { icon: <Clock className="h-3 w-3" />, variant: 'secondary', label: 'Pending' },
    scheduled: { icon: <Clock className="h-3 w-3" />, variant: 'outline', label: 'Scheduled' },
    processing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, variant: 'default', label: 'Processing' },
    completed: { icon: <CheckCircle2 className="h-3 w-3" />, variant: 'default', label: 'Completed' },
    failed: { icon: <XCircle className="h-3 w-3" />, variant: 'destructive', label: 'Failed' },
    cancelled: { icon: <Pause className="h-3 w-3" />, variant: 'outline', label: 'Cancelled' },
  };

  const { icon, variant, label } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {label}
    </Badge>
  );
};
