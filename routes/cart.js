const express = require('express');
const passport = require('passport');
const router = express.Router();

const cartController = require('../controllers/cartController');

// @route  POST api/cart/add
// @desc   Add item to cart
// @access Private
router.post('/add',
  passport.authenticate('jwt', { session: false }),
  cartController.addItemToCart
);

// @route  POST api/cart/remove
// @desc   Remove item from cart
// @access Private
router.post('/remove',
  passport.authenticate('jwt', { session: false }),
  cartController.removeItemFromCart
);

// @route  POST api/cart/checkout
// @desc   Convert cart to order
// @access Private
router.post('/checkout',
  passport.authenticate('jwt', { session: false }),
  cartController.checkoutCart
);

module.exports = router;
