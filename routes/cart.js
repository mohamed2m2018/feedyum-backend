const express = require('express');
const passport = require('passport');

const router = express.Router();

const cartController = require('../controllers/cartController');


// @route  POST api/cart/add_to_cart
// @desc   add to cart
// @access Public
router.post('/add_to_cart',
    passport.authenticate('jwt', { session: false }),
    cartController.addToCart);




// @route  GET api/cart/
// @desc   Get cart
// @access Public

router.get('/', passport.authenticate('jwt', { session: false }), cartController.getCartItems );

module.exports = router;