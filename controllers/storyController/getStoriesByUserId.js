const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');
const Like = mongoose.model('like');



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
const getStories = (req, res) => {
    const { page = 1, limit = 10, id } = req.query;
    const errors = {};
    Story.find({author: new mongoose.Types.ObjectId(id)})
        .limit(limit * 1)
        .populate("author").populate('category')
        .skip((page - 1) * limit).sort({ _id: -1 })
        .exec().then(async (stories) => {
            // get total documents in the stories collection 
            const count = await Story.countDocuments({author: new mongoose.Types.ObjectId(id)});

            // Fetch currentUserLiked for each story
            const populatedStories = await Promise.all(
                stories.map(async (story) => {
                // Check if the current user has liked the story
                const currentUserLiked = await Like.exists({ post_id: story?._doc?._id, user_id: req.user?._id?.toString() });
                    return {
                    ...story?._doc,
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
