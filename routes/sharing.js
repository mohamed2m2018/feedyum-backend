const express = require('express');
const passport = require('passport');
const router = express.Router();

const sharingController = require('../controllers/sharingController');

// @route  POST api/sharing/generate-link
// @desc   Generate shareable links for content (reels, profiles, menus, etc.)
// @access Private
router.post('/generate-link',
  passport.authenticate('jwt', { session: false }),
  sharingController.generateShareLink
);

// @route  GET /reel/:contentId
// @desc   Web fallback for reel deep links
// @access Public
router.get('/reel/:contentId', (req, res) => {
  req.params.type = 'reel';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /story/:contentId
// @desc   Web fallback for story deep links
// @access Public
router.get('/story/:contentId', (req, res) => {
  req.params.type = 'story';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /review-reel/:contentId
// @desc   Web fallback for review reel deep links
// @access Public
router.get('/review-reel/:contentId', (req, res) => {
  req.params.type = 'reviewReel';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /profile/:contentId
// @desc   Web fallback for profile deep links
// @access Public
router.get('/profile/:contentId', (req, res) => {
  req.params.type = 'profile';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /user/:contentId
// @desc   Web fallback for user profile deep links
// @access Public
router.get('/user/:contentId', (req, res) => {
  req.params.type = 'userProfile';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /u/:contentId
// @desc   Web fallback for username profile deep links
// @access Public
router.get('/u/:contentId', (req, res) => {
  req.params.type = 'profileByUsername';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /chef/:contentId
// @desc   Web fallback for chef profile deep links
// @access Public
router.get('/chef/:contentId', (req, res) => {
  req.params.type = 'chefProfile';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /chef/:contentId/menu
// @desc   Web fallback for chef menu deep links
// @access Public
router.get('/chef/:contentId/menu', (req, res) => {
  req.params.type = 'chefMenu';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /menu/:contentId
// @desc   Web fallback for menu deep links
// @access Public
router.get('/menu/:contentId', (req, res) => {
  req.params.type = 'menu';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /menu/:menuId/item/:contentId
// @desc   Web fallback for menu item deep links
// @access Public
router.get('/menu/:menuId/item/:contentId', (req, res) => {
  req.params.type = 'menuItem';
  req.params.menuId = req.params.menuId; // Pass menu ID as additional param
  sharingController.generateWebFallback(req, res);
});

// @route  GET /dish/:contentId
// @desc   Web fallback for dish deep links
// @access Public
router.get('/dish/:contentId', (req, res) => {
  req.params.type = 'dish';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /discover
// @desc   Web fallback for discover deep links
// @access Public
router.get('/discover/:contentId?', (req, res) => {
  req.params.type = req.params.contentId ? 'discoverCategory' : 'discover';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /trending
// @desc   Web fallback for trending deep links
// @access Public
router.get('/trending', (req, res) => {
  req.params.type = 'trending';
  req.params.contentId = null;
  sharingController.generateWebFallback(req, res);
});

// @route  GET /search/:contentId
// @desc   Web fallback for search deep links
// @access Public
router.get('/search/:contentId?', (req, res) => {
  req.params.type = req.params.contentId ? 'searchResults' : 'search';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /hashtag/:contentId
// @desc   Web fallback for hashtag deep links
// @access Public
router.get('/hashtag/:contentId', (req, res) => {
  req.params.type = 'hashtag';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /live/:contentId
// @desc   Web fallback for live stream deep links
// @access Public
router.get('/live/:contentId?', (req, res) => {
  req.params.type = req.params.contentId ? 'live' : 'liveStream';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /post/:contentId
// @desc   Web fallback for post deep links
// @access Public
router.get('/post/:contentId', (req, res) => {
  req.params.type = 'post';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /sound/:contentId
// @desc   Web fallback for sound deep links
// @access Public
router.get('/sound/:contentId', (req, res) => {
  req.params.type = 'sound';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /order/:contentId/track
// @desc   Web fallback for order tracking deep links
// @access Public
router.get('/order/:contentId/track', (req, res) => {
  req.params.type = 'orderTracking';
  sharingController.generateWebFallback(req, res);
});

// @route  GET /chat/:contentId
// @desc   Web fallback for chat deep links
// @access Public
router.get('/chat/:contentId?', (req, res) => {
  req.params.type = req.params.contentId ? 'chat' : 'chatList';
  sharingController.generateWebFallback(req, res);
});

module.exports = router; 