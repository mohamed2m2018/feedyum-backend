const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model('like');
const View = mongoose.model('view');
const Dish = mongoose.model('dish');
const Follow = mongoose.model('follow');

// Utils
const {
  getNearestLocation,
  calculateRecommendationScore,
  bucketByPriority,
  interleaveBuckets,
  FEED_EXPIRY
} = require('../../utils/storyFeedUtils');

// Simple in-memory storage for pagination consistency (no external dependencies)
const userFeeds = new Map();

/**
 * GENERATE FEED (Heavy Operation)
 * Fetches candidates, analyzes user interest, scores, and returns ORDERED LIST OF IDs.
 */
async function generateNewFeed(userId, categoryIds, userLat, userLong) {
  const startTime = Date.now();
  console.log(`[FEED GEN] Starting feed generation for user ${userId}, categoryIds: ${categoryIds}`);

  // 1. Build Query for Candidates
  // Limit to last 60 days for performance/relevance
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  let query = { created_at: { $gte: sixtyDaysAgo } };

  // FIX: Convert categoryIds string to array of ObjectIds for proper MongoDB matching
  if (categoryIds && categoryIds.length > 0) {
    const categoryIdArray = categoryIds.split(',').filter(id => id.trim());
    if (categoryIdArray.length > 0) {
      // Convert string IDs to ObjectIds for proper matching
      const objectIds = categoryIdArray.map(id => {
        try {
          return new mongoose.Types.ObjectId(id.trim());
        } catch (e) {
          console.warn(`[FEED GEN] Invalid ObjectId: ${id}`);
          return null;
        }
      }).filter(Boolean);

      if (objectIds.length > 0) {
        query.category = { $in: objectIds };
        console.log(`[FEED GEN] Filtering by ${objectIds.length} categories:`, objectIds);
      }
    }
  }

  // 2. Fetch Candidates
  const candidates = await Story.find(query)
    .select('created_at author likesNo views caption dishes reviewMode poster category')
    .populate('author', 'locations')
    .sort({ created_at: -1 })
    .limit(1000)
    .lean();

  console.log(`[FEED GEN] Found ${candidates.length} candidates after filtering`);


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

  const buckets = bucketByPriority(candidates);
  const uniqueOrderedIds = interleaveBuckets(buckets);

  console.log(`[FEED GEN] Generated feed with ${uniqueOrderedIds.length} items from ${candidates.length} candidates`);

  return uniqueOrderedIds;
}


const getStories = async (req, res) => {
  const startTime = Date.now();
  const { page = 1, limit = 10, categoryIds, lat, long, refresh } = req.query;
  const userId = req.user?._id?.toString() || 'anonymous';
  const pageNum = parseInt(page) || 1; // Parse page as integer
  const pageSize = parseInt(limit) || 10;

  console.log(`[GET STORIES] Request: page=${pageNum}, limit=${pageSize}, userId=${userId}`);

  // Cache Key Strategy:
  // - User Specific
  // - Location (Rounded)
  // - Categories
  const latKey = lat ? Math.round(Number(lat) * 100) / 100 : 'noc';
  const longKey = long ? Math.round(Number(long) * 100) / 100 : 'noc';
  const catKey = categoryIds || 'all';
  const feedKey = `${userId}:${catKey}:${latKey}:${longKey}`;

  try {
    let feedIds = [];

    // Check if we have cached feed for this user (for pagination consistency)
    const cachedFeed = userFeeds.get(feedKey);
    if (cachedFeed && (Date.now() - cachedFeed.timestamp) < FEED_EXPIRY) {
      feedIds = cachedFeed.ids;
      console.log(`[GET STORIES] Using cached feed: ${feedIds.length} items`);
    } else {
      // Generate new feed
      feedIds = await generateNewFeed(userId === 'anonymous' ? null : userId, categoryIds, lat, long);
      // Store for pagination consistency
      userFeeds.set(feedKey, { ids: feedIds, timestamp: Date.now() });
      console.log(`[GET STORIES] Generated new feed: ${feedIds.length} items, stored for pagination`);
    }

    // Pagination
    const startIndex = (pageNum - 1) * pageSize;
    const pageIds = feedIds.slice(startIndex, startIndex + pageSize);
    console.log(`[GET STORIES] Page ${pageNum}: startIndex=${startIndex}, returning ${pageIds.length} items`);

    if (pageIds.length === 0) {
      // If we're filtering by category and got 0 results, return empty - don't fall back to all content
      if (categoryIds && categoryIds.length > 0) {
        console.log('[FEED] Category filter active with 0 results - returning empty list');
        return res.json({
          stories: [],
          totalPages: 0,
          currentPage: page,
          message: "No content matches your selected categories."
        });
      }

      // TIER 2/3 FALLBACK: Only for non-filtered feeds when user exhausted hot content
      console.log('[FEED] Tier 1 exhausted, switching to Tier 2/3 fallback');

      const tier1Size = feedIds.length;
      const fallbackOffset = startIndex - tier1Size; // How far into fallback tiers

      // Use aggregation for distance-sorted extended content
      const userLat = lat ? parseFloat(lat) : null;
      const userLong = long ? parseFloat(long) : null;
      const hasLocation = userLat && userLong && !isNaN(userLat) && !isNaN(userLong);

      // Build fallback query (exclude already-shown IDs if possible)

      const excludeIds = feedIds.map(id => new mongoose.Types.ObjectId(id));

      let fallbackStories = [];

      if (hasLocation) {
        // Tier 2/3: Distance-sorted via aggregation
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
        // No location - just date sorted
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
          currentPage: page,
          message: "You've seen everything! Check back later for new content."
        });
      }

      // Hydrate fallback stories
      const hydratedFallback = fallbackStories.map(s => ({
        ...s,
        author: s.authorData || s.author,
        kmAway: s.distance,
      }));

      return res.json({
        stories: hydratedFallback,
        totalPages: 999, // Unknown total for archive
        currentPage: page,
        tier: 'extended'
      });
    }

    // 4. Fetch Details
    const stories = await Story.find({ _id: { $in: pageIds } })
      .populate("author")
      .populate("dishes")
      .populate("reviewedChef")
      .lean();

    // 5. Re-Order
    const storyMap = new Map(stories.map(s => [s._id.toString(), s]));
    const orderedStories = pageIds.map(id => storyMap.get(id)).filter(Boolean);

    // 6. Hydrate (Likes, Ratings, Follow Status)
    if (userId !== 'anonymous') {
      const allLikes = await Like.find({
        post_id: { $in: orderedStories.map(s => s._id) },
        user_id: userId
      }).select('post_id').lean();
      const likeSet = new Set(allLikes.map(l => l.post_id.toString()));
      orderedStories.forEach(s => s.currentUserLiked = likeSet.has(s._id.toString()));

      // Check follow status for all story authors and reviewedChefs
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

    // Aggregate Author Ratings
    const uniqueAuthorIds = [...new Set(orderedStories.map(s => s.author?._id))];
    if (uniqueAuthorIds.length > 0) {
      const authorRatings = await Dish.aggregate([
        { $match: { user_id: { $in: uniqueAuthorIds } } },
        { $match: { average_rating: { $gt: 0 } } }, // Exclude dishes without ratings
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

    const totalPages = Math.ceil(feedIds.length / pageSize);
    console.log(`[GET STORIES] Response: ${orderedStories.length} stories, page ${pageNum}/${totalPages}`);

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
