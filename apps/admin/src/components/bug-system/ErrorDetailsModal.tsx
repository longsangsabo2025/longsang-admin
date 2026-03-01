/**
 * Error Details Modal
 *
 * Shows detailed information about an error
 */

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Calendar, Globe, User } from 'lucide-react';

interface ErrorDetailsModalProps {
  error: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ErrorDetailsModal({ error, open, onOpenChange }: ErrorDetailsModalProps) {
  if (!error) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'long',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Details
          </DialogTitle>
          <DialogDescription>Detailed information about this error</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stack">Stack Trace</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Error Type</label>
                <p className="text-sm font-medium">{error.error_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Severity</label>
                <div>
                  <Badge className={getSeverityColor(error.severity)}>{error.severity}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project</label>
                <p className="text-sm">{error.project_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(error.created_at)}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Error Message</label>
              <ScrollArea className="h-32 w-full rounded-md border p-4 mt-2">
                <pre className="text-sm whitespace-pre-wrap">{error.error_message}</pre>
              </ScrollArea>
            </div>

            {error.page_url && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Page URL
                </label>
                <p className="text-sm text-blue-500 break-all">{error.page_url}</p>
              </div>
            )}

            {error.user_id && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  User ID
                </label>
                <p className="text-sm font-mono">{error.user_id}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stack" className="space-y-4">
            {error.error_stack ? (
              <ScrollArea className="h-96 w-full rounded-md border p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono">{error.error_stack}</pre>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">No stack trace available</p>
            )}
          </TabsContent>

          <TabsContent value="context" className="space-y-4">
            {error.context && Object.keys(error.context).length > 0 ? (
              <ScrollArea className="h-96 w-full rounded-md border p-4">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(error.context, null, 2)}
                </pre>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">No context data available</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
