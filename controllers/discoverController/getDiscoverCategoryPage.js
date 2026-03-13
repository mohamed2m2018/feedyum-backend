const mongoose = require('mongoose');
const User = mongoose.model('user');
const Story = mongoose.model('story');
const Dish = require('../../models/dish');
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');
const { getNearestBranchBatch } = require('../../utils/getNearestBranch');

let redisClient;
try {
  redisClient = require('../../config/redis');
} catch (e) {
  console.log('[DISCOVER PAGE] Redis not available');
}

/**
 * Paginated endpoint for a single Discover category.
 * GET /api/discover/category/:category?page=1&limit=10&lat=30.033&long=31.233&userId=123
 * 
 * Returns chefs (with stories) and dishes for one category at a time,
 * with proper DB-level $skip/$limit for performance.
 * 
 * Response shape matches the batch endpoint's per-category data so the
 * frontend can merge pages seamlessly.
 */
const getDiscoverCategoryPage = async (req, res) => {
  const startTime = Date.now();

  try {
    const { category } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10)); // Cap at 50
    const { lat, long, userId } = req.query;
    const skip = (page - 1) * limit;

    console.log(`[DISCOVER PAGE] Category: "${category}", Page: ${page}, Limit: ${limit}`);

    const coordinates = lat && long ? { lat: parseFloat(lat), long: parseFloat(long) } : null;

    // Cache key includes category + page + location
    const locationKey = coordinates
      ? `${Math.round(coordinates.lat * 100) / 100}_${Math.round(coordinates.long * 100) / 100}`
      : 'no_location';
    const cacheKey = `discover_page_${category}_${page}_${limit}_${locationKey}`;

    // Try cache first
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          console.log(`[DISCOVER PAGE] Cache hit for "${category}" page ${page} in ${Date.now() - startTime}ms`);
          return res.json(JSON.parse(cached));
        }
      } catch (e) {
        console.log('[DISCOVER PAGE] Cache read error (non-critical):', e.message);
      }
    }

    const blockedChefIds = await getBlockedChefIds();

    const isAll = category === 'All';

    // Fetch chefs and dishes in parallel
    const [chefsResult, dishesResult] = await Promise.all([
      getChefsForCategory(category, isAll, coordinates, blockedChefIds, skip, limit),
      getDishesForCategory(category, isAll, coordinates, blockedChefIds, skip, limit)
    ]);

    const response = {
      success: true,
      data: {
        users: chefsResult.chefs,
        dishes: dishesResult.dishes,
      },
      pagination: {
        currentPage: page,
        totalChefs: chefsResult.totalCount,
        totalDishes: dishesResult.totalCount,
        hasNextPage: chefsResult.hasMore || dishesResult.hasMore,
        chefsHasMore: chefsResult.hasMore,
        dishesHasMore: dishesResult.hasMore,
      },
      loadTime: Date.now() - startTime,
    };

    // Cache for 2 minutes (shorter than batch because pagination is more granular)
    if (redisClient) {
      try {
        await redisClient.setex(cacheKey, 120, JSON.stringify(response));
      } catch (e) {
        console.log('[DISCOVER PAGE] Cache write error (non-critical):', e.message);
      }
    }

    console.log(`[DISCOVER PAGE] "${category}" page ${page}: ${chefsResult.chefs.length} chefs, ${dishesResult.dishes.length} dishes in ${Date.now() - startTime}ms`);

    res.json(response);
  } catch (error) {
    console.error('[DISCOVER PAGE] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      loadTime: Date.now() - startTime,
    });
  }
};

/**
 * Get chefs for a single category with DB-level pagination.
 * For "All": chefs with content (stories OR dishes).
 * For category tabs: chefs with matching tags.
 */
async function getChefsForCategory(category, isAll, coordinates, blockedChefIds, skip, limit) {
  try {
    let matchStage;

    if (isAll) {
      // "All" tab — get chefs with content
      // Use a $lookup to check for stories/dishes before pagination
      const pipeline = [
        {
          $match: {
            type: 'chef',
            date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
            ...(blockedChefIds.length > 0 && { _id: { $nin: blockedChefIds } })
          }
        },
        // Check for at least 1 story
        {
          $lookup: {
            from: 'stories',
            let: { userId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$author', '$$userId'] } } },
              { $limit: 1 }
            ],
            as: 'storyCheck'
          }
        },
        // Check for at least 1 visible dish
        {
          $lookup: {
            from: 'dishes',
            let: { chefId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$user_id', '$$chefId'] }, visible: true } },
              { $limit: 1 }
            ],
            as: 'dishCheck'
          }
        },
        // Only chefs with content
        {
          $match: {
            $or: [
              { 'storyCheck.0': { $exists: true } },
              { 'dishCheck.0': { $exists: true } }
            ]
          }
        },
        { $sort: { date: -1 } },
        // Use $facet for count + paginated data in ONE query
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1, fullName: 1, avatar: 1, bio: 1,
                  type: 1, tags: 1, postsNo: 1, date: 1
                }
              }
            ]
          }
        }
      ];

      const result = await User.aggregate(pipeline);
      const chefs = result[0]?.data || [];
      const totalCount = result[0]?.metadata[0]?.total || 0;

      // Enrich with stories, distances, ratings
      const enriched = await enrichChefs(chefs, coordinates);

      return {
        chefs: enriched,
        totalCount,
        hasMore: skip + chefs.length < totalCount,
      };
    } else {
      // Category tab — get chefs by tag
      const Tag = require('../../models/tag');
      const tagDoc = await Tag.findOne({ name: category }).select('_id').lean();
      if (!tagDoc) {
        return { chefs: [], totalCount: 0, hasMore: false };
      }

      matchStage = {
        tags: tagDoc._id,
        type: 'chef',
        date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        ...(blockedChefIds.length > 0 && { _id: { $nin: blockedChefIds } })
      };

      const pipeline = [
        { $match: matchStage },
        { $sort: { date: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1, fullName: 1, avatar: 1, bio: 1,
                  type: 1, tags: 1, postsNo: 1, date: 1
                }
              }
            ]
          }
        }
      ];

      const result = await User.aggregate(pipeline);
      const chefs = result[0]?.data || [];
      const totalCount = result[0]?.metadata[0]?.total || 0;

      const enriched = await enrichChefs(chefs, coordinates);

      return {
        chefs: enriched,
        totalCount,
        hasMore: skip + chefs.length < totalCount,
      };
    }
  } catch (error) {
    console.error(`[DISCOVER PAGE] Error fetching chefs for "${category}":`, error);
    return { chefs: [], totalCount: 0, hasMore: false };
  }
}

/**
 * Enrich chefs with stories, branch distances, and dish ratings.
 * Only fetches data for the chefs on THIS page (not all chefs in the category).
 */
async function enrichChefs(chefs, coordinates) {
  if (chefs.length === 0) return [];

  const chefIds = chefs.map(c => c._id);

  // Parallel fetch: stories, branch distances, dish ratings
  const [allStories, branchDistanceMap, ratingResults] = await Promise.all([
    // Stories for ONLY these chefs
    Story.find({ author: { $in: chefIds } })
      .populate('dishes')
      .populate('category', 'name')
      .lean(),

    // Branch distances for ONLY these chefs
    coordinates
      ? getNearestBranchBatch(chefIds, coordinates.lat, coordinates.long)
      : Promise.resolve(new Map()),

    // Dish ratings for ONLY these chefs
    Dish.aggregate([
      { $match: { user_id: { $in: chefIds.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $match: { average_rating: { $gt: 0 } } },
      { $group: { _id: '$user_id', ratedDishesCount: { $sum: 1 }, totalRating: { $sum: '$average_rating' } } },
      { $project: { ratedDishesCount: 1, averageDishRating: { $round: [{ $divide: ['$totalRating', '$ratedDishesCount'] }, 1] } } }
    ]).exec().catch(err => {
      console.error('[DISCOVER PAGE] Ratings error:', err?.message);
      return [];
    })
  ]);

  // Build lookup maps
  const storiesByUser = new Map();
  allStories.forEach(story => {
    const authorId = story.author.toString();
    if (!storiesByUser.has(authorId)) storiesByUser.set(authorId, []);
    storiesByUser.get(authorId).push(story);
  });

  const ratingMap = new Map(ratingResults.map(r => [r._id.toString(), r]));

  // Assemble enriched chef objects
  let result = chefs.map(chef => {
    const ratingData = ratingMap.get(chef._id.toString());
    const branchData = branchDistanceMap.get(chef._id.toString());
    return {
      ...chef,
      distance: branchData?.distance ?? null,
      stories: storiesByUser.get(chef._id.toString()) || [],
      averageDishRating: ratingData?.averageDishRating || 0,
      ratedDishesCount: ratingData?.ratedDishesCount || 0,
    };
  });

  // Sort by distance if coordinates available
  if (coordinates) {
    result.sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
  }

  return result;
}

/**
 * Get dishes for a single category with DB-level pagination.
 */
async function getDishesForCategory(category, isAll, coordinates, blockedChefIds, skip, limit) {
  try {
    const matchStage = isAll
      ? {
          visible: true,
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          ...(blockedChefIds.length > 0 && { user_id: { $nin: blockedChefIds } })
        }
      : {
          visible: true,
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          $or: [
            { category: { $regex: new RegExp(category, 'i') } },
            { categories: { $elemMatch: { $regex: new RegExp(category, 'i') } } }
          ],
          ...(blockedChefIds.length > 0 && { user_id: { $nin: blockedChefIds } })
        };

    const pipeline = [
      { $match: matchStage },
      // Lookup chef info
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'chefInfo',
          pipeline: [
            { $project: { fullName: 1, avatar: 1, type: 1, locations: 1, bio: 1, averageRating: 1, totalReviews: 1 } }
          ]
        }
      },
      { $addFields: { chef: { $arrayElemAt: ['$chefInfo', 0] } } },
      { $sort: { created_at: -1 } },
      // DB-level count + pagination
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1, name: 1, title: 1, description: 1, image: 1, price: 1,
                category: 1, chef: 1, user_id: 1, created_at: 1,
                visible: 1,
                average_rating: { $ifNull: ['$average_rating', 0] }
              }
            }
          ]
        }
      }
    ];

    const result = await Dish.aggregate(pipeline);
    const dishes = result[0]?.data || [];
    const totalCount = result[0]?.metadata[0]?.total || 0;

    return {
      dishes,
      totalCount,
      hasMore: skip + dishes.length < totalCount,
    };
  } catch (error) {
    console.error(`[DISCOVER PAGE] Error fetching dishes for "${category}":`, error);
    return { dishes: [], totalCount: 0, hasMore: false };
  }
}

module.exports = { getDiscoverCategoryPage };
