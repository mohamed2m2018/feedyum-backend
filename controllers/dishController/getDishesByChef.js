const mongoose = require("mongoose");
const Dish = require("../../models/dish");
const Section = require("../../models/section");

const getDishesByChef = async (req, res) => {
  try {
    const { chefId } = req.params;

    console.log("Fetching dishes for chef:", chefId);

    // Try both string and ObjectId queries since data might be stored in different formats
    let dishes = [];
    
    // First try with string (this is how the data is currently stored)
    dishes = await Dish.find({ user_id: chefId }).populate("section");
    
    // If no results with string, try with ObjectId
    if (dishes.length === 0 && mongoose.Types.ObjectId.isValid(chefId)) {
      dishes = await Dish.find({ user_id: new mongoose.Types.ObjectId(chefId) }).populate("section");
    }

    console.log("Found dishes:", dishes.length);

    // Return dishes (empty array if none found)
    res.status(200).json(dishes);
  } catch (error) {
    console.error("Error fetching dishes by chef:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = getDishesByChef;