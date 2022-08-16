const mongoose = require('mongoose');
// Validations
const validateAddToCart = require('../../validations/AddToCart');


// Models
const Cart = mongoose.model('cart');


module.exports = addToCart = (req, res) => {

    // Validate
    const { errors, isValid } = validateAddToCart(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }

    // Create new story
    const newCart = new Cart({
        storyId: mongoose.Types.ObjectId(req.body?.storyId),
        quantity: req.body?.quantity,
        owner: req.user._id,
    });
    newCart.save().then(story => res.json({ story, success: true })).catch((err) => {
        errors.error = 'Error saving user to database';
        res.status(500).json({ ...errors, ...err });
    });

};
