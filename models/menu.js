const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  dishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "dish" }],
  chef: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // Reference to User with type 'chef'
  categories: { type: [mongoose.Schema.Types.ObjectId], ref: "category", required: true, index: true },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Menu = mongoose.model("menu", MenuSchema);
module.exports = Menu;
