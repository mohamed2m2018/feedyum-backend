const Dish = require("../../models/dish");
const mongoose = require("mongoose");

const getDishesByMenuId = async (req, res) => {
  try {
    const { menuId } = req.params;

    // Validate menuId format
    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return res.status(400).json({ message: "Invalid menu ID format" });
    }

    // Find dishes by menuId and populate section details
    const dishes = await Dish.find({ menu: menuId }).populate("section").lean();

    // Transform ObjectIds to strings
    const transformedDishes = dishes.map(dish => ({
      ...dish,
      _id: dish._id.toString(),
      user_id: dish.user_id.toString(),
      menu: dish.menu.toString(),
      section: dish.section ? {
        ...dish.section,
        _id: dish.section._id.toString()
      } : dish.section,
      // Add chef information for easier access
      chef: {
        _id: dish.user_id.toString()
      }
    }));

    res.status(200).json(transformedDishes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = getDishesByMenuId;

