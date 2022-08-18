const mongoose = require("mongoose");
// Validations
const validateAddToCart = require("../../validations/AddToCart");

// Models
const Order = mongoose.model("order");

module.exports = addOrder = (req, res) => {
  // const { errors, isValid } = validateAddToCart(req.body);

  // if (!isValid) {
  //   return res.status(400).json(errors);
  // }

  Cart.findOne({ owner: req.user._id })
    .lean()
    .exec((err, cart) => {
      if (err) {
        errors.error = "Error checking for the cart in the database";
        return res.status(500).json({ ...errors, ...err });
      }
      if (cart) {
        // Create new story
        const newOrder = new Order({
          cart: cart._id,
          status: "Pending",
          cancellable: true,
          owner: req.user._id,
        });
        newOrder
          .save()
          .then((order) => {
            Cart.findOneAndDelete({ owner: req.user._id })
              .then((cart) => {
                if (cart) {
                  res.status(200).json({ success: true, cart: [] });
                } else {
                  errors.error = "No records found";
                  res.status(400).json({ ...errors });
                }
              })
              .catch((err) => {
                errors.error = "Error checking for the user in database";
                return res.status(500).json({ ...errors, ...err });
              });
            return res.json({ ...order, success: true });
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
