/**
 * Budget Reallocation Service
 * Phase 3: Automated budget reallocation based on performance
 *
 * Uses advanced optimization algorithms to automatically adjust budgets
 */

const axios = require('axios');
const CampaignOptimizerService = require('./campaign-optimizer-service');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';

class BudgetReallocationService {
  constructor() {
    this.mcpServerUrl = MCP_SERVER_URL;
    this.campaignOptimizer = new CampaignOptimizerService();
    this.reallocationHistory = [];
  }

  /**
   * Analyze and reallocate budgets automatically
   * @param {Object} config - Reallocation configuration
   * @returns {Promise<Object>} Reallocation recommendations
   */
  async analyzeAndReallocate(config) {
    const {
      campaign_data,
      total_budget,
      min_budget_per_variant = 50,
      max_budget_per_variant = null,
      method = "thompson_sampling",
      auto_apply = false
    } = config;

    try {
      // Step 1: Get optimization analysis
      const optimization = await axios.post(
        `${this.mcpServerUrl}/mcp/advanced-optimization/budget-allocation`,
        {
          campaign_data,
          total_budget,
          method
        },
        {
          timeout: 30000
        }
      );

      if (!optimization.data.success) {
        throw new Error(optimization.data.error || 'Budget optimization failed');
      }

      // Step 2: Apply constraints
      const allocations = optimization.data.allocations.map(alloc => {
        let budget = alloc.allocated_budget || alloc.recommended_budget || 0;

        // Apply min constraint
        if (budget < min_budget_per_variant) {
          budget = min_budget_per_variant;
        }

        // Apply max constraint
        if (max_budget_per_variant && budget > max_budget_per_variant) {
          budget = max_budget_per_variant;
        }

        return {
          ...alloc,
          allocated_budget: budget,
          original_budget: alloc.allocated_budget || alloc.recommended_budget
        };
      });

      // Normalize to ensure total equals budget
      const total_allocated = allocations.reduce((sum, a) => sum + a.allocated_budget, 0);
      if (total_allocated > 0 && total_allocated !== total_budget) {
        allocations.forEach(alloc => {
          alloc.allocated_budget = (alloc.allocated_budget / total_allocated) * total_budget;
        });
      }

      // Step 3: Generate actions
      const actions = this._generateActions(allocations, campaign_data, {
        min_budget_per_variant,
        max_budget_per_variant
      });

      const result = {
        success: true,
        total_budget,
        allocations,
        actions,
        algorithm: optimization.data.algorithm,
        timestamp: new Date().toISOString()
      };

      // Step 4: Auto-apply if requested
      if (auto_apply) {
        const applied = await this._applyReallocation(actions);
        result.applied = applied;
      }

      // Store in history
      this.reallocationHistory.push(result);

      return result;
    } catch (error) {
      console.error('Error in budget reallocation:', error.message);
      throw error;
    }
  }

  /**
   * Generate actions from allocations
   * @param {Array} allocations - Budget allocations
   * @param {Object} campaign_data - Campaign data
   * @returns {Array} List of actions to take
   */
  _generateActions(allocations, campaign_data, config = {}) {
    const actions = [];

    allocations.forEach(alloc => {
      const variant = campaign_data.variants?.find(v => v.variant_id === alloc.variant);
      const current_budget = variant?.current_budget || 0;
      const new_budget = alloc.allocated_budget;
      const change = new_budget - current_budget;
      const change_percent = current_budget > 0 ? (change / current_budget) * 100 : 0;

      if (Math.abs(change_percent) > 10) { // Only act if change > 10%
        if (change_percent > 0) {
          actions.push({
            type: "increase_budget",
            variant: alloc.variant,
            current_budget,
            new_budget,
            change,
            change_percent,
            reason: `Variant performing well. Increase budget by ${change_percent.toFixed(1)}%`
          });
        } else {
          actions.push({
            type: "decrease_budget",
            variant: alloc.variant,
            current_budget,
            new_budget,
            change,
            change_percent,
            reason: `Variant underperforming. Decrease budget by ${Math.abs(change_percent).toFixed(1)}%`
          });
        }
      } else if (new_budget < (config.min_budget_per_variant || 50)) {
        actions.push({
          type: "pause",
          variant: alloc.variant,
          reason: "Budget too low. Consider pausing this variant."
        });
      }
    });

    return actions;
  }

  /**
   * Apply reallocation actions
   * @param {Array} actions - Actions to apply
   * @returns {Promise<Object>} Application result
   */
  async _applyReallocation(actions) {
    const results = [];

    for (const action of actions) {
      try {
        // This would call the actual platform APIs to update budgets
        // Placeholder for now
        results.push({
          variant: action.variant,
          action: action.type,
          success: true,
          note: "Action queued (implementation pending)"
        });
      } catch (error) {
        results.push({
          variant: action.variant,
          action: action.type,
          success: false,
          error: error.message
        });
      }
    }

    return {
      applied: results.length,
      results
    };
  }

  /**
   * Get reallocation history
   * @param {String} campaign_id - Optional campaign ID filter
   * @returns {Array} Reallocation history
   */
  getHistory(campaign_id = null) {
    if (campaign_id) {
      return this.reallocationHistory.filter(h => h.campaign_id === campaign_id);
    }
    return this.reallocationHistory;
  }

  /**
   * Forecast campaign performance
   * @param {Object} config - Forecasting configuration
   * @returns {Promise<Object>} Forecast results
   */
  async forecastPerformance(config) {
    const {
      historical_data,
      days_ahead = 7
    } = config;

    try {
      const response = await axios.post(
        `${this.mcpServerUrl}/mcp/advanced-optimization/forecast`,
        {
          historical_data,
          days_ahead
        },
        {
          timeout: 30000
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Forecasting failed');
      }

      return response.data;
    } catch (error) {
      console.error('Error in performance forecasting:', error.message);
      throw error;
    }
  }
}

module.exports = BudgetReallocationService;

