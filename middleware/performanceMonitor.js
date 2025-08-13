// Performance monitoring middleware for backend APIs

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowQueryThreshold = 1000; // 1 second
    this.memoryThreshold = 100 * 1024 * 1024; // 100MB
  }

  // Middleware function
  monitor() {
    return (req, res, next) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      // Override res.json to capture response time
      const originalJson = res.json;
      res.json = function(body) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const endMemory = process.memoryUsage();
        
        // Log performance metrics
        const metrics = {
          method: req.method,
          url: req.originalUrl,
          duration: duration,
          memoryDelta: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal
          },
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        };
        
        // Store metrics
        this.storeMetrics(req.originalUrl, metrics);
        
        // Log slow queries
        if (duration > this.slowQueryThreshold) {
          console.warn(`[SLOW QUERY] ${req.method} ${req.originalUrl} - ${duration}ms`, {
            query: req.query,
            params: req.params,
            memoryDelta: metrics.memoryDelta
          });
        }
        
        // Add performance headers in development
        if (process.env.NODE_ENV === 'development') {
          res.set({
            'X-Response-Time': `${duration}ms`,
            'X-Memory-Usage': `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
            'X-Memory-Delta': `${Math.round(metrics.memoryDelta.heapUsed / 1024 / 1024)}MB`
          });
        }
        
        // Call original json method
        return originalJson.call(this, body);
      }.bind(this);
      
      next();
    };
  }

  // Store performance metrics
  storeMetrics(url, metrics) {
    if (!this.metrics.has(url)) {
      this.metrics.set(url, []);
    }
    
    const urlMetrics = this.metrics.get(url);
    urlMetrics.push(metrics);
    
    // Keep only last 100 requests per endpoint
    if (urlMetrics.length > 100) {
      urlMetrics.shift();
    }
  }

  // Get performance statistics
  getStats(url = null) {
    if (url) {
      const urlMetrics = this.metrics.get(url) || [];
      return this.calculateStats(urlMetrics);
    }
    
    // Get stats for all endpoints
    const allStats = {};
    for (const [endpoint, metrics] of this.metrics.entries()) {
      allStats[endpoint] = this.calculateStats(metrics);
    }
    
    return allStats;
  }

  // Calculate statistics for metrics array
  calculateStats(metrics) {
    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        slowQueries: 0
      };
    }
    
    const durations = metrics.map(m => m.duration);
    const slowQueries = durations.filter(d => d > this.slowQueryThreshold).length;
    
    return {
      count: metrics.length,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      slowQueries: slowQueries,
      slowQueryPercentage: Math.round((slowQueries / durations.length) * 100),
      lastRequests: metrics.slice(-5).map(m => ({
        duration: m.duration,
        timestamp: m.timestamp,
        memoryDelta: Math.round(m.memoryDelta.heapUsed / 1024 / 1024)
      }))
    };
  }

  // Clear metrics
  clearMetrics(url = null) {
    if (url) {
      this.metrics.delete(url);
    } else {
      this.metrics.clear();
    }
  }

  // Memory usage monitoring
  getMemoryStats() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024), // MB
      heapUsedPercentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
  }

  // Health check
  healthCheck() {
    const memoryStats = this.getMemoryStats();
    const allStats = this.getStats();
    
    // Calculate overall health score
    let healthScore = 100;
    
    // Deduct points for high memory usage
    if (memoryStats.heapUsedPercentage > 80) healthScore -= 20;
    else if (memoryStats.heapUsedPercentage > 60) healthScore -= 10;
    
    // Deduct points for slow queries
    const totalRequests = Object.values(allStats).reduce((sum, stat) => sum + stat.count, 0);
    const totalSlowQueries = Object.values(allStats).reduce((sum, stat) => sum + stat.slowQueries, 0);
    const slowQueryPercentage = totalRequests > 0 ? (totalSlowQueries / totalRequests) * 100 : 0;
    
    if (slowQueryPercentage > 20) healthScore -= 30;
    else if (slowQueryPercentage > 10) healthScore -= 15;
    
    return {
      score: Math.max(0, healthScore),
      status: healthScore > 80 ? 'healthy' : healthScore > 50 ? 'warning' : 'critical',
      memory: memoryStats,
      performance: {
        totalRequests,
        slowQueryPercentage: Math.round(slowQueryPercentage),
        averageResponseTime: totalRequests > 0 ? 
          Math.round(Object.values(allStats).reduce((sum, stat) => sum + (stat.avgDuration * stat.count), 0) / totalRequests) : 0
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Express middleware function
const monitorPerformance = performanceMonitor.monitor();

// Export both the middleware and the monitor instance
module.exports = {
  monitor: monitorPerformance,
  performanceMonitor
};