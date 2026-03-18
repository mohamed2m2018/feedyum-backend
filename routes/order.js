const express = require('express');
const passport = require('passport');
const router = express.Router();

const orderController = require('../controllers/orderController');
const checkChefPaymentStatus = require('../middleware/checkChefPaymentStatus');
const { orderLimiter } = require('../middleware/rateLimit');

// @route  POST api/orders
// @desc   Create a new order
// @access Private (Rate limited to prevent order spam)
router.post('/',
  orderLimiter,
  passport.authenticate('jwt', { session: false }),
  orderController.createOrder
);

// @route  GET api/orders/user
// @desc   Get all orders for the current authenticated user
// @access Private
router.get('/user',
  passport.authenticate('jwt', { session: false }),
  orderController.getCurrentUserOrders
);

// @route  GET api/orders/user/:userId
// @desc   Get all orders for a user
// @access Private
router.get('/user/:userId',
  passport.authenticate('jwt', { session: false }),
  orderController.getOrdersByUser
);

// @route  GET api/orders/chef/stats
// @desc   Get aggregated stats for chef dashboard
// @access Private
router.get('/chef/stats',
  passport.authenticate('jwt', { session: false }),
  orderController.getChefDashboardStats
);

// @route  GET api/orders/chef/analytics
// @desc   Get detailed analytics for chef
// @access Private
router.get('/chef/analytics',
  passport.authenticate('jwt', { session: false }),
  orderController.getChefAnalytics
);

// @route  GET api/orders/chef/:chefId
// @desc   Get all orders for a chef
// @access Private
router.get('/chef/:chefId',
  passport.authenticate('jwt', { session: false }),
  orderController.getOrdersByChef
);

// @route  PUT api/orders/:id/status
// @desc   Update order status
// @access Private
router.put('/:id/status',
  passport.authenticate('jwt', { session: false }),
  checkChefPaymentStatus,
  orderController.updateOrderStatus
);

// @route  PUT api/orders/:id/cancel
// @desc   Cancel order by user (only when status is pending/confirmed)
// @access Private
router.put('/:id/cancel',
  passport.authenticate('jwt', { session: false }),
  orderController.cancelOrderByUser
);

// @route  PUT api/orders/:id/confirm
// @desc   Confirm order by user (only when status is awaiting_confirmation)
// @access Private
router.put('/:id/confirm',
  passport.authenticate('jwt', { session: false }),
  orderController.confirmOrderByUser
);

// @route  PUT api/orders/:id/confirm-deposit
// @desc   Chef confirms deposit received for an order
// @access Private
router.put('/:id/confirm-deposit',
  passport.authenticate('jwt', { session: false }),
  orderController.confirmDepositReceived
);

// @route  GET api/orders/unseen/count
// @desc   Get count of orders with unseen status changes
// @access Private
router.get('/unseen/count',
  passport.authenticate('jwt', { session: false }),
  orderController.getUnseenOrderCount
);

// @route  GET api/orders/available-slots/:chefId
// @desc   Get available scheduling time slots for a chef
// @access Public (no auth required for browsing)
router.get('/available-slots/:chefId',
  orderController.getAvailableSlots
);

// @route  GET api/orders/check-delivery/:chefId
// @desc   Check if a kitchen delivers to a given location
// @access Public (no auth required for menu browsing)
router.get('/check-delivery/:chefId',
  orderController.checkDeliveryEligibility
);

// @route  GET api/orders/:id
// @desc   Get a single order by ID
// @access Private
router.get('/:id',
  passport.authenticate('jwt', { session: false }),
  orderController.getOrderById
);

// @route  PUT api/orders/:orderId/seen
// @desc   Mark an order as seen by current user
// @access Private
router.put('/:orderId/seen',
  passport.authenticate('jwt', { session: false }),
  orderController.markOrderSeen
);

module.exports = router;

