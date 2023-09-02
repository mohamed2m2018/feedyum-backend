const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");

// Fisher-Yates Shuffle Function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const getStories = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const errors = {};

  try {
    // Retrieve random story IDs
    const randomStoryIds = await Story.aggregate([
      { $sample: { size: parseInt(limit) } },
      { $project: { _id: 1 } }, // Project only the _id field
    ]);

    // Extract the _id values from the randomStoryIds array
    const storyIds = randomStoryIds.map((doc) => doc._id);

    // Retrieve all stories with the random IDs
    const allStories = await Story.find({ _id: { $in: storyIds } })
      .populate("author")
      .sort({ _id: -1 })
      .exec();

    if (allStories.length === 0) {
      return res.json({
        stories: [],
        totalPages: 1,
        currentPage: page,
      });
    }

    // Shuffle the stories order randomly
    shuffleArray(allStories);

    // Calculate pagination offsets
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Get the stories for the current page
    const stories = allStories.slice(startIndex, endIndex);

    // Return response with randomly ordered stories, total pages, and current page
    res.json({
      stories: stories ? stories : [],
      totalPages: Math.ceil(allStories.length / limit),
      currentPage: page,
    });
  } catch (err) {
    errors.error = "Error fetching stories from the database";
    res.status(500).json({ ...errors, ...err });
  }
};

module.exports = getStories;
