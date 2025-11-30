/**
 * Calendar Panel - Event Management Component
 * Create and view calendar events
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Clock,
  Loader2,
  MapPin
} from 'lucide-react';
import { createCalendarEvent, getCalendarStats, CalendarEvent } from '@/lib/google/calendar-api';
import { toast } from 'sonner';

export const CalendarPanel = () => {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [eventForm, setEventForm] = useState({
    summary: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    calendarEmail: '',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getCalendarStats(30);
      setStats(data);
    } catch (error) {
      console.error('Error loading calendar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.summary || !eventForm.startDate || !eventForm.startTime) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setCreating(true);
      
      const calendarEmail = eventForm.calendarEmail || 'primary';
      const startDateTime = `${eventForm.startDate}T${eventForm.startTime}:00`;
      const endDateTime = eventForm.endDate && eventForm.endTime 
        ? `${eventForm.endDate}T${eventForm.endTime}:00`
        : `${eventForm.startDate}T${eventForm.endTime || eventForm.startTime}:00`;

      const event: CalendarEvent = {
        summary: eventForm.summary,
        description: eventForm.description,
        location: eventForm.location,
        start: { dateTime: startDateTime, timeZone: 'Asia/Ho_Chi_Minh' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Ho_Chi_Minh' },
      };

      await createCalendarEvent(calendarEmail, event);
      toast.success('Event created successfully!');
      setEventForm({
        summary: '',
        description: '',
        location: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        calendarEmail: '',
      });
      await loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</div>
            <p className="text-xs text-muted-foreground">Active events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Event Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Event
          </CardTitle>
          <CardDescription>
            Create a new calendar event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="summary">Event Title *</Label>
              <Input
                id="summary"
                placeholder="Meeting with client"
                value={eventForm.summary}
                onChange={(e) => setEventForm(prev => ({ ...prev, summary: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  className="pl-9"
                  placeholder="Office or address"
                  value={eventForm.location}
                  onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={eventForm.startDate}
                onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={eventForm.startTime}
                onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={eventForm.endDate}
                onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={eventForm.endTime}
                onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Event details..."
              rows={3}
              value={eventForm.description}
              onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendarEmail">Calendar Email (optional)</Label>
            <Input
              id="calendarEmail"
              type="email"
              placeholder="Leave empty for primary calendar"
              value={eventForm.calendarEmail}
              onChange={(e) => setEventForm(prev => ({ ...prev, calendarEmail: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateEvent} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
            <Button variant="outline" onClick={loadStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      {stats?.recentEvents && stats.recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Last 10 created events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentEvents.map((event: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium">{event.summary || 'Untitled'}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.start_time).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
