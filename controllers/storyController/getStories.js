const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model('like');
const View = mongoose.model('view');

// Instagram/Facebook-like recommendation algorithm
function calculateRecommendationScore(story, userLocation, viewedStoryIds, currentTime) {
  let score = 0;
  
  // Factor 1: Recency Score (0-40 points)
  const storyCreatedAt = story.created_at || story.createdAt || new Date();
  const storyAge = (currentTime - new Date(storyCreatedAt).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 40 * Math.exp(-storyAge / 24));
  score += recencyScore;
  
  // Factor 2: View History Score (0-35 points)
  const isViewed = viewedStoryIds.has(story._id.toString());
  const viewScore = isViewed ? 5 : 35;
  score += viewScore;
  
  // Factor 3: Location Proximity Score (0-30 points) - Increased weight
  let locationScore = 0;
  if (story.kmAway !== undefined && story.kmAway !== null) {
    if (story.kmAway <= 5) locationScore = 30;
    else if (story.kmAway <= 15) locationScore = 25;
    else if (story.kmAway <= 30) locationScore = 20;
    else if (story.kmAway <= 50) locationScore = 15;
    else if (story.kmAway <= 80) locationScore = 8;
    else if (story.kmAway <= 150) locationScore = 4;
    else locationScore = 1;
  } else {
    locationScore = 10; // Reduced default for unknown locations
  }
  score += locationScore;
  
  // Factor 4: Engagement Score (0-15 points)
  const likesScore = Math.min(8, (story.likesNo || 0) * 0.1);
  const viewsScore = Math.min(7, (story.views || 0) * 0.01);
  score += likesScore + viewsScore;
  
  // Factor 5: Randomness Factor (0-10 points)
  const randomScore = Math.random() * 10;
  score += randomScore;
  
  // Factor 6: Content Quality Factors (0-10 points)
  let qualityScore = 0;
  if (story.caption && story.caption.length > 10) qualityScore += 2;
  if (story.dishes && story.dishes.length > 0) qualityScore += 3;
  if (story.reviewMode) qualityScore += 3;
  if (story.poster) qualityScore += 2;
  score += qualityScore;
  
  return score;
}

// Enhanced shuffle function
function shuffleWithBias(array, biasStrength = 0.3) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const maxSwapDistance = Math.floor((1 - biasStrength) * i + 1);
    const swapIndex = Math.max(0, i - Math.floor(Math.random() * maxSwapDistance));
    [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
  }
  return result;
}

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
  
  const result = {
    nearestLocation,
    distance: nearestDistance !== Infinity ? parseFloat(nearestDistance.toFixed(2)) : undefined,
  };
  
  return result;
}

function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}

const getStories = async (req, res) => {
  console.log(`[PERFORMANCE] Enhanced getStories START: ${new Date().toISOString()}`);
  
  const { page = 1, limit = 10, categoryIds, lat, long } = req.query;
  const errors = {};
  const pageSize = parseInt(limit);
  const userId = req.user?._id?.toString();
  const currentTime = Date.now();
  
  console.log(`[DEBUG] User: ${userId}, Coordinates: lat=${lat}, long=${long}`);

  try {
    // Build query for category filtering
    let categoryMatch = {};
    if(categoryIds?.length){
      categoryMatch = { category: { $in: categoryIds.split(',') } };
    }

    // Get user's viewed stories for recommendation scoring
    let viewedStoryIds = new Set();
    if (userId) {
      const userViews = await View.find({ user_id: userId }).lean();
      viewedStoryIds = new Set(userViews.map(view => view.story.toString()));
    }

    const hasValidCoordinates = lat !== 'undefined' && long !== 'undefined' && 
                               !isNaN(Number(lat)) && !isNaN(Number(long));

    let allStories = [];
    
    if (hasValidCoordinates) {
      const userLat = Number(lat);
      const userLong = Number(long);
      
      // Get stories with proper population - this ensures all data is maintained
      const storiesWithLocation = await Story.find(categoryMatch)
        .populate("author")
        .populate("dishes")
        .lean()
        .sort({ created_at: -1 })
        .limit(pageSize * 3);

      // Calculate distances and scores, ensure avatarUri is populated
      storiesWithLocation.forEach(story => {
        if (story.author && story.author.locations && Array.isArray(story.author.locations)) {
          const result = getNearestLocation(userLat, userLong, story.author.locations);
          story.kmAway = result?.distance;
        } else {
          story.kmAway = undefined;
        }
        // Fix: Ensure avatarUri is populated (ReelComponent expects this field)
        if (!story.avatarUri && story.poster) {
          story.avatarUri = story.poster;
        }
        story._recommendationScore = calculateRecommendationScore(story, { lat: userLat, long: userLong }, viewedStoryIds, currentTime);
      });
      
      allStories = storiesWithLocation;
      
    } else {
      // No location data - get stories with proper population
      const stories = await Story.find(categoryMatch)
        .populate("author")
        .populate("dishes")
        .sort({ created_at: -1 })
        .limit(pageSize * 3)
        .lean();
        
      // Calculate recommendation scores without location factor, ensure avatarUri is populated
      stories.forEach(story => {
        story.kmAway = undefined;
        // Fix: Ensure avatarUri is populated (ReelComponent expects this field)
        if (!story.avatarUri && story.poster) {
          story.avatarUri = story.poster;
        }
        story._recommendationScore = calculateRecommendationScore(story, null, viewedStoryIds, currentTime);
      });
      
      allStories = stories;
    }

    // Enhanced recommendation sorting algorithm
    allStories.sort((a, b) => b._recommendationScore - a._recommendationScore);
    
    // Create proximity-based groups for better distribution - Enhanced location prioritization
    const proximityGroups = {
      veryClose: [],
      close: [],
      nearby: [],
      distant: []
    };
    
    allStories.forEach(story => {
      // Prioritize unseen, high-scoring, very close stories
      if (!viewedStoryIds.has(story._id.toString()) && story._recommendationScore > 70) {
        proximityGroups.veryClose.push(story);
      } else if (story.kmAway !== undefined) {
        // Stricter location-based grouping
        if (story.kmAway <= 10) proximityGroups.veryClose.push(story);        // Within 10km
        else if (story.kmAway <= 50) proximityGroups.close.push(story);       // 10-50km 
        else if (story.kmAway <= 150) proximityGroups.nearby.push(story);     // 50-150km
        else proximityGroups.distant.push(story);                            // 150km+
      } else {
        proximityGroups.distant.push(story);
      }
    });
    
    // Apply smart shuffling within each group
    Object.keys(proximityGroups).forEach(group => {
      proximityGroups[group] = shuffleWithBias(proximityGroups[group], 0.4);
    });
    
    // Interleave groups with bias toward closer/higher-score stories
    const finalStories = [];
    const maxGroupSize = Math.max(
      proximityGroups.veryClose.length,
      proximityGroups.close.length, 
      proximityGroups.nearby.length,
      proximityGroups.distant.length
    );
    
    for (let i = 0; i < maxGroupSize; i++) {
      if (proximityGroups.veryClose.length > 0 && (Math.random() < 0.6 || i < proximityGroups.veryClose.length)) {
        finalStories.push(proximityGroups.veryClose.shift());
      }
      if (proximityGroups.close.length > 0 && (Math.random() < 0.25 || finalStories.length === 0)) {
        finalStories.push(proximityGroups.close.shift());
      }
      if (proximityGroups.nearby.length > 0 && (Math.random() < 0.1 || finalStories.length === 0)) {
        finalStories.push(proximityGroups.nearby.shift());
      }
      if (proximityGroups.distant.length > 0 && (Math.random() < 0.05 || finalStories.length === 0)) {
        finalStories.push(proximityGroups.distant.shift());
      }
    }
    
    // Add any remaining stories
    finalStories.push(
      ...proximityGroups.veryClose,
      ...proximityGroups.close,
      ...proximityGroups.nearby,
      ...proximityGroups.distant
    );

    // Get total count for pagination
    const count = await Story.countDocuments(categoryMatch);

    // Check likes for all stories in one query if user exists
    if (userId && finalStories.length > 0) {
      const allLikes = await Like.find({
        post_id: { $in: finalStories.map(story => story._id) },
        user_id: userId
      }).lean();
      
      const likeMap = new Map();
      allLikes.forEach(like => {
        likeMap.set(like.post_id.toString(), true);
      });

      finalStories.forEach(story => {
        story.currentUserLiked = likeMap.has(story._id.toString());
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedStories = finalStories.slice(startIndex, startIndex + pageSize);
    
    // Clean up debug info before sending to client
    paginatedStories.forEach(story => {
      delete story._recommendationScore;
    });

    console.log(`[DEBUG] Returning ${paginatedStories.length} stories for page ${page}`);
    console.log(`[PERFORMANCE] Enhanced getStories END: total time: ${Date.now() - currentTime}ms`);
    
    res.json({
      stories: paginatedStories || [],
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      message: paginatedStories.length ? "Stories fetched with enhanced recommendation" : "No stories found"
    });
    
  } catch (err) {
    console.error(`[ERROR] Error in enhanced getStories:`, err);
    errors.error = "Error fetching stories from the database";
    res.status(500).json({ ...errors, message: err.message });
  }
};

module.exports = getStories;
