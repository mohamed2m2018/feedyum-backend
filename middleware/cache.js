const NodeCache = require('node-cache');

// Create cache instance with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      console.log(`Cache hit for: ${key}`);
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(data) {
      // Cache successful responses only
      if (res.statusCode === 200) {
        cache.set(key, data, duration);
        console.log(`Cached response for: ${key}`);
      }
      
      // Call original json method
      originalJson.call(this, data);
    };

    next();
  };
};

// Function to clear cache for specific patterns
const clearCache = (pattern) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.includes(pattern));
  
  keysToDelete.forEach(key => {
    cache.del(key);
  });
  
  console.log(`Cleared ${keysToDelete.length} cache entries matching: ${pattern}`);
};

module.exports = { cacheMiddleware, clearCache };