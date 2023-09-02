const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");


const getStories = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const errors = {};

  try {
    // Retrieve stories with pagination and populate the author field

    const storiesQuery = Story.find()
      .limit(limit * 1)
      .populate("author")
      .skip((page - 1) * limit)
      .sort({ _id: -1 });

    // Retrieve the total count of documents in the stories collection
    const countQuery = Story.countDocuments();

    // Execute the queries in parallel
    const [stories, count] = await Promise.all([storiesQuery, countQuery]);

    // Return response with stories, total pages, and current page

    res.json({
      stories: stories?.length> 0 ? [...stories]: [],
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    errors.error = "Error fetching stories from the database";
    res.status(500).json({ ...errors, ...err });
  }
};

module.exports = getStories;
