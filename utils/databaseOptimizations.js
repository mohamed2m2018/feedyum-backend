const mongoose = require('mongoose');

// Enhanced database optimization utilities
class DatabaseOptimizations {
  
  // Optimized story aggregation pipeline for the main feed
  static getStoriesAggregationPipeline(params) {
    const { categoryIds, lat, long, userId, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    
    const pipeline = [];
    
    // 1. Match stage - filter early for performance
    const matchStage = {};
    if (categoryIds && categoryIds.length > 0) {
      matchStage.category = { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) };
    }
    pipeline.push({ $match: matchStage });
    
    // 2. Lookup author information efficiently 
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
              bio: 1,
              type: 1,
              locations: 1,
              chefSettings: 1
            }
          }
        ]
      }
    });
    
    // 3. Unwind author (convert array to object)
    pipeline.push({ $unwind: '$author' });
    
    // 4. Add computed fields
    const addFieldsStage = {
      createdAtTimestamp: { $toLong: '$created_at' },
      hasValidLocation: {
        $and: [
          { $ne: ['$author.locations', null] },
          { $gt: [{ $size: { $ifNull: ['$author.locations', []] } }, 0] }
        ]
      }
    };
    
    // Add distance calculation if coordinates provided
    if (lat !== undefined && long !== undefined && !isNaN(lat) && !isNaN(long)) {
      addFieldsStage.kmAway = {
        $cond: {
          if: '$hasValidLocation',
          then: {
            $min: {
              $map: {
                input: '$author.locations',
                as: 'location',
                in: {
                  $multiply: [
                    6371, // Earth's radius in km
                    {
                      $acos: {
                        $add: [
                          {
                            $multiply: [
                              { $sin: { $degreesToRadians: lat } },
                              { $sin: { $degreesToRadians: '$$location.lat' } }
                            ]
                          },
                          {
                            $multiply: [
                              { $cos: { $degreesToRadians: lat } },
                              { $cos: { $degreesToRadians: '$$location.lat' } },
                              { $cos: { $degreesToRadians: { $subtract: [long, '$$location.long'] } } }
                            ]
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            }
          },
          else: null
        }
      };
    }
    
    pipeline.push({ $addFields: addFieldsStage });
    
    // 5. Calculate recommendation score
    pipeline.push({
      $addFields: {
        recommendationScore: {
          $add: [
            // Recency score (0-40 points)
            {
              $multiply: [
                40,
                {
                  $exp: {
                    $divide: [
                      { $subtract: [Date.now(), '$createdAtTimestamp'] },
                      -86400000 // -24 hours in milliseconds
                    ]
                  }
                }
              ]
            },
            // Location score (0-30 points)
            {
              $cond: {
                if: { $ne: ['$kmAway', null] },
                then: {
                  $switch: {
                    branches: [
                      { case: { $lte: ['$kmAway', 5] }, then: 30 },
                      { case: { $lte: ['$kmAway', 15] }, then: 25 },
                      { case: { $lte: ['$kmAway', 30] }, then: 20 },
                      { case: { $lte: ['$kmAway', 50] }, then: 15 },
                      { case: { $lte: ['$kmAway', 80] }, then: 8 },
                      { case: { $lte: ['$kmAway', 150] }, then: 4 }
                    ],
                    default: 1
                  }
                },
                else: 10
              }
            },
            // Engagement score (0-15 points)
            { $min: [8, { $multiply: [{ $ifNull: ['$likesNo', 0] }, 0.1] }] },
            { $min: [7, { $multiply: [{ $ifNull: ['$views', 0] }, 0.01] }] },
            // Quality score (0-10 points)
            {
              $add: [
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$caption', ''] } }, 10] }, 2, 0] },
                { $cond: [{ $gt: [{ $size: { $ifNull: ['$dishes', []] } }, 0] }, 3, 0] },
                { $cond: [{ $eq: ['$reviewMode', true] }, 3, 0] },
                { $cond: [{ $ne: ['$poster', null] }, 2, 0] }
              ]
            }
          ]
        }
      }
    });
    
    // 6. Sort by recommendation score
    pipeline.push({ $sort: { recommendationScore: -1, created_at: -1 } });
    
    // 7. Skip and limit for pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    // 8. Populate dishes
    pipeline.push({
      $lookup: {
        from: 'dishes',
        localField: 'dishes',
        foreignField: '_id',
        as: 'dishes'
      }
    });
    
    // 9. Final projection to clean up fields
    pipeline.push({
      $project: {
        recommendationScore: 0, // Remove from final output
        createdAtTimestamp: 0,
        hasValidLocation: 0
      }
    });
    
    return pipeline;
  }
  
  // Optimized user likes batch query
  static async getUserLikesMap(userId, storyIds) {
    if (!userId || !storyIds.length) return new Map();
    
    const Like = mongoose.model('like');
    const likes = await Like.find({
      post_id: { $in: storyIds },
      user_id: userId
    }).select('post_id').lean();
    
    const likeMap = new Map();
    likes.forEach(like => {
      likeMap.set(like.post_id.toString(), true);
    });
    
    return likeMap;
  }
  
  // Optimized chef ratings aggregation
  static async getChefRatingsMap(chefIds) {
    if (!chefIds.length) return new Map();
    
    const Dish = mongoose.model('dish');
    const ratings = await Dish.aggregate([
      { 
        $match: { 
          user_id: { $in: chefIds.map(id => new mongoose.Types.ObjectId(id)) },
          average_rating: { $gt: 0 }
        } 
      },
      {
        $group: {
          _id: '$user_id',
          ratedDishesCount: { $sum: 1 },
          totalRating: { $sum: '$average_rating' }
        }
      },
      {
        $project: {
          ratedDishesCount: 1,
          averageDishRating: { 
            $round: [{ $divide: ['$totalRating', '$ratedDishesCount'] }, 1] 
          }
        }
      }
    ]);
    
    const ratingMap = new Map();
    ratings.forEach(rating => {
      ratingMap.set(rating._id.toString(), {
        averageDishRating: rating.averageDishRating,
        ratedDishesCount: rating.ratedDishesCount
      });
    });
    
    return ratingMap;
  }
  
  // Optimized dishes by category query
  static getDishesByCategoryPipeline(category, lat, long, limit = 50) {
    const pipeline = [];
    
    // 1. Match dishes by category (support legacy `category` and new `categories`)
    pipeline.push({
      $match: {
        $and: [
          { visible: { $ne: false } },
          {
            $or: [
              { category: { $regex: new RegExp(category, 'i') } },
              { categories: { $elemMatch: { $regex: new RegExp(category, 'i') } } }
            ]
          }
        ]
      }
    });
    
    // 2. Lookup chef information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'chef',
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
              bio: 1,
              locations: 1,
              chefSettings: 1
            }
          }
        ]
      }
    });
    
    // 3. Unwind chef
    pipeline.push({ $unwind: '$chef' });
    
    // 4. Add distance calculation if coordinates provided
    if (lat !== undefined && long !== undefined && !isNaN(lat) && !isNaN(long)) {
      pipeline.push({
        $addFields: {
          kmAway: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$chef.locations', null] },
                  { $gt: [{ $size: { $ifNull: ['$chef.locations', []] } }, 0] }
                ]
              },
              then: {
                $min: {
                  $map: {
                    input: '$chef.locations',
                    as: 'location',
                    in: {
                      $multiply: [
                        6371,
                        {
                          $acos: {
                            $add: [
                              {
                                $multiply: [
                                  { $sin: { $degreesToRadians: lat } },
                                  { $sin: { $degreesToRadians: '$$location.lat' } }
                                ]
                              },
                              {
                                $multiply: [
                                  { $cos: { $degreesToRadians: lat } },
                                  { $cos: { $degreesToRadians: '$$location.lat' } },
                                  { $cos: { $degreesToRadians: { $subtract: [long, '$$location.long'] } } }
                                ]
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              },
              else: null
            }
          }
        }
      });
      
      // 5. Sort by distance
      pipeline.push({ $sort: { kmAway: 1, created_at: -1 } });
    } else {
      // 5. Sort by creation date if no location
      pipeline.push({ $sort: { created_at: -1 } });
    }
    
    // 6. Limit results
    pipeline.push({ $limit: limit });
    
    // 7. Select only needed fields
    pipeline.push({
      $project: {
        name: 1,
        image: 1,
        price: 1,
        category: 1,
        categories: 1,
        visible: 1,
        created_at: 1,
        chef: 1,
        kmAway: 1
      }
    });
    
    return pipeline;
  }
  
  // Create essential indexes for performance
  static async createOptimizedIndexes() {
    const Story = mongoose.model('story');
    const Like = mongoose.model('like');
    const View = mongoose.model('view');
    const Dish = mongoose.model('dish');
    const User = mongoose.model('user');
    
    try {
      console.log('Creating optimized database indexes...');
      
      // Story indexes
      await Story.collection.createIndex({ author: 1, created_at: -1 });
      await Story.collection.createIndex({ category: 1, created_at: -1 });
      await Story.collection.createIndex({ created_at: -1, likesNo: -1 });
      await Story.collection.createIndex({ reviewMode: 1, created_at: -1 });
      
      // Like indexes for faster user like queries
      await Like.collection.createIndex({ user_id: 1, post_id: 1 }, { unique: true });
      await Like.collection.createIndex({ post_id: 1 });
      
      // View indexes for recommendation scoring
      await View.collection.createIndex({ user_id: 1, story: 1 }, { unique: true });
      await View.collection.createIndex({ story: 1 });
      
      // Dish indexes
      await Dish.collection.createIndex({ category: 1, visible: 1, created_at: -1 });
      await Dish.collection.createIndex({ user_id: 1, average_rating: 1 });
      await Dish.collection.createIndex({ visible: 1, created_at: -1 });
      
      // User indexes for location queries
      await User.collection.createIndex({ 'locations.lat': 1, 'locations.long': 1 });
      await User.collection.createIndex({ type: 1 });
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }
  
  // Batch process multiple operations efficiently
  static async batchProcess(items, processor, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }
    
    return results;
  }
}

module.exports = DatabaseOptimizations;