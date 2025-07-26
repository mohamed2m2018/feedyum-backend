const mongoose = require("mongoose");
const { search } = require("../../routes/user");

// Models
const Story = mongoose.model("story");
var ObjectId = require("mongoose").Types.ObjectId;

const searchStories = (req, res) => {
  const { page = 1, limit = 10, searchString, excludeReviews, reviewsOnly, ...rest } = req.query;
  const string = new RegExp(searchString, 'i')
  const errors = {};
  if (rest.category && !ObjectId.isValid(rest.category)) {
    errors.error = "Category id is invalid";
    return res.status(500).json(errors);
  }

  // Build base query
  let baseQuery = searchString
    ? {
        $or: [{caption: string}, {description: string}, {title: string}],
        ...rest,
      }
    : {
        ...rest,
      };

  // Add review filtering logic
  if (excludeReviews === 'true') {
    // Exclude review posts (posts without rating or reviewType)
    baseQuery.$and = baseQuery.$and || [];
    baseQuery.$and.push({
      $or: [
        { rating: { $exists: false } },
        { rating: null },
        { reviewType: { $exists: false } },
        { reviewType: null },
        { reviewMode: { $ne: true } }
      ]
    });
  } else if (reviewsOnly === 'true') {
    // Only include review posts (posts with rating or reviewType or reviewMode)
    baseQuery.$and = baseQuery.$and || [];
    baseQuery.$and.push({
      $or: [
        { rating: { $exists: true, $ne: null } },
        { reviewType: { $exists: true, $ne: null } },
        { reviewMode: true }
      ]
    });
  }

  Story.find(baseQuery)
    .limit(limit * 1)
    .populate('author', 'fullName')
    .populate("dishes")
    .skip((page - 1) * limit)
    .sort({ _id: -1 })
    .exec()
    .then(async (stories) => {
      if (stories.length === 0) {
        return res.json({stories: []});
      }
      
      // get total documents in the stories collection that match the query
      const count = await Story.countDocuments(baseQuery);

      // return response with stories, total pages, and current page
      res.json({
        stories,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    })
    .catch((err) => {
      errors.error = "Error fetching stories from database";
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = searchStories;