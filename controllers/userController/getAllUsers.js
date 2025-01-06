const mongoose = require('mongoose');

// Models
const User = mongoose.model('user');


const getAllUsers = (req, res) => {
  const errors = {};
  User.find()
    .sort({ date: -1 })
    .then((users) => {
      if (users.length === 0) {
        return res.json([]);
      }
      users = users.map((user) => {
        const {password, ...userData}  = user?._doc
        return userData;
      });
      return res.json(users);
    })
    .catch((err) => {
      errors.error = 'Error fetching users from database';
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = getAllUsers;
