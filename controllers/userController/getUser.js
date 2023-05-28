const mongoose = require('mongoose');

// Models
const User = mongoose.model('user');

const getUser = (req, res) => {
  const errors = {};
  User.findById(req.user._id)
    .then((user) => {
      const {password, ...userData}  = user?._doc
      res.json({
        user: userData,
        success: true
      });
    })
    .catch((err) => {
      errors.error = 'Error checking for the user in the database';
      res.status(500).json({ ...errors, ...err });
    });
};


module.exports = getUser;