const mongoose = require("mongoose");

// Models
const Order = mongoose.model("order");

module.exports = getOrders = (req, res) => {
  const errors = {};
  //lean() make you able to get rid of _doc
  //populate() make you able to populate all fields for story given its id
  Order.find({ owner: req.user._id }).populate('cart').lean().exec((err, orders) => {
    if (err) {
      errors.error = "Error checking for orders in the database";
      return res.status(500).json({ ...errors, ...err });
    }
    if (!orders)
      return res.status(200).json({
        orders: [],
      });
    res.json({
      orders,
      success: true,
    });
  });
};
