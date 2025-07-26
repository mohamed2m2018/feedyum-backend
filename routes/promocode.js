const express = require('express');
const passport = require('passport');
const router = express.Router();

const promocodeController = require('../controllers/promocodeController');

// @route  POST api/promocode/validate
// @desc   Validate a promocode
// @access Private
router.post('/validate',
  passport.authenticate('jwt', { session: false }),
  promocodeController.validatePromocode
);

// @route  POST api/promocode/create
// @desc   Create a new promocode (admin only)
// @access Private
router.post('/create',
  passport.authenticate('jwt', { session: false }),
  promocodeController.createPromocode
);

// @route  GET api/promocode/my-codes
// @desc   Get user's promocodes
// @access Private
router.get('/my-codes',
  passport.authenticate('jwt', { session: false }),
  promocodeController.getUserPromocodes
);

// @route  DELETE api/promocode/delete/:id
// @desc   Delete a promocode
// @access Private
router.delete('/delete/:id',
  passport.authenticate('jwt', { session: false }),
  promocodeController.deletePromocode
);

module.exports = router;