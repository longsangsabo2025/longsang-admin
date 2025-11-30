/**
 * Google Analytics API Routes
 * Server-side endpoints for Google Analytics operations
 */

const express = require('express');
const router = express.Router();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// Initialize Analytics client with service account
const getAnalyticsClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });
};

/**
 * POST /api/google/analytics/overview
 * Get analytics overview metrics
 */
router.post('/overview', async (req, res) => {
  try {
    const { propertyId, startDate = '7daysAgo', endDate = 'today' } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const analyticsDataClient = getAnalyticsClient();

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'conversions' },
      ],
    });

    if (!response.rows) {
      return res.json([]);
    }

    const metrics = response.rows.map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      sessions: Number.parseInt(row.metricValues?.[0]?.value || '0'),
      users: Number.parseInt(row.metricValues?.[1]?.value || '0'),
      pageViews: Number.parseInt(row.metricValues?.[2]?.value || '0'),
      bounceRate: Number.parseFloat(row.metricValues?.[3]?.value || '0'),
      avgSessionDuration: Number.parseFloat(row.metricValues?.[4]?.value || '0'),
      conversions: Number.parseInt(row.metricValues?.[5]?.value || '0'),
    }));

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/analytics/traffic-sources
 * Get traffic sources breakdown
 */
router.post('/traffic-sources', async (req, res) => {
  try {
    const { propertyId, startDate = '30daysAgo', endDate = 'today' } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const analyticsDataClient = getAnalyticsClient();

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' },
      ],
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true,
        },
      ],
      limit: 20,
    });

    if (!response.rows) {
      return res.json([]);
    }

    const sources = response.rows.map((row) => {
      const sessions = Number.parseInt(row.metricValues?.[0]?.value || '0');
      const conversions = Number.parseInt(row.metricValues?.[2]?.value || '0');
      
      return {
        source: row.dimensionValues?.[0]?.value || 'unknown',
        medium: row.dimensionValues?.[1]?.value || 'unknown',
        sessions,
        users: Number.parseInt(row.metricValues?.[1]?.value || '0'),
        conversionRate: sessions > 0 ? (conversions / sessions) * 100 : 0,
      };
    });

    res.json(sources);
  } catch (error) {
    console.error('Error fetching traffic sources:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/analytics/top-pages
 * Get top pages by pageviews
 */
router.post('/top-pages', async (req, res) => {
  try {
    const { propertyId, startDate = '30daysAgo', endDate = 'today', limit = 20 } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const analyticsDataClient = getAnalyticsClient();

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true,
        },
      ],
      limit,
    });

    if (!response.rows) {
      return res.json([]);
    }

    const pages = response.rows.map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || '',
      pageTitle: row.dimensionValues?.[1]?.value || 'Unknown',
      pageViews: Number.parseInt(row.metricValues?.[0]?.value || '0'),
      avgTimeOnPage: Number.parseFloat(row.metricValues?.[1]?.value || '0'),
      bounceRate: Number.parseFloat(row.metricValues?.[2]?.value || '0'),
    }));

    res.json(pages);
  } catch (error) {
    console.error('Error fetching top pages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/analytics/realtime-users
 * Get real-time active users
 */
router.post('/realtime-users', async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const analyticsDataClient = getAnalyticsClient();

    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });

    const activeUsers = Number.parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0');

    res.json({ activeUsers });
  } catch (error) {
    console.error('Error fetching realtime users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/analytics/compare-performance
 * Compare performance between two time periods
 */
router.post('/compare-performance', async (req, res) => {
  try {
    const {
      propertyId,
      currentStart = '7daysAgo',
      currentEnd = 'today',
      previousStart = '14daysAgo',
      previousEnd = '8daysAgo'
    } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const analyticsDataClient = getAnalyticsClient();

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: currentStart, endDate: currentEnd },
        { startDate: previousStart, endDate: previousEnd },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'conversions' },
        { name: 'bounceRate' },
      ],
    });

    if (!response.rows?.[0]) {
      return res.json(null);
    }

    const current = {
      sessions: Number.parseInt(response.rows[0].metricValues?.[0]?.value || '0'),
      users: Number.parseInt(response.rows[0].metricValues?.[1]?.value || '0'),
      pageViews: Number.parseInt(response.rows[0].metricValues?.[2]?.value || '0'),
      conversions: Number.parseInt(response.rows[0].metricValues?.[3]?.value || '0'),
      bounceRate: Number.parseFloat(response.rows[0].metricValues?.[4]?.value || '0'),
    };

    const previous = {
      sessions: Number.parseInt(response.rows[0].metricValues?.[5]?.value || '0'),
      users: Number.parseInt(response.rows[0].metricValues?.[6]?.value || '0'),
      pageViews: Number.parseInt(response.rows[0].metricValues?.[7]?.value || '0'),
      conversions: Number.parseInt(response.rows[0].metricValues?.[8]?.value || '0'),
      bounceRate: Number.parseFloat(response.rows[0].metricValues?.[9]?.value || '0'),
    };

    const calculateChange = (curr, prev) => {
      if (prev === 0) return 0;
      return ((curr - prev) / prev) * 100;
    };

    const comparison = {
      current,
      previous,
      changes: {
        sessions: calculateChange(current.sessions, previous.sessions),
        users: calculateChange(current.users, previous.users),
        pageViews: calculateChange(current.pageViews, previous.pageViews),
        conversions: calculateChange(current.conversions, previous.conversions),
        bounceRate: calculateChange(current.bounceRate, previous.bounceRate),
      },
    };

    res.json(comparison);
  } catch (error) {
    console.error('Error comparing performance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/analytics/conversion-paths
 * Get conversion paths (user journey)
 */
router.post('/conversion-paths', async (req, res) => {
  try {
    const { propertyId, startDate = '30daysAgo', endDate = 'today' } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const analyticsDataClient = getAnalyticsClient();

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'landingPage' },
      ],
      metrics: [
        { name: 'conversions' },
        { name: 'sessions' },
      ],
      orderBys: [
        {
          metric: { metricName: 'conversions' },
          desc: true,
        },
      ],
      limit: 50,
    });

    if (!response.rows) {
      return res.json([]);
    }

    const paths = response.rows.map((row) => ({
      source: row.dimensionValues?.[0]?.value || 'unknown',
      medium: row.dimensionValues?.[1]?.value || 'unknown',
      landingPage: row.dimensionValues?.[2]?.value || '/',
      conversions: Number.parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: Number.parseInt(row.metricValues?.[1]?.value || '0'),
    }));

    res.json(paths);
  } catch (error) {
    console.error('Error fetching conversion paths:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/analytics/device-breakdown
 * Get device breakdown (Mobile, Desktop, Tablet)
 */
router.post('/device-breakdown', async (req, res) => {
  try {
    const { propertyId, startDate = '30daysAgo', endDate = 'today' } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const analyticsDataClient = getAnalyticsClient();

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'conversions' },
      ],
    });

    if (!response.rows) {
      return res.json([]);
    }

    const devices = response.rows.map((row) => ({
      device: row.dimensionValues?.[0]?.value || 'unknown',
      sessions: Number.parseInt(row.metricValues?.[0]?.value || '0'),
      users: Number.parseInt(row.metricValues?.[1]?.value || '0'),
      bounceRate: Number.parseFloat(row.metricValues?.[2]?.value || '0'),
      conversions: Number.parseInt(row.metricValues?.[3]?.value || '0'),
    }));

    res.json(devices);
  } catch (error) {
    console.error('Error fetching device breakdown:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
