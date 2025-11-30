import {
  useActionHistory,
  useExecutePendingActions,
  useQueueAction,
} from '@/brain/hooks/useActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { History, Loader2, Play, Plus } from 'lucide-react';
import { useState } from 'react';

export function ActionCenter() {
  const [actionType, setActionType] = useState('create_task');
  const [payload, setPayload] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'pending' | 'running' | 'success' | 'failed' | 'cancelled' | 'all' | undefined
  >(undefined);

  const queueActionMutation = useQueueAction();
  const executePendingActionsMutation = useExecutePendingActions();
  const { data: actions, isLoading: isLoadingActions } = useActionHistory(
    filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
    undefined,
    50
  );

  const handleQueueAction = async () => {
    if (!actionType) return;
    try {
      const parsedPayload = payload ? JSON.parse(payload) : {};
      await queueActionMutation.mutateAsync({ actionType, payload: parsedPayload });
      setPayload('');
    } catch (error) {
      console.error('Failed to queue action:', error);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'running':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Queue New Action
          </CardTitle>
          <CardDescription>Manually queue an action to be executed by the system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="action-type">Action Type</Label>
            <Select
              value={actionType}
              onValueChange={setActionType}
              disabled={queueActionMutation.isPending}
            >
              <SelectTrigger id="action-type">
                <SelectValue placeholder="Select an action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create_task">Create Task</SelectItem>
                <SelectItem value="send_notification">Send Notification</SelectItem>
                <SelectItem value="add_note">Add Note</SelectItem>
                <SelectItem value="update_knowledge">Update Knowledge (Placeholder)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="action-payload">Payload (JSON)</Label>
            <Textarea
              id="action-payload"
              placeholder='{"title": "Review Q4 Report", "priority": "high"}'
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={5}
              disabled={queueActionMutation.isPending}
            />
          </div>
          <Button
            onClick={handleQueueAction}
            disabled={!actionType || queueActionMutation.isPending}
            className="w-full"
          >
            {queueActionMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Queue Action
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Action History
          </CardTitle>
          <CardDescription>View recently queued and executed actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select
              value={filterStatus || 'all'}
              onValueChange={(
                value: 'pending' | 'running' | 'success' | 'failed' | 'cancelled' | 'all'
              ) => setFilterStatus(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => executePendingActionsMutation.mutate()}
              disabled={executePendingActionsMutation.isPending}
              variant="outline"
            >
              {executePendingActionsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Pending Actions
            </Button>
          </div>

          {isLoadingActions ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading actions...</p>
            </div>
          ) : actions && actions.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {actions.map((action) => (
                  <div key={action.id} className="border p-3 rounded-md text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={getStatusVariant(action.status)}>{action.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(action.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="font-semibold">{action.action_type}</p>
                    {action.payload && (
                      <p className="text-muted-foreground text-xs truncate">
                        Payload: {JSON.stringify(action.payload)}
                      </p>
                    )}
                    {action.status === 'failed' && action.error_log && (
                      <p className="text-destructive text-xs mt-1">Error: {action.error_log}</p>
                    )}
                    {action.status === 'success' && action.result && (
                      <p className="text-green-600 text-xs mt-1">
                        Result: {JSON.stringify(action.result)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground">No actions found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
