require('dotenv').config();
// Fix deprecation warnings first
process.env.NODE_NO_WARNINGS = '1';
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

const bodyParser = require("body-parser");
const express = require("express");
const passport = require("passport");
const AdminJS = require("adminjs");
const mongoose = require("mongoose");
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");
const http = require('http');
const socketSetup = require('./socket');
const keys = require("./config/keys");
const mongoURI = keys.mongoURI;

AdminJS.registerAdapter(AdminJSMongoose);

// Models
require("./models/loadModels");

const app = express();

// Connect to MongoDB with proper await and error handling
async function connectToDatabase() {
  try {
    // Enable mongoose buffering to prevent connection timing issues
    mongoose.set('bufferCommands', true);

    const mongooseDb = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log("MongoDB Connected Successfully");

    // Initialize AdminJS after successful connection
    try {
      const adminJS = new AdminJS({
        databases: [mongooseDb],
        rootPath: "/shoman-salah-not-expected",
        loginPath: "/shoman-salah-not-expected/login",
        logoutPath: "/shoman-salah-not-expected/logout",
      });

      const adminJSRouter = AdminJSExpress.buildAuthenticatedRouter(
        adminJS,
        {
          authenticate: async (email, password) => {
            if (email === keys.adminEmail && password === keys.adminPassword) {
              return Promise.resolve({ email: keys.adminEmail, role: 'admin' });
            }
            return null;
          },
          cookiePassword: 'some-secret-password-used-to-secure-cookie',
        },
        null,
        {
          resave: false,
          saveUninitialized: true,
        }
      );

      app.use(adminJS.options.rootPath, adminJSRouter);
      console.log("AdminJS initialized successfully (Secured)");
    } catch (err) {
      console.error("AdminJS initialization error:", err.message);
    }

    return mongooseDb;
  } catch (err) {
    console.error("Error connecting to database:", err.message);
    process.exit(1);
  }
}

// Performance monitoring middleware
const performanceMonitor = require('./middleware/performance');
const timeout = require('./middleware/timeout');

// Rate limiting middleware (security)
const { globalLimiter, authLimiter, searchLimiter, orderLimiter, uploadLimiter } = require('./middleware/rateLimit');

// Apply global rate limiter first (baseline protection)
app.use(globalLimiter);

app.use(performanceMonitor);
app.use(timeout(30000)); // 30 second timeout

// Health check endpoint (excluded from rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// BodyParser Middleware (skip AdminJS paths - it has its own body parser)
const adminRoot = '/shoman-salah-not-expected';
app.use((req, res, next) => {
  if (req.path.startsWith(adminRoot)) return next();
  bodyParser.urlencoded({ extended: false })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path.startsWith(adminRoot)) return next();
  bodyParser.json()(req, res, next);
});
// Passport Config
app.use(passport.initialize());
require("./config/passport")(passport);

// Cross Origin Problem
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// Optimized batch endpoint for Discover screen (HIGH PRIORITY)
app.use("/api/discover", require("./routes/discover"));

// Routes with caching for performance
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
app.use("/api/location", require("./routes/location"));

// Add optimized routes FIRST for priority routing
// Optimization routes removed - standard routes only

// Add the standard routes with caching for dishes
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
app.use("/api/paymob", require("./routes/paymob"));
app.use("/api/favorites", require("./routes/favorites"));
app.use("/api/translate", require("./routes/translate"));
// Sharing routes for deep linking fallback (must be before static files)
app.use("/", require("./routes/sharing"));

app.use(express.static(__dirname + '/public', { dotfiles: 'allow' }));

const port = process.env.PORT || 4800;

// Start server only after database connection is established
async function startServer() {
  try {
    // Connect to database first
    await connectToDatabase();

    // Ensure categories exist in DB before serving requests
    try {
      const { ensureCategoriesSeeded } = require('./utils/seeders/ensureCategories');
      const result = await ensureCategoriesSeeded();
      console.log(`[SEED] Categories ensured. created=${result.created}, total=${result.total}`);
    } catch (seedErr) {
      console.warn('[SEED] Failed to ensure categories:', seedErr.message);
    }

    // Ensure guest user exists for guest login
    try {
      const { ensureGuestUser } = require('./scripts/seedGuestUser');
      const guestResult = await ensureGuestUser();
      console.log(`[SEED] Guest user ensured. created=${guestResult.created}`);
    } catch (seedErr) {
      console.warn('[SEED] Failed to ensure guest user:', seedErr.message);
    }

    // Create HTTP server
    const server = http.createServer(app);

    // Socket.io setup
    socketSetup(server);

    // Start cron jobs (only in production to avoid duplicate notifications from dev servers)
    if (process.env.NODE_ENV === 'production') {
      const { startStaleOrderReminders } = require('./cron/staleOrderReminders');
      const { startOrderExpiry } = require('./cron/orderExpiry');
      startStaleOrderReminders();
      startOrderExpiry();
      console.log('⏰ Cron jobs started (production mode)');
    } else {
      console.log('⏰ Cron jobs SKIPPED (non-production mode)');
    }

    // Start listening
    server.listen(port, () => {
      console.log('🚀 Server listening on port', port);
      console.log('✅ All services initialized successfully');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
