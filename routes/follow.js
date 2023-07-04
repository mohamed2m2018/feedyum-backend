const express = require('express');
const passport = require('passport');

const router = express.Router();

const followController = require('../controllers/followController');

// @route  POST api/follow/:userToFollow
// @desc   Follow a user
// @access Private
router.post('/',
  passport.authenticate('jwt', { session: false }),
  followController.followUser
);

router.get('/followers',
  passport.authenticate('jwt', { session: false }),
  followController.getFollowers
);


router.get('/following',
  passport.authenticate('jwt', { session: false }),
  followController.getFollowing
);

// @route  DELETE api/follow/:userToUnfollow
// @desc   Unfollow a user
// @access Private
router.delete('/',
  passport.authenticate('jwt', { session: false }),
  followController.unfollowUser
);

router.get('/statistics/:userId',
  followController.getStatisticsbyUser
);

module.exports = router;