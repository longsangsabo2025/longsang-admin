/**
 * Google Calendar Integration for Daily Planner
 * Wrapper around existing Google Calendar API
 */

const { createClient } = require('@supabase/supabase-js');
const { getAPIKeys } = require('../env-loader');

const keys = getAPIKeys();
const supabase = createClient(
  keys.supabaseUrl,
  keys.supabaseServiceKey || keys.supabaseAnonKey
);

/**
 * Get user's Google Calendar events
 */
async function getCalendarEvents({ userId, startDate, endDate }) {
  try {
    // Get user's Google credentials from Supabase
    const { data: credentials, error } = await supabase
      .from('social_media_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'google')
      .eq('credential_type', 'oauth')
      .single();

    if (error || !credentials) {
      console.warn('[Google Calendar] No credentials found for user:', userId);
      return [];
    }

    // Call existing calendar API endpoint
    const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${API_BASE}/api/google/calendar/list-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('[Google Calendar] Error getting events:', error);
    return [];
  }
}

/**
 * Create calendar event
 */
async function createCalendarEvent({ userId, title, start, end, description }) {
  try {
    const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${API_BASE}/api/google/calendar/create-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        summary: title,
        start: start.toISOString(),
        end: end.toISOString(),
        description,
      }),
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('[Google Calendar] Error creating event:', error);
    throw error;
  }
}

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
};

