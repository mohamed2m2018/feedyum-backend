const bodyParser = require('body-parser');
const express = require('express');
const passport = require('passport');


const app = express();

// Models
require('./models/loadModels');

// DB Connect
require('./config/dbConnect');

// BodyParser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// Passport Config
app.use(passport.initialize());
require('./config/passport')(passport);

// Cross Origin Problem
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  next();
});

// Routes
app.use('/api/user', require('./routes/user'));

const port = process.env.PORT || 4800;

app.listen(port, () =>
  console.log(`Server started on port ${port}`)
);