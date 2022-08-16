const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');
const Cart = mongoose.model('cart');

module.exports = getCartItems = (req, res) => {
  const errors = {};
  Cart.findOne({owner: req.user._id}).then((cart)=>{
    const cartContent = cart._doc
    Story.findOne({storyId: req.params.storyId})
    .then((story) => {
      res.json({
        ...cartContent,
        story,
        success: true,
      });
    })
    .catch((err) => {
      errors.error = 'Error checking for the story in the database';
      res.status(500).json({ ...errors, ...err });
    });
  })
  
};
