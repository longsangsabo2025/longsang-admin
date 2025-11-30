/**
 * Enhanced Authentication Middleware
 * JWT token validation, session management, API key support
 */

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'your-secret-key';

/**
 * Extract token from request
 */
function extractToken(req) {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check x-api-key header
  if (req.headers['x-api-key']) {
    return req.headers['x-api-key'];
  }

  // Check x-user-id header (for development/testing)
  if (req.headers['x-user-id']) {
    return req.headers['x-user-id'];
  }

  return null;
}

/**
 * Validate JWT token
 */
function validateJWT(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      userId: decoded.sub || decoded.user_id || decoded.id,
      payload: decoded,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Validate API key
 */
async function validateAPIKey(apiKey) {
  if (!supabase) {
    return { valid: false, error: 'Supabase not configured' };
  }

  try {
    // Check if API key exists in database (assuming brain_api_keys table exists)
    // For now, we'll use a simple check against environment variable
    const validAPIKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
    if (validAPIKeys.includes(apiKey)) {
      // In production, fetch user_id from database based on API key
      return {
        valid: true,
        userId: null, // Will be fetched from database
        apiKey,
      };
    }

    return { valid: false, error: 'Invalid API key' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get user from Supabase session
 */
async function getUserFromSession(token) {
  if (!supabase) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware
 */
async function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
  }

  // Try JWT validation first
  const jwtResult = validateJWT(token);
  if (jwtResult.valid) {
    req.user = {
      id: jwtResult.userId,
      token,
      type: 'jwt',
    };
    req.userId = jwtResult.userId;
    return next();
  }

  // Try API key validation
  const apiKeyResult = await validateAPIKey(token);
  if (apiKeyResult.valid) {
    req.user = {
      id: apiKeyResult.userId,
      token,
      type: 'api_key',
      apiKey: apiKeyResult.apiKey,
    };
    req.userId = apiKeyResult.userId;
    return next();
  }

  // Try Supabase session
  const user = await getUserFromSession(token);
  if (user) {
    req.user = {
      id: user.id,
      email: user.email,
      token,
      type: 'supabase',
    };
    req.userId = user.id;
    return next();
  }

  // Check if it's a simple user ID (for development)
  if (token.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    req.user = {
      id: token,
      token,
      type: 'user_id',
    };
    req.userId = token;
    return next();
  }

  return res.status(401).json({
    success: false,
    error: {
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
    },
  });
}

/**
 * Optional authentication (doesn't fail if no token)
 */
async function optionalAuthenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    req.userId = null;
    return next();
  }

  // Try to authenticate, but don't fail if it doesn't work
  const jwtResult = validateJWT(token);
  if (jwtResult.valid) {
    req.user = {
      id: jwtResult.userId,
      token,
      type: 'jwt',
    };
    req.userId = jwtResult.userId;
    return next();
  }

  const user = await getUserFromSession(token);
  if (user) {
    req.user = {
      id: user.id,
      email: user.email,
      token,
      type: 'supabase',
    };
    req.userId = user.id;
    return next();
  }

  req.user = null;
  req.userId = null;
  next();
}

/**
 * Require specific user role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    // For now, we'll check if user has role in their profile
    // This would need to be implemented based on your user role system
    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
      });
    }

    next();
  };
}

/**
 * Get user ID helper (for backward compatibility)
 */
function getUserId(req) {
  return req.userId || req.headers['x-user-id'] || req.user?.id || null;
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireRole,
  getUserId,
  validateJWT,
  validateAPIKey,
  extractToken,
};


