const Dish = require("../../models/dish");

const getDishesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Find dishes by category and populate chef information
    const dishes = await Dish.find({
      category: { $regex: new RegExp(category, "i") }, // Case-insensitive search
      visible: { $ne: false }, // Only visible dishes
    })
      .populate("user_id", "fullName avatar bio")
      .sort({ created_at: -1 })
      .limit(50); // Limit to 50 dishes for performance

    // Transform the data to include chef information in a consistent format
    const transformedDishes = dishes.map((dish) => ({
      ...dish.toObject(),
      chef: dish.user_id
        ? {
            _id: dish.user_id._id,
            fullName: dish.user_id.fullName,
            avatar: dish.user_id.avatar,
            bio: dish.user_id.bio,
          }
        : null,
    }));

    res.json(transformedDishes);
  } catch (error) {
    console.error("Error fetching dishes by category:", error);
    res.status(500).json({
      message: "Server error while fetching dishes by category",
      error: error.message,
    });
  }
};

module.exports = getDishesByCategory;
