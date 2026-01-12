const mongoose = require("mongoose");
const cacheManager = require('../../utils/cacheManager');

// Models
const Story = mongoose.model("story");
const Like = mongoose.model('like');
const View = mongoose.model('view');
const Dish = mongoose.model('dish');

/**
 * SCORING ALGORITHM
 * Calculates a relevance score (0-150+) for a story relative to a specific user context.
 */
function calculateRecommendationScore(story, userLocation, viewedStoryIds, preferredCategories, currentTime) {
  let score = 0;

  // 1. Recency Score (0-40 points)
  // Decay: Half-life of 24 hours. Freshness is key.
  const storyCreatedAt = story.created_at || story.createdAt || new Date();
  const storyAge = (currentTime - new Date(storyCreatedAt).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 40 * Math.exp(-storyAge / 24));
  score += recencyScore;

  // 2. View History Logic (The "Pivot")
  const isViewed = viewedStoryIds.has(story._id.toString());

  if (isViewed) {
    // BURIAL: If seen, massive penalty. We effectively hide it unless it's the only content left.
    score -= 30;
  } else {
    // BOOST: If unseen AND matches user interest, big bonus.
    // Check if story category matches any of the user's top categories
    let isPreferred = false;
    if (story.category && Array.isArray(story.category)) {
      isPreferred = story.category.some(catId => preferredCategories.has(catId.toString()));
    } else if (story.category) {
      isPreferred = preferredCategories.has(story.category.toString());
    }

    if (isPreferred) {
      score += 15; // "More like this" Bonus
    }
  }

  // 3. Location Proximity Score (0-30 points)
  // Essential for a food app. Near = Better.
  let locationScore = 0;
  if (story.kmAway !== undefined && story.kmAway !== null) {
    if (story.kmAway <= 5) locationScore = 30;
    else if (story.kmAway <= 15) locationScore = 25;
    else if (story.kmAway <= 30) locationScore = 20;
    else if (story.kmAway <= 50) locationScore = 15;
    else if (story.kmAway <= 80) locationScore = 8;
    else locationScore = 1;
  } else {
    locationScore = 5; // Reduced default
  }
  score += locationScore;

  // 4. Engagement Score (0-15 points)
  // Popularity signal
  const likesScore = Math.min(8, (story.likesNo || 0) * 0.1);
  const viewsScore = Math.min(7, (story.views || 0) * 0.01);
  score += likesScore + viewsScore;

  // 5. Randomness Factor (0-10 points)
  // Prevents deterministic boredom
  score += Math.random() * 10;

  // 6. Quality/Completeness Bonus (0-10 points)
  if (story.caption && story.caption.length > 10) score += 2;
  if (story.dishes && story.dishes.length > 0) score += 3;
  if (story.reviewMode) score += 3;

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
  if (!Array.isArray(locations) || locations.length === 0) return undefined;
  if (isNaN(targetLat) || isNaN(targetLong)) return undefined;

  const earthRadius = 6371;
  let nearestLocation = null;
  let nearestDistance = Infinity;

  // Simple Haversine
  for (const location of locations) {
    const { lat, long } = location;
    if (isNaN(lat) || isNaN(long)) continue;

    const latDiff = (lat - targetLat) * (Math.PI / 180);
    const longDiff = (long - targetLong) * (Math.PI / 180);

    const a =
      Math.sin(latDiff / 2) ** 2 +
      Math.cos(targetLat * (Math.PI / 180)) *
      Math.cos(lat * (Math.PI / 180)) *
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

/**
 * GENERATE FEED (Heavy Operation)
 * Fetches candidates, analyzes user interest, scores, and returns ORDERED LIST OF IDs.
 */
async function generateNewFeed(userId, categoryIds, userLat, userLong) {
  const startTime = Date.now();
  console.log(`[FEED GEN] Starting feed generation for user ${userId}`);

  // 1. Build Query for Candidates
  // Limit to last 60 days for performance/relevance
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  let query = { created_at: { $gte: sixtyDaysAgo } };
  if (categoryIds && categoryIds.length) {
    query.category = { $in: categoryIds.split(',') };
  }

  // 2. Fetch Candidates
  const candidates = await Story.find(query)
    .select('created_at author likesNo views caption dishes reviewMode poster category')
    .populate('author', 'locations')
    .sort({ created_at: -1 })
    .limit(1000)
    .lean();

  // 3. Analyze User History (Implicit Interest Tracking)
  let viewedStoryIds = new Set();
  let preferredCategories = new Set();

  if (userId) {
    // Fetch last 50 views
    const userViews = await View.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('story', 'category') // Populate category of viewed stories
      .lean();

    // Count Categories
    const categoryCounts = {};
    userViews.forEach(view => {
      viewedStoryIds.add(view.story?._id?.toString() || view.story?.toString());

      // Track category preference
      if (view.story && view.story.category) {
        // Handle array or single category
        const cats = Array.isArray(view.story.category) ? view.story.category : [view.story.category];
        cats.forEach(cat => {
          const catId = cat.toString();
          categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
        });
      }
    });

    // Determine Top Categories (Threshold: Viewed > 2 items in this cat)
    Object.entries(categoryCounts).forEach(([catId, count]) => {
      if (count >= 2) preferredCategories.add(catId);
    });

    console.log(`[FEED GEN] User Interests: ${[...preferredCategories].length} categories`);
  }

  // 4. Score Candidates
  const currentTime = Date.now();
  const hasValidCoordinates = userLat && userLong && !isNaN(userLat) && !isNaN(userLong);

  candidates.forEach(story => {
    // Calc Distance
    if (hasValidCoordinates && story.author && story.author.locations) {
      const result = getNearestLocation(Number(userLat), Number(userLong), story.author.locations);
      story.kmAway = result?.distance;
    } else {
      story.kmAway = undefined;
    }

    // Assign Score
    story._score = calculateRecommendationScore(
      story,
      { lat: userLat, long: userLong },
      viewedStoryIds,
      preferredCategories,
      currentTime
    );
  });

  // 5. Sort & Bucket
  candidates.sort((a, b) => b._score - a._score);

  const buckets = {
    veryClose: [], // High Priority (Local OR High Score)
    close: [],
    nearby: [],
    distant: []    // Low Priority (Distant OR Viewed)
  };

  candidates.forEach(story => {
    // Special Rule: If score is very low (likely viewed), force to distant
    if (story._score < 0) {
      buckets.distant.push(story);
      return;
    }

    // Normal Bucketing
    if (story._score > 80) { // High Score (Hot + Nearby + Unseen)
      buckets.veryClose.push(story);
    } else if (story.kmAway !== undefined) {
      if (story.kmAway <= 10) buckets.veryClose.push(story);
      else if (story.kmAway <= 50) buckets.close.push(story);
      else if (story.kmAway <= 150) buckets.nearby.push(story);
      else buckets.distant.push(story);
    } else {
      buckets.distant.push(story);
    }
  });

  // Shuffle Groups
  Object.keys(buckets).forEach(key => buckets[key] = shuffleWithBias(buckets[key], 0.4));

  // Interleave
  const orderedIds = [];
  const maxLen = Math.max(...Object.values(buckets).map(b => b.length));

  for (let i = 0; i < maxLen; i++) {
    // 60% Chance for Top Content
    if (buckets.veryClose.length) {
      if (Math.random() < 0.6 || i < buckets.veryClose.length) orderedIds.push(buckets.veryClose.shift()._id);
    }
    // 25% Chance for Close
    if (buckets.close.length) {
      if (Math.random() < 0.25 || orderedIds.length === 0) orderedIds.push(buckets.close.shift()._id);
    }
    // 10% Chance for Nearby
    if (buckets.nearby.length) {
      if (Math.random() < 0.1 || orderedIds.length === 0) orderedIds.push(buckets.nearby.shift()._id);
    }
    // 5% Chance for Distant/Viewed
    if (buckets.distant.length) {
      if (Math.random() < 0.05 || orderedIds.length === 0) orderedIds.push(buckets.distant.shift()._id);
    }
  }

  // Append remainders
  ['veryClose', 'close', 'nearby', 'distant'].forEach(k => {
    while (buckets[k].length) orderedIds.push(buckets[k].shift()._id);
  });

  const uniqueOrderedIds = [...new Set(orderedIds.map(id => id.toString()))];
  console.log(`[FEED GEN] Generated feed with ${uniqueOrderedIds.length} items from ${candidates.length} candidates`);

  return uniqueOrderedIds;
}


const getStories = async (req, res) => {
  const startTime = Date.now();
  const { page = 1, limit = 10, categoryIds, lat, long, refresh } = req.query;
  const userId = req.user?._id?.toString() || 'anonymous';
  const pageSize = parseInt(limit);

  // Cache Key Strategy:
  // - User Specific
  // - Location (Rounded)
  // - Categories
  const latKey = lat ? Math.round(Number(lat) * 100) / 100 : 'noc';
  const longKey = long ? Math.round(Number(long) * 100) / 100 : 'noc';
  const catKey = categoryIds || 'all';
  const feedCacheKey = `feed:${userId}:${catKey}:${latKey}:${longKey}`;

  try {
    let feedIds = [];
    let isCached = false;

    // 1. Check Redis (Skip if refreshing)
    if (cacheManager.isConnected && refresh !== 'true') {
      const cachedFeed = await cacheManager.client.get(feedCacheKey);
      if (cachedFeed) {
        feedIds = JSON.parse(cachedFeed);
        isCached = true;
      }
    }

    // 2. Generate New Feed if needed
    if (!isCached || feedIds.length === 0) {
      feedIds = await generateNewFeed(userId === 'anonymous' ? null : userId, categoryIds, lat, long);

      // Cache for 15 minutes
      if (cacheManager.isConnected && feedIds.length > 0) {
        await cacheManager.client.setEx(feedCacheKey, 900, JSON.stringify(feedIds));
      }
    }

    // 3. Pagination (O(1))
    const startIndex = (page - 1) * pageSize;
    const pageIds = feedIds.slice(startIndex, startIndex + pageSize);

    if (pageIds.length === 0) {
      return res.json({
        stories: [],
        totalPages: Math.ceil(feedIds.length / pageSize),
        currentPage: page,
        message: "No more stories"
      });
    }

    // 4. Fetch Details
    const stories = await Story.find({ _id: { $in: pageIds } })
      .populate("author")
      .populate("dishes")
      .lean();

    // 5. Re-Order
    const storyMap = new Map(stories.map(s => [s._id.toString(), s]));
    const orderedStories = pageIds.map(id => storyMap.get(id)).filter(Boolean);

    // 6. Hydrate (Likes, Ratings)
    if (userId !== 'anonymous') {
      const allLikes = await Like.find({
        post_id: { $in: orderedStories.map(s => s._id) },
        user_id: userId
      }).select('post_id').lean();
      const likeSet = new Set(allLikes.map(l => l.post_id.toString()));
      orderedStories.forEach(s => s.currentUserLiked = likeSet.has(s._id.toString()));
    }

    // Aggregate Author Ratings
    const uniqueAuthorIds = [...new Set(orderedStories.map(s => s.author?._id))];
    if (uniqueAuthorIds.length > 0) {
      const authorRatings = await Dish.aggregate([
        { $match: { user_id: { $in: uniqueAuthorIds } } },
        { $group: { _id: "$user_id", avg: { $avg: "$average_rating" }, count: { $sum: 1 } } }
      ]);
      const ratingMap = new Map(authorRatings.map(r => [r._id.toString(), r]));

      orderedStories.forEach(s => {
        if (s.author) {
          const r = ratingMap.get(s.author._id.toString());
          s.author.averageDishRating = r ? parseFloat(r.avg.toFixed(1)) : 0;
          s.author.ratedDishesCount = r ? r.count : 0;
          if (!s.avatarUri && s.poster) s.avatarUri = s.poster;

          if (lat && long && s.author.locations) {
            const loc = getNearestLocation(Number(lat), Number(long), s.author.locations);
            s.kmAway = loc?.distance;
          }
        }
      });
    }

    res.json({
      stories: orderedStories,
      totalPages: Math.ceil(feedIds.length / pageSize),
      currentPage: page
    });

  } catch (error) {
    console.error("[GET STORIES] Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = getStories;
