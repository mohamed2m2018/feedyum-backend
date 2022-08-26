const mongoose = require("mongoose");

// Models
const Order = mongoose.model("order");

module.exports = removeOrder = (req, res) => {
  const errors = {};
  Order.remove(
    { _id: req.body.orderId.toString() },
  )
    .then(() =>
      res.json({
        success: true,
      })
    )
    .catch((err) => {
      errors.error = "Error checking for the order in the database";
      res.status(500).json({ ...errors, ...err });
    });
};
