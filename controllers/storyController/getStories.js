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
  console.log(`[DEBUG] getNearestLocation called with targetLat=${targetLat}, targetLong=${targetLong}, locations length=${locations?.length || 0}`);
  
  if (!Array.isArray(locations) || locations.length === 0) {
    console.log(`[DEBUG] getNearestLocation returning undefined - locations is empty or not an array`);
    return undefined;
  }

  // Make sure we have valid coordinates
  if (isNaN(targetLat) || isNaN(targetLong)) {
    console.log(`[DEBUG] getNearestLocation returning undefined - targetLat or targetLong is NaN`);
    return undefined;
  }

  // Radius of the Earth in kilometers
  const earthRadius = 6371;

  // Initialize variables to track the nearest location and its distance
  let nearestLocation = null;
  let nearestDistance = Infinity;

  // Iterate through the list of locations
  for (const location of locations) {
    const { lat, long } = location;
    
    // Skip invalid coordinates
    if (isNaN(lat) || isNaN(long)) {
      console.log(`[DEBUG] Skipping location with invalid coordinates: lat=${lat}, long=${long}`);
      continue;
    }

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
  
  // Return result with appropriate precision
  const result = {
    nearestLocation,
    distance: nearestDistance !== Infinity ? parseFloat(nearestDistance.toFixed(2)) : undefined,
  };
  
  console.log(`[DEBUG] getNearestLocation returning distance=${result.distance}`);
  return result;
}

// Helper function to convert degrees to radians
function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}

const getStories = async (req, res) => {
  console.log(`[PERFORMANCE] getStories START: ${new Date().toISOString()}`);
  
  const { page = 1, limit = 10, categoryIds, lat, long } = req.query;
  const errors = {};
  const pageSize = parseInt(limit);
  const userId = req.user?._id?.toString();
  
  console.log(`[DEBUG] User coordinates: lat=${lat}, long=${long}`);

  try {
    // Build the query params for category filtering
    let categoryMatch = {};
    if(categoryIds?.length){
      categoryMatch = { category: { $in: categoryIds.split(',') } };
    }

    // Distance ranges for grouping stories (in km)
    const distanceRanges = [
      { max: 30, stories: [] },
      { max: 60, stories: [] },
      { max: 70, stories: [] },
      { max: 80, stories: [] },
      { max: Infinity, stories: [] }
    ];

    let allStories = [];
    const hasValidCoordinates = lat !== 'undefined' && long !== 'undefined' && 
                               !isNaN(Number(lat)) && !isNaN(Number(long));

    if (hasValidCoordinates) {
      const userLat = Number(lat);
      const userLong = Number(long);
      
      console.log(`[DEBUG] Using geospatial query with $geoNear`);
      const geoStartTime = Date.now();
      
      try {
        // Use $geoNear for efficient distance-based query
        const geoNearPipeline = [
          {
            $geoNear: {
              near: { 
                type: "Point", 
                coordinates: [Number(long), Number(lat)] 
              },
              distanceField: "calcDistance",
              maxDistance: 80000, // 80km in meters
              spherical: true,
              query: categoryMatch
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author"
            }
          },
          {
            $unwind: "$author"
          },
          {
            $lookup: {
              from: "dishes",
              localField: "dishes",
              foreignField: "_id",
              as: "dishes"
            }
          },
          {
            $sort: { calcDistance: 1, createdAt: -1 }
          }
        ];

        // Execute the geoNear pipeline
        const storiesWithLocation = await Story.aggregate(geoNearPipeline);
        console.log(`[PERFORMANCE] $geoNear query took ${Date.now() - geoStartTime}ms, found ${storiesWithLocation.length} stories`);

        // Process stories with location data
        storiesWithLocation.forEach(story => {
          // Convert distance from meters to kilometers
          story.kmAway = parseFloat((story.calcDistance / 1000).toFixed(2));
          
          // Place in the appropriate distance range
          let rangeIndex = -1;
          for (let i = 0; i < distanceRanges.length; i++) {
            if (story.kmAway <= distanceRanges[i].max) {
              rangeIndex = i;
              break;
            }
          }
          
          if (rangeIndex >= 0) {
            distanceRanges[rangeIndex].stories.push(story);
          } else {
            distanceRanges[distanceRanges.length - 1].stories.push(story);
          }
        });
        
        allStories = allStories.concat(storiesWithLocation);
      } catch (geoError) {
        console.error(`[ERROR] $geoNear query failed, falling back to regular query:`, geoError);
        
        // FALLBACK: If geoNear fails due to missing index, fetch all stories and calculate distances manually
        console.log(`[DEBUG] Falling back to manual distance calculation`);
        const fallbackStartTime = Date.now();
        
        // Get ALL stories first, then filter by location
        const allStoriesWithAuthor = await Story.find(categoryMatch)
          .populate("author")
          .populate("dishes")
          .lean()
          .sort({ createdAt: -1 });
        
        console.log(`[PERFORMANCE] Fetching all stories took ${Date.now() - fallbackStartTime}ms, found ${allStoriesWithAuthor.length} stories`);
        
        // Separate stories with and without locations
        const storiesWithLocation = [];
        const storiesWithoutLocation = [];
        
        allStoriesWithAuthor.forEach(story => {
          // Check if story has valid author with locations
          if (story.author && 
              story.author.locations && 
              Array.isArray(story.author.locations) && 
              story.author.locations.length > 0) {
            storiesWithLocation.push(story);
          } else {
            storiesWithoutLocation.push(story);
          }
        });
        
        console.log(`[DEBUG] Found ${storiesWithLocation.length} stories with location data and ${storiesWithoutLocation.length} without`);
        
        // Calculate distances manually using getNearestLocation function
        const calcStartTime = Date.now();
        storiesWithLocation.forEach(story => {
          try {
            // Calculate distance using Haversine formula
            const result = getNearestLocation(userLat, userLong, story.author.locations);
            story.kmAway = result?.distance;
            
            console.log(`[DEBUG] Story ${story._id} - Author: ${story.author?._id}, Locations: ${story.author?.locations?.length}, kmAway: ${story.kmAway}`);
            
            // Place in the appropriate distance range
            if (story.kmAway !== undefined) {
              let rangeIndex = -1;
              for (let i = 0; i < distanceRanges.length; i++) {
                if (story.kmAway <= distanceRanges[i].max) {
                  rangeIndex = i;
                  break;
                }
              }
              
              if (rangeIndex >= 0) {
                distanceRanges[rangeIndex].stories.push(story);
              } else {
                distanceRanges[distanceRanges.length - 1].stories.push(story);
              }
            } else {
              // If distance calculation failed, add to the last range
              distanceRanges[distanceRanges.length - 1].stories.push(story);
            }
          } catch (e) {
            console.error(`[ERROR] Manual distance calculation failed for story ${story._id}:`, e);
            story.kmAway = undefined;
            distanceRanges[distanceRanges.length - 1].stories.push(story);
          }
        });
        
        console.log(`[PERFORMANCE] Manual distance calculation took ${Date.now() - calcStartTime}ms`);
        allStories = allStories.concat(storiesWithLocation);
        
        // Add stories without location to the last range
        storiesWithoutLocation.forEach(story => {
          story.kmAway = undefined;
          distanceRanges[distanceRanges.length - 1].stories.push(story);
        });
        allStories = allStories.concat(storiesWithoutLocation);
      }
      
      // Now get stories without location data separately
      const noLocStartTime = Date.now();
      const noLocationStories = await Story.find({
        ...categoryMatch,
        $or: [
          { 'author.locations': { $exists: false } },
          { 'author.locations': [] }
        ]
      })
        .populate("author")
        .populate("dishes")
        .lean()
        .sort({ createdAt: -1 });
      
      console.log(`[PERFORMANCE] Fetching no-location stories took ${Date.now() - noLocStartTime}ms, found ${noLocationStories.length} stories`);
      
      // Add stories without location to the last range
      noLocationStories.forEach(story => {
        story.kmAway = undefined;
        distanceRanges[distanceRanges.length - 1].stories.push(story);
      });
      
      allStories = allStories.concat(noLocationStories);
    } else {
      // If no location data provided or both are 0, sort by recency and add random shuffle
      console.log(`[DEBUG] No location data provided, using recency-biased randomization`);
      
      // Get stories sorted by recency first
      let stories = await Story.find(categoryMatch)
        .populate("author")
        .populate("dishes")
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(pageSize * 3)     // Get more for better randomization but limit for performance
        .lean();
        
      console.log(`[DEBUG] Fetched ${stories.length} stories sorted by recency`);
      
      // Split stories into "newer" (first third) and "older" (remaining two-thirds)
      const newerStoriesCount = Math.max(Math.floor(stories.length / 3), 1);
      const newerStories = stories.slice(0, newerStoriesCount);
      const olderStories = stories.slice(newerStoriesCount);
      
      console.log(`[DEBUG] Split into ${newerStories.length} newer stories and ${olderStories.length} older stories`);
      
      // Shuffle both groups separately
      shuffleArray(newerStories);
      shuffleArray(olderStories);
      
      // Interleave newer and older stories with bias toward newer (2:1 ratio)
      const result = [];
      const maxLength = Math.max(newerStories.length * 2, olderStories.length);
      
      for (let i = 0; i < maxLength; i++) {
        // Add newer story every 1st and 2nd position in each triplet
        if (i % 3 !== 2 && newerStories.length > 0) {
          result.push(newerStories.shift());
        } 
        // Add older story every 3rd position
        else if (olderStories.length > 0) {
          result.push(olderStories.shift());
        }
      }
      
      // Add any remaining stories
      result.push(...newerStories, ...olderStories);
      
      console.log(`[DEBUG] After recency-biased randomization, returning ${result.length} stories`);
      
      // Add missing kmAway property to satisfy client expectations
      result.forEach(story => {
        story.kmAway = undefined;
      });
      
      return res.status(200).json({
        message: result.length ? "Stories fetched successfully" : "No stories found",
        stories: result.slice(0, pageSize), // Return only requested page size
        totalPages: 1,
        currentPage: 1,
      });
    }

    // Get total count for pagination (optimize by using countDocuments)
    const countStartTime = Date.now();
    const count = await Story.countDocuments(categoryMatch);
    console.log(`[PERFORMANCE] Counting documents took ${Date.now() - countStartTime}ms, total: ${count}`);

    // If we have user ID, check likes for all stories in one query
    if (userId && allStories.length > 0) {
      console.log(`[DEBUG] Checking likes for user ${userId}`);
      const likeStartTime = Date.now();
      const allLikes = await Like.find({
        post_id: { $in: allStories.map(story => story._id) },
        user_id: userId
      }).lean();
      console.log(`[PERFORMANCE] Fetching likes took ${Date.now() - likeStartTime}ms, found ${allLikes.length} likes`);

      // Create a map of story IDs to likes for quick lookup
      const likeMap = new Map();
      allLikes.forEach(like => {
        likeMap.set(like.post_id.toString(), true);
      });

      // Add like info to stories
      allStories.forEach(story => {
        story.currentUserLiked = likeMap.has(story._id.toString());
      });
    }

    // Count stories in each range before shuffling
    distanceRanges.forEach((range, index) => {
      console.log(`[DEBUG] Range ${index} (max: ${range.max}km) has ${range.stories.length} stories before shuffling`);
    });

    // Shuffle stories within each range
    const shuffleStartTime = Date.now();
    distanceRanges.forEach(range => {
      range.stories = shuffleArray(range.stories);
    });
    console.log(`[PERFORMANCE] Shuffling stories took ${Date.now() - shuffleStartTime}ms`);

    // Flatten all stories preserving the range order
    const sortedStories = distanceRanges.flatMap(range => range.stories);
    console.log(`[DEBUG] Total sorted stories: ${sortedStories.length}`);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedStories = sortedStories.slice(startIndex, startIndex + pageSize);
    console.log(`[DEBUG] Returning ${paginatedStories.length} stories for page ${page}`);

    console.log(`[PERFORMANCE] getStories END: ${new Date().toISOString()}, total time: ${Date.now() - new Date(req.query.startTime || Date.now()).getTime()}ms`);
    
    res.json({
      stories: paginatedStories || [],
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    });
  } catch (err) {
    console.error(`[ERROR] Error in getStories:`, err);
    errors.error = "Error fetching stories from the database";
    res.status(500).json({ ...errors, message: err.message });
  }
};

module.exports = getStories;
