const mongoose = require("mongoose");

// Models
const Cart = mongoose.model("cart");

module.exports = removeCart = (req, res) => {
  const errors = {};
  User.findByIdAndUpdate(
    { _id: req.user._id.toString() },
    {
      cart: [],
    },
    { new: true }
  )
    .then((user) =>
      res.json({
        cart: user.cart,
        success: true,
      })
    )
    .catch((err) => {
      errors.error = "Error checking for the user in the database";
      res.status(500).json({ ...errors, ...err });
    });
};
