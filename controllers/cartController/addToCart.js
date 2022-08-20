const mongoose = require("mongoose");
// Validations
const validateAddToCart = require("../../validations/AddToCart");

// Models
const Cart = mongoose.model("cart");

module.exports = addToCart = (req, res) => {
  const { errors, isValid } = validateAddToCart(req.body);
  const { newItem  } = req.body;

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const storyId = mongoose.Types.ObjectId(req.body?.storyId);
  const authorId = mongoose.Types.ObjectId(req.body?.author);


  if (newItem) {
    // Create new cart
    const newCart = new Cart({
      story: storyId,
      author: authorId,
      quantity: req.body?.quantity,
      owner: req.user._id,
    });
    newCart
      .save()
      .then(() => res.json({  success: true }))
      .catch((err) => {
        errors.error = "Error saving cart to database";
        res.status(500).json({ ...errors, ...err });
      });
  } else {
    Cart.findOneAndUpdate({ story: storyId }, { ...req.body }, { new: true })
      .lean()
      .exec((err, cart) => {
        if (err) {
          errors.error = "Error checking for the cart in the database";
          return res.status(500).json({ ...errors, ...err });
        }

        if (cart) {
          res.json({
            ...cart,
          });
        } else {
          errors.error = "We didn't find such item to update";
          return res.status(500).json({ ...errors });
        }
      });
  }
};
