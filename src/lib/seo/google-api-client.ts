/**
 * 🔐 Google API Client
 * Browser-safe version - All Google API operations must be called through API server
 */

// Browser-safe: Comment out Node.js imports
// import { google } from 'googleapis';

// Lấy credentials từ environment variable
const getCredentials = () => {
  const credentialsJson = import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  
  if (!credentialsJson) {
    console.warn('⚠️ GOOGLE_SERVICE_ACCOUNT_JSON not found in .env');
    return null;
  }

  try {
    return JSON.parse(credentialsJson);
  } catch (error) {
    console.error('❌ Failed to parse Google credentials:', error);
    return null;
  }
};

// Tạo authenticated client
const getAuthClient = async () => {
  const credentials = getCredentials();
  
  if (!credentials) {
    throw new Error('Google credentials not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/indexing',
    ],
  });

  return auth.getClient();
};

// ================================================
// GOOGLE SEARCH CONSOLE API
// ================================================

export const searchConsoleAPI = {
  /**
   * Lấy danh sách tất cả websites đã verify
   */
  async listSites() {
    try {
      const authClient = await getAuthClient();
      const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
      
      const response = await searchconsole.sites.list();
      return response.data.siteEntry || [];
    } catch (error) {
      console.error('❌ Failed to list sites:', error);
      throw error;
    }
  },

  /**
   * Lấy performance data (clicks, impressions, CTR, position)
   */
  async getPerformance(siteUrl: string, startDate: string, endDate: string) {
    try {
      const authClient = await getAuthClient();
      const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
      
      const response = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query', 'page'],
          rowLimit: 1000,
        },
      });

      return response.data.rows || [];
    } catch (error) {
      console.error('❌ Failed to get performance:', error);
      throw error;
    }
  },

  /**
   * Submit sitemap
   */
  async submitSitemap(siteUrl: string, sitemapUrl: string) {
    try {
      const authClient = await getAuthClient();
      const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
      
      await searchconsole.sitemaps.submit({
        siteUrl,
        feedpath: sitemapUrl,
      });

      // Successfully submitted
      return true;
    } catch (error) {
      console.error('❌ Failed to submit sitemap:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra URL inspection
   */
  async inspectUrl(siteUrl: string, inspectionUrl: string) {
    try {
      const authClient = await getAuthClient();
      const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
      
      const response = await searchconsole.urlInspection.index.inspect({
        requestBody: {
          siteUrl,
          inspectionUrl,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to inspect URL:', error);
      throw error;
    }
  },
};

// ================================================
// GOOGLE INDEXING API
// ================================================

export const indexingAPI = {
  /**
   * Request Google index một URL mới
   */
  async requestIndexing(url: string) {
    try {
      const authClient = await getAuthClient();
      const indexing = google.indexing({ version: 'v3', auth: authClient });
      
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type: 'URL_UPDATED',
        },
      });

      // Request sent successfully
      return response.data;
    } catch (error) {
      console.error('❌ Failed to request indexing:', error);
      throw error;
    }
  },

  /**
   * Request Google remove URL khỏi index
   */
  async requestRemoval(url: string) {
    try {
      const authClient = await getAuthClient();
      const indexing = google.indexing({ version: 'v3', auth: authClient });
      
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type: 'URL_DELETED',
        },
      });

      // Removal request sent successfully
      return response.data;
    } catch (error) {
      console.error('❌ Failed to request removal:', error);
      throw error;
    }
  },

  /**
   * Check indexing status
   */
  async getStatus(url: string) {
    try {
      const authClient = await getAuthClient();
      const indexing = google.indexing({ version: 'v3', auth: authClient });
      
      const response = await indexing.urlNotifications.getMetadata({ url });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get indexing status:', error);
      throw error;
    }
  },
};

// ================================================
// GOOGLE ANALYTICS DATA API
// ================================================

export const analyticsAPI = {
  /**
   * Lấy traffic data từ GA4
   */
  async getTrafficData(propertyId: string, startDate: string, endDate: string) {
    try {
      const authClient = await getAuthClient();
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });
      
      const response = await analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [
            { name: 'pagePath' },
            { name: 'sessionSource' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get analytics data:', error);
      throw error;
    }
  },

  /**
   * Lấy top pages
   */
  async getTopPages(propertyId: string, days: number = 30) {
    try {
      const authClient = await getAuthClient();
      const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: authClient });
      
      const response = await analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ 
            startDate: `${days}daysAgo`, 
            endDate: 'today' 
          }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
          ],
          orderBys: [
            {
              metric: { metricName: 'screenPageViews' },
              desc: true,
            },
          ],
          limit: 50,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get top pages:', error);
      throw error;
    }
  },
};

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Kiểm tra xem credentials đã được setup chưa
 */
export const isGoogleAPIConfigured = () => {
  return !!import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON;
};

/**
 * Test connection với Google APIs
 */
export const testConnection = async () => {
  try {
    const sites = await searchConsoleAPI.listSites();
    // Connection successful
    return { success: true, sites };
  } catch (error) {
    console.error('❌ Google API connection failed:', error);
    return { success: false, error };
  }
};

export default {
  searchConsoleAPI,
  indexingAPI,
  analyticsAPI,
  isGoogleAPIConfigured,
  testConnection,
};
