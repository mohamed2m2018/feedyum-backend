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

AdminJS.registerAdapter(AdminJSMongoose);

// Models
require("./models/loadModels");

const app = express();

// Connect to MongoDB with optimized connection settings
mongoose
  .connect(mongoURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds
    bufferCommands: false, // Disable mongoose buffering
  })
  .then(mongooseDb => {
    console.log("MongoDB Connected");

    // Initialize AdminJS
    try {
      const adminJS = new AdminJS({
        databases: [mongooseDb],
        rootPath: "/shoman-salah-not-expected",
      });
      const adminJSRouter = AdminJSExpress.buildRouter(adminJS);
      app.use(adminJS.options.rootPath, adminJSRouter);
    } catch (err) {
      console.log(err);
    }
  })
  .catch(err => console.log("Error connecting to database", err));

// Performance monitoring middleware
const performanceMonitor = require('./middleware/performance');
const timeout = require('./middleware/timeout');

app.use(performanceMonitor);
app.use(timeout(30000)); // 30 second timeout

// BodyParser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

// Routes
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

// Add the new routes here
app.use("/api/menus", require("./routes/menu"));
app.use("/api/dishes", require("./routes/dish"));
app.use("/api/sections", require("./routes/section"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/promocode", require("./routes/promocode"));
app.use("/api/chef-wallet", require("./routes/chefWallet"));
app.use("/api/reviews", require("./routes/review"));
app.use("/api/favorites", require("./routes/favorites"));

app.get('/post/:any', (req, res) => {
  res.redirect('/index.html');
});

app.use(express.static(__dirname + '/public', { dotfiles: 'allow' }));

const port = process.env.PORT || 4800;

const server = http.createServer(app);

// Socket.io setup
socketSetup(server);

server.listen(port, () => {
  console.log('listening on ', port);
});
