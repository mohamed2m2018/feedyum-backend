// Fix deprecation warnings first
require('./utils/deprecationFixes');

const bodyParser = require("body-parser");
const express = require("express");
const passport = require("passport");
const AdminJS = require("adminjs");
const mongoose = require("mongoose");
const mongoURI = require("./config/keys").mongoURI;
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");
const http = require('http');
const socketSetup = require('./socket');

// Import optimized utilities
const serverInitializer = require('./utils/serverInitializer');
const dbConnection = require('./utils/databaseConnection');
const { monitor } = require('./middleware/performanceMonitor');

AdminJS.registerAdapter(AdminJSMongoose);

// Models
require("./models/loadModels");

const app = express();

// Async server initialization
async function initializeServer() {
  try {
    console.log('[SERVER] Starting optimized server initialization...');
    
    // 1. Initialize database connection properly
    await serverInitializer.initialize();
    
    // 2. Setup AdminJS after database connection is ready
    try {
      const adminJS = new AdminJS({
        databases: [mongoose.connection],
        rootPath: "/shoman-salah-not-expected",
      });
      const adminJSRouter = AdminJSExpress.buildRouter(adminJS);
      app.use(adminJS.options.rootPath, adminJSRouter);
      console.log('[SERVER] AdminJS initialized successfully');
    } catch (err) {
      console.warn('[SERVER] AdminJS initialization failed:', err.message);
    }

    // 3. Add server initialization middleware to ensure DB is ready
    app.use(serverInitializer.ensureInitialized());
    
    // 4. Performance monitoring middleware
    app.use(monitor);
    
    // 5. Timeout middleware
    const timeout = require('./middleware/timeout');
    app.use(timeout(30000)); // 30 second timeout

    // 6. BodyParser Middleware
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    // 7. Passport Config
    app.use(passport.initialize());
    require("./config/passport")(passport);

    // 8. CORS setup
    app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      next();
    });

    // 9. Health check endpoint
    app.get('/api/health', async (req, res) => {
      try {
        const health = await serverInitializer.getHealthStatus();
        res.json(health);
      } catch (error) {
        res.status(503).json({
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // 10. Add optimized routes first (they take priority)
    app.use("/api", require("./routes/optimizedRoutes"));

    // 11. Ensure categories exist in DB before exposing routes
    try {
      const { ensureCategoriesSeeded } = require('./utils/seeders/ensureCategories');
      const result = await ensureCategoriesSeeded();
      console.log(`[SEED] Categories ensured. created=${result.created}, total=${result.total}`);
    } catch (seedErr) {
      console.warn('[SEED] Failed to ensure categories:', seedErr.message);
    }

    // 12. Existing routes
    app.use("/api/user", require("./routes/user"));
    app.use("/api/story", require("./routes/story"));
    app.use("/api/categories", require("./routes/categories"));
    app.use("/api/address", require("./routes/address"));
    app.use("/api/like", require("./routes/like"));
    app.use("/api/comment", require("./routes/comment"));
    app.use("/api/follow", require("./routes/follow"));
    app.use("/api/views", require("./routes/views"));
    app.use("/api/tags", require("./routes/tags"));
    app.use("/api/chat", require("./routes/chat"));
    app.use("/api/messages", require("./routes/messages"));
    app.use("/api/notifications", require("./routes/notifications"));
    app.use("/api/menus", require("./routes/menu"));
    app.use("/api/dishes", require("./routes/dish"));
    app.use("/api/branches", require("./routes/branches"));
    app.use("/api/location-chefs", require("./routes/locationChefs"));
    app.use("/api/sections", require("./routes/section"));
    app.use("/api/cart", require("./routes/cart"));
    app.use("/api/orders", require("./routes/order"));
    app.use("/api/promocode", require("./routes/promocode"));
    app.use("/api/chef-wallet", require("./routes/chefWallet"));
    app.use("/api/reviews", require("./routes/review"));
    app.use("/api/favorites", require("./routes/favorites"));

    // 13. Static file serving
    app.get('/post/:any', (req, res) => {
      res.redirect('/index.html');
    });
    app.use(express.static(__dirname + '/public', { dotfiles: 'allow' }));

    // 14. Global error handler
    app.use((err, req, res, next) => {
      console.error('[SERVER] Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // 15. Start HTTP server
    const port = process.env.PORT || 4800;
    const server = http.createServer(app);

    // 16. Socket.io setup
    socketSetup(server);

    // 17. Start listening
    server.listen(port, () => {
      console.log(`[SERVER] Optimized server listening on port ${port}`);
      console.log(`[SERVER] Health check available at http://localhost:${port}/api/health`);
    });

    // 18. Graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('[SERVER] Received SIGINT, shutting down gracefully...');
      server.close(async () => {
        await dbConnection.disconnect();
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('[SERVER] Received SIGTERM, shutting down gracefully...');
      server.close(async () => {
        await dbConnection.disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('[SERVER] Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start the server
initializeServer();