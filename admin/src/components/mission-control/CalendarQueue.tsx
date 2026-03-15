import { useQuery } from '@tanstack/react-query';
import { Calendar, ListTodo, Loader2 } from 'lucide-react';
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
import { type ContentCalendarItem, type QueuedJob, RelativeTime } from './mission-control.types';

export function CalendarQueue() {
  // ── Content calendar upcoming (next 7 days)
  const { data: calendarItems = [] } = useQuery<ContentCalendarItem[]>({
    queryKey: ['mission-control', 'content-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_content_calendar_upcoming')
        .select('id, title, topic, type, scheduled_date, status, product, notes');
      if (error) {
        console.warn('v_content_calendar_upcoming:', error.message);
        return [];
      }
      return (data ?? []) as ContentCalendarItem[];
    },
    refetchInterval: 300000,
  });

  // ── Pipeline queue
  const { data: queuedJobs = [] } = useQuery<QueuedJob[]>({
    queryKey: ['mission-control', 'pipeline-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_queue')
        .select('id, topic, mode, status, priority, created_at, started_at, completed_at')
        .in('status', ['queued', 'running', 'processing'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10);
      if (error) {
        console.warn('pipeline_queue:', error.message);
        return [];
      }
      return (data ?? []) as QueuedJob[];
    },
    refetchInterval: 30000,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ─── Content Calendar ─── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Content Calendar
        </h2>
        <Card>
          <CardContent className="p-0">
            {calendarItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No upcoming content scheduled.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title / Topic</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calendarItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(item.scheduled_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {item.title || item.topic || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'published'
                              ? 'default'
                              : item.status === 'scheduled'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─── Pipeline Queue ─── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ListTodo className="h-5 w-5" /> Pipeline Queue
        </h2>
        <Card>
          <CardContent className="p-0">
            {queuedJobs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No jobs in queue.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queuedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="max-w-[200px] truncate text-sm">{job.topic}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {job.mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{job.priority}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            job.status === 'running'
                              ? 'default'
                              : job.status === 'queued'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {job.status === 'running' && (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          )}
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <RelativeTime iso={job.created_at} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
