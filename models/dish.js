const mongoose = require("mongoose");

const DishSchema = new mongoose.Schema({
  id: { type: Number, required: true }, // Adding an explicit ID field
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // Category field for dish type
  section: { type: mongoose.Schema.Types.ObjectId, ref: "section" }, // Reference to section
  price: { type: Number, required: true },
  menu: { type: mongoose.Schema.Types.ObjectId, ref: "menu", required: true }, // Reference to menu
  menu_id: { type: Number, required: true }, // Numeric ID for the menu
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // User identifier
  visible: { type: Boolean, default: true }, // Visibility field
  average_rating: { type: Number, default: 0 }, // Average rating for the dish
  image: { type: String }, // URL for the dish image
  
  // Enhanced fields for dish detail screen
  ingredients: [{ type: String }], // List of ingredients
  tags: [{ type: String }], // Tags for the dish (e.g., "spicy", "vegetarian")
  preparationTime: { type: Number }, // Preparation time in minutes
  
  // Nutritional information
  nutritionalInfo: {
    calories: { type: Number },
    protein: { type: String }, // e.g., "25g"
    carbs: { type: String }, // e.g., "30g"
    fat: { type: String }, // e.g., "15g"
    fiber: { type: String }, // e.g., "5g"
    sodium: { type: String }, // e.g., "500mg"
    sugar: { type: String }, // e.g., "10g"
  },
  
  // Dietary information
  dietaryInfo: [{ type: String }], // e.g., ["Vegetarian", "Gluten-Free", "Dairy-Free"]
  
  // Additional nutritional fields (for backward compatibility)
  calories: { type: Number },
  protein: { type: String },
  carbs: { type: String },
  fat: { type: String },
  fiber: { type: String },
  
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Dish = mongoose.model("dish", DishSchema);
module.exports = Dish;
