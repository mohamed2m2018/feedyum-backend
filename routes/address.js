const express = require("express");
const passport = require("passport");

const router = express.Router();

const addressController = require("../controllers/addressController");

// @route  POST api/address/add_address
// @desc   add address
// @access Private
router.post(
  "/add_address",
  passport.authenticate("jwt", { session: false }),
  addressController.addAddress
);

// @route  PUT api/address/edit_address
// @desc   edit address
// @access Private
router.put(
  "/edit_address",
  passport.authenticate("jwt", { session: false }),
  addressController.editAddress
);

// @route  GET api/address/
// @desc   Get cart
// @access Private

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  addressController.getAddresses
);

// @route  DELETE api/address/
// @desc   DELETE address
// @access Private

router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  addressController.removeAddress
);

// @route  POST api/address/current_location
// @desc   Set current location as delivery address
// @access Private
router.post(
  "/current_location",
  passport.authenticate("jwt", { session: false }),
  addressController.setCurrentLocation
);

// @route  POST api/address/geocode
// @desc   Reverse geocode coordinates to address
// @access Private
router.post(
  "/geocode",
  passport.authenticate("jwt", { session: false }),
  addressController.geocodeAddress
);

module.exports = router;
