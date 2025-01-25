const mongoose = require("mongoose");

const DishSchema = new mongoose.Schema({
  id: { type: Number, required: true }, // Adding an explicit ID field
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // Category field for dish type
  price: { type: Number, required: true },
  menu_id: { type: Number, required: true }, // Numeric ID for the menu
  user_id: { type: String, required: true }, // User identifier
  visible: { type: Boolean, default: true }, // Visibility field
  average_rating: { type: Number, default: 0 }, // Average rating for the dish
  image: { type: String }, // URL for the dish image
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Dish = mongoose.model("dish", DishSchema);
module.exports = Dish;
