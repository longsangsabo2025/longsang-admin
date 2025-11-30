/**
 * Robyn Service (Node.js Wrapper)
 * Wraps Python Robyn optimization for Node.js API
 */

const axios = require('axios');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';

class RobynService {
  constructor() {
    this.mcpServerUrl = MCP_SERVER_URL;
  }

  /**
   * Optimize budget allocation using Robyn MMM
   * @param {Object} config - Optimization config
   * @returns {Promise<Object>} Optimization results
   */
  async optimizeBudgetAllocation(config) {
    const {
      historical_data,
      total_budget,
      channels
    } = config;

    try {
      const response = await axios.post(
        `${this.mcpServerUrl}/mcp/robyn/optimize-budget`,
        {
          historical_data,
          total_budget,
          channels
        },
        {
          timeout: 60000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Robyn optimization error:', error);
      return {
        success: false,
        error: error.message || 'Robyn optimization failed'
      };
    }
  }

  /**
   * Calculate channel attribution using Robyn
   * @param {Object} config - Attribution config
   * @returns {Promise<Object>} Attribution results
   */
  async calculateChannelAttribution(config) {
    const {
      historical_data,
      channels
    } = config;

    try {
      const response = await axios.post(
        `${this.mcpServerUrl}/mcp/robyn/attribution`,
        {
          historical_data,
          channels
        },
        {
          timeout: 60000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Robyn attribution error:', error);
      return {
        success: false,
        error: error.message || 'Robyn attribution failed'
      };
    }
  }
}

module.exports = new RobynService();

