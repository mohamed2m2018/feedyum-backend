const mongoose = require('mongoose');
const User = require('../../models/user');
const Dish = require('../../models/dish');
const Story = require('../../models/story');

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

    // Define all categories we need
    const categories = [
      'Coupons', 'Homemade', 'Desserts', 'Fast food',
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

    // Batch fetch all data in parallel using Promise.all
    const [usersData, dishesData] = await Promise.all([
      // 1. Get users for all categories in one aggregation (includes rating data)
      getUsersForAllCategories(categories, coordinates),

      // 2. Get dishes for all categories in one aggregation  
      getDishesForAllCategories(categories, coordinates)
    ]);

    // Organize data by category
    const result = {
      success: true,
      data: {},
      loadTime: Date.now() - startTime
    };

    // Structure the response
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

// FIXED: Optimized aggregation to get users for all categories at once
async function getUsersForAllCategories(categories, coordinates) {
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
          // Only include active chefs with recent activity
          date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
        }
      },

      // Add distance calculation if coordinates provided
      ...(coordinates ? [{
        $addFields: {
          distance: {
            $sqrt: {
              $add: [
                { $pow: [{ $subtract: [{ $ifNull: [{ $arrayElemAt: ['$locations.lat', 0] }, 0] }, coordinates.lat] }, 2] },
                { $pow: [{ $subtract: [{ $ifNull: [{ $arrayElemAt: ['$locations.long', 0] }, 0] }, coordinates.long] }, 2] }
              ]
            }
          }
        }
      }] : []),

      // Sort by distance (if coordinates) or by creation date
      {
        $sort: coordinates ? { distance: 1, date: -1 } : { date: -1 }
      },

      // Project needed fields (stories fetched separately via batch query)
      {
        $project: {
          _id: 1,
          fullName: 1,
          avatar: 1,
          bio: 1,
          type: 1,
          locations: 1,
          tags: 1,
          postsNo: 1,
          date: 1,
          distance: { $ifNull: ['$distance', null] }
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

    // Add dish rating aggregation for each chef (like getUserByTag.js does)
    const uniqueUserIds = [...new Set(users.map(u => u._id.toString()))];
    let ratingMap = new Map();

    if (uniqueUserIds.length > 0) {
      try {
        const ratings = await Dish.aggregate([
          { $match: { user_id: { $in: uniqueUserIds.map(id => mongoose.Types.ObjectId(id)) } } },
          { $match: { average_rating: { $gt: 0 } } }, // Only dishes with ratings
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
      // Find which categories this user belongs to
      user.tags.forEach(tagId => {
        const categoryName = tagNameMap[tagId.toString()];
        if (categoryName && usersData[categoryName]) {
          // Limit to 8 users per category
          if (usersData[categoryName].length < 8) {
            // Get rating data from aggregation
            const ratingData = ratingMap.get(user._id.toString());

            usersData[categoryName].push({
              _id: user._id,
              fullName: user.fullName,
              avatar: user.avatar,
              bio: user.bio,
              type: user.type,
              locations: user.locations,
              tags: user.tags,
              postsNo: user.postsNo,
              date: user.date,
              distance: user.distance,
              stories: user.stories || [],
              averageDishRating: ratingData?.averageDishRating || 0,
              ratedDishesCount: ratingData?.ratedDishesCount || 0
            });
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

// Optimized aggregation to get dishes for all categories at once
async function getDishesForAllCategories(categories, coordinates) {
  try {
    const pipeline = [
      // Match dishes in our categories that are available
      {
        $match: {
          category: { $in: categories },
          visible: true,
          // Only include recent dishes for better relevance
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
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

// Ratings are now fetched directly from User model with averageRating and totalReviews fields
// No separate rating lookup needed

module.exports = { getDiscoverData };