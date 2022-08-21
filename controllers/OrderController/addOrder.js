const mongoose = require("mongoose");

// Models
const Order = mongoose.model("order");
const User = mongoose.model("user");


module.exports = addOrder = (req, res) => {
  errors = {};

  User.findByIdAndUpdate(req.user._id)
    .then((user) => {
      if (!user.cart) {
        errors.error = "Error checking for the cart in the database";
        return res.status(500).json({ ...errors });
      }
      if (user.cart.length !== 0) {
        const newOrder = new Order({
          items: user.cart,
          status: "Pending",
          cancellable: true,
          author: user.cart?.[0]?.author,
          owner: req.user._id,
        });
        newOrder
          .save()
          .then((order) => {
           user.cart = [];
           user.save()
            return res.json({ ...order._doc, success: true });
          })
          .catch((err) => {
            errors.error = "Error saving order to database";
            res.status(500).json({ ...errors, ...err });
          });
      } else {
        errors.error = "Your cart is empty";
        res.status(400).json({ ...errors });
      }
    });
};
