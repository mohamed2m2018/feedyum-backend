const mongoose = require("mongoose");

// Models
const Cart = mongoose.model("cart");

module.exports = removeCart = (req, res) => {
  const errors = {};
  Cart.findOneAndDelete({ owner: req.user._id })
    .then((cart) => {
      if (cart) {
        res.status(200).json({ success: true, ...cart });
      } else {
        errors.error = "No records found";
        res.status(400).json({ ...errors });
      }
    })
    .catch((err) => {
      errors.error = "Error checking for the user in database";
      return res.status(500).json({ ...errors, ...err });
    });
};
