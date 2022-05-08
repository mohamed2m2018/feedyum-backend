const mongoose = require('mongoose');

// Models
const User = mongoose.model('user');

module.exports = deleteUser = (req, res) => {
  const errors = {};

  User.findByIdAndRemove(req.user._id)
    .catch((err) => {
      errors.error = 'Error checking for the user in database';
      return res.status(500).json({ ...errors, ...err });
    });
};
