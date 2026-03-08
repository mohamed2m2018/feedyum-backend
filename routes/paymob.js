const express = require('express');
const passport = require('passport');
const router = express.Router();

const paymobController = require('../controllers/paymobController');

// @route  POST api/paymob/create-intention
// @desc   Create a Paymob payment intention for wallet top-up
// @access Private
router.post('/create-intention',
    passport.authenticate('jwt', { session: false }),
    paymobController.createPaymentIntention
);

// @route  POST api/paymob/callback
// @desc   Handle Paymob transaction callback (called by Paymob servers)
// @access Public (verified via HMAC)
router.post('/callback', paymobController.handleCallback);

// @route  GET api/paymob/redirect
// @desc   Handle redirect after Paymob checkout (user returns)
// @access Public
router.get('/redirect', paymobController.handleRedirect);

// @route  GET api/paymob/verify/:transactionId
// @desc   Verify a payment transaction status
// @access Private
router.get('/verify/:transactionId',
    passport.authenticate('jwt', { session: false }),
    paymobController.verifyPayment
);

module.exports = router;
