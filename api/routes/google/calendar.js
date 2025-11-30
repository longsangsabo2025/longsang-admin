/**
 * Google Calendar API Routes
 * Server-side endpoints for Google Calendar operations
 */

const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Google Calendar client
const getCalendarClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
};

/**
 * POST /api/google/calendar/create-event
 * Create a calendar event
 */
router.post("/create-event", async (req, res) => {
  try {
    const { calendarEmail, event } = req.body;

    if (!calendarEmail || !event) {
      return res.status(400).json({ error: "calendarEmail and event are required" });
    }

    const calendar = getCalendarClient();

    const response = await calendar.events.insert({
      calendarId: calendarEmail,
      requestBody: event,
    });

    // Store in Supabase
    await supabase.from("calendar_events").insert({
      calendar_email: calendarEmail,
      event_id: response.data.id,
      summary: event.summary,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      status: "confirmed",
      google_event_data: response.data,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/calendar/update-event
 * Update a calendar event
 */
router.post("/update-event", async (req, res) => {
  try {
    const { calendarEmail, eventId, updates } = req.body;

    if (!calendarEmail || !eventId || !updates) {
      return res.status(400).json({ error: "calendarEmail, eventId, and updates are required" });
    }

    const calendar = getCalendarClient();

    const response = await calendar.events.patch({
      calendarId: calendarEmail,
      eventId: eventId,
      requestBody: updates,
    });

    // Update in Supabase
    await supabase
      .from("calendar_events")
      .update({
        summary: updates.summary,
        start_time: updates.start?.dateTime || updates.start?.date,
        end_time: updates.end?.dateTime || updates.end?.date,
        google_event_data: response.data,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId);

    res.json(response.data);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/calendar/cancel-event
 * Cancel a calendar event
 */
router.post("/cancel-event", async (req, res) => {
  try {
    const { calendarEmail, eventId } = req.body;

    if (!calendarEmail || !eventId) {
      return res.status(400).json({ error: "calendarEmail and eventId are required" });
    }

    const calendar = getCalendarClient();

    await calendar.events.delete({
      calendarId: calendarEmail,
      eventId: eventId,
    });

    // Update status in Supabase
    await supabase
      .from("calendar_events")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId);

    res.json({ success: true, message: "Event cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling calendar event:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/calendar/list-events
 * List upcoming calendar events
 */
router.post("/list-events", async (req, res) => {
  try {
    const { calendarEmail, maxResults = 10 } = req.body;

    if (!calendarEmail) {
      return res.status(400).json({ error: "calendarEmail is required" });
    }

    const calendar = getCalendarClient();

    const response = await calendar.events.list({
      calendarId: calendarEmail,
      timeMin: new Date().toISOString(),
      maxResults: Number.parseInt(maxResults),
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items || []);
  } catch (error) {
    console.error("Error listing calendar events:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/calendar/sync-consultations
 * Auto-create calendar events for consultations
 */
router.post("/sync-consultations", async (req, res) => {
  try {
    const { calendarEmail } = req.body;

    if (!calendarEmail) {
      return res.status(400).json({ error: "calendarEmail is required" });
    }

    // Get pending consultations from Supabase
    const { data: consultations, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("status", "pending")
      .is("calendar_event_id", null);

    if (error) {
      throw error;
    }

    const calendar = getCalendarClient();
    const results = [];

    for (const consultation of consultations || []) {
      try {
        const event = {
          summary: `Consultation: ${consultation.name}`,
          description: `Phone: ${consultation.phone}\nEmail: ${consultation.email}\nService: ${consultation.service}`,
          start: {
            dateTime: consultation.preferred_date,
            timeZone: "Asia/Ho_Chi_Minh",
          },
          end: {
            dateTime: new Date(
              new Date(consultation.preferred_date).getTime() + 60 * 60 * 1000
            ).toISOString(),
            timeZone: "Asia/Ho_Chi_Minh",
          },
          attendees: [{ email: consultation.email }],
        };

        const response = await calendar.events.insert({
          calendarId: calendarEmail,
          requestBody: event,
        });

        // Update consultation with event ID
        await supabase
          .from("consultations")
          .update({ calendar_event_id: response.data.id })
          .eq("id", consultation.id);

        // Store calendar event
        await supabase.from("calendar_events").insert({
          calendar_email: calendarEmail,
          event_id: response.data.id,
          summary: event.summary,
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          status: "confirmed",
          google_event_data: response.data,
        });

        results.push({
          consultationId: consultation.id,
          eventId: response.data.id,
          success: true,
        });
      } catch (err) {
        results.push({
          consultationId: consultation.id,
          success: false,
          error: err.message,
        });
      }
    }

    res.json({
      totalProcessed: consultations?.length || 0,
      results,
    });
  } catch (error) {
    console.error("Error syncing consultations:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
