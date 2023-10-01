const mongoose = require('mongoose');

// Models
const User = mongoose.model('user');
const Follow = mongoose.model('follow');



const getUserById = async (req, res) => {
  const errors = {};
  User.findById(req.params.id).populate('locations')
    .then(async (user) => {
      const {password, ...userData}  = user._doc
      const currentUserFollowed = await Follow.exists({ follower_id: req.query?.currentUser?._id, following_id: userData?._id });
      res.json({
        user: userData,
        currentUserFollowed: Boolean(currentUserFollowed),
        success: true
      });
    })
    .catch((err) => {
      errors.error = 'Error checking for the user in the database';
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = getUserById;
