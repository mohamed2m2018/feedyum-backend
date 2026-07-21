const express = require('express');
const passport = require('passport');
const router = express.Router();

const authenticateUser = passport.authenticate('jwt', { session: false });
const {
  getWalletInfo,
  getEarningsHistory,
  getDashboardStats,
  transferToWallet,
} = require('../controllers/ambassadorWalletController');

// @route  GET api/ambassador-wallet/info
// @desc   Get ambassador wallet information
// @access Private
router.get('/info', authenticateUser, getWalletInfo);

// @route  GET api/ambassador-wallet/earnings
// @desc   Get earnings history with pagination and optional grouping
// @access Private
router.get('/earnings', authenticateUser, getEarningsHistory);

// @route  GET api/ambassador-wallet/dashboard
// @desc   Get ambassador dashboard stats
// @access Private
router.get('/dashboard', authenticateUser, getDashboardStats);

// @route  POST api/ambassador-wallet/transfer-to-wallet
// @desc   Transfer balance from ambassador wallet to app wallet
// @access Private
router.post('/transfer-to-wallet', authenticateUser, transferToWallet);

module.exports = router;
