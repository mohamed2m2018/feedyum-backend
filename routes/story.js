const express = require('express');
const passport = require('passport');

const router = express.Router();

const storyController = require('../controllers/storyController');


// @route  POST api/user/addStory
// @desc   User Signup - Create new story
// @access Public
// @body   isFacebookEntry(optional) facebookId(optional)
router.post('/addStory',
    passport.authenticate('jwt', { session: false }),
    storyController.addStory);




// @route  GET api/story/stories
// @desc   Get all stories
// @access Public

router.get('/stories', storyController.getStories );


// @route  GET api/user/story/:id
// @desc   Get story by ID
// @access Public
// @errors
// router.get('/story/:id', userController.getUserById);


// @route  GET api/stories/:userid
// @desc   Get story by User ID
// @access Public
// @errors
// router.get('/stories/:userid', userController.getUserById);


module.exports = router;