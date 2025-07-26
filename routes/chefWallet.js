const express = require('express');
const passport = require('passport');
const router = express.Router();

const chefWalletController = require('../controllers/chefWalletController');

// @route  GET api/chef-wallet/info/:chefId?
// @desc   Get chef wallet information
// @access Private
router.get('/info/:chefId?',
  passport.authenticate('jwt', { session: false }),
  chefWalletController.getWalletInfo
);

// @route  POST api/chef-wallet/payment
// @desc   Process payment to platform
// @access Private
router.post('/payment',
  passport.authenticate('jwt', { session: false }),
  chefWalletController.processPayment
);

// @route  GET api/chef-wallet/payment-required
// @desc   Check if payment is required
// @access Private
router.get('/payment-required',
  passport.authenticate('jwt', { session: false }),
  chefWalletController.checkPaymentRequired
);

module.exports = router;