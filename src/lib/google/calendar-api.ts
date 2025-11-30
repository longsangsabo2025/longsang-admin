/**
 * Google Calendar API - Browser-Safe Version
 * Calls API server endpoints for Google Calendar operations
 */

import { supabase } from '@/integrations/supabase/client';

const API_BASE = 'http://localhost:3001/api/google/calendar';

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface EventResult {
  status: 'success' | 'error';
  eventId?: string;
  eventLink?: string;
  message: string;
  timestamp: string;
}

// ============================================================
// API FUNCTIONS - Call through API server
// ============================================================

export async function createCalendarEvent(
  calendarEmail: string,
  event: CalendarEvent
): Promise<EventResult> {
  const response = await fetch(`${API_BASE}/create-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarEmail, event }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create calendar event');
  }

  const data = await response.json();
  return {
    status: 'success',
    eventId: data.id,
    eventLink: data.htmlLink,
    message: 'Event created successfully',
    timestamp: new Date().toISOString(),
  };
}

export async function updateCalendarEvent(
  calendarEmail: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<EventResult> {
  const response = await fetch(`${API_BASE}/update-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarEmail, eventId, updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update calendar event');
  }

  const data = await response.json();
  return {
    status: 'success',
    eventId: data.id,
    eventLink: data.htmlLink,
    message: 'Event updated successfully',
    timestamp: new Date().toISOString(),
  };
}

export async function cancelCalendarEvent(
  calendarEmail: string,
  eventId: string
): Promise<EventResult> {
  const response = await fetch(`${API_BASE}/cancel-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarEmail, eventId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel calendar event');
  }

  return {
    status: 'success',
    eventId,
    message: 'Event cancelled successfully',
    timestamp: new Date().toISOString(),
  };
}

export async function listUpcomingEvents(calendarEmail: string, maxResults: number = 10) {
  const response = await fetch(`${API_BASE}/upcoming-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarEmail, maxResults }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list events');
  }

  return response.json();
}

export async function checkFreeBusy(calendarEmail: string, timeMin: string, timeMax: string) {
  const response = await fetch(`${API_BASE}/free-busy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarEmail, timeMin, timeMax }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check free/busy');
  }

  return response.json();
}

// ============================================================
// WORKING FUNCTIONS - SUPABASE ONLY (SAFE IN BROWSER)
// ============================================================

/**
 * Get calendar event statistics from database
 */
export async function getCalendarStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = data?.length || 0;
    const upcoming = data?.filter((event) => new Date(event.start_time) > new Date()).length || 0;
    const past = total - upcoming;

    return {
      total,
      upcoming,
      past,
      recentEvents: data?.slice(0, 10) || [],
    };
  } catch (error) {
    console.error('Error getting calendar stats:', error);
    throw error;
  }
}

/**
 * Get upcoming events from database
 */
export async function getUpcomingEventsFromDB(limit: number = 20) {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    throw error;
  }
}

/**
 * Get event by ID from database
 */
export async function getEventFromDB(eventId: string) {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('google_event_id', eventId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
}
