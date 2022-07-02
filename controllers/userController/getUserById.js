const mongoose = require('mongoose');

// Models
const User = mongoose.model('user');

module.exports = getUserById = (req, res) => {
  const errors = {};
  User.findById(req.params.id)
    .then((user) => {
      const {password, ...userData}  = user
      res.json({
        user: userData?._doc,
        success: true
      });
    })
    .catch((err) => {
      errors.error = 'Error checking for the user in the database';
      res.status(500).json({ ...errors, ...err });
    });
};
