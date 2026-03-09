const express = require('express');
const passport = require('passport');

const router = express.Router();

const userController = require('../controllers/userController/index.js');
const optionalAuth = require('../middleware/optionalAuth');
const { authLimiter, searchLimiter } = require('../middleware/rateLimit');

// @route  GET api/user/all
// @desc   Get all users
// @access Private
// @errors nousers error
router.get('/all', passport.authenticate('jwt', { session: false }), userController.getAllUsers);


// @route  GET api/user/search
// @desc   search users
// @access Private
// @errors nousers error
router.get('/search', passport.authenticate('jwt', { session: false }), userController.searchUser);

// @route  GET api/user/semantic-search
// @desc   Semantic search users (with AI embeddings)
// @access Private
router.get('/semantic-search', searchLimiter, passport.authenticate('jwt', { session: false }), userController.semanticSearchUser);

// @route  POST api/user/check-availability
// @desc   Check if email/phone are available for registration
// @access Public
router.post('/check-availability', userController.checkAvailability);

// @route  POST api/user/upload-profile-picture
// @desc   Upload profile picture during registration (public, no auth required)
// @access Public
router.post('/upload-profile-picture', userController.uploadProfilePicture);

// @route  POST api/user
// @desc   User Signup - Create new user
// @access Public (Rate limited to prevent abuse)
// @errors first_name last_name email password password2 location error
// @body   isFacebookEntry(optional) facebookId(optional)
router.post('/', authLimiter, userController.signupUser);

// @route  POST api/user/login
// @desc   User Login - Return jwt token
// @access Public (Rate limited to prevent brute force)
// @errors incorrectinfo email password error
// @body   isFacebookEntry(optional) facebookId(optional)
router.post('/login', authLimiter, userController.loginUser);

// @route  POST api/user/forgot-password
// @desc   Request password reset email
// @access Public (Rate limited)
router.post('/forgot-password', authLimiter, userController.forgotPassword);

// @route  POST api/user/reset-password
// @desc   Reset password using token from email
// @access Public (Rate limited)
router.post('/reset-password', authLimiter, userController.resetPassword);

// @route  GET api/user/reset-password
// @desc   Redirect page that opens the app via deep link
// @access Public
router.get('/reset-password', (req, res) => {
  const { token, email } = req.query;
  const deepLink = `feedyum://reset-password?token=${encodeURIComponent(token || '')}&email=${encodeURIComponent(email || '')}`;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - FeedYum</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); }
        .container { background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        h1 { color: #FF6B35; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
        .btn { display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); color: white; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .btn:hover { opacity: 0.9; }
        .note { font-size: 14px; color: #999; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍽️ FeedYum</h1>
        <p>Tap the button below to open the app and reset your password.</p>
        <a href="${deepLink}" class="btn">Open FeedYum App</a>
        <p class="note">If the app doesn't open, make sure FeedYum is installed on your device.</p>
      </div>
      <script>
        // Auto-redirect to app
        setTimeout(function() {
          window.location.href = "${deepLink}";
        }, 500);
      </script>
    </body>
    </html>
  `);
});

// @route  PATCH api/user
// @desc   Update logged in user
// @access Private
// @errors first_name last_name email password password2 location error
router.patch(
  '/',
  passport.authenticate('jwt', { session: false }),
  userController.updateUser
);

// @route  POST api/user/request-deletion
// @desc   Public account deletion request (for Play Store compliance)
// @access Public (verifies email + password)
router.post('/request-deletion', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const User = mongoose.model('user');

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password / بريد إلكتروني أو كلمة مرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password / بريد إلكتروني أو كلمة مرور غير صحيحة' });
    }

    // Delete user and all associated data
    const userId = user._id;
    const models = ['story', 'comment', 'like', 'follow', 'message', 'order', 'cart', 'review', 'notification', 'favorite'];
    for (const modelName of models) {
      try {
        const Model = mongoose.model(modelName);
        await Model.deleteMany({ $or: [{ user: userId }, { userId }, { sender: userId }, { receiver: userId }] });
      } catch (e) { /* model may not exist, skip */ }
    }

    await User.findByIdAndDelete(userId);

    console.log(`[DELETION] Account deleted via web form: ${email}`);
    return res.json({ message: 'Your account and all associated data have been deleted. / تم حذف حسابك وجميع البيانات المرتبطة به.' });
  } catch (error) {
    console.error('[DELETION] Error:', error.message);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

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
// @access Public (with optional auth for personalized data like follow status)
// @errors
router.get('/:id', optionalAuth, userController.getUserById);

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