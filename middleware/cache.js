const cache = require('../utils/cacheManager');

// Add caching middleware for frequently accessed endpoints
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `api:${req.originalUrl}${req.user ? ':' + req.user._id : ''}`;

    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log(`[CACHE HIT] ${req.originalUrl}`);
        return res.json(cachedData);
      }
    } catch (err) {
      console.log('[CACHE] Redis not available, proceeding without cache');
    }

    // Store original json function
    const originalJson = res.json;
    res.json = function (data) {
      // Cache the response
      cache.set(cacheKey, data, duration).catch(err => {
        console.log('[CACHE] Failed to cache response:', err.message);
      });

      // Send response
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = cacheMiddleware;