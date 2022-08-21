const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");

module.exports = getCartItems = (req, res) => {
  const errors = {};
  //lean() make you able to get rid of _doc
  //populate() make you able to populate all fields for story given its id
  User.findOne({ _id: req.user._id }).populate('cart.story').lean().exec((err, user) => {
    if (err) {
      errors.error = "Error checking for the cart in the database";
      return res.status(500).json({ ...errors, ...err });
    }
    if (!user.cart)
      return res.status(200).json({
        cart: [],
      });
    res.json({
      cart: user.cart,
      success: true,
    });
  });
};
