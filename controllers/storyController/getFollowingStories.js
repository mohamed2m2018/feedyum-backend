const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Follow = mongoose.model("follow");
const Like = mongoose.model('like');
const Dish = mongoose.model('dish');

// Utils
const { shuffleArray } = require('../../utils/storyFeedUtils');
const { getNearestBranchBatch } = require('../../utils/getNearestBranch');

const getFollowingStories = async (req, res) => {
  const { page = 1, limit = 10, userId, categoryIds } = req.query;
  const errors = {};


  try {
    const currentUserFollowing = await Follow.find(
      { follower_id: userId },
      "following_id"
    );

    let params = {
      author: {
        $in: currentUserFollowing.map((follow) => follow.following_id),
      },
    };

    if (categoryIds.length) {
      params.category = {
        $in: categoryIds.split(',')
      }
    }

    // Retrieve the count of stories of the users the current user is following
    const totalStories = await Story.countDocuments(params);


    // Retrieve paginated stories of the users the current user is following
    const followingStories = await Story.find(params)
      .limit(limit * 1)
      .populate("author")
      .populate("dishes")
      .skip((page - 1) * limit)
      .sort({ _id: -1 })
      .lean()
      .exec();



    if (followingStories.length === 0) {
      return res.json({
        stories: [],
        totalPages: 1,
        currentPage: page,
      });
    }

    // Batch fetch branch distances for all unique authors
    const hasValidCoordinates = req?.query?.lat && req?.query?.lat !== 'undefined' && req?.query?.long;
    const uniqueStoryAuthorIds = [...new Set(followingStories.map(s => s.author?._id?.toString()).filter(Boolean))];
    let branchDistMap = new Map();
    if (hasValidCoordinates && uniqueStoryAuthorIds.length > 0) {
      branchDistMap = await getNearestBranchBatch(uniqueStoryAuthorIds, Number(req.query.lat), Number(req.query.long));
    }

    const mappedStories = await Promise.all(
      followingStories.map(async (item) => {
        // Check if the current user has liked the story
        const currentUserLiked = await Like.exists({ post_id: item?._id, user_id: userId });

        // Parity with getStories.js: Ensure avatarUri is populated for images
        let finalAvatarUri = item.avatarUri;
        if (!finalAvatarUri && item.poster) {
          finalAvatarUri = item.poster;
        }

        // Mark author as followed (these are stories from followed users by definition)
        if (item.author) {
          item.author.currentUserFollowed = true;
        }

        const branchData = branchDistMap.get(item?.author?._id?.toString());

        return {
          ...item,
          avatarUri: finalAvatarUri,
          kmAway: branchData?.distance,
          currentUserLiked
        };
      })
    );

    // Performance optimization: Only compute ratings for unique authors
    const uniqueAuthorIds = [...new Set(mappedStories.map(s => s.author?._id?.toString()).filter(Boolean))];
    if (uniqueAuthorIds.length > 0) {
      try {
        const ratings = await Dish.aggregate([
          { $match: { user_id: { $in: uniqueAuthorIds.map(id => mongoose.Types.ObjectId(id)) } } },
          { $match: { average_rating: { $gt: 0 } } }, // Pre-filter rated dishes
          {
            $group: {
              _id: "$user_id",
              ratedDishesCount: { $sum: 1 },
              totalRating: { $sum: "$average_rating" }
            }
          },
          {
            $project: {
              ratedDishesCount: 1,
              averageDishRating: { $round: [{ $divide: ["$totalRating", "$ratedDishesCount"] }, 1] }
            }
          }
        ]).exec();

        const ratingMap = new Map(ratings.map(r => [r._id.toString(), r]));
        mappedStories.forEach(story => {
          if (story.author?._id) {
            const rating = ratingMap.get(story.author._id.toString());
            story.author.averageDishRating = rating?.averageDishRating || 0;
            story.author.ratedDishesCount = rating?.ratedDishesCount || 0;
          }
        });
      } catch (ratingErr) {
        console.error('[PERF] Failed to attach author ratings (following):', ratingErr?.message);
        mappedStories.forEach(story => {
          if (story.author) {
            story.author.averageDishRating = 0;
            story.author.ratedDishesCount = 0;
          }
        });
      }
    }

    // Shuffle the followingStories array to randomize the order
    const randomizedStories = shuffleArray(mappedStories);

    // Return response with randomized stories, total pages, and current page
    return res.json({
      stories: randomizedStories,
      totalPages: Math.ceil(totalStories / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching following stories:", error);
    errors.error = "Error fetching following stories";
    return res.status(500).json({ ...errors, ...error });
  }
};

module.exports = getFollowingStories;
