const mongoose = require("mongoose");
const { search } = require("../../routes/user");

// Models
const Story = mongoose.model("story");
var ObjectId = require("mongoose").Types.ObjectId;

const searchStories = async (req, res) => {
  const { page = 1, limit = 10, searchString, excludeReviews, reviewsOnly, authorType, ...rest } = req.query;

  console.log('Traditional story search called with:', {
    searchString,
    page,
    limit,
    excludeReviews,
    reviewsOnly,
    authorType,
    rest
  });

  const errors = {};
  if (rest.category && !ObjectId.isValid(rest.category)) {
    errors.error = "Category id is invalid";
    return res.status(500).json(errors);
  }

  // Build base query
  let baseQuery;

  if (searchString && searchString.trim() !== '') {
    const string = new RegExp(searchString.trim(), 'i');
    baseQuery = {
      $or: [
        { caption: string },
        { description: string },
        { title: string }
      ],
      ...rest,
    };
  } else {
    baseQuery = {
      ...rest,
    };
  }

  // Handle author type filtering (Kitchen Posts vs Reviews)
  if (authorType) {
    try {
      const User = mongoose.model("user");
      let userQuery = {};

      if (authorType === 'chef') {
        userQuery = { type: 'chef' };
      } else if (authorType === 'user') {
        userQuery = { type: { $ne: 'chef' } };
      }

      // Find all users matching the type
      const users = await User.find(userQuery).select('_id');
      const userIds = users.map(u => u._id);

      // Add author filter to story query
      baseQuery.author = { $in: userIds };

      console.log(`Filtering for authorType: ${authorType}, found ${userIds.length} users`);
    } catch (err) {
      console.error('Error filtering by author type:', err);
      // Continue without author filter if it fails, or return error?
      // For now, let's log and continue, effectively ignoring the filter if it breaks
    }
  }

  // Add review filtering logic (keep as optional fallback or secondary filter)
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

  console.log('Story search query:', JSON.stringify(baseQuery, null, 2));

  try {
    const stories = await Story.find(baseQuery)
      .limit(limit * 1)
      .populate('author', 'fullName avatar')
      .populate("dishes")
      .skip((page - 1) * limit)
      .sort({ _id: -1 });

    // Get total count for pagination
    const totalStories = await Story.countDocuments(baseQuery);

    // Remove embeddings from response to reduce size
    const storiesWithoutEmbeddings = stories.map(story => {
      const storyObj = story.toObject();
      delete storyObj.embedding;
      delete storyObj.embeddingGenerated;

      // Also remove embeddings from populated dishes
      if (storyObj.dishes && Array.isArray(storyObj.dishes)) {
        storyObj.dishes = storyObj.dishes.map(dish => {
          const dishObj = dish.toObject ? dish.toObject() : dish;
          delete dishObj.embedding;
          delete dishObj.embeddingGenerated;
          return dishObj;
        });
      }

      return storyObj;
    });

    console.log(`Traditional search found ${storiesWithoutEmbeddings.length} stories for query: "${searchString}"`);

    res.status(200).json({
      success: true,
      data: {
        stories: storiesWithoutEmbeddings,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalStories / limit),
        totalItems: totalStories,
        hasNextPage: page < Math.ceil(totalStories / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Story search error:', err);
    return res.status(500).json({ success: false, error: 'Database error during search' });
  }
};

module.exports = searchStories;