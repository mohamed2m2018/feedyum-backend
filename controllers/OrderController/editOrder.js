const mongoose = require("mongoose");
const order = require("../../models/order");

// Models
const Order = mongoose.model("order");

module.exports = editOrder = (req, res) => {
  const errors = {}
  Order.findByIdAndUpdate(
    req.body?.id,
    {
      ...req.body,
    },
    {
      runValidators: true,
      new: true,
    }
  ).lean().exec((err, order) => {
    if (err) {
      if (err.errors.status.name === "ValidatorError") {
        errors.error = err.errors.status?.message;
        return res.status(500).json({ ...errors });
      } else {
        errors.error = "Error checking for order in the database";
        return res.status(500).json({ ...errors, ...err });
      }
    }
    if (!order) {
      errors.error = "We didn't find an order with that id";
      return res.status(500).json({ ...errors });
    }

    if (!order.owner.equals(req.user?._id)) {
      errors.error = "You are not the owner of this order";
      return res.status(500).json({ ...errors });
    }
    res.json({
      order: { ...order },
      success: true,
    });
  });
};
