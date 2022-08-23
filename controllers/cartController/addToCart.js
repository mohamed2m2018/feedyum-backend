const mongoose = require("mongoose");
// Validations
const validateAddToCart = require("../../validations/AddToCart");

// Models
const User = mongoose.model("user");

module.exports = addToCart = (req, res) => {
  const { newItem, storyId: id, ...rest } = req.body;
  const { errors, isValid } = validateAddToCart(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const storyId = mongoose.Types.ObjectId(req.body?.storyId);
  const Story = mongoose.model("story");

  User.findById(req.user._id)
    .then((user) => {
      const index = user.cart?.findIndex((element) => {
        return element?.story?.toString() === storyId?.toString();
      });

      if (index === -1) {
        Story.findById(storyId, (err, story) => {
          if (err) {
            errors.error = "We didn't find such story to add to cart";
            return res.status(500).json({ ...errors });
          } else {
            user.cart = [
              ...user.cart,
              {
                story: storyId,
                quantity: req.body?.quantity,
                author: story.author,
              },
            ];
            user.save();
            res.json({
              cart: user.cart,
            });
          }
        });
        return;
      }
      user.cart[index] = { ...user.cart?.[index]?._doc, ...rest };
      user.save();
      res.json({
        cart: user.cart,
      });
    })
    .catch((err) => {
      errors.error = "Error adding cart to the database";
      res.status(500).json({ ...errors, ...err });
    });
};
