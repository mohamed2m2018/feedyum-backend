const dbConnection = require('./databaseConnection');
const cacheManager = require('./cacheManager');

class ServerInitializer {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  async _performInitialization() {
    console.log('[SERVER] Starting initialization...');
    
    try {
      // 1. Connect to MongoDB first
      console.log('[SERVER] Connecting to MongoDB...');
      await dbConnection.connect();
      
      // 2. Initialize Redis cache (non-blocking)
      console.log('[SERVER] Initializing cache...');
      // Cache initialization is handled internally and doesn't block server startup
      
      // 3. Wait a moment for all connections to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isInitialized = true;
      this.initializationPromise = null;
      
      console.log('[SERVER] Initialization completed successfully');
      
    } catch (error) {
      console.error('[SERVER] Initialization failed:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  // Middleware to ensure server is initialized before handling requests
  ensureInitialized() {
    return async (req, res, next) => {
      try {
        if (!this.isInitialized) {
          console.log('[SERVER] Waiting for initialization...');
          await this.initialize();
        }
        next();
      } catch (error) {
        console.error('[SERVER] Initialization failed for request:', error);
        res.status(503).json({
          error: 'Server is initializing',
          message: 'Please try again in a moment',
          retryAfter: 5
        });
      }
    };
  }

  // Health check endpoint data
  async getHealthStatus() {
    const dbHealth = await dbConnection.healthCheck();
    const cacheHealth = await cacheManager.healthCheck();
    
    const overallStatus = dbHealth.status === 'connected' && 
                         (cacheHealth.status === 'connected' || cacheHealth.status === 'disconnected')
                         ? 'healthy' : 'unhealthy';
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        cache: cacheHealth
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      }
    };
  }
}

// Export singleton instance
const serverInitializer = new ServerInitializer();
module.exports = serverInitializer;