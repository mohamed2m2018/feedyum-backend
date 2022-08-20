const express = require('express');
const passport = require('passport');

const router = express.Router();

const orderController = require('../controllers/OrderController');


// @route  POST api/orders/add_order
// @desc   add order
// @access Private
router.post('/add_order',
    passport.authenticate('jwt', { session: false }),
    orderController.addOrder);

// @route  put api/orders/edit_order
// @desc   edit order
// @access Private
router.put('/edit_order',
    passport.authenticate('jwt', { session: false }),
    orderController.editOrder);


// @route  GET api/order/
// @desc   Get orders
// @access Private

router.get('/', passport.authenticate('jwt', { session: false }), orderController.getOrders );



// @route  GET api/order/past
// @desc   Get orders
// @access Private

router.get('/past', passport.authenticate('jwt', { session: false }), orderController.getPastOrders );


// @route  GET api/order/upcoming
// @desc   Get orders
// @access Private

router.get('/upcoming', passport.authenticate('jwt', { session: false }), orderController.getUpcomingOrders );


module.exports = router;