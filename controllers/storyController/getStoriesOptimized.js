const mongoose = require("mongoose");
const cacheManager = require("../../utils/cacheManager");
const DatabaseOptimizations = require("../../utils/databaseOptimizations");

// Models
const Story = mongoose.model("story");
const View = mongoose.model('view');

const getStoriesOptimized = async (req, res) => {
  const startTime = Date.now();
  console.log(`[PERFORMANCE] Optimized getStories START: ${new Date().toISOString()}`);
  
  const { page = 1, limit = 10, categoryIds, lat, long } = req.query;
  const errors = {};
  const pageSize = parseInt(limit);
  const userId = req.user?._id?.toString();
  
  console.log(`[DEBUG] User: ${userId}, Page: ${page}, Limit: ${limit}, Categories: ${categoryIds}`);

  try {
    // Prepare parameters for caching and queries
    const queryParams = {
      page: parseInt(page),
      limit: pageSize,
      categoryIds: categoryIds ? categoryIds.split(',') : [],
      lat: lat !== 'undefined' ? parseFloat(lat) : undefined,
      long: long !== 'undefined' ? parseFloat(long) : undefined,
      userId
    };

    // Generate cache key for this specific query
    const cacheKey = cacheManager.generateKey('stories_optimized', {
      page: queryParams.page,
      limit: queryParams.limit,
      categoryIds: queryParams.categoryIds.join(','),
      lat: queryParams.lat,
      long: queryParams.long,
      userId: queryParams.userId
    });

    // Try to get from cache first
    let cachedResult = await cacheManager.get(cacheKey);
    if (cachedResult) {
      console.log(`[PERFORMANCE] Cache HIT for stories - ${Date.now() - startTime}ms`);
      return res.json(cachedResult);
    }

    console.log(`[PERFORMANCE] Cache MISS - executing database query`);

    // Get user's viewed stories for recommendation scoring (with caching)
    let viewedStoryIds = new Set();
    if (userId) {
      const cachedViews = await cacheManager.getCachedUserViews(userId);
      if (cachedViews) {
        viewedStoryIds = new Set(cachedViews);
      } else {
        const userViews = await View.find({ user_id: userId })
          .select('story')
          .lean();
        viewedStoryIds = new Set(userViews.map(view => view.story.toString()));
        
        // Cache user views for future requests
        await cacheManager.cacheUserViews(userId, Array.from(viewedStoryIds));
      }
    }

    // Use optimized aggregation pipeline
    const aggregationPipeline = DatabaseOptimizations.getStoriesAggregationPipeline(queryParams);
    
    console.log(`[DEBUG] Executing aggregation pipeline...`);
    const stories = await Story.aggregate(aggregationPipeline);
    
    // Get total count for pagination (cached separately for performance)
    const countCacheKey = cacheManager.generateKey('stories_count', {
      categoryIds: queryParams.categoryIds.join(',')
    });
    
    let totalCount = await cacheManager.get(countCacheKey);
    if (totalCount === null) {
      const countMatch = {};
      if (queryParams.categoryIds.length > 0) {
        countMatch.category = { $in: queryParams.categoryIds.map(id => mongoose.Types.ObjectId(id)) };
      }
      totalCount = await Story.countDocuments(countMatch);
      await cacheManager.set(countCacheKey, totalCount, 600); // Cache count for 10 minutes
    }

    console.log(`[DEBUG] Found ${stories.length} stories`);

    // Batch process user likes if user exists
    if (userId && stories.length > 0) {
      const storyIds = stories.map(story => story._id);
      
      // Check cache for user likes
      const cachedLikes = await cacheManager.getCachedUserLikes(userId, storyIds);
      let likeMap;
      
      if (cachedLikes) {
        likeMap = new Map(Object.entries(cachedLikes));
      } else {
        likeMap = await DatabaseOptimizations.getUserLikesMap(userId, storyIds);
        
        // Cache likes for this user and story set
        const likesObject = Object.fromEntries(likeMap);
        await cacheManager.cacheUserLikes(userId, storyIds, likesObject);
      }

      // Apply likes to stories
      stories.forEach(story => {
        story.currentUserLiked = likeMap.has(story._id.toString());
      });
    }

    // Batch process chef ratings
    const uniqueChefIds = [...new Set(stories.map(s => s.author?._id?.toString()).filter(Boolean))];
    if (uniqueChefIds.length > 0) {
      const cachedRatings = await cacheManager.getCachedChefRatings(uniqueChefIds);
      let ratingMap;
      
      if (cachedRatings) {
        ratingMap = new Map(Object.entries(cachedRatings));
      } else {
        ratingMap = await DatabaseOptimizations.getChefRatingsMap(uniqueChefIds);
        
        // Cache ratings
        const ratingsObject = Object.fromEntries(ratingMap);
        await cacheManager.cacheChefRatings(uniqueChefIds, ratingsObject);
      }

      // Apply ratings to stories
      stories.forEach(story => {
        if (story.author?._id) {
          const rating = ratingMap.get(story.author._id.toString());
          if (rating) {
            story.author.averageDishRating = rating.averageDishRating;
            story.author.ratedDishesCount = rating.ratedDishesCount;
          } else {
            story.author.averageDishRating = 0;
            story.author.ratedDishesCount = 0;
          }
        }
      });
    }

    // Apply view history bias to recommendation
    stories.forEach(story => {
      const isViewed = viewedStoryIds.has(story._id.toString());
      story.isViewed = isViewed;
      
      // Ensure avatarUri is populated for frontend compatibility
      if (!story.avatarUri && story.poster) {
        story.avatarUri = story.poster;
      }
    });

    const result = {
      stories: stories || [],
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: parseInt(page),
      message: stories.length ? "Stories fetched with optimized performance" : "No stories found"
    };

    // Cache the result for future requests (shorter TTL for personalized data)
    const cacheTTL = userId ? 120 : 300; // 2 min for personalized, 5 min for general
    await cacheManager.set(cacheKey, result, cacheTTL);

    const executionTime = Date.now() - startTime;
    console.log(`[PERFORMANCE] Optimized getStories COMPLETED: ${executionTime}ms`);
    
    // Add performance metrics to response in development
    if (process.env.NODE_ENV === 'development') {
      result.performance = {
        executionTime: `${executionTime}ms`,
        cacheHit: false,
        storiesCount: stories.length,
        totalCount
      };
    }

    res.json(result);
    
  } catch (err) {
    console.error(`[ERROR] Error in optimized getStories:`, err);
    errors.error = "Error fetching stories from the database";
    res.status(500).json({ 
      ...errors, 
      message: err.message,
      performance: {
        executionTime: `${Date.now() - startTime}ms`,
        error: true
      }
    });
  }
};

module.exports = getStoriesOptimized;