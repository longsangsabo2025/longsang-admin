/**
 * Campaign Monitoring Service
 * Phase 3: Real-time campaign performance monitoring
 *
 * Provides live metrics updates via WebSocket
 */

const EventEmitter = require('events');
const axios = require('axios');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';

class CampaignMonitoringService extends EventEmitter {
  constructor() {
    super();
    this.mcpServerUrl = MCP_SERVER_URL;
    this.activeMonitors = new Map(); // campaign_id -> monitoring config
    this.metricsCache = new Map(); // campaign_id -> latest metrics
    this.updateInterval = 30000; // 30 seconds default
  }

  /**
   * Start monitoring a campaign
   * @param {Object} config - Monitoring configuration
   * @returns {Promise<Object>} Monitoring result
   */
  async startMonitoring(config) {
    const {
      campaign_id,
      platforms = ['facebook'],
      update_interval = 30000, // 30 seconds
      metrics = ['impressions', 'clicks', 'spend', 'conversions', 'ctr', 'cpc']
    } = config;

    if (!campaign_id) {
      throw new Error('campaign_id is required');
    }

    // Store monitoring config
    this.activeMonitors.set(campaign_id, {
      campaign_id,
      platforms,
      update_interval,
      metrics,
      start_time: new Date(),
      last_update: null
    });

    // Initial metrics fetch
    await this.updateMetrics(campaign_id);

    // Set up interval
    const intervalId = setInterval(async () => {
      await this.updateMetrics(campaign_id);
    }, update_interval);

    // Store interval ID
    const monitor = this.activeMonitors.get(campaign_id);
    monitor.intervalId = intervalId;

    return {
      success: true,
      campaign_id,
      monitoring: true,
      update_interval,
      message: 'Campaign monitoring started'
    };
  }

  /**
   * Stop monitoring a campaign
   * @param {String} campaign_id - Campaign ID
   * @returns {Object} Stop result
   */
  stopMonitoring(campaign_id) {
    const monitor = this.activeMonitors.get(campaign_id);

    if (!monitor) {
      return {
        success: false,
        error: 'Campaign not being monitored'
      };
    }

    // Clear interval
    if (monitor.intervalId) {
      clearInterval(monitor.intervalId);
    }

    // Remove from active monitors
    this.activeMonitors.delete(campaign_id);
    this.metricsCache.delete(campaign_id);

    return {
      success: true,
      campaign_id,
      message: 'Campaign monitoring stopped'
    };
  }

  /**
   * Update metrics for a campaign
   * @param {String} campaign_id - Campaign ID
   * @returns {Promise<Object>} Updated metrics
   */
  async updateMetrics(campaign_id) {
    const monitor = this.activeMonitors.get(campaign_id);

    if (!monitor) {
      return null;
    }

    try {
      // Get metrics from platforms
      const metrics = {
        campaign_id,
        timestamp: new Date().toISOString(),
        platforms: {}
      };

      // Fetch from each platform
      for (const platform of monitor.platforms) {
        try {
          if (platform === 'facebook') {
            // Get Facebook metrics
            const fbMetrics = await this._getFacebookMetrics(campaign_id);
            metrics.platforms.facebook = fbMetrics;
          } else if (platform === 'google') {
            // Get Google Ads metrics
            const googleMetrics = await this._getGoogleMetrics(campaign_id);
            metrics.platforms.google = googleMetrics;
          }
        } catch (error) {
          console.error(`Error fetching ${platform} metrics:`, error.message);
          metrics.platforms[platform] = {
            error: error.message
          };
        }
      }

      // Calculate aggregated metrics
      metrics.aggregated = this._aggregateMetrics(metrics.platforms);

      // Cache metrics
      this.metricsCache.set(campaign_id, metrics);

      // Update monitor
      monitor.last_update = new Date();

      // Emit event for WebSocket
      this.emit('metrics_update', {
        campaign_id,
        metrics
      });

      return metrics;
    } catch (error) {
      console.error(`Error updating metrics for ${campaign_id}:`, error);
      this.emit('metrics_error', {
        campaign_id,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get Facebook metrics
   * @param {String} campaign_id - Campaign ID
   * @returns {Promise<Object>} Facebook metrics
   */
  async _getFacebookMetrics(campaign_id) {
    // Placeholder - would call Facebook Ads API
    // For now, return mock data structure
    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      note: 'Facebook metrics integration pending'
    };
  }

  /**
   * Get Google Ads metrics
   * @param {String} campaign_id - Campaign ID
   * @returns {Promise<Object>} Google Ads metrics
   */
  async _getGoogleMetrics(campaign_id) {
    // Placeholder - would call Google Ads API
    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      note: 'Google Ads metrics integration pending'
    };
  }

  /**
   * Aggregate metrics across platforms
   * @param {Object} platformMetrics - Metrics from each platform
   * @returns {Object} Aggregated metrics
   */
  _aggregateMetrics(platformMetrics) {
    const aggregated = {
      total_impressions: 0,
      total_clicks: 0,
      total_spend: 0,
      total_conversions: 0,
      overall_ctr: 0,
      overall_cpc: 0,
      overall_cpa: 0
    };

    Object.values(platformMetrics).forEach(metrics => {
      if (!metrics.error) {
        aggregated.total_impressions += metrics.impressions || 0;
        aggregated.total_clicks += metrics.clicks || 0;
        aggregated.total_spend += metrics.spend || 0;
        aggregated.total_conversions += metrics.conversions || 0;
      }
    });

    // Calculate rates
    if (aggregated.total_impressions > 0) {
      aggregated.overall_ctr = (aggregated.total_clicks / aggregated.total_impressions) * 100;
    }
    if (aggregated.total_clicks > 0) {
      aggregated.overall_cpc = aggregated.total_spend / aggregated.total_clicks;
    }
    if (aggregated.total_conversions > 0) {
      aggregated.overall_cpa = aggregated.total_spend / aggregated.total_conversions;
    }

    return aggregated;
  }

  /**
   * Get latest metrics for a campaign
   * @param {String} campaign_id - Campaign ID
   * @returns {Object} Latest metrics
   */
  getLatestMetrics(campaign_id) {
    return this.metricsCache.get(campaign_id) || null;
  }

  /**
   * Get all active monitors
   * @returns {Array} List of active monitors
   */
  getActiveMonitors() {
    const monitors = [];
    this.activeMonitors.forEach((monitor, campaign_id) => {
      monitors.push({
        campaign_id,
        platforms: monitor.platforms,
        update_interval: monitor.update_interval,
        start_time: monitor.start_time,
        last_update: monitor.last_update
      });
    });
    return monitors;
  }

  /**
   * Get monitoring status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      active_monitors: this.activeMonitors.size,
      monitors: this.getActiveMonitors(),
      cache_size: this.metricsCache.size
    };
  }
}

module.exports = CampaignMonitoringService;

