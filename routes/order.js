const express = require('express');
const passport = require('passport');
const router = express.Router();

const orderController = require('../controllers/orderController');
const checkChefPaymentStatus = require('../middleware/checkChefPaymentStatus');

// @route  POST api/orders
// @desc   Create a new order
// @access Private
router.post('/',
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

// @route  GET api/orders/:id
// @desc   Get a single order by ID
// @access Private
router.get('/:id',
  passport.authenticate('jwt', { session: false }),
  orderController.getOrderById
);

// @route  PUT api/orders/:id/status
// @desc   Update order status
// @access Private
router.put('/:id/status',
  passport.authenticate('jwt', { session: false }),
  checkChefPaymentStatus,
  orderController.updateOrderStatus
);

module.exports = router;
