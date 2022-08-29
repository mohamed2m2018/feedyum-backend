const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");

module.exports = removeItem = (req, res) => {

  const storyId = mongoose.Types.ObjectId(req.body?.storyId);

  User.findById(req.user._id)
    .then((user) => {

      const index = user.cart?.findIndex((element) => {
        return element?.story?.toString() === storyId?.toString();
      });
    
      user.cart.splice(index,1)
      user.save();
      res.json({
        cart: user.cart,
      });
    })
    .catch((err) => {
      errors.error = "Error removing item form cart";
      res.status(500).json({ ...errors, ...err });
    });
};
