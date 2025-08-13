const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000;
  }

  async connect() {
    if (this.isConnected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._attemptConnection();
    return this.connectionPromise;
  }

  async _attemptConnection() {
    try {
      const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/foodtok';
      
      console.log(`[DB] Attempting connection ${this.retryCount + 1}/${this.maxRetries}...`);
      
      // Enhanced connection options for better reliability
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0, // Disable mongoose buffering
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        heartbeatFrequencyMS: 10000, // Send a ping to server every 10 seconds
      };

      await mongoose.connect(mongoURI, options);
      
      this.isConnected = true;
      this.retryCount = 0;
      this.connectionPromise = null;
      
      console.log('[DB] MongoDB Connected Successfully');
      
      // Setup connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error('[DB] MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[DB] MongoDB disconnected');
        this.isConnected = false;
        
        // Auto-reconnect on disconnect
        if (this.retryCount < this.maxRetries) {
          setTimeout(() => {
            this._reconnect();
          }, this.retryDelay);
        }
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[DB] MongoDB reconnected');
        this.isConnected = true;
        this.retryCount = 0;
      });

      return Promise.resolve();
      
    } catch (error) {
      console.error(`[DB] Connection attempt ${this.retryCount + 1} failed:`, error.message);
      
      this.retryCount++;
      this.connectionPromise = null;
      
      if (this.retryCount < this.maxRetries) {
        console.log(`[DB] Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        this.retryDelay *= 2; // Exponential backoff
        return this._attemptConnection();
      } else {
        console.error('[DB] Max retry attempts reached. Connection failed.');
        throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts: ${error.message}`);
      }
    }
  }

  async _reconnect() {
    if (!this.isConnected && this.retryCount < this.maxRetries) {
      try {
        console.log('[DB] Attempting to reconnect...');
        await this._attemptConnection();
      } catch (error) {
        console.error('[DB] Reconnection failed:', error.message);
      }
    }
  }

  // Middleware to ensure connection before executing queries
  ensureConnection() {
    return async (req, res, next) => {
      try {
        if (!this.isConnected) {
          console.log('[DB] Connection not ready, attempting to connect...');
          await this.connect();
        }
        next();
      } catch (error) {
        console.error('[DB] Failed to ensure connection:', error);
        res.status(503).json({
          error: 'Database connection unavailable',
          message: 'Please try again in a moment'
        });
      }
    };
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: 'No active connection' };
      }

      // Test the connection with a simple operation
      const adminDB = mongoose.connection.db.admin();
      const result = await adminDB.ping();
      
      return {
        status: 'connected',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        ping: result.ok ? 'success' : 'failed'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // Graceful shutdown
  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.connection.close();
        this.isConnected = false;
        console.log('[DB] MongoDB connection closed');
      }
    } catch (error) {
      console.error('[DB] Error during disconnection:', error);
    }
  }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();
module.exports = dbConnection;