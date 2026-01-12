const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');
const Like = mongoose.model('like');
const Dish = mongoose.model('dish');
const Menu = mongoose.model('menu');



function getNearestLocation(targetLat, targetLong, locations) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return undefined; // Return null if the locations array is empty or not an array
  }

  // Radius of the Earth in kilometers
  const earthRadius = 6371;

  // Initialize variables to track the nearest location and its distance
  let nearestLocation = null;
  let nearestDistance = Infinity;


  // Iterate through the list of locations
  for (const location of locations) {
    const { lat, long } = location;

    // Calculate the differences in latitude and longitude
    const latDiff = deg2rad(lat - targetLat);
    const longDiff = deg2rad(long - targetLong);

    // Calculate the Haversine distance
    const a =
      Math.sin(latDiff / 2) ** 2 +
      Math.cos(deg2rad(targetLat)) *
      Math.cos(deg2rad(lat)) *
      Math.sin(longDiff / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    // Update nearestLocation if this location is closer
    if (distance < nearestDistance) {
      nearestLocation = location;
      nearestDistance = distance;
    }
  }

  return {
    nearestLocation,
    distance: nearestDistance,
  };
}

// Helper function to convert degrees to radians
function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}
const getStories = async (req, res) => {
  const { page = 1, limit = 10, id, excludeReviews, reviewsOnly, receivedReviews } = req.query;
  const errors = {};

  // Build query based on review filtering
  let query = { author: new mongoose.Types.ObjectId(id) };

  // Special handling for fetching reviews RECEIVED by a chef
  if (receivedReviews === 'true' && id) {
    try {
      // 1. Find all dishes belonging to this chef
      const chefDishes = await Dish.find({ user_id: id }).select('_id');
      const chefDishIds = chefDishes.map(d => d._id);

      // 2. Find the menu belonging to this chef
      const chefMenu = await Menu.findOne({ chef: id }).select('_id');
      const chefMenuId = chefMenu ? chefMenu._id : null;

      // 3. Query for stories that review any of these dishes OR the menu
      // Note: We intentionally overwrite the 'author' query because we want reviews FROM OTHERS
      query = {
        reviewMode: true,
        $or: [
          { reviewedDish: { $in: chefDishIds } },
          { reviewedMenu: chefMenuId }
        ]
      };

      // Filter out nulls if menu doesn't exist
      if (!chefMenuId) {
        query.$or = [{ reviewedDish: { $in: chefDishIds } }];
      }

    } catch (err) {
      console.error('Error fetching chef assets for reviews:', err);
      return res.status(500).json({ error: 'Error preparing review query' });
    }
  } else {
    // Standard logic for fetching posts BY the author
    if (excludeReviews === 'true') {
      // Exclude review posts (posts without rating or reviewType)
      query.$or = [
        { rating: { $exists: false } },
        { rating: null },
        { reviewType: { $exists: false } },
        { reviewType: null }
      ];
    } else if (reviewsOnly === 'true') {
      // Only include review posts (posts with rating or reviewType)
      query.$or = [
        { rating: { $exists: true, $ne: null } },
        { reviewType: { $exists: true, $ne: null } }
      ];
    }
  }

  Story.find(query)
    .limit(limit * 1)
    .populate("author")
    .populate("dishes")
    .skip((page - 1) * limit).sort({ _id: -1 })
    .exec().then(async (stories) => {
      // get total documents in the stories collection with the same filter
      const count = await Story.countDocuments(query);

      // Fetch currentUserLiked for each story
      const populatedStories = await Promise.all(
        stories.map(async (story) => {
          // Check if the current user has liked the story
          const currentUserLiked = await Like.exists({ post_id: story?._doc?._id, user_id: req.user?._id?.toString() });

          // Parity with getStories.js & getFollowingStories.js: Ensure avatarUri is populated for images
          // This allows the frontend to correctly identify image stories and hide video controls
          let finalAvatarUri = story?._doc?.avatarUri;
          if (!finalAvatarUri && story?._doc?.poster) {
            finalAvatarUri = story._doc.poster;
          }

          return {
            ...story?._doc,
            avatarUri: finalAvatarUri,
            kmAway: req?.query?.lat !== 'undefined' ? getNearestLocation(Number(req.query.lat), Number(req.query.long), story?.author?.locations)?.distance : undefined,
            currentUserLiked
          };
        })
      );

      // return response with stories, total pages, and current page
      res.json({
        stories: populatedStories,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    })
    .catch((err) => {
      errors.error = 'Error fetching stories from database';
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = getStories;
