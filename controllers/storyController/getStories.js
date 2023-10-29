const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model('like');


// Function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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
  const { page = 1, limit = 10, categoryIds } = req.query;
  const errors = {};

  let  params = {};

  if(categoryIds.length){
    params = { category: { $in: categoryIds } };
  }
  try {
    // Retrieve stories with pagination and populate the author field
    const storiesQuery = Story.find(params?.category? params: null)
      .limit(limit * 1)
      .populate("author").populate('category')
      .skip((page - 1) * limit)
      .lean()
      .sort({ _id: -1 });



    // Execute the query to retrieve stories
    const stories = await storiesQuery;

    // Fetch currentUserLiked for each story
    const mappedStories = await Promise.all(
      stories.map(async (item) => {
      // Check if the current user has liked the story
      const currentUserLiked = await Like.exists({ post_id: item?._id, user_id: req.user?._id?.toString() });
          return {
          ...item,
          kmAway: req?.query?.lat !== 'undefined' ? getNearestLocation(Number(req.query.lat), Number(req.query.long), item?.author?.locations)?.distance : undefined,
          currentUserLiked
      };
      })
  );


    const randomizedStories = shuffleArray([...mappedStories]);
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
