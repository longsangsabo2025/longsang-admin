/**
 * Campaign Strategy Service
 * Uses Brain domain agent to generate campaign strategies based on knowledge base
 *
 * Phase 1: Integrate Brain module for intelligent campaign planning
 */

const axios = require('axios');

// Brain API endpoint (from long-sang-forge API)
const BRAIN_API_URL = process.env.BRAIN_API_URL || 'http://localhost:3001/api/brain';

class CampaignStrategyService {
  constructor() {
    this.brainApiUrl = BRAIN_API_URL;
  }

  /**
   * Generate campaign strategy using Brain domain agent
   * @param {Object} config - Strategy generation config
   * @returns {Promise<Object>} Campaign strategy
   */
  async generateStrategy(config) {
    const {
      product_info,
      domain_id,
      target_audience,
      budget,
      objective
    } = config;

    try {
      // If domain_id provided, use Brain domain agent
      if (domain_id) {
        return await this.generateStrategyWithBrain({
          product_info,
          domain_id,
          target_audience,
          budget,
          objective
        });
      }

      // Otherwise, generate basic strategy without Brain
      return this.generateBasicStrategy({
        product_info,
        target_audience,
        budget,
        objective
      });
    } catch (error) {
      console.error('Error generating strategy:', error);
      // Fallback to basic strategy
      return this.generateBasicStrategy({
        product_info,
        target_audience,
        budget,
        objective
      });
    }
  }

  /**
   * Generate strategy using Brain domain agent
   * @param {Object} config
   * @returns {Promise<Object>}
   */
  async generateStrategyWithBrain(config) {
    const {
      product_info,
      domain_id,
      target_audience,
      budget,
      objective
    } = config;

    // Query Brain domain agent
    const question = this.buildStrategyQuestion(product_info, target_audience, objective);

    try {
      const response = await axios.post(
        `${this.brainApiUrl}/domains/${domain_id}/query`,
        {
          question,
          context: {
            product_info,
            target_audience,
            budget,
            objective
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
            // Add auth headers if needed
          }
        }
      );

      if (response.data.success && response.data.data) {
        const brainResponse = response.data.data;

        // Parse Brain response and structure as campaign strategy
        return this.parseBrainResponse(brainResponse, config);
      }

      throw new Error('Brain agent returned invalid response');
    } catch (error) {
      console.error('Error querying Brain domain agent:', error);
      throw error;
    }
  }

  /**
   * Build question for Brain domain agent
   * @param {Object} product_info
   * @param {Object} target_audience
   * @param {String} objective
   * @returns {String}
   */
  buildStrategyQuestion(product_info, target_audience, objective) {
    const { name, description, category } = product_info;

    return `Based on our knowledge base and past successful campaigns, generate a comprehensive advertising campaign strategy for:

Product: ${name}
Description: ${description || 'N/A'}
Category: ${category || 'N/A'}
Objective: ${objective || 'CONVERSIONS'}
Target Audience: ${target_audience ? JSON.stringify(target_audience) : 'General audience'}

Please provide:
1. Recommended ad styles and creative approaches
2. Key messaging points
3. Best performing formats and placements
4. Budget allocation recommendations
5. A/B testing suggestions
6. Expected performance metrics

Use insights from similar products and campaigns in our knowledge base.`;
  }

  /**
   * Parse Brain response into structured campaign strategy
   * @param {Object} brainResponse
   * @param {Object} config
   * @returns {Object}
   */
  parseBrainResponse(brainResponse, config) {
    const { answer, sources, confidence } = brainResponse;

    // Extract structured information from Brain response
    // This is a simplified parser - can be enhanced with LLM structured output
    const strategy = {
      source: 'brain_domain_agent',
      confidence: confidence || 0.8,
      answer: answer,
      sources: sources || [],

      // Structured recommendations
      recommendations: {
        ad_styles: this.extractAdStyles(answer),
        messaging: this.extractMessaging(answer),
        formats: this.extractFormats(answer),
        budget_allocation: this.extractBudgetAllocation(answer, config.budget),
        ab_testing: this.extractABTesting(answer)
      },

      // Metadata
      product_info: config.product_info,
      target_audience: config.target_audience,
      objective: config.objective
    };

    return strategy;
  }

  /**
   * Extract ad style recommendations from Brain response
   * @param {String} answer
   * @returns {Array}
   */
  extractAdStyles(answer) {
    const styles = ['product', 'lifestyle', 'social', 'testimonial', 'minimalist'];
    const recommended = [];

    // Simple keyword matching (can be enhanced with NLP)
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('product') || lowerAnswer.includes('showcase')) {
      recommended.push('product');
    }
    if (lowerAnswer.includes('lifestyle') || lowerAnswer.includes('real-world')) {
      recommended.push('lifestyle');
    }
    if (lowerAnswer.includes('social') || lowerAnswer.includes('vibrant')) {
      recommended.push('social');
    }
    if (lowerAnswer.includes('testimonial') || lowerAnswer.includes('customer')) {
      recommended.push('testimonial');
    }
    if (lowerAnswer.includes('minimalist') || lowerAnswer.includes('elegant')) {
      recommended.push('minimalist');
    }

    return recommended.length > 0 ? recommended : ['product', 'lifestyle']; // Default
  }

  /**
   * Extract messaging points from Brain response
   * @param {String} answer
   * @returns {Array}
   */
  extractMessaging(answer) {
    // Simple extraction - can be enhanced
    const messages = [];
    const lines = answer.split('\n');

    for (const line of lines) {
      if (line.includes('message') || line.includes('key point') || line.match(/^\d+\./)) {
        messages.push(line.trim());
      }
    }

    return messages.slice(0, 5); // Top 5 messages
  }

  /**
   * Extract format recommendations
   * @param {String} answer
   * @returns {Array}
   */
  extractFormats(answer) {
    const formats = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('video') || lowerAnswer.includes('reel')) {
      formats.push('video');
    }
    if (lowerAnswer.includes('carousel') || lowerAnswer.includes('multi')) {
      formats.push('carousel');
    }
    if (lowerAnswer.includes('single') || lowerAnswer.includes('image')) {
      formats.push('single_image');
    }

    return formats.length > 0 ? formats : ['single_image']; // Default
  }

  /**
   * Extract budget allocation recommendations
   * @param {String} answer
   * @param {Number} totalBudget
   * @returns {Object}
   */
  extractBudgetAllocation(answer, totalBudget) {
    if (!totalBudget) {
      return {
        creative_generation: 10,
        ad_placement: 80,
        testing: 10
      };
    }

    // Simple allocation (can be enhanced with Brain insights)
    return {
      creative_generation: totalBudget * 0.1,
      ad_placement: totalBudget * 0.8,
      testing: totalBudget * 0.1
    };
  }

  /**
   * Extract A/B testing suggestions
   * @param {String} answer
   * @returns {Array}
   */
  extractABTesting(answer) {
    const tests = [];
    const lowerAnswer = answer.toLowerCase();

    if (lowerAnswer.includes('headline') || lowerAnswer.includes('copy')) {
      tests.push('headline_variations');
    }
    if (lowerAnswer.includes('image') || lowerAnswer.includes('creative')) {
      tests.push('creative_variations');
    }
    if (lowerAnswer.includes('audience') || lowerAnswer.includes('targeting')) {
      tests.push('audience_segments');
    }

    return tests.length > 0 ? tests : ['creative_variations']; // Default
  }

  /**
   * Generate basic strategy without Brain
   * @param {Object} config
   * @returns {Object}
   */
  generateBasicStrategy(config) {
    const { product_info, target_audience, budget, objective } = config;

    return {
      source: 'basic_template',
      confidence: 0.5,
      answer: 'Basic campaign strategy generated without Brain knowledge base.',

      recommendations: {
        ad_styles: ['product', 'lifestyle'],
        messaging: [
          `Discover ${product_info.name}`,
          product_info.description || 'Quality product for you'
        ],
        formats: ['single_image'],
        budget_allocation: {
          creative_generation: budget ? budget * 0.1 : 0,
          ad_placement: budget ? budget * 0.8 : 0,
          testing: budget ? budget * 0.1 : 0
        },
        ab_testing: ['creative_variations']
      },

      product_info,
      target_audience,
      objective
    };
  }
}

module.exports = CampaignStrategyService;

