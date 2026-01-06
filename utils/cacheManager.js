const Redis = require('redis');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes
    this.init();
  }

  async init() {
    try {
      // Initialize Redis client
      this.client = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retry_strategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        // Silent: Redis connected
        this.isConnected = true;
      });

      this.client.on('error', () => {
        // Silent: Redis error (non-critical, app works without cache)
        this.isConnected = false;
      });

      // Connect to Redis with better error handling
      if (!this.client.isOpen) {
        await this.client.connect().catch(() => {
          // Silent: Redis connection failed (non-critical)
          this.isConnected = false;
        });
      }

    } catch (error) {
      // Silent: Cache initialization failed (non-critical)
    }
  }

  // Generate cache key with consistent formatting
  generateKey(prefix, params) {
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${prefix}:${cleanParams}`;
  }

  // Get cached data
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached data
  async set(key, data, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;

    try {
      await this.client.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete cached data
  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete patterns (wildcard)
  async delPattern(pattern) {
    if (!this.isConnected) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Get or set pattern - common caching pattern
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    let data = await this.get(key);

    if (data === null) {
      data = await fetchFunction();
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }
    }

    return data;
  }

  // Cache stories with location-aware keys
  async cacheStories(params, stories, ttl = 180) { // 3 minutes for stories
    const key = this.generateKey('stories', params);
    return await this.set(key, stories, ttl);
  }

  async getCachedStories(params) {
    const key = this.generateKey('stories', params);
    return await this.get(key);
  }

  // Cache dishes by category
  async cacheDishes(category, location, dishes, ttl = 300) { // 5 minutes for dishes
    const key = this.generateKey('dishes', { category, ...location });
    return await this.set(key, dishes, ttl);
  }

  async getCachedDishes(category, location) {
    const key = this.generateKey('dishes', { category, ...location });
    return await this.get(key);
  }

  // Cache user views for recommendation scoring
  async cacheUserViews(userId, views, ttl = 600) { // 10 minutes for views
    const key = `user_views:${userId}`;
    return await this.set(key, views, ttl);
  }

  async getCachedUserViews(userId) {
    const key = `user_views:${userId}`;
    return await this.get(key);
  }

  // Cache user likes
  async cacheUserLikes(userId, storyIds, likes, ttl = 300) { // 5 minutes for likes
    const key = this.generateKey('user_likes', { userId, stories: storyIds.join(',') });
    return await this.set(key, likes, ttl);
  }

  async getCachedUserLikes(userId, storyIds) {
    const key = this.generateKey('user_likes', { userId, stories: storyIds.join(',') });
    return await this.get(key);
  }

  // Cache chef ratings
  async cacheChefRatings(chefIds, ratings, ttl = 1800) { // 30 minutes for ratings
    const key = this.generateKey('chef_ratings', { chefs: chefIds.join(',') });
    return await this.set(key, ratings, ttl);
  }

  async getCachedChefRatings(chefIds) {
    const key = this.generateKey('chef_ratings', { chefs: chefIds.join(',') });
    return await this.get(key);
  }

  // Invalidate related caches
  async invalidateStoriesCache(userId, categoryIds) {
    const patterns = [
      `stories:*userId:${userId}*`,
      `stories:*categoryIds:${categoryIds}*`,
      `user_views:${userId}`,
      `user_likes:*userId:${userId}*`
    ];

    for (const pattern of patterns) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } catch (error) {
        console.error('Cache invalidation error:', error);
      }
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) return { status: 'disconnected' };

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      return {
        status: 'connected',
        latency: `${latency}ms`
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// Singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;