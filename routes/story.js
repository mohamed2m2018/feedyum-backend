const express = require('express');
const passport = require('passport');

const router = express.Router();

const storyController = require('../controllers/storyController');


// @route  POST api/user/add_story
// @desc   User Signup - Create new story
// @access Public
// @body   isFacebookEntry(optional) facebookId(optional)
router.post('/add_story',
    passport.authenticate('jwt', { session: false }),
    storyController.addStory);




// @route  GET api/story/stories
// @desc   Get all stories
// @access Public

router.get('/stories', storyController.getStories );



// @route  GET api/story/search
// @desc   Get all stories
// @access Public

router.get('/search', storyController.searchStories );



// @route  delete api/story/stories
// @desc   delete all stories
// @access Public

router.delete('/stories', storyController.deleteStories );


// @route  GET api/story/author
// @desc   Get story by User ID
// @access Public

router.get('/author', storyController.getStoriesByUserId);


// @route  GET api/story/following
// @desc   Get story for following
// @access Public

router.get('/following', storyController.getFollowingStories);


// @route  GET api/story/categories
// @desc   Get stories based on category
// @access Public

router.get('/categories', storyController.getSubscribedCategoriesStories);

// @route  GET api/story/:id
// @desc   Get story by ID
// @access Public

router.get('/:id', storyController.getStoryById);

// @route  PATCH api/story
// @desc   Update logged in user
// @access Private
// @errors first_name last_name email password password2 location error
router.patch(
    '/update_story',
    passport.authenticate('jwt', { session: false }),
    storyController.updateStory,
  );


module.exports = router;