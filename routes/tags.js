const express = require('express');
const passport = require('passport');

const router = express.Router();

const tagsController = require('../controllers/tagsController');

// @route  POST api/tags/
// @desc   Like a story
// @access Private
router.get('/',
  passport.authenticate('jwt', { session: false }),
  tagsController.getTags,
);

module.exports = router;