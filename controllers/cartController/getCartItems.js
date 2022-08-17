const mongoose = require("mongoose");

// Models
const Cart = mongoose.model("cart");

module.exports = getCartItems = (req, res) => {
  const errors = {};
  Cart.findOne({ owner: req.user._id }).populate('story').exec((err, cart) => {
    if (err) {
      errors.error = "Error checking for the cart in the database";
      return res.status(500).json({ ...errors, ...err });
    }
    if (!cart)
      return res.status(200).json({
        cart: [],
      });
    res.json({
      ...cart,
      success: true,
    });
  });
};
