const express = require('express');
const passport = require('passport');

const router = express.Router();

const orderController = require('../controllers/OrderController');


// @route  POST api/orders/add_order
// @desc   add order
// @access Public
router.post('/add_order',
    passport.authenticate('jwt', { session: false }),
    orderController.addOrder);


// @route  GET api/order/
// @desc   Get orders
// @access Public

router.get('/', passport.authenticate('jwt', { session: false }), orderController.getOrders );



module.exports = router;