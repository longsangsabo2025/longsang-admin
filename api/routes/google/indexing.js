/**
 * Google Indexing API Routes
 * Server-side endpoints for Google Search Console Indexing API
 */

const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Google Indexing API client
const getIndexingClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  return google.indexing({ version: "v3", auth });
};

/**
 * POST /api/google/indexing/submit-url
 * Submit a single URL to Google for indexing
 */
router.post("/submit-url", async (req, res) => {
  try {
    const { url, action = "URL_UPDATED" } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const indexing = getIndexingClient();
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type: action,
      },
    });

    // Log to Supabase
    await supabase.from("indexing_logs").insert({
      url,
      action,
      status: "submitted",
      response_data: response.data,
      submitted_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      url,
      action,
      response: response.data,
    });
  } catch (error) {
    console.error("Error submitting URL:", error);

    // Log error to Supabase
    await supabase.from("indexing_logs").insert({
      url: req.body.url,
      action: req.body.action || "URL_UPDATED",
      status: "failed",
      error_message: error.message,
      submitted_at: new Date().toISOString(),
    });

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/indexing/batch-submit
 * Submit multiple URLs to Google for indexing
 */
router.post("/batch-submit", async (req, res) => {
  try {
    const { urls, action = "URL_UPDATED" } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "urls array is required" });
    }

    const indexing = getIndexingClient();
    const results = [];

    for (const url of urls) {
      try {
        const response = await indexing.urlNotifications.publish({
          requestBody: {
            url,
            type: action,
          },
        });

        await supabase.from("indexing_logs").insert({
          url,
          action,
          status: "submitted",
          response_data: response.data,
          submitted_at: new Date().toISOString(),
        });

        results.push({
          url,
          success: true,
          response: response.data,
        });
      } catch (err) {
        await supabase.from("indexing_logs").insert({
          url,
          action,
          status: "failed",
          error_message: err.message,
          submitted_at: new Date().toISOString(),
        });

        results.push({
          url,
          success: false,
          error: err.message,
        });
      }

      // Rate limiting: wait 200ms between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    res.json({
      totalSubmitted: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Error batch submitting URLs:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/indexing/remove-url
 * Request removal of URL from Google index
 */
router.post("/remove-url", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const indexing = getIndexingClient();
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type: "URL_DELETED",
      },
    });

    // Log to Supabase
    await supabase.from("indexing_logs").insert({
      url,
      action: "URL_DELETED",
      status: "submitted",
      response_data: response.data,
      submitted_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      url,
      action: "URL_DELETED",
      response: response.data,
    });
  } catch (error) {
    console.error("Error removing URL:", error);

    // Log error to Supabase
    await supabase.from("indexing_logs").insert({
      url: req.body.url,
      action: "URL_DELETED",
      status: "failed",
      error_message: error.message,
      submitted_at: new Date().toISOString(),
    });

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/indexing/get-status
 * Get indexing status for a URL
 */
router.post("/get-status", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const indexing = getIndexingClient();
    const response = await indexing.urlNotifications.getMetadata({
      url,
    });

    // Log query to Supabase
    await supabase.from("indexing_logs").insert({
      url,
      action: "GET_STATUS",
      status: "queried",
      response_data: response.data,
      submitted_at: new Date().toISOString(),
    });

    res.json({
      url,
      status: response.data,
    });
  } catch (error) {
    console.error("Error getting URL status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/google/indexing/stats
 * Get indexing statistics from Supabase
 */
router.get("/stats", async (req, res) => {
  try {
    // Get total submissions
    const { count: totalSubmissions } = await supabase
      .from("indexing_logs")
      .select("*", { count: "exact", head: true })
      .eq("action", "URL_UPDATED");

    // Get successful submissions
    const { count: successfulSubmissions } = await supabase
      .from("indexing_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted");

    // Get failed submissions
    const { count: failedSubmissions } = await supabase
      .from("indexing_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    // Get recent logs
    const { data: recentLogs } = await supabase
      .from("indexing_logs")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(10);

    res.json({
      totalSubmissions: totalSubmissions || 0,
      successfulSubmissions: successfulSubmissions || 0,
      failedSubmissions: failedSubmissions || 0,
      successRate:
        totalSubmissions > 0 ? ((successfulSubmissions / totalSubmissions) * 100).toFixed(2) : 0,
      recentLogs: recentLogs || [],
    });
  } catch (error) {
    console.error("Error getting indexing stats:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
