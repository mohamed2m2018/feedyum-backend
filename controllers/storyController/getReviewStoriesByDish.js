const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");

const getReviewStoriesByDish = async (req, res) => {
  try {
    const { dishId } = req.params;

    // Validate dishId
    if (!mongoose.Types.ObjectId.isValid(dishId)) {
      return res.status(400).json({ error: "Invalid dish ID" });
    }

    // Find review stories for this dish
    const reviewStories = await Story.find({
      reviewMode: true,
      reviewType: 'dish',
      reviewedDish: dishId,
    })
      .populate('author', 'fullName avatar')
      .populate('reviewedDish', 'name image price')
      .sort({ created_at: -1 })
      .limit(20); // Limit to recent 20 reviews

    console.log(`Found ${reviewStories.length} review stories for dish ${dishId}`);

    res.json({
      success: true,
      reviewStories,
      count: reviewStories.length,
    });
  } catch (error) {
    console.error("Get review stories by dish error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

module.exports = getReviewStoriesByDish;