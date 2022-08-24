const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");

module.exports = getCartItems = (req, res) => {
  const errors = {};
  //lean() make you able to get rid of _doc
  //populate() make you able to populate all fields for story given its id
  User.findOne({ _id: req.user._id }).populate('cart.story').lean().exec((err, user) => {
    if (err) {
      errors.error = "Error checking for the cart in the database";
      return res.status(500).json({ ...errors, ...err });
    }
    if (!user.cart)
      return res.status(200).json({
        cart: [],
      });
    const dishes = user.cart?.map((element) => {
        return ({
        title: element.story?.title ,
        description: element.story?.description,
        image: element.story?.image,
        price: element.story?.price * element.quantity,
        quantity: element.quantity,
        storyId: element.story?._id,
      })});
    res.json({
      cart: dishes,
      tax: 0,
      serive: 0,
      totalPrice: dishes.reduce((partialSum, element) => partialSum + element.price, 0),
      success: true,
    });
  });
};
