const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');


// Models
const User = mongoose.model('user');

// Validations
const validateUser = require('../../validations/user');

module.exports = signupUser = (req, res) => {

  // Validate
  let { errors, isValid } = validateUser(req.body);

  if (!isValid) {
    throw res.status(400).json(errors);
  }

  // Check if there is a user with the same email
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user) {
        errors.email = 'Email already exists';
        return res.status(400).json(errors);
      }
      User.findOne({username: req.body.username}).then((user=>{
        if (user) {
          errors.username = 'username already exists';
          return res.status(400).json(errors);
        }
      }))

      // Create new user
      const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        type: req.body.type,
        password: req.body.password,
        phone: req.body.phone
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => {
                // JWT Payload
                const TokenPayload = {
                  _id: user._id,
                  email: user.email,
                };
                const {password, ...userData} = user;

              // Make JWT
              jwt.sign(
                TokenPayload,
                keys.secretOrKey,
                // { expiresIn: 604800 },
                (err, token) => {
                  return res.json({ user: userData, success: true, token: 'Bearer ' + token });
                }
              );
            })
            .catch((err) => {
              errors.error = 'Error saving user to database';
              res.status(500).json({ ...errors, ...err });
            });
        });
      });

    })
    .catch((err) => {
      errors.error = 'Error checking for the user in the database';
      res.status(500).json({ ...errors, ...err });
    });
};
