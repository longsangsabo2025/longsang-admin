// ================================================
// AGENT SCHEDULING CONFIGURATION
// ================================================
// UI component for scheduling agent runs

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  time?: string;
  days?: number[];
  cron?: string;
}

interface AgentScheduleModalProps {
  agentId: string;
  currentSchedule?: ScheduleConfig;
  onUpdate: () => void;
}

export function AgentScheduleModal({
  agentId,
  currentSchedule,
  onUpdate,
}: AgentScheduleModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleConfig>(
    currentSchedule || {
      enabled: false,
      frequency: 'daily',
      time: '09:00',
    }
  );

  const handleSave = async () => {
    try {
      // Update agent config with schedule
      const { error } = await supabase
        .from('ai_agents')
        .update({
          config: { schedule },
          status: schedule.enabled ? 'active' : 'paused',
        })
        .eq('id', agentId);

      if (error) throw error;

      // If enabled, create automation trigger
      if (schedule.enabled) {
        const cronExpression = generateCronExpression(schedule);

        await supabase.from('automation_triggers').upsert({
          agent_id: agentId,
          trigger_type: 'schedule',
          enabled: true,
          config: {
            schedule,
            cron: cronExpression,
          },
        });
      } else {
        // Disable existing triggers
        await supabase
          .from('automation_triggers')
          .update({ enabled: false })
          .eq('agent_id', agentId)
          .eq('trigger_type', 'schedule');
      }

      toast({
        title: '✅ Schedule Updated',
        description: schedule.enabled
          ? `Agent will run ${schedule.frequency}`
          : 'Scheduled runs disabled',
      });

      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to update schedule',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          {currentSchedule?.enabled ? 'Edit Schedule' : 'Schedule'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Agent Runs</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Scheduling</Label>
            <Switch
              id="enabled"
              checked={schedule.enabled}
              onCheckedChange={(checked) => setSchedule({ ...schedule, enabled: checked })}
            />
          </div>

          {schedule.enabled && (
            <>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={schedule.frequency}
                  onValueChange={(value: any) => setSchedule({ ...schedule, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom Interval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {schedule.frequency === 'custom' && (
                <div className="space-y-2">
                  <Label>Run Every (hours)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={schedule.interval || 1}
                    onChange={(e) =>
                      setSchedule({ ...schedule, interval: parseInt(e.target.value) })
                    }
                  />
                </div>
              )}

              {(schedule.frequency === 'daily' || schedule.frequency === 'weekly') && (
                <div className="space-y-2">
                  <Label>Time of Day</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {schedule.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <Button
                        key={day}
                        variant={schedule.days?.includes(index) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const days = schedule.days || [];
                          const newDays = days.includes(index)
                            ? days.filter((d) => d !== index)
                            : [...days, index];
                          setSchedule({ ...schedule, days: newDays });
                        }}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg text-sm">
                <strong>Schedule Summary:</strong>
                <p className="mt-1 text-muted-foreground">{getScheduleSummary(schedule)}</p>
              </div>
            </>
          )}

          <Button onClick={handleSave} className="w-full">
            Save Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateCronExpression(schedule: ScheduleConfig): string {
  switch (schedule.frequency) {
    case 'hourly':
      return '0 * * * *'; // Every hour
    case 'daily':
      const [hour, minute] = (schedule.time || '09:00').split(':');
      return `${minute} ${hour} * * *`; // Daily at specified time
    case 'weekly':
      const [h, m] = (schedule.time || '09:00').split(':');
      const days = (schedule.days || [1]).join(',');
      return `${m} ${h} * * ${days}`; // Weekly on specified days
    case 'monthly':
      return `0 9 1 * *`; // First day of month at 9 AM
    case 'custom':
      return `0 */${schedule.interval || 1} * * *`; // Every N hours
    default:
      return '0 9 * * *';
  }
}

function getScheduleSummary(schedule: ScheduleConfig): string {
  if (!schedule.enabled) return 'Scheduling is disabled';

  switch (schedule.frequency) {
    case 'hourly':
      return 'Runs every hour';
    case 'daily':
      return `Runs daily at ${schedule.time}`;
    case 'weekly':
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const days = (schedule.days || [1]).map((d) => dayNames[d]).join(', ');
      return `Runs weekly on ${days} at ${schedule.time}`;
    case 'monthly':
      return 'Runs on the first day of each month at 9:00 AM';
    case 'custom':
      return `Runs every ${schedule.interval} hour(s)`;
    default:
      return 'Custom schedule';
  }
}
