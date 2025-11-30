/**
 * Web Vitals Analytics API Endpoint
 * Lưu Core Web Vitals metrics vào database
 */

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * POST /api/analytics/web-vitals
 * Save Core Web Vitals metric
 */
router.post("/web-vitals", async (req, res) => {
  try {
    const { metric, value, rating, page, timestamp } = req.body;

    if (!metric || value === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase not configured, skipping web vitals storage");
      return res.json({ success: true, message: "Analytics disabled" });
    }

    // Save to database
    const { data, error } = await supabase
      .from("web_vitals_metrics")
      .insert({
        metric_name: metric,
        metric_value: value,
        rating,
        page_url: page,
        user_agent: req.headers["user-agent"],
        recorded_at: timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving web vital:", error);
      // Don't fail hard - analytics is optional
      return res.json({ success: true, message: "Metric received but not stored" });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error processing web vital:", error);
    // Don't fail hard - just log and continue
    res.json({ success: true, message: "Error logged" });
  }
});

/**
 * GET /api/analytics/web-vitals/summary
 * Get aggregated Web Vitals summary
 */
router.get("/web-vitals/summary", async (req, res) => {
  try {
    const { page, days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    let query = supabase
      .from("web_vitals_metrics")
      .select("*")
      .gte("recorded_at", startDate.toISOString())
      .order("recorded_at", { ascending: false });

    if (page) {
      query = query.eq("page_url", page);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Aggregate metrics
    const summary = {
      LCP: calculateMetricStats(data, "LCP"),
      FID: calculateMetricStats(data, "FID"),
      CLS: calculateMetricStats(data, "CLS"),
      FCP: calculateMetricStats(data, "FCP"),
      TTFB: calculateMetricStats(data, "TTFB"),
      INP: calculateMetricStats(data, "INP"),
      totalSamples: data.length,
      timeRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching web vitals summary:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

function calculateMetricStats(data, metricName) {
  const metrics = data.filter((d) => d.metric_name === metricName);

  if (metrics.length === 0) {
    return {
      count: 0,
      avg: 0,
      p75: 0,
      p95: 0,
      good: 0,
      needsImprovement: 0,
      poor: 0,
    };
  }

  const values = metrics.map((m) => m.metric_value).sort((a, b) => a - b);
  const ratings = metrics.reduce((acc, m) => {
    acc[m.rating] = (acc[m.rating] || 0) + 1;
    return acc;
  }, {});

  return {
    count: metrics.length,
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    p75: values[Math.floor(values.length * 0.75)],
    p95: values[Math.floor(values.length * 0.95)],
    good: ratings.good || 0,
    needsImprovement: ratings["needs-improvement"] || 0,
    poor: ratings.poor || 0,
  };
}

module.exports = router;
