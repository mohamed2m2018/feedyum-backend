const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model("like");
const Follow = mongoose.model("follow");
const Comment = mongoose.model("comment");

const getStories = async (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
  const errors = {};

  try {
    // Retrieve stories with pagination and populate the author field
    const storiesQuery = Story.find()
      .limit(limit * 1)
      .populate("author")
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }); // Sort by most recent posts first

    // Retrieve the total count of documents in the stories collection
    const countQuery = Story.countDocuments();

    // Execute the queries in parallel
    const [stories, count] = await Promise.all([storiesQuery, countQuery]);

    // Check if any stories were found
    if (stories.length === 0) {
      errors.nousers = "No Posts found";
      return res.status(404).json(errors);
    }

    // Prepare an array to store promises for additional sorting factors
    const sortingPromises = [];

    // Iterate over the stories and add sorting factor promises to the array
    stories.forEach((dbStory) => {
      const story = dbStory._doc;
      const likesPromise = Like.countDocuments({ post_id: story._id });
      const commentsPromise = Comment.countDocuments({ post_id: story._id });
      const followsPromise = Follow.countDocuments({
        follower_id: userId,
        following_id: story.author._id,
      });
      sortingPromises.push(
        Promise.all([likesPromise, commentsPromise, followsPromise])
      );
    });

    // Execute all sorting factor promises concurrently
    const sortingResults = await Promise.all(sortingPromises);

    // Map the sorting factors and stories to a combined array for sorting
    const combinedData = stories.map((dbStory, index) => {
      const story = dbStory._doc;
      const [likesCount, commentsCount, followsCount] = sortingResults[index];
      return {
        story,
        likesCount,
        commentsCount,
        followsCount,
      };
    });

    // Sort the combined array based on multiple factors
    const sortedData = combinedData.sort((a, b) => {
      // Sort by likes count
      if (a.likesCount !== b.likesCount) {
        return b.likesCount - a.likesCount;
      }

      // Sort by comments count
      if (a.commentsCount !== b.commentsCount) {
        return b.commentsCount - a.commentsCount;
      }

      // Sort by follows count
      if (a.followsCount !== b.followsCount) {
        return b.followsCount - a.followsCount;
      }

      // Sort by recency (createdAt)
      return b.story.createdAt - a.story.createdAt;
    });

    // Get the subset of stories for the current page
    const paginatedData = sortedData.slice((page - 1) * limit, page * limit);

    const populatedStories = await Promise.all(
      paginatedData.map(async (data) => {
        // Check if the current user has liked the story
        const currentUserLiked = await Like.exists({
          post_id: data.story._id,
          user_id: userId,
        });

        return {
          ...data.story,
          currentUserLiked: currentUserLiked ? true : false,
        };
      })
    );

    // Return response with stories, total pages, and current page
    res.json({
      stories: populatedStories,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    console.log("ee ", err);
    errors.error = "Error fetching stories from database";
    res.status(500).json({ ...errors, ...err });
  }
};
module.exports = getStories;
