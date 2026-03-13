const mongoose = require('mongoose');
const User = require('../../models/user');
const Dish = require('../../models/dish');
const Story = require('../../models/story');
const { getNearestBranchBatch } = require('../../utils/getNearestBranch');
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');

// Redis cache for performance (silent - logs disabled)
let redisClient = null;
try {
  const redis = require('redis');
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  redisClient.on('error', () => {
    // Silent: Redis error (non-critical, app works without cache)
    redisClient = null;
  });

  // Connect to Redis
  redisClient.connect().catch(() => {
    // Silent: Redis connection failed (non-critical)
    redisClient = null;
  });
} catch (error) {
  // Silent: Redis not available
}

// Single optimized endpoint for ALL Discover screen data
const getDiscoverData = async (req, res) => {
  const startTime = Date.now();

  try {
    const { lat, long, userId } = req.query;

    console.log(`[DISCOVER BATCH] Starting batch data fetch for user ${userId}`);

    // Define tag-based categories ("All" is handled separately with dedicated queries)
    const categories = [
      'Homemade', 'Desserts', 'Fast food',
      'Burger', 'Chicken', 'Bakery', 'Main Courses', 'Pizza'
    ];

    // Create coordinate object if provided
    const coordinates = lat && long ? { lat: parseFloat(lat), long: parseFloat(long) } : null;

    // Create cache key based on location (rounded to reduce cache fragmentation)
    const locationKey = coordinates
      ? `${Math.round(coordinates.lat * 100) / 100}_${Math.round(coordinates.long * 100) / 100}`
      : 'no_location';
    const cacheKey = `discover_batch_${locationKey}`;

    // Try to get from cache first
    if (redisClient) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          console.log(`[DISCOVER BATCH] Cache hit! Served in ${Date.now() - startTime}ms`);
          return res.json({
            success: true,
            data: parsedData,
            loadTime: Date.now() - startTime,
            cached: true
          });
        }
      } catch (cacheError) {
        console.log('[DISCOVER BATCH] Cache read error (non-critical):', cacheError.message);
      }
    }

    // Fetch blocked chef IDs once (wallet grace period expired)
    const blockedChefIds = await getBlockedChefIds();

    // Batch fetch all data in parallel using Promise.all
    // "All" has its own dedicated queries that don't depend on tags
    const [usersData, dishesData, allChefs, allDishes] = await Promise.all([
      // 1. Get users for tag-based categories in one aggregation
      getUsersForAllCategories(categories, coordinates, blockedChefIds),

      // 2. Get dishes for tag-based categories in one aggregation  
      getDishesForAllCategories(categories, coordinates, blockedChefIds),

      // 3. Get ALL chefs (no tag filter) — dedicated query for "All" tab
      getAllChefs(coordinates, blockedChefIds),

      // 4. Get ALL visible dishes (no category filter) — dedicated query for "All" tab
      getAllDishes(coordinates, blockedChefIds)
    ]);

    // Organize data by category
    const result = {
      success: true,
      data: {
        // "All" tab: dedicated queries, server-side filtered to only include chefs with content
        All: {
          users: allChefs || [],
          dishes: allDishes || []
        }
      },
      loadTime: Date.now() - startTime
    };

    // Structure the tag-based categories
    categories.forEach(category => {
      result.data[category] = {
        users: usersData[category] || [],
        dishes: dishesData[category] || []
      };
    });

    // Ratings are now included directly from User model

    // Cache the result for 3 minutes
    if (redisClient) {
      try {
        await redisClient.setex(cacheKey, 180, JSON.stringify(result.data)); // 3 minutes cache
        console.log(`[DISCOVER BATCH] Data cached for 3 minutes`);
      } catch (cacheError) {
        console.log('[DISCOVER BATCH] Cache write error (non-critical):', cacheError.message);
      }
    }

    console.log(`[DISCOVER BATCH] Completed in ${result.loadTime}ms - fetched data for ${categories.length} categories`);

    res.json(result);

  } catch (error) {
    console.error('[DISCOVER BATCH] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      loadTime: Date.now() - startTime
    });
  }
};

// Optimized aggregation to get users for tag-based categories at once
async function getUsersForAllCategories(categories, coordinates, blockedChefIds = []) {
  try {
    // First, get the ObjectIds for all category names
    const Tag = require('../../models/tag');
    const tagDocs = await Tag.find({ name: { $in: categories } }).select('_id name').lean();

    if (tagDocs.length === 0) {
      console.log('[DISCOVER BATCH] No matching tags found for categories:', categories);
      return {};
    }

    const tagIds = tagDocs.map(tag => tag._id);
    const tagNameMap = {};
    tagDocs.forEach(tag => {
      tagNameMap[tag._id.toString()] = tag.name;
    });

    console.log(`[DISCOVER BATCH] Found ${tagDocs.length} tags for categories:`, tagDocs.map(t => t.name));

    const pipeline = [
      // Match users who have any of our target tag ObjectIds
      {
        $match: {
          tags: { $in: tagIds },
          type: 'chef',
          date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          ...(blockedChefIds.length > 0 && { _id: { $nin: blockedChefIds } })
        }
      },

      // Sort by creation date (distance sorting done post-pipeline with branch data)
      {
        $sort: { date: -1 }
      },

      // Project needed fields
      {
        $project: {
          _id: 1,
          fullName: 1,
          avatar: 1,
          bio: 1,
          type: 1,
          tags: 1,
          postsNo: 1,
          date: 1
        }
      }
    ];

    const users = await User.aggregate(pipeline);
    console.log(`[DISCOVER BATCH] Found ${users.length} users with matching tags`);

    // OPTIMIZED: Batch fetch all stories in ONE query instead of N queries (N+1 fix)
    const storiesStartTime = Date.now();
    const allUserIds = users.map(u => u._id);
    let storiesByUser = new Map();

    if (allUserIds.length > 0) {
      try {
        const allStories = await Story.find({ author: { $in: allUserIds } })
          .populate("dishes")
          .populate("category", "name")
          .lean();

        // Group stories by author for O(1) lookup
        allStories.forEach(story => {
          const authorId = story.author.toString();
          if (!storiesByUser.has(authorId)) {
            storiesByUser.set(authorId, []);
          }
          storiesByUser.get(authorId).push(story);
        });

        console.log(`[DISCOVER BATCH] Fetched ${allStories.length} stories for ${allUserIds.length} users in ${Date.now() - storiesStartTime}ms`);
      } catch (error) {
        console.error('[DISCOVER BATCH] Error batch fetching stories:', error);
      }
    }

    // Assign stories to users from the pre-built map
    users.forEach(user => {
      user.stories = storiesByUser.get(user._id.toString()) || [];
    });

    // Batch fetch branch-based distances for all chefs
    let branchDistanceMap = new Map();
    if (coordinates && allUserIds.length > 0) {
      try {
        branchDistanceMap = await getNearestBranchBatch(allUserIds, coordinates.lat, coordinates.long);
        console.log(`[DISCOVER BATCH] Branch distances: ${branchDistanceMap.size} chefs have branches`);
      } catch (branchErr) {
        console.error('[DISCOVER BATCH] Failed to fetch branch distances:', branchErr?.message);
      }
    }

    // Add dish rating aggregation for each chef
    const uniqueUserIds = [...new Set(allUserIds.map(id => id.toString()))];
    let ratingMap = new Map();

    if (uniqueUserIds.length > 0) {
      try {
        const ratings = await Dish.aggregate([
          { $match: { user_id: { $in: uniqueUserIds.map(id => new mongoose.Types.ObjectId(id)) } } },
          { $match: { average_rating: { $gt: 0 } } },
          {
            $group: {
              _id: "$user_id",
              ratedDishesCount: { $sum: 1 },
              totalRating: { $sum: "$average_rating" }
            }
          },
          {
            $project: {
              ratedDishesCount: 1,
              averageDishRating: { $round: [{ $divide: ["$totalRating", "$ratedDishesCount"] }, 1] }
            }
          }
        ]).exec();

        ratingMap = new Map(ratings.map(r => [r._id.toString(), r]));
        console.log(`[DISCOVER BATCH] Aggregated dish ratings for ${ratings.length} chefs`);
      } catch (ratingErr) {
        console.error('[DISCOVER BATCH] Failed to aggregate dish ratings:', ratingErr?.message);
      }
    }

    // Group users by their matching categories
    const usersData = {};
    categories.forEach(category => {
      usersData[category] = [];
    });

    users.forEach(user => {
      const ratingData = ratingMap.get(user._id.toString());
      const branchData = branchDistanceMap.get(user._id.toString());
      const userData = {
        _id: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        type: user.type,
        tags: user.tags,
        postsNo: user.postsNo,
        date: user.date,
        distance: branchData?.distance ?? null,
        stories: user.stories || [],
        averageDishRating: ratingData?.averageDishRating || 0,
        ratedDishesCount: ratingData?.ratedDishesCount || 0
      };

      // Find which categories this user belongs to
      user.tags.forEach(tagId => {
        const categoryName = tagNameMap[tagId.toString()];
        if (categoryName && usersData[categoryName]) {
          // Limit to 8 users per category
          if (usersData[categoryName].length < 8) {
            usersData[categoryName].push(userData);
          }
        }
      });
    });

    // Log results for debugging
    categories.forEach(category => {
      console.log(`[DISCOVER BATCH] Category "${category}": ${usersData[category].length} users`);
    });

    return usersData;

  } catch (error) {
    console.error('[DISCOVER BATCH] Error fetching users:', error);
    return {};
  }
}

// Optimized aggregation to get dishes for tag-based categories at once
async function getDishesForAllCategories(categories, coordinates, blockedChefIds = []) {
  try {
    const pipeline = [
      // Match dishes in our categories that are available
      {
        $match: {
          category: { $in: categories },
          visible: true,
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          ...(blockedChefIds.length > 0 && { user_id: { $nin: blockedChefIds } })
        }
      },

      // Lookup chef information using user_id field
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'chefInfo',
          pipeline: [
            {
              $project: {
                fullName: 1,
                avatar: 1,
                type: 1,
                locations: 1,
                bio: 1,
                averageRating: 1,
                totalReviews: 1
              }
            }
          ]
        }
      },

      // Add chef data
      {
        $addFields: {
          chef: { $arrayElemAt: ['$chefInfo', 0] }
        }
      },

      // Add distance calculation if coordinates provided
      ...(coordinates ? [{
        $addFields: {
          distance: {
            $sqrt: {
              $add: [
                { $pow: [{ $subtract: [{ $ifNull: ['$branch.lat', 0] }, coordinates.lat] }, 2] },
                { $pow: [{ $subtract: [{ $ifNull: ['$branch.long', 0] }, coordinates.long] }, 2] }
              ]
            }
          }
        }
      }] : []),

      // Sort by distance or creation date
      {
        $sort: coordinates ? { distance: 1, created_at: -1 } : { created_at: -1 }
      },

      // Group by category and limit dishes per category  
      {
        $group: {
          _id: '$category',
          dishes: {
            $push: {
              _id: '$_id',
              name: '$name',
              title: '$title',
              description: '$description',
              image: '$image',
              price: '$price',
              category: '$category',
              chef: '$chef',
              user_id: '$user_id',
              branch: '$branch',
              created_at: '$created_at',
              visible: '$visible',
              distance: { $ifNull: ['$distance', null] },
              average_rating: { $ifNull: ['$average_rating', 0] }
            }
          }
        }
      },

      // Limit to 20 dishes per category
      {
        $addFields: {
          dishes: { $slice: ['$dishes', 20] }
        }
      }
    ];

    const results = await Dish.aggregate(pipeline);

    // Convert to object with category keys
    const dishesData = {};
    results.forEach(result => {
      dishesData[result._id] = result.dishes;
    });

    return dishesData;

  } catch (error) {
    console.error('[DISCOVER BATCH] Error fetching dishes:', error);
    return {};
  }
}

// ── Dedicated "All" queries ──────────────────────────────────────────────────
// These run in parallel with tag-based queries. They fetch ALL chefs/dishes
// without tag or category filters, and filter server-side to only return
// chefs that have content (stories OR dishes).

async function getAllChefs(coordinates, blockedChefIds = []) {
  try {
    // Step 1: Get all chefs with content (stories or dishes)
    const pipeline = [
      {
        $match: {
          type: 'chef',
          date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          ...(blockedChefIds.length > 0 && { _id: { $nin: blockedChefIds } })
        }
      },

      // Lookup stories to check content existence
      {
        $lookup: {
          from: 'stories',
          localField: '_id',
          foreignField: 'author',
          as: 'storyDocs'
        }
      },

      // Lookup dishes to check content existence
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

      // SERVER-SIDE FILTER: only chefs with at least 1 story OR 1 dish
      {
        $match: {
          $or: [
            { 'storyDocs.0': { $exists: true } },
            { 'dishCheck.0': { $exists: true } }
          ]
        }
      },

      // Sort by date (distance sorting done post-pipeline with branch data)
      { $sort: { date: -1 } },

      // Limit to 20 for the batch response
      { $limit: 20 },

      // Project only needed fields (drop the lookup arrays)
      {
        $project: {
          _id: 1,
          fullName: 1,
          avatar: 1,
          bio: 1,
          type: 1,
          tags: 1,
          postsNo: 1,
          date: 1
        }
      }
    ];

    const users = await User.aggregate(pipeline);
    console.log(`[DISCOVER BATCH] "All" tab: found ${users.length} chefs with content`);

    if (users.length === 0) return [];

    const userIds = users.map(u => u._id);

    // Step 2: Batch fetch branch distances, stories, and ratings in parallel
    const [branchDistanceMap, allStories, ratingResults] = await Promise.all([
      // Branch distances
      coordinates
        ? getNearestBranchBatch(userIds, coordinates.lat, coordinates.long)
        : Promise.resolve(new Map()),

      // Stories
      Story.find({ author: { $in: userIds } })
        .populate('dishes')
        .populate('category', 'name')
        .lean(),

      // Ratings
      Dish.aggregate([
        { $match: { user_id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } } },
        { $match: { average_rating: { $gt: 0 } } },
        { $group: { _id: '$user_id', ratedDishesCount: { $sum: 1 }, totalRating: { $sum: '$average_rating' } } },
        { $project: { ratedDishesCount: 1, averageDishRating: { $round: [{ $divide: ['$totalRating', '$ratedDishesCount'] }, 1] } } }
      ]).exec().catch(err => { console.error('[DISCOVER BATCH] "All" ratings error:', err?.message); return []; })
    ]);

    // Build lookup maps
    const storiesByUser = new Map();
    allStories.forEach(story => {
      const authorId = story.author.toString();
      if (!storiesByUser.has(authorId)) storiesByUser.set(authorId, []);
      storiesByUser.get(authorId).push(story);
    });

    const ratingMap = new Map(ratingResults.map(r => [r._id.toString(), r]));

    // Step 3: Assemble final user objects with branch-based distance
    let result = users.map(user => {
      const ratingData = ratingMap.get(user._id.toString());
      const branchData = branchDistanceMap.get(user._id.toString());
      return {
        ...user,
        distance: branchData?.distance ?? null,
        stories: storiesByUser.get(user._id.toString()) || [],
        averageDishRating: ratingData?.averageDishRating || 0,
        ratedDishesCount: ratingData?.ratedDishesCount || 0
      };
    });

    // Sort by branch distance (closest first), nulls last
    if (coordinates) {
      result.sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
    }

    return result;

  } catch (error) {
    console.error('[DISCOVER BATCH] "All" tab: error fetching chefs:', error);
    return [];
  }
}

async function getAllDishes(coordinates, blockedChefIds = []) {
  try {
    const pipeline = [
      // All visible dishes, no category filter
      {
        $match: {
          visible: true,
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          ...(blockedChefIds.length > 0 && { user_id: { $nin: blockedChefIds } })
        }
      },

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

      // No distance on dishes — distance comes from chef (user object)
      { $sort: { created_at: -1 } },

      // Limit for batch response
      { $limit: 30 },

      // Project final shape
      {
        $project: {
          _id: 1, name: 1, title: 1, description: 1, image: 1, price: 1,
          category: 1, chef: 1, user_id: 1, created_at: 1,
          visible: 1,
          average_rating: { $ifNull: ['$average_rating', 0] }
        }
      }
    ];

    const dishes = await Dish.aggregate(pipeline);
    console.log(`[DISCOVER BATCH] "All" tab: found ${dishes.length} dishes`);

    return dishes;

  } catch (error) {
    console.error('[DISCOVER BATCH] "All" tab: error fetching dishes:', error);
    return [];
  }
}

// Ratings are now fetched directly from User model with averageRating and totalReviews fields
// No separate rating lookup needed

module.exports = { getDiscoverData };