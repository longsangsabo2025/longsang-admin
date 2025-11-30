/**
 * Input Validation Middleware
 * Using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation result handler
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
}

/**
 * Campaign creation validation
 */
const validateCampaignCreation = [
  body('campaign_name')
    .notEmpty().withMessage('Campaign name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Campaign name must be 3-100 characters'),
  body('platforms')
    .isArray().withMessage('Platforms must be an array')
    .notEmpty().withMessage('At least one platform is required'),
  body('budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('product_info.name')
    .notEmpty().withMessage('Product name is required'),
  validate
];

/**
 * Image generation validation
 */
const validateImageGeneration = [
  body('prompt')
    .notEmpty().withMessage('Prompt is required')
    .isLength({ min: 10, max: 500 }).withMessage('Prompt must be 10-500 characters'),
  body('aspect_ratio')
    .optional()
    .isIn(['1:1', '16:9', '9:16', '4:5']).withMessage('Invalid aspect ratio'),
  body('ad_style')
    .optional()
    .isIn(['product', 'lifestyle', 'testimonial', 'social', 'minimalist']).withMessage('Invalid ad style'),
  validate
];

/**
 * Budget optimization validation
 */
const validateBudgetOptimization = [
  body('campaign_data')
    .notEmpty().withMessage('Campaign data is required')
    .isObject().withMessage('Campaign data must be an object'),
  body('total_budget')
    .notEmpty().withMessage('Total budget is required')
    .isFloat({ min: 0 }).withMessage('Total budget must be a positive number'),
  body('method')
    .optional()
    .isIn(['thompson_sampling', 'bayesian', 'equal']).withMessage('Invalid optimization method'),
  validate
];

/**
 * Campaign ID validation
 */
const validateCampaignId = [
  param('campaign_id')
    .notEmpty().withMessage('Campaign ID is required')
    .isString().withMessage('Campaign ID must be a string'),
  validate
];

module.exports = {
  validate,
  validateCampaignCreation,
  validateImageGeneration,
  validateBudgetOptimization,
  validateCampaignId
};

