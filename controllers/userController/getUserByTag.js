const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");
const Tag = mongoose.model("tag");
const Story = mongoose.model("story");
const Category = mongoose.model("category");

// Helper function to calculate nearest location distance
function getNearestLocation(targetLat, targetLong, locations) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return undefined;
  }

  if (isNaN(targetLat) || isNaN(targetLong)) {
    return undefined;
  }

  const earthRadius = 6371;
  let nearestLocation = null;
  let nearestDistance = Infinity;

  for (const location of locations) {
    const { lat, long } = location;
    
    if (isNaN(lat) || isNaN(long)) {
      continue;
    }

    const latDiff = deg2rad(lat - targetLat);
    const longDiff = deg2rad(long - targetLong);

    const a =
      Math.sin(latDiff / 2) ** 2 +
      Math.cos(deg2rad(targetLat)) *
        Math.cos(deg2rad(lat)) *
        Math.sin(longDiff / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    if (distance < nearestDistance) {
      nearestLocation = location;
      nearestDistance = distance;
    }
  }
  
  return {
    nearestLocation,
    distance: nearestDistance !== Infinity ? parseFloat(nearestDistance.toFixed(2)) : undefined,
  };
}

function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}

const getUserByTag = async (req, res) => {
  const { tag } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5; // Assuming you want to fetch 5 users per page
  const { lat, long } = req.query;
  console.log(`[DISCOVER] getUserByTag - Tag: ${tag}, Coordinates: lat=${lat}, long=${long}`);

  try {
    const skip = (page - 1) * limit;

    // Fetch the tag and ensure it exists
    const fetchedTag = await Tag.findOne({ name: tag }).lean().exec();
    if (!fetchedTag) {
      return res.status(404).json({ success: false, error: "Tag not found" });
    }

    // Fetch the corresponding category
    const category = await Category.findOne({ name: tag }).lean().exec();
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    // Check if we have valid coordinates for location-based sorting
    const hasValidCoordinates = lat !== 'undefined' && long !== 'undefined' && 
                               !isNaN(Number(lat)) && !isNaN(Number(long));

    // Find users with the fetched tag ID and paginate the results
    // Performance optimization: adjust query based on whether location sorting is needed
    const queryOptions = { tags: fetchedTag._id };
    const sortOptions = hasValidCoordinates ? {} : { _id: -1 }; // Only sort by _id if no location sorting
    
    let users = await User.find(queryOptions)
      .select('fullName avatar bio locations tags') // Only select needed fields for performance
      .skip(skip)
      .limit(limit)
      .lean()
      .sort(sortOptions)
      .exec();
    
    if (hasValidCoordinates) {
      const userLat = Number(lat);
      const userLong = Number(long);
      
      users = users.map(user => {
        let kmAway = undefined;
        if (user.locations && Array.isArray(user.locations) && user.locations.length > 0) {
          const nearestLocation = getNearestLocation(userLat, userLong, user.locations);
          kmAway = nearestLocation?.distance;
        }
        return { ...user, kmAway };
      });
      
      // Sort by distance (closest first) if location data available
      users.sort((a, b) => {
        if (a.kmAway !== undefined && b.kmAway !== undefined) {
          return a.kmAway - b.kmAway;
        }
        if (a.kmAway !== undefined) return -1;
        if (b.kmAway !== undefined) return 1;
        return 0;
      });
      
      // Performance note: For very large datasets, consider implementing geospatial indexing
      // using MongoDB's 2dsphere index for location-based queries
    }
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No users found with the specified tag",
      });
    }

    // Fetch stories for each user that match the category and attach them to the user object
    for (let user of users) {
      const userStories = await Story.find({ author: user._id })
        .populate("dishes")
        .populate("category", "name") // Assuming the category schema has a 'name' field
        .lean()
        .exec();
      user.stories = userStories; // Attach stories to the user object
    }

    const totalUsers = await User.countDocuments({ tags: fetchedTag._id });

    res.json({
      users,
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      success: true,
    });
  } catch (err) {
    console.error("error", err);
    res
      .status(500)
      .json({ success: false, error: "Error fetching users by tag" });
  }
};

module.exports = getUserByTag;
