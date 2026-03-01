/**
 * Live Sessions Scheduler
 * Weekly workshops calendar with registration
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Users, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface LiveSession {
  id: string;
  title: string;
  description: string;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  max_attendees: number;
  attendee_count: number;
  meeting_url: string;
}

export function LiveSessions({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSessions();
    loadRegistrations();
  }, []);

  const loadSessions = async () => {
    const { data } = await supabase
      .from('live_sessions')
      .select('*')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at');

    setSessions(data || []);
  };

  const loadRegistrations = async () => {
    const { data } = await supabase
      .from('live_session_attendees')
      .select('session_id')
      .eq('user_id', userId);

    setRegistered(new Set(data?.map((d) => d.session_id) || []));
  };

  const register = async (sessionId: string) => {
    const { error } = await supabase
      .from('live_session_attendees')
      .insert({ session_id: sessionId, user_id: userId });

    if (!error) {
      toast.success('Registered for session!');
      loadRegistrations();
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-purple-500" />
        Upcoming Live Sessions
      </h3>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="p-4 border border-gray-700 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-white">{session.title}</h4>
                <p className="text-sm text-gray-400">{session.description}</p>
              </div>
              <Badge>{session.session_type}</Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(session.scheduled_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {session.duration_minutes} mins
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {session.attendee_count}/{session.max_attendees}
              </span>
            </div>

            {registered.has(session.id) ? (
              <Button className="w-full" variant="outline">
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => register(session.id)}
                disabled={session.attendee_count >= session.max_attendees}
              >
                Register
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
