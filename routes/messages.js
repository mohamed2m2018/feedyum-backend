const express = require('express');
const router = express.Router();
const passport = require('passport');

const messagesController = require('../controllers/messagesController');

// @route   GET /api/messages/chat-list
// @desc    Get chat list for current user
// @access  Private
router.get(
  '/chat-list',
  passport.authenticate('jwt', { session: false }),
  messagesController.getChatList
);

// @route   GET /api/messages/conversation
// @desc    Get messages between current user and another user
// @access  Private
router.get(
  '/conversation',
  passport.authenticate('jwt', { session: false }),
  messagesController.getMessages
);

// @route   POST /api/messages/send
// @desc    Send a message to another user
// @access  Private
router.post(
  '/send',
  passport.authenticate('jwt', { session: false }),
  messagesController.sendMessage
);

// @route   POST /api/messages/upload-audio
// @desc    Upload audio file for voice messages
// @access  Private
router.post(
  '/upload-audio',
  passport.authenticate('jwt', { session: false }),
  messagesController.uploadAudio
);

// @route   POST /api/messages/upload-image
// @desc    Upload image file for chat messages
// @access  Private
router.post(
  '/upload-image',
  passport.authenticate('jwt', { session: false }),
  messagesController.uploadImage
);

// @route   PUT /api/messages/:messageId/edit
// @desc    Edit a message
// @access  Private
router.put(
  '/:messageId/edit',
  passport.authenticate('jwt', { session: false }),
  messagesController.editMessage
);

module.exports = router; 