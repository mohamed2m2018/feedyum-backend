const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model("like");
// const Follow = mongoose.model("follow");
// const Comment = mongoose.model("comment");
const View = mongoose.model("view");

const getStories = async (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
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

    // Check if any stories were found
    if (stories.length === 0) {
      errors.nousers = "No Posts found";
      return res.status(404).json(errors);
    }

    // Prepare an array to store promises for additional sorting factors
    const sortingPromises = [];

    // Iterate over the stories and add sorting factor promises to the array
    stories.forEach(async (dbStory) => {
      const story = dbStory._doc;
      const viewedBeforePromise = View.exists({
        story: story._id,
        user_id: userId,
      });
      sortingPromises.push(Promise.all([viewedBeforePromise]));
    });

    // Execute all sorting factor promises concurrently
    const sortingResults = await Promise.all(sortingPromises);

    // Map the sorting factors and stories to a combined array for sorting
    const combinedData = stories.map((dbStory, index) => {
      const story = dbStory._doc;
      const [likesCount, commentsCount, followsCount, viewedBefore] =
        sortingResults[index];
      return {
        story,
        likesCount,
        commentsCount,
        followsCount,
        viewedBefore,
      };
    });

    // Sort the combined array based on multiple factors
    const sortedData = combinedData.sort((a, b) => {
      const randomIndex = Math.floor(Math.random() * 36);

      if (randomIndex >= 0 || randomIndex <= 9) {
        if (a.viewedBefore && !b.viewedBefore) {
          return b.viewedBefore - a.viewedBefore;
        }
      }

      if(randomIndex >=10 && randomIndex <=28){
        return b.followsCount - a.followsCount
      }

      // If all sorting factors are equal, introduce more randomness
      const randomA = Math.random();
      const randomB = Math.random();
      return randomA - randomB;
    });

    // Get the subset of stories for the current page

    const populatedStories = await Promise.all(
      sortedData.map(async (data) => {
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
      stories: [...populatedStories, "ad"],
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    errors.error = "Error fetching stories from the database";
    res.status(500).json({ ...errors, ...err });
  }
};

module.exports = getStories;
