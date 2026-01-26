/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse, DDoS, and brute force attacks
 * 
 * Tiered limits:
 * - Auth routes (login/register): Strict (5 requests/15 min)
 * - Write operations (POST/PUT/DELETE): Moderate (100 requests/min)
 * - Read operations (GET): Generous (300 requests/min)
 * - Semantic search: Limited (30 requests/min) due to AI costs
 */

const rateLimit = require('express-rate-limit');

// Standard response for rate limit exceeded
const createLimitMessage = (retryAfter) => ({
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(retryAfter / 1000), // seconds
});

// Key generator - use user ID if authenticated, otherwise IP
const keyGenerator = (req) => {
    if (req.user && req.user._id) {
        return `user_${req.user._id}`;
    }
    // Use X-Forwarded-For for proxied requests, fallback to direct IP
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
};

/**
 * Global Rate Limiter
 * Applied to all requests as a baseline protection
 * 500 requests per minute per IP/user
 */
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
        res.status(429).json(createLimitMessage(req.rateLimit.resetTime - Date.now()));
    },
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    },
});

/**
 * Auth Rate Limiter (Strict)
 * For login, register, forgot-password endpoints
 * Protection against brute force attacks
 * 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many authentication attempts',
        message: 'Please wait 15 minutes before trying again.',
    },
    // Always use IP for auth (user not authenticated yet)
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    },
});

/**
 * Write Operation Limiter
 * For POST, PUT, DELETE operations (creating content, orders, etc.)
 * 100 requests per minute
 */
const writeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many write operations',
            message: 'Please slow down and try again shortly.',
        });
    },
});

/**
 * Semantic Search Limiter
 * Stricter limit for AI-powered search (expensive operations)
 * 30 requests per minute
 */
const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Search rate limit exceeded',
            message: 'Too many search requests. Please wait a moment.',
        });
    },
});

/**
 * Upload Limiter
 * For media upload endpoints
 * 20 uploads per minute
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Upload rate limit exceeded',
            message: 'Too many uploads. Please wait before uploading more.',
        });
    },
});

/**
 * Order Creation Limiter
 * Prevents order spam/abuse
 * 10 orders per 5 minutes
 */
const orderLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Order rate limit exceeded',
            message: 'Too many orders placed. Please wait before ordering again.',
        });
    },
});

module.exports = {
    globalLimiter,
    authLimiter,
    writeLimiter,
    searchLimiter,
    uploadLimiter,
    orderLimiter,
};
