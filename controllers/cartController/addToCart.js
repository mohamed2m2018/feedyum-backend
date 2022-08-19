const mongoose = require("mongoose");
// Validations
const validateAddToCart = require("../../validations/AddToCart");

// Models
const Cart = mongoose.model("cart");

module.exports = addToCart = (req, res) => {

  const { errors, isValid } = validateAddToCart(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const storyId = mongoose.Types.ObjectId(req.body?.storyId);
  const authorId = mongoose.Types.ObjectId(req.body?.author);


  Cart.findOne({ owner: req.user._id }).exec((err,cart)=>{
    if(err){
      errors.error = "Error checking for the story in the database";
      return res.status(500).json({ ...errors, ...err });
    }
    if (cart) {
      errors.error = "You already have item in cart";
      res.status(400).json({ ...errors });
    } else {
      // Create new story
      const newCart = new Cart({
        story: storyId,
        author: authorId,
        quantity: req.body?.quantity,
        owner: req.user._id,
      });
      newCart
        .save()
        .then((cart) => res.json({ ...cart?._doc, success: true }))
        .catch((err) => {
          errors.error = "Error saving user to database";
          res.status(500).json({ ...errors, ...err });
        });
    }
  })
   
};
