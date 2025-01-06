const mongoose = require('mongoose');

// Models
const User = mongoose.model('user');

 const deleteUser = (req, res) => {
  const errors = {};

  User.findByIdAndRemove(req.user._id)
    .catch((err) => {
      errors.error = 'Error checking for the user in database';
      return res.status(500).json({ ...errors, ...err });
    });
};

module.exports = deleteUser;
