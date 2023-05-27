const express = require('express');
const passport = require('passport');

const router = express.Router();

const followController = require('../controllers/followController');

// @route  POST api/user/follow/:userToFollow
// @desc   Follow a user
// @access Private
router.post('/',
  passport.authenticate('jwt', { session: false }),
  followController.followUser
);

// @route  DELETE api/user/unfollow/:userToUnfollow
// @desc   Unfollow a user
// @access Private
router.delete('/',
  passport.authenticate('jwt', { session: false }),
  followController.unfollowUser
);

module.exports = router;