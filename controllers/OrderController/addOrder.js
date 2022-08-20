const mongoose = require("mongoose");

// Models
const Order = mongoose.model("order");
const Cart = mongoose.model("cart");


module.exports = addOrder = (req, res) => {
  errors = {};

  Cart.find({ owner: req.user._id })
    .lean()
    .exec((err, cart) => {
      if (err) {
        errors.error = "Error checking for the cart in the database";
        return res.status(500).json({ ...errors, ...err });
      }
      if (cart.length !== 0) {
        const newOrder = new Order({
          items: cart,
          status: "Pending",
          cancellable: true,
          owner: req.user._id,
          author: cart?.[0]?.author
        });
        newOrder
          .save()
          .then((order) => {
            Cart.remove({ owner: req.user._id })
              .catch((err) => {
                errors.error = "Error checking for the user in database";
                return res.status(500).json({ ...errors, ...err });
              });
            return res.json({ ...order._doc, success: true });
          })
          .catch((err) => {
            errors.error = "Error saving user to database";
            res.status(500).json({ ...errors, ...err });
          });
      } else {
        errors.error = "Your cart is invalid";
        res.status(400).json({ ...errors });
      }
    });
};
