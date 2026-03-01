import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Info, Clock, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { ActivityLog } from '@/types/automation';

interface ActivityLogListProps {
  logs: (ActivityLog & { ai_agents?: { name: string; type: string } })[];
  isLoading?: boolean;
}

const statusIcons: Record<string, any> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const statusColors: Record<string, { icon: string; bg: string; badge: string }> = {
  success: {
    icon: 'text-green-500',
    bg: 'bg-green-500/10',
    badge: 'default',
  },
  error: {
    icon: 'text-red-500',
    bg: 'bg-red-500/10',
    badge: 'destructive',
  },
  warning: {
    icon: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    badge: 'secondary',
  },
  info: {
    icon: 'text-blue-500',
    bg: 'bg-blue-500/10',
    badge: 'outline',
  },
};

export const ActivityLogList = ({ logs, isLoading }: ActivityLogListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Info className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Agent activities and events will be logged here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          {logs.map((log) => {
            const Icon = statusIcons[log.status] || Info;
            const colors = statusColors[log.status] || statusColors.info;

            return (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${colors.bg} mt-1`}>
                  <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{log.action}</h4>
                    <Badge variant={colors.badge as any} className="text-xs">
                      {log.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                    {log.ai_agents && (
                      <>
                        <span>•</span>
                        <span className="font-medium">{log.ai_agents.name}</span>
                      </>
                    )}
                    {log.duration_ms !== undefined && log.duration_ms > 0 && (
                      <>
                        <span>•</span>
                        <span>{log.duration_ms}ms</span>
                      </>
                    )}
                  </div>

                  {log.error_message && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      {log.error_message}
                    </div>
                  )}

                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        View details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                {log.agent_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/automation/agents/${log.agent_id}`)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {logs.length >= 20 && (
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => navigate('/automation/logs')}>
              View All Logs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
