/**
 * Environment Variables Loader for AI Workspace
 * Tự động load và validate các API keys từ .env.local
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

/**
 * Get API keys from environment
 */
function getAPIKeys() {
  return {
    openai: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    tavily: process.env.TAVILY_API_KEY || process.env.VITE_TAVILY_API_KEY || process.env.TAVILY_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY,
  };
}

/**
 * Validate required keys for AI Workspace
 */
function validateKeys() {
  const keys = getAPIKeys();
  const errors = [];

  // At least one AI provider is required
  if (!keys.openai && !keys.anthropic) {
    errors.push('OPENAI_API_KEY or ANTHROPIC_API_KEY is required');
  }

  // Supabase is required for RAG
  if (!keys.supabaseUrl) {
    errors.push('SUPABASE_URL is required');
  }

  if (!keys.supabaseAnonKey && !keys.supabaseServiceKey) {
    errors.push('SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    keys,
  };
}

/**
 * Get available AI providers
 */
function getAvailableProviders() {
  const keys = getAPIKeys();
  const providers = [];

  if (keys.openai) providers.push('openai');
  if (keys.anthropic) providers.push('anthropic');

  return providers;
}

/**
 * Get preferred provider (OpenAI first, then Anthropic)
 */
function getPreferredProvider() {
  const keys = getAPIKeys();
  if (keys.openai) return 'openai';
  if (keys.anthropic) return 'anthropic';
  return null;
}

module.exports = {
  getAPIKeys,
  validateKeys,
  getAvailableProviders,
  getPreferredProvider,
};

