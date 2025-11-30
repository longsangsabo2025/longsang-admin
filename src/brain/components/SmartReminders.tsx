import { useReminders } from '@/brain/hooks/useSuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Loader2 } from 'lucide-react';

export function SmartReminders() {
  const { data: reminders, isLoading } = useReminders();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!reminders || reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Smart Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No reminders at this time</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> Smart Reminders
        </CardTitle>
        <CardDescription>Important reminders and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {reminders.map((reminder, index) => (
            <div key={index} className="p-3 border rounded flex items-center justify-between">
              <p className="text-sm">{reminder.message}</p>
              <Badge variant="outline">{reminder.type}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


