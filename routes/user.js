const express = require('express');
const passport = require('passport');

const router = express.Router();

const userController = require('../controllers/userController/index.js');

// @route  GET api/user/all
// @desc   Get all users
// @access Public
// @errors nousers error
router.get('/all', userController.getAllUsers);


// @route  GET api/user/search
// @desc   search users
// @access Public
// @errors nousers error
router.get('/search', userController.searchUser);

// @route  POST api/user
// @desc   User Signup - Create new user
// @access Public
// @errors first_name last_name email password password2 location error
// @body   isFacebookEntry(optional) facebookId(optional)
router.post('/', userController.signupUser);

// @route  POST api/user/login
// @desc   User Login - Return jwt token
// @access Public
// @errors incorrectinfo email password error
// @body   isFacebookEntry(optional) facebookId(optional)
router.post('/login', userController.loginUser);

// @route  PATCH api/user
// @desc   Update logged in user
// @access Private
// @errors first_name last_name email password password2 location error
router.patch(
  '/',
  passport.authenticate('jwt', { session: false }),
  userController.updateUser
);

// @route  DELETE api/user
// @desc   Delete logged in user
// @access Private
// @errors error
router.delete(
  '/',
  passport.authenticate('jwt', { session: false }),
  userController.deleteUser
);

// @route  GET api/user
// @desc   Get logged in user
// @access Private
// @errors error
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  userController.getUser
);

router.get(
  '/location',
  passport.authenticate('jwt', { session: false }),
  userController.getAllLocations,
);

router.get(
  '/tag/:tag',
  userController.getUserByTag,
);

// @route  GET api/user/:id
// @desc   Get user by ID
// @access Public
// @errors
router.get('/:id', userController.getUserById);

// @route  GET api/user/:id/profile
// @desc   Get user profile with menu (if chef)
// @access Public
// @errors
router.get('/:id/profile', userController.getUserProfile);

// @route  GET api/user/chef/:chefId/profile
// @desc   Get chef profile with menu details
// @access Public
// @errors
router.get('/chef/:chefId/profile', userController.getChefProfile);


module.exports = router;