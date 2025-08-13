const mongoose = require('mongoose');
const User = require('../../models/user');
const Dish = require('../../models/dish');
const Rating = require('../../models/rating');
const Story = require('../../models/story');

// Redis cache for performance
let redisClient = null;
try {
  const redis = require('redis');
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    password: process.env.REDIS_PASSWORD || undefined,
  });
  
  redisClient.on('error', (err) => {
    console.log('Redis Client Error (non-critical):', err.message);
    redisClient = null; // Disable Redis if connection fails
  });
  
  // Connect to Redis
  redisClient.connect().catch((err) => {
    console.log('Redis connection failed (non-critical):', err.message);
    redisClient = null;
  });
} catch (error) {
  console.log('Redis not available, continuing without cache');
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
    const [usersData, dishesData, ratingsData] = await Promise.all([
      // 1. Get users for all categories in one aggregation
      getUsersForAllCategories(categories, coordinates),
      
      // 2. Get dishes for all categories in one aggregation  
      getDishesForAllCategories(categories, coordinates),
      
      // 3. Get ratings for performance (batch fetch)
      getRatingsForUsers(coordinates)
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
    
    // Add ratings to users
    if (ratingsData.length > 0) {
      addRatingsToUsers(result.data, ratingsData);
    }
    
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
      
      // Lookup stories for each user
      {
        $lookup: {
          from: 'stories',
          localField: '_id',
          foreignField: 'author',
          as: 'stories',
          pipeline: [
            {
              $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category'
              }
            },
            {
              $lookup: {
                from: 'dishes',
                localField: 'dishes',
                foreignField: '_id',
                as: 'dishes'
              }
            }
          ]
        }
      },
      
      // Sort by distance (if coordinates) or by creation date
      { 
        $sort: coordinates ? { distance: 1, date: -1 } : { date: -1 }
      },
      
      // Project needed fields
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
          distance: { $ifNull: ['$distance', null] },
          stories: 1
        }
      }
    ];
    
    const users = await User.aggregate(pipeline);
    console.log(`[DISCOVER BATCH] Found ${users.length} users with matching tags`);
    
    // Fetch stories for each user (similar to individual API)
    for (let user of users) {
      try {
        const userStories = await Story.find({ author: user._id })
          .populate("dishes")
          .populate("category", "name")
          .lean()
          .exec();
        user.stories = userStories;
      } catch (error) {
        console.error(`[DISCOVER BATCH] Error fetching stories for user ${user._id}:`, error);
        user.stories = [];
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
              stories: user.stories || []
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
                bio: 1
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
              distance: { $ifNull: ['$distance', null] }
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

// Get ratings for users to add performance data
async function getRatingsForUsers(coordinates) {
  try {
    const pipeline = [
      {
        $match: {
          average_rating: { $gt: 0 }
        }
      },
      {
        $project: {
          user_id: 1,
          average_rating: 1,
          total_ratings: 1
        }
      },
      { $limit: 1000 } // Reasonable limit
    ];
    
    return await Rating.aggregate(pipeline);
    
  } catch (error) {
    console.error('[DISCOVER BATCH] Error fetching ratings:', error);
    return [];
  }
}

// Add ratings to users in the response
function addRatingsToUsers(data, ratingsData) {
  // Create ratings map for fast lookup
  const ratingsMap = {};
  ratingsData.forEach(rating => {
    ratingsMap[rating.user_id.toString()] = {
      averageRating: rating.average_rating,
      totalRatings: rating.total_ratings
    };
  });
  
  // Add ratings to each user in each category
  Object.keys(data).forEach(category => {
    if (data[category].users) {
      data[category].users.forEach(user => {
        const userRating = ratingsMap[user._id.toString()];
        if (userRating) {
          user.averageRating = userRating.averageRating;
          user.totalRatings = userRating.totalRatings;
        }
      });
    }
  });
}

module.exports = { getDiscoverData };