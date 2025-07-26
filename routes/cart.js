const express = require('express');
const passport = require('passport');
const router = express.Router();

const cartController = require('../controllers/cartController');

// @route  GET api/cart
// @desc   Get user's cart
// @access Private
router.get('/',
  passport.authenticate('jwt', { session: false }),
  cartController.getCart
);

// @route  POST api/cart/add
// @desc   Add item to cart
// @access Private
router.post('/add',
  passport.authenticate('jwt', { session: false }),
  cartController.addItemToCart
);

// @route  POST api/cart/update
// @desc   Update item quantity in cart
// @access Private
router.post('/update',
  passport.authenticate('jwt', { session: false }),
  cartController.updateCartItem
);

// @route  POST api/cart/remove
// @desc   Remove item from cart
// @access Private
router.post('/remove',
  passport.authenticate('jwt', { session: false }),
  cartController.removeItemFromCart
);

// @route  POST api/cart/clear
// @desc   Clear entire cart
// @access Private
router.post('/clear',
  passport.authenticate('jwt', { session: false }),
  cartController.clearCart
);

// @route  POST api/cart/checkout
// @desc   Checkout cart and create order
// @access Private
router.post('/checkout',
  passport.authenticate('jwt', { session: false }),
  cartController.checkoutCart
);

module.exports = router;
