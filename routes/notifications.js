const express = require('express');
const router = express.Router();
const passport = require('passport');
const notificationController = require('../controllers/notificationController');

// Route to get user notifications
router.get('/', 
  passport.authenticate('jwt', { session: false }),
  notificationController.getNotifications
);

// Route to mark a notification as read or mark all as read
router.put('/:notificationId/read', 
  passport.authenticate('jwt', { session: false }),
  notificationController.markNotificationAsRead
);

// Route to mark all notifications as read
router.put('/read-all', 
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    req.body.markAll = true;
    notificationController.markNotificationAsRead(req, res);
  }
);

module.exports = router; 