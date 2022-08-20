const bodyParser = require("body-parser");
const express = require("express");
const passport = require("passport");
const AdminJS = require("adminjs");
const mongoose = require("mongoose");
const mongoURI = require("./config/keys").mongoURI;
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");

AdminJS.registerAdapter(AdminJSMongoose);


//connecting to db
mongoose
  .connect(mongoURI, { useCreateIndex: true, useNewUrlParser: true })
  .then((mongooseDb) => {
    console.log("MongoDB Connected");
    // init adminJS
   let  adminJS = new AdminJS({
      databases: [mongooseDb],
      rootPath: "/admin",
    });
    const adminJSRouter = AdminJSExpress.buildRouter(adminJS);
    app.use(adminJS.options.rootPath, adminJSRouter);
  })
  .catch((err) => console.log("Error connecting to database", err));

const app = express();

// Models
require("./models/loadModels");


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

app.use("/api/cart", require("./routes/cart"));

app.use("/api/story", require("./routes/story"));

app.use("/api/orders", require("./routes/orders"));

app.use("/api/categories", require("./routes/categories"));


const port = process.env.PORT || 4800;

app.listen(port, () => console.log(`Server started on port ${port}`));
