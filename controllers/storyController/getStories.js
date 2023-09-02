const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");

// Function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const getStories = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const errors = {};

  try {
    // Check if stories have been seen and retrieved before
    if (!req.session || !req.session.seenStories) {
      req.session.seenStories = new Set(); // Initialize the set to store seen stories
    }

    // Retrieve stories with pagination, exclude seen stories, and populate the author field
    const storiesQuery = Story.find({
      _id: { $nin: [...req.session.seenStories] }, // Exclude seen stories
    })
      .limit(limit * 1)
      .populate("author")
      .skip((page - 1) * limit)
      .sort({ _id: -1 });

    // Execute the query to retrieve stories
    const stories = await storiesQuery;

    // Update the set of seen stories with the newly retrieved stories
    stories.forEach((story) => req.session.seenStories.add(story._id));

    // Shuffle the stories array to randomize the order
    const randomizedStories = shuffleArray([...stories]);

    // Retrieve the total count of documents in the stories collection
    const countQuery = Story.countDocuments();

    // Execute the count query
    const count = await countQuery;

    // Return response with randomized stories, total pages, and current page
    res.json({
      stories: randomizedStories || [],
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    errors.error = "Error fetching stories from the database";
    res.status(500).json({ ...errors, ...err });
  }
};

module.exports = getStories;
