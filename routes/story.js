const express = require("express");
const passport = require("passport");

const router = express.Router();

const storyController = require("../controllers/storyController");

// @route  POST api/user/add_story
// @desc   User Signup - Create new story
// @access Public
// @body   isFacebookEntry(optional) facebookId(optional)
router.post(
  "/add_story",
  passport.authenticate("jwt", { session: false }),
  storyController.addStory
);

router.post(
  "/report_story", storyController.reportStory
);

// @route  GET api/story/stories
// @desc   Get all stories
// @access Public

router.get("/stories", passport.authenticate("jwt", { session: false }), storyController.getStories);

// @route  GET api/story/search
// @desc   Get all stories
// @access Public

router.get("/search", storyController.searchStories);

// @route  delete api/story/stories
// @desc   delete all stories
// @access private

router.delete("/stories", storyController.deleteStories);

router.delete(
  "/deleteById/:id",
  passport.authenticate("jwt", { session: false }),
  storyController.deleteStoryById
);

// @route  GET api/story/author
// @desc   Get story by User ID
// @access private

router.get("/author",
passport.authenticate("jwt", { session: false }),
storyController.getStoriesByUserId);

// @route  GET api/story/following
// @desc   Get story for following
// @access Public

router.get("/following", storyController.getFollowingStories);

// @route  GET api/story/categories
// @desc   Get stories based on category
// @access Public

router.get("/categories", storyController.getSubscribedCategoriesStories);

// @route  GET api/story/reviews
// @desc   Get stories based on revies
// @access Public

router.get("/reviews", storyController.getReviewsStories);

// @route  GET api/story/:id
// @desc   Get story by ID
// @access Public

router.get("/:id", passport.authenticate("jwt", { session: false }),
storyController.getStoryById);

// @route  PATCH api/story
// @desc   Update logged in user
// @access Private
// @errors first_name last_name email password password2 location error
router.patch(
  "/update_story",
  passport.authenticate("jwt", { session: false }),
  storyController.updateStory
);

// @route  POST api/story/create-review-reel
// @desc   Create a review reel for a dish or menu
// @access Private
router.post(
  "/create-review-reel",
  passport.authenticate("jwt", { session: false }),
  storyController.createReviewReel
);

// @route  GET api/story/reviews/dish/:dishId
// @desc   Get review stories for a specific dish
// @access Public
router.get(
  "/reviews/dish/:dishId",
  storyController.getReviewStoriesByDish
);

module.exports = router;
