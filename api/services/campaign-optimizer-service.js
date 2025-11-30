/**
 * Campaign Optimizer Service
 * Phase 2: Auto-optimize campaigns based on performance
 *
 * Integrates with MCP Server campaign optimizer
 */

const axios = require('axios');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';

class CampaignOptimizerService {
  constructor() {
    this.mcpServerUrl = MCP_SERVER_URL;
  }

  /**
   * Analyze campaign and get optimization recommendations
   * @param {Object} config - Campaign analysis config
   * @returns {Promise<Object>} Optimization recommendations
   */
  async analyzeCampaign(config) {
    const {
      campaign_data,
      min_impressions = 1000,
      confidence_level = 0.95
    } = config;

    try {
      const response = await axios.post(
        `${this.mcpServerUrl}/mcp/campaign-optimizer/analyze`,
        {
          campaign_data,
          min_impressions,
          confidence_level
        },
        {
          timeout: 30000
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Campaign optimization failed');
      }

      return response.data;
    } catch (error) {
      console.error('Error optimizing campaign:', error.message);
      throw error;
    }
  }

  /**
   * Format recommendations for display
   * @param {Object} analysisResult - Analysis result from optimizer
   * @returns {Object} Formatted recommendations
   */
  formatRecommendations(analysisResult) {
    const recommendations = analysisResult.recommendations || [];

    const formatted = {
      priority: [],
      actions: [],
      insights: []
    };

    recommendations.forEach(rec => {
      const action = {
        type: rec.recommendation_type,
        variant: rec.variant,
        reason: rec.reason,
        action: rec.action,
        confidence: rec.confidence,
        expected_improvement: rec.expected_improvement
      };

      // Categorize by priority
      if (rec.recommendation_type === 'scale_up' || rec.recommendation_type === 'pause') {
        formatted.priority.push(action);
      } else {
        formatted.actions.push(action);
      }
    });

    // Add insights from analysis
    if (analysisResult.ab_test_results) {
      const summary = analysisResult.ab_test_results.summary || {};
      formatted.insights.push({
        overall_winner: summary.overall_winner,
        significant_tests: summary.significant_tests,
        total_tests: summary.total_tests
      });
    }

    return formatted;
  }
}

module.exports = CampaignOptimizerService;

