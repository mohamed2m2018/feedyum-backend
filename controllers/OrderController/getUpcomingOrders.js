const mongoose = require("mongoose");

// Models
const Order = mongoose.model("order");

module.exports = getUpcomingOrders = (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const errors = {};
  if (req.user?.type === "chef") {
    Order.find({
      "cart.author": req.user?._id,
      status: ["Pending", "In Progress"],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ _id: -1 })
      .exec(async (err, orders) => {
        if (err) {
          errors.error = "Error checking for orders in the database";
          return res.status(500).json({ ...errors, ...err });
        }
        if (!orders)
          return res.status(200).json({
            orders: [],
          });
        // get total documents in the stories collection
        const count = await Story.countDocuments();

        res.json({
          orders,
          success: true,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        });
      });
  } else {
    Order.find({
      owner: req.user._id,
      status: ["Pending", "In Progress"],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ _id: -1 })
      .exec(async (err, orders) => {
        if (err) {
          errors.error = "Error checking for orders in the database";
          return res.status(500).json({ ...errors, ...err });
        }
        if (!orders)
          return res.status(200).json({
            orders: [],
          });
        // get total documents in the stories collection
        const count = await Story.countDocuments();
        res.json({
          orders,
          success: true,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        });
      });
  }
};
