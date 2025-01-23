const mongoose = require("mongoose");

const DishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  section: { type: mongoose.Schema.Types.ObjectId, ref: "section", required: true, index: true },
  price: { type: Number, required: true },
  menu: { type: mongoose.Schema.Types.ObjectId, ref: "menu", required: false }, 
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Dish = mongoose.model("dish", DishSchema);
module.exports = Dish;