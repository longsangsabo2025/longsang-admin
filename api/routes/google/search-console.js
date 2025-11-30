/**
 * Google Search Console API Routes
 * Server-side endpoints for Search Console data
 */

const express = require("express");
const router = express.Router();
const { google } = require("googleapis");

// Initialize Google Search Console client
const getSearchConsoleClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  return google.searchconsole({ version: "v1", auth });
};

/**
 * GET /api/google/search-console/sites
 * List all verified sites
 */
router.get("/sites", async (req, res) => {
  try {
    const searchconsole = getSearchConsoleClient();
    const response = await searchconsole.sites.list();
    
    res.json({
      success: true,
      sites: response.data.siteEntry || [],
    });
  } catch (error) {
    console.error("Error listing sites:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/search-console/performance
 * Get search performance data
 */
router.post("/performance", async (req, res) => {
  try {
    const { siteUrl, startDate, endDate, dimensions = ["query"], rowLimit = 100 } = req.body;

    if (!siteUrl) {
      return res.status(400).json({ error: "siteUrl is required" });
    }

    // Default to last 7 days if not specified
    const end = endDate || new Date().toISOString().split("T")[0];
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const searchconsole = getSearchConsoleClient();
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions,
        rowLimit,
      },
    });

    // Process data
    const rows = response.data.rows || [];
    const summary = {
      totalClicks: rows.reduce((sum, row) => sum + (row.clicks || 0), 0),
      totalImpressions: rows.reduce((sum, row) => sum + (row.impressions || 0), 0),
      avgCTR: 0,
      avgPosition: 0,
    };

    if (summary.totalImpressions > 0) {
      summary.avgCTR = (summary.totalClicks / summary.totalImpressions) * 100;
    }
    if (rows.length > 0) {
      summary.avgPosition = rows.reduce((sum, row) => sum + (row.position || 0), 0) / rows.length;
    }

    res.json({
      success: true,
      siteUrl,
      dateRange: { start, end },
      summary,
      rows: rows.map(row => ({
        keys: row.keys,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
    });
  } catch (error) {
    console.error("Error getting performance:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/search-console/pages
 * Get top pages data
 */
router.post("/pages", async (req, res) => {
  try {
    const { siteUrl, startDate, endDate, rowLimit = 50 } = req.body;

    if (!siteUrl) {
      return res.status(400).json({ error: "siteUrl is required" });
    }

    const end = endDate || new Date().toISOString().split("T")[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const searchconsole = getSearchConsoleClient();
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["page"],
        rowLimit,
      },
    });

    const rows = response.data.rows || [];

    res.json({
      success: true,
      totalPages: rows.length,
      pages: rows.map(row => ({
        url: row.keys?.[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })).sort((a, b) => (b.clicks || 0) - (a.clicks || 0)),
    });
  } catch (error) {
    console.error("Error getting pages:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/search-console/keywords
 * Get top keywords/queries
 */
router.post("/keywords", async (req, res) => {
  try {
    const { siteUrl, startDate, endDate, rowLimit = 100 } = req.body;

    if (!siteUrl) {
      return res.status(400).json({ error: "siteUrl is required" });
    }

    const end = endDate || new Date().toISOString().split("T")[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const searchconsole = getSearchConsoleClient();
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["query"],
        rowLimit,
      },
    });

    const rows = response.data.rows || [];

    // Categorize by position
    const top3 = rows.filter(r => r.position <= 3);
    const top10 = rows.filter(r => r.position > 3 && r.position <= 10);
    const top30 = rows.filter(r => r.position > 10 && r.position <= 30);

    res.json({
      success: true,
      totalKeywords: rows.length,
      ranking: {
        top3: top3.length,
        top10: top10.length,
        top30: top30.length,
      },
      keywords: rows.map(row => ({
        query: row.keys?.[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: Math.round(row.position * 10) / 10,
      })).sort((a, b) => (a.position || 0) - (b.position || 0)),
    });
  } catch (error) {
    console.error("Error getting keywords:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/google/search-console/sitemaps/:siteUrl
 * List sitemaps for a site
 */
router.get("/sitemaps/:siteUrl", async (req, res) => {
  try {
    const siteUrl = decodeURIComponent(req.params.siteUrl);
    
    const searchconsole = getSearchConsoleClient();
    const response = await searchconsole.sitemaps.list({ siteUrl });

    res.json({
      success: true,
      sitemaps: response.data.sitemap || [],
    });
  } catch (error) {
    console.error("Error listing sitemaps:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/search-console/submit-sitemap
 * Submit a sitemap
 */
router.post("/submit-sitemap", async (req, res) => {
  try {
    const { siteUrl, feedpath } = req.body;

    if (!siteUrl || !feedpath) {
      return res.status(400).json({ error: "siteUrl and feedpath are required" });
    }

    const searchconsole = getSearchConsoleClient();
    await searchconsole.sitemaps.submit({ siteUrl, feedpath });

    res.json({
      success: true,
      message: `Sitemap ${feedpath} submitted successfully`,
    });
  } catch (error) {
    console.error("Error submitting sitemap:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
