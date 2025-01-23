const Dish = require("../../models/dish");
const mongoose = require("mongoose");

const getDishesByMenuId = async (req, res) => {
  try {
    const { menuId } = req.params;

    // Validate menuId format
    if (!mongoose.Types.ObjectId.isValid(menuId)) {
      return res.status(400).json({ message: "Invalid menu ID format" });
    }

    // Find dishes by menuId and populate category details
    const dishes = await Dish.find({ menu: menuId }).populate("category");

    res.status(200).json(dishes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = getDishesByMenuId;

