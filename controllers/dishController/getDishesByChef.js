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
    dishes = await Dish.find({ user_id: chefId }).populate("section").lean();
    
    // If no results with string, try with ObjectId
    if (dishes.length === 0 && mongoose.Types.ObjectId.isValid(chefId)) {
      dishes = await Dish.find({ user_id: new mongoose.Types.ObjectId(chefId) }).populate("section").lean();
    }

    console.log("Found dishes:", dishes.length);

    // Transform ObjectIds to strings to prevent serialization issues
    const transformedDishes = dishes.map(dish => ({
      ...dish,
      _id: dish._id.toString(),
      user_id: dish.user_id.toString(),
      menu: dish.menu ? dish.menu.toString() : dish.menu,
      section: dish.section ? {
        ...dish.section,
        _id: dish.section._id.toString()
      } : dish.section,
      // Add chef information for easier access
      chef: {
        _id: dish.user_id.toString()
      }
    }));

    // Return transformed dishes
    res.status(200).json(transformedDishes);
  } catch (error) {
    console.error("Error fetching dishes by chef:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = getDishesByChef;