const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model('like');
const View = mongoose.model('view');
const Dish = mongoose.model('dish');
const Follow = mongoose.model('follow');

// Utils
const {
  calculateRecommendationScore,
  bucketByPriority,
  interleaveBuckets,
  FEED_EXPIRY
} = require('../../utils/storyFeedUtils');
const { getNearestBranchBatch } = require('../../utils/getNearestBranch');
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');

// Simple in-memory storage for pagination consistency (no external dependencies)
const userFeeds = new Map();

// Configuration
const TIER1_CANDIDATE_LIMIT = 500;   // Hot+Recent content (fast scoring)
const TIER2_CANDIDATE_LIMIT = 300;   // Extended content (scored on demand)
const MAX_FEED_SIZE = 1000;          // Max items in a single feed before fallback
const FEED_CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // Cleanup every 10 minutes

// Periodic cleanup of old feeds to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, feed] of userFeeds.entries()) {
    if (now - feed.timestamp > FEED_EXPIRY * 3) {
      userFeeds.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[FEED CLEANUP] Removed ${cleaned} expired feeds`);
  }
}, FEED_CACHE_CLEANUP_INTERVAL);

/**
 * TIERED CANDIDATE FETCHING
 * Instead of fetching all 1000 at once, fetch in priority tiers
 */
async function fetchCandidatesTiered(categoryQuery, limit, extraFilters = {}) {
  const now = new Date();
  // Merge extra filters into the category query
  const baseQuery = { ...categoryQuery, ...extraFilters };
  const results = [];

  // TIER 1: Hot content (last 7 days) - most likely to be relevant
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const tier1 = await Story.find({ ...baseQuery, created_at: { $gte: sevenDaysAgo } })
    .select('created_at author likesNo views commentsNo caption dishes reviewMode poster category avgCompletionRate rewatchCount shareCount')
    .populate('author', 'locations type')
    .sort({ created_at: -1 })
    .limit(Math.min(limit, TIER1_CANDIDATE_LIMIT))
    .lean();

  results.push(...tier1);

  // TIER 2: Extended content (7-30 days) - only if we need more
  if (results.length < limit) {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const tier2 = await Story.find({
      ...baseQuery,
      created_at: { $gte: thirtyDaysAgo, $lt: sevenDaysAgo }
    })
      .select('created_at author likesNo views commentsNo caption dishes reviewMode poster category avgCompletionRate rewatchCount shareCount')
      .populate('author', 'locations type')
      .sort({ likesNo: -1 }) // Sort by engagement for older content
      .limit(Math.min(limit - results.length, TIER2_CANDIDATE_LIMIT))
      .lean();

    results.push(...tier2);
  }

  // TIER 3: Archive content (30-60 days) - only if needed
  if (results.length < limit) {
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const tier3 = await Story.find({
      ...baseQuery,
      created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    })
      .select('created_at author likesNo views commentsNo caption dishes reviewMode poster category avgCompletionRate rewatchCount shareCount')
      .populate('author', 'locations type')
      .sort({ views: -1 }) // Sort by views for archive
      .limit(Math.min(limit - results.length, 200))
      .lean();

    results.push(...tier3);
  }

  return results;
}

/**
 * OPTIMIZED USER HISTORY FETCH
 * Use aggregation for faster processing
 */
async function getUserViewHistory(userId) {
  if (!userId) return { viewedIds: new Set(), preferredCategories: new Set() };

  const userViews = await View.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    { $sort: { created_at: -1 } },
    { $limit: 100 },
    {
      $lookup: {
        from: 'stories',
        localField: 'story',
        foreignField: '_id',
        as: 'storyData'
      }
    },
    { $unwind: { path: '$storyData', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        viewedIds: { $addToSet: '$story' },
        categories: { $push: '$storyData.category' }
      }
    }
  ]);

  if (!userViews.length) {
    return { viewedIds: new Set(), preferredCategories: new Set() };
  }

  const viewedIds = new Set(userViews[0].viewedIds.map(id => id.toString()));

  // Count category occurrences
  const categoryCounts = {};
  userViews[0].categories.flat().forEach(cat => {
    if (cat) {
      const catId = cat.toString();
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    }
  });

  // Preferred = viewed 2+ times
  const preferredCategories = new Set(
    Object.entries(categoryCounts)
      .filter(([_, count]) => count >= 2)
      .map(([catId]) => catId)
  );

  return { viewedIds, preferredCategories };
}

/**
 * GENERATE FEED (Optimized)
 * Uses tiered fetching and optimized aggregations
 */
async function generateNewFeed(userId, categoryIds, userLat, userLong, filters = {}) {
  const startTime = Date.now();
  console.log(`[FEED GEN] Starting optimized feed generation for user ${userId}`);

  // Fetch blocked chef IDs to exclude from feed
  const blockedChefIds = await getBlockedChefIds();

  // 1. Build Category Query
  let categoryQuery = {};
  if (categoryIds && categoryIds.length > 0) {
    const categoryIdArray = categoryIds.split(',').filter(id => id.trim());
    if (categoryIdArray.length > 0) {
      const objectIds = categoryIdArray.map(id => {
        try {
          return new mongoose.Types.ObjectId(id.trim());
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      if (objectIds.length > 0) {
        categoryQuery.category = { $in: objectIds };
      }
    }
  }

  // Build extra filter conditions from query params
  const extraFilters = {};

  // Reviews only filter
  if (filters.reviewsOnly) {
    extraFilters.$or = [
      { rating: { $exists: true, $ne: null } },
      { reviewMode: true },
    ];
  }

  // Chefs only filter - lookup chef user IDs
  if (filters.chefsOnly) {
    const User = mongoose.model('user');
    const chefUsers = await User.find({ type: 'chef' }).select('_id').lean();
    extraFilters.author = { $in: chefUsers.map(u => u._id) };
  }

  // Has orderable dishes filter
  if (filters.hasDishes) {
    extraFilters.dishes = { $exists: true, $not: { $size: 0 } };
  }

  // Add blocked chef exclusion
  if (blockedChefIds.length > 0) {
    extraFilters.author = extraFilters.author
      ? { ...extraFilters.author, $nin: blockedChefIds }
      : { $nin: blockedChefIds };
  }

  // 2. Fetch Candidates (Tiered)
  const candidates = await fetchCandidatesTiered(categoryQuery, MAX_FEED_SIZE, extraFilters);
  console.log(`[FEED GEN] Fetched ${candidates.length} candidates (tiered)`);

  // 3. Get User History (Optimized)
  const { viewedIds, preferredCategories } = await getUserViewHistory(userId);
  console.log(`[FEED GEN] User has ${viewedIds.size} viewed, ${preferredCategories.size} preferred categories`);

  // 4. Score Candidates (Batch Processing)
  const currentTime = Date.now();
  const hasValidCoordinates = userLat && userLong && !isNaN(userLat) && !isNaN(userLong);
  const userLatNum = Number(userLat);
  const userLongNum = Number(userLong);

  // Batch fetch branch distances for all unique authors
  const uniqueAuthorIds = [...new Set(candidates.map(c => c.author?._id?.toString()).filter(Boolean))];
  let branchDistMap = new Map();
  if (hasValidCoordinates && uniqueAuthorIds.length > 0) {
    branchDistMap = await getNearestBranchBatch(uniqueAuthorIds, userLatNum, userLongNum);
  }

  // Process in batches of 100 to avoid blocking
  const BATCH_SIZE = 100;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    batch.forEach(story => {
      // Calculate distance from nearest branch
      const authorId = story.author?._id?.toString();
      if (hasValidCoordinates && authorId) {
        const branchData = branchDistMap.get(authorId);
        story.kmAway = branchData?.distance;
      } else {
        story.kmAway = undefined;
      }

      // Calculate score
      story._score = calculateRecommendationScore(
        story,
        { lat: userLatNum, long: userLongNum },
        viewedIds,
        preferredCategories,
        currentTime
      );
    });
  }

  // 5. Sort, Bucket, Interleave
  if (filters.sortBy === 'trending') {
    // Trending sort: by engagement (likes + views) instead of recommendation score
    candidates.sort((a, b) => ((b.likesNo || 0) + (b.views || 0)) - ((a.likesNo || 0) + (a.views || 0)));
  } else {
    candidates.sort((a, b) => b._score - a._score);
  }
  const buckets = bucketByPriority(candidates);
  const uniqueOrderedIds = filters.sortBy === 'trending'
    ? candidates.map(c => c._id.toString())
    : interleaveBuckets(buckets);

  const elapsed = Date.now() - startTime;
  console.log(`[FEED GEN] Generated ${uniqueOrderedIds.length} items in ${elapsed}ms`);

  return uniqueOrderedIds;
}


const getStories = async (req, res) => {
  const startTime = Date.now();
  const { page = 1, limit = 10, categoryIds, lat, long, refresh, reviewsOnly, chefsOnly, hasDishes, sortBy } = req.query;

  // Build filters object from query params
  const filters = {
    reviewsOnly: reviewsOnly === 'true',
    chefsOnly: chefsOnly === 'true',
    hasDishes: hasDishes === 'true',
    sortBy: sortBy || 'default',
  };
  const userId = req.user?._id?.toString() || 'anonymous';
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;

  console.log(`[GET STORIES] Request: page=${pageNum}, limit=${pageSize}, userId=${userId}`);

  // Cache Key Strategy
  const latKey = lat ? Math.round(Number(lat) * 100) / 100 : 'noc';
  const longKey = long ? Math.round(Number(long) * 100) / 100 : 'noc';
  const catKey = categoryIds || 'all';
  const filterKey = `${filters.reviewsOnly}:${filters.chefsOnly}:${filters.hasDishes}:${filters.sortBy}`;
  const feedKey = `${userId}:${catKey}:${latKey}:${longKey}:${filterKey}`;

  try {
    let feedIds = [];

    // Force refresh if requested
    const forceRefresh = refresh === 'true';

    // Check cache
    const cachedFeed = userFeeds.get(feedKey);
    if (!forceRefresh && cachedFeed && (Date.now() - cachedFeed.timestamp) < FEED_EXPIRY) {
      feedIds = cachedFeed.ids;
      console.log(`[GET STORIES] Cache HIT: ${feedIds.length} items`);
    } else {
      // Generate new feed
      feedIds = await generateNewFeed(userId === 'anonymous' ? null : userId, categoryIds, lat, long, filters);
      userFeeds.set(feedKey, { ids: feedIds, timestamp: Date.now() });
      console.log(`[GET STORIES] Cache MISS: Generated ${feedIds.length} items`);
    }

    // Pagination
    const startIndex = (pageNum - 1) * pageSize;
    const pageIds = feedIds.slice(startIndex, startIndex + pageSize);
    console.log(`[GET STORIES] Page ${pageNum}: indices [${startIndex}-${startIndex + pageSize}], got ${pageIds.length} items`);

    if (pageIds.length === 0) {
      // Category filter with 0 results
      if (categoryIds && categoryIds.length > 0) {
        return res.json({
          stories: [],
          totalPages: 0,
          currentPage: pageNum,
          message: "No content matches your selected categories."
        });
      }

      // Exhausted feed - show archive content
      console.log('[FEED] Feed exhausted, entering archive mode');

      const tier1Size = feedIds.length;
      const fallbackOffset = startIndex - tier1Size;
      const userLat = lat ? parseFloat(lat) : null;
      const userLong = long ? parseFloat(long) : null;
      const hasLocation = userLat && userLong && !isNaN(userLat) && !isNaN(userLong);

      const excludeIds = feedIds.map(id => new mongoose.Types.ObjectId(id));

      let fallbackStories = [];

      if (hasLocation) {
        // Distance-sorted fallback using aggregation
        const pipeline = [
          { $match: { _id: { $nin: excludeIds } } },
          { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorData' } },
          { $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              distance: {
                $cond: {
                  if: { $and: [{ $isArray: "$authorData.locations" }, { $gt: [{ $size: "$authorData.locations" }, 0] }] },
                  then: {
                    $min: {
                      $map: {
                        input: "$authorData.locations",
                        as: "loc",
                        in: {
                          $multiply: [
                            6371,
                            {
                              $acos: {
                                $min: [1, {
                                  $add: [
                                    { $multiply: [{ $sin: { $degreesToRadians: userLat } }, { $sin: { $degreesToRadians: { $ifNull: ["$$loc.lat", 0] } } }] },
                                    {
                                      $multiply: [{ $cos: { $degreesToRadians: userLat } }, { $cos: { $degreesToRadians: { $ifNull: ["$$loc.lat", 0] } } },
                                      { $cos: { $subtract: [{ $degreesToRadians: { $ifNull: ["$$loc.long", 0] } }, { $degreesToRadians: userLong }] } }
                                      ]
                                    }
                                  ]
                                }]
                              }
                            }
                          ]
                        }
                      }
                    }
                  },
                  else: 999999
                }
              }
            }
          },
          { $sort: { distance: 1 } },
          { $skip: Math.max(0, fallbackOffset) },
          { $limit: pageSize },
          { $lookup: { from: 'dishes', localField: 'dishes', foreignField: '_id', as: 'dishes' } }
        ];

        fallbackStories = await Story.aggregate(pipeline);
      } else {
        fallbackStories = await Story.find({ _id: { $nin: excludeIds } })
          .populate('author')
          .populate('dishes')
          .sort({ created_at: -1 })
          .skip(Math.max(0, fallbackOffset))
          .limit(pageSize)
          .lean();
      }

      if (fallbackStories.length === 0) {
        return res.json({
          stories: [],
          totalPages: Math.ceil(tier1Size / pageSize) + 1,
          currentPage: pageNum,
          message: "You've seen everything! Check back later for new content."
        });
      }

      const hydratedFallback = fallbackStories.map(s => ({
        ...s,
        author: s.authorData || s.author,
        kmAway: s.distance,
      }));

      return res.json({
        stories: hydratedFallback,
        totalPages: 999,
        currentPage: pageNum,
        tier: 'extended'
      });
    }

    // Fetch full story details
    const stories = await Story.find({ _id: { $in: pageIds } })
      .populate("author")
      .populate("dishes")
      .populate("reviewedChef")
      .lean();

    // Re-order to match feed order
    const storyMap = new Map(stories.map(s => [s._id.toString(), s]));
    const orderedStories = pageIds.map(id => storyMap.get(id)).filter(Boolean);

    // Hydrate with user-specific data (likes, follows)
    if (userId !== 'anonymous') {
      // Batch fetch likes
      const allLikes = await Like.find({
        post_id: { $in: orderedStories.map(s => s._id) },
        user_id: userId
      }).select('post_id').lean();
      const likeSet = new Set(allLikes.map(l => l.post_id.toString()));
      orderedStories.forEach(s => s.currentUserLiked = likeSet.has(s._id.toString()));

      // Batch fetch follows
      const authorIds = orderedStories.map(s => s.author?._id).filter(Boolean);
      const reviewedChefIds = orderedStories.map(s => s.reviewedChef?._id).filter(Boolean);
      const allIdsToCheck = [...new Set([...authorIds, ...reviewedChefIds])];

      if (allIdsToCheck.length > 0) {
        const userFollows = await Follow.find({
          follower_id: userId,
          following_id: { $in: allIdsToCheck }
        }).select('following_id').lean();
        const followSet = new Set(userFollows.map(f => f.following_id.toString()));

        orderedStories.forEach(s => {
          if (s.author) {
            s.author.currentUserFollowed = followSet.has(s.author._id.toString());
          }
          if (s.reviewedChef) {
            s.reviewedChef.currentUserFollowed = followSet.has(s.reviewedChef._id.toString());
          }
        });
      }
    }

    // Aggregate author ratings (batch)
    const uniqueAuthorIds = [...new Set(orderedStories.map(s => s.author?._id))];
    if (uniqueAuthorIds.length > 0) {
      const authorRatings = await Dish.aggregate([
        { $match: { user_id: { $in: uniqueAuthorIds } } },
        { $match: { average_rating: { $gt: 0 } } },
        { $group: { _id: "$user_id", avg: { $avg: "$average_rating" }, count: { $sum: 1 } } }
      ]);
      const ratingMap = new Map(authorRatings.map(r => [r._id.toString(), r]));

      // Batch fetch branch distances for story authors
      const storyAuthorIds = [...new Set(orderedStories.map(s => s.author?._id?.toString()).filter(Boolean))];
      let storyBranchMap = new Map();
      if (lat && long && storyAuthorIds.length > 0) {
        storyBranchMap = await getNearestBranchBatch(storyAuthorIds, Number(lat), Number(long));
      }

      orderedStories.forEach(s => {
        if (s.author) {
          const r = ratingMap.get(s.author._id.toString());
          s.author.averageDishRating = r ? parseFloat(r.avg.toFixed(1)) : 0;
          s.author.ratedDishesCount = r ? r.count : 0;
          if (!s.avatarUri && s.poster) s.avatarUri = s.poster;

          const branchData = storyBranchMap.get(s.author._id.toString());
          s.kmAway = branchData?.distance;
        }
      });
    }

    const totalPages = Math.ceil(feedIds.length / pageSize);
    const elapsed = Date.now() - startTime;
    console.log(`[GET STORIES] Response: ${orderedStories.length} stories, page ${pageNum}/${totalPages}, took ${elapsed}ms`);

    res.json({
      stories: orderedStories,
      totalPages: totalPages,
      currentPage: pageNum
    });

  } catch (error) {
    console.error("[GET STORIES] Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = getStories;
