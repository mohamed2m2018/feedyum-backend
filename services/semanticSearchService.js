const embeddingService = require('./embeddingService');
const Dish = require('../models/dish');
const User = require('../models/user');
const Story = require('../models/story');

class SemanticSearchService {
  constructor() {
    this.similarityThreshold = 0.35; // Threshold based on query testing: fast food=0.38+, sweets=0.32-0.35
    this.maxResults = 50;
  }

  /**
   * Detect if query contains Arabic characters
   * @param {string} query - Search query
   * @returns {boolean} - True if query contains Arabic
   */
  isArabicQuery(query) {
    if (!query) return false;
    // Arabic Unicode range: \u0600-\u06FF
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(query);
  }

  // Note: enhanceArabicQuery was removed as it caused incorrect search results.
  // OpenAI's text-embedding-3-large has excellent native multilingual support
  // and doesn't need manual query expansion which was adding irrelevant terms.

  /**
   * Perform semantic search for dishes using MongoDB
   * @param {string} searchQuery - User's search query
   * @param {Object} options - Search options (limit, filters)
   * @returns {Promise<Object>} - Search results with similarity scores
   */
  async searchDishes(searchQuery, options = {}) {
    const { limit = 10, filters = {} } = options;

    try {
      console.log(`🔍 Semantic dish search: "${searchQuery}"`);

      // Generate embedding for search query
      const queryEmbedding = await embeddingService.generateQueryEmbedding(searchQuery);

      if (!queryEmbedding) {
        console.log('Failed to generate query embedding, falling back to text search');
        return this.fallbackTextSearch('dishes', searchQuery, options);
      }

      console.log(`Query embedding: ${queryEmbedding.length} dimensions`);

      // Get dishes that have embeddings
      const dishes = await Dish.find({
        visible: { $ne: false },
        embedding: { $exists: true, $ne: null, $not: { $size: 0 } },
        ...filters
      })
        .select('+embedding')
        .populate('user_id', 'fullName avatar averageRating')
        .limit(this.maxResults)
        .lean();

      console.log(`Found ${dishes.length} dishes with embeddings`);

      // Calculate similarity scores
      const dishesWithScores = dishes
        .map(dish => {
          if (!dish.embedding || !Array.isArray(dish.embedding)) {
            return null;
          }

          // Check dimension match
          if (dish.embedding.length !== queryEmbedding.length) {
            console.log(`Dimension mismatch: dish has ${dish.embedding.length}, query has ${queryEmbedding.length}`);
            return null;
          }

          const similarity = embeddingService.calculateCosineSimilarity(
            queryEmbedding,
            dish.embedding
          );

          return {
            ...dish,
            embedding: undefined, // Don't return embedding
            averageRating: dish.average_rating || 0,
            chef: dish.user_id ? {
              _id: dish.user_id._id,
              fullName: dish.user_id.fullName,
              avatar: dish.user_id.avatar,
              averageRating: dish.user_id.averageRating || 0,
            } : null,
            semanticScore: similarity
          };
        })
        .filter(dish => dish && dish.semanticScore >= this.similarityThreshold)
        .sort((a, b) => b.semanticScore - a.semanticScore)
        .slice(0, limit);

      console.log(`Semantic search found ${dishesWithScores.length} matching dishes`);

      return {
        success: true,
        data: {
          dishes: dishesWithScores,
          pagination: {
            hasMore: false,
            nextCursor: null,
            limit
          },
          searchType: 'semantic'
        }
      };

    } catch (error) {
      console.error('Semantic search error:', error);
      return this.fallbackTextSearch('dishes', searchQuery, options);
    }
  }

  /**
   * Perform semantic search for users using Pinecone
   * @param {string} searchQuery - User's search query
   * @param {Object} options - Search options (cursor, limit, currentUserId)
   * @returns {Promise<Object>} - Search results with similarity scores
   */
  async searchUsers(searchQuery, options = {}) {
    const { page = 1, cursor = null, limit = 10, currentUserId, filters = {} } = options;

    try {
      // Use query directly - OpenAI model has native multilingual support
      const queryEmbedding = await embeddingService.generateQueryEmbedding(searchQuery);

      if (!queryEmbedding) {
        return this.fallbackTextSearch('users', searchQuery, options);
      }

      // Get users that have embeddings
      const users = await User.find({
        _id: { $ne: currentUserId },
        type: { $ne: "guest" },
        embedding: { $exists: true, $ne: null, $not: { $size: 0 } },
        ...filters
      })
        .select('+embedding +embeddingGenerated') // Explicitly include embeddings
        .limit(this.maxResults * 2)
        .lean();

      // Calculate similarity scores
      const usersWithScores = users
        .map(user => {
          if (!user.embedding || !Array.isArray(user.embedding)) {
            return null;
          }

          const similarity = embeddingService.calculateCosineSimilarity(
            queryEmbedding,
            user.embedding
          );

          return {
            ...user,
            semanticScore: similarity
          };
        })
        .filter(user => user && user.semanticScore >= this.similarityThreshold)
        .sort((a, b) => b.semanticScore - a.semanticScore);

      console.log(`Semantic search found ${usersWithScores.length} users for query: "${searchQuery}"`);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = usersWithScores.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          users: paginatedResults,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(usersWithScores.length / limit),
            totalItems: usersWithScores.length,
            hasNextPage: endIndex < usersWithScores.length,
            hasPrevPage: page > 1
          },
          searchType: 'semantic'
        }
      };

    } catch (error) {
      console.error('Semantic search error for users:', error);
      return this.fallbackTextSearch('users', searchQuery, options);
    }
  }

  /**
   * Perform semantic search for stories
   * @param {string} searchQuery - User's search query
   * @param {Object} options - Search options (page, limit, excludeReviews, reviewsOnly)
   * @returns {Promise<Object>} - Search results with similarity scores
   */
  async searchStories(searchQuery, options = {}) {
    const { page = 1, limit = 10, excludeReviews, reviewsOnly, authorType } = options;

    try {
      // Use query directly - OpenAI model has native multilingual support
      const queryEmbedding = await embeddingService.generateQueryEmbedding(searchQuery);

      if (!queryEmbedding) {
        console.log(`❌ Failed to generate query embedding for "${searchQuery}" - falling back to text search`);
        return this.fallbackTextSearch('stories', searchQuery, options);
      }

      console.log(`✅ Generated query embedding for "${searchQuery}" successfully`);

      // Build query based on review filtering
      // Note: $ne: [] ensures we exclude empty embedding arrays
      let query = {
        embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
      };

      // Author Type Filtering
      if (authorType) {
        try {
          const User = require('../models/user');
          let userQuery = {};

          if (authorType === 'chef') {
            userQuery = { type: 'chef' };
          } else if (authorType === 'user') {
            userQuery = { type: { $ne: 'chef' } };
          }

          // Find all users matching the type
          const users = await User.find(userQuery).select('_id');
          const userIds = users.map(u => u._id);

          // Add author filter to story query
          query.author = { $in: userIds };
          console.log(`Semantic Search: Filtering for authorType: ${authorType}, found ${userIds.length} users`);
        } catch (err) {
          console.error('Semantic Search: Error filtering by author type:', err);
        }
      }

      // Keep legacy review filtering if needed (though UI might stop sending it)
      if (excludeReviews === 'true') {
        query.$and = [{
          $or: [
            { rating: { $exists: false } },
            { rating: null },
            { reviewType: { $exists: false } },
            { reviewType: null },
            { reviewMode: { $ne: true } }
          ]
        }];
      } else if (reviewsOnly === 'true') {
        query.$and = [{
          $or: [
            { rating: { $exists: true, $ne: null } },
            { reviewType: { $exists: true, $ne: null } },
            { reviewMode: true }
          ]
        }];
      }

      const stories = await Story.find(query)
        .select('+embedding +embeddingGenerated') // Explicitly include embeddings
        .populate('author', 'fullName avatar')
        .limit(this.maxResults * 2)
        .lean();

      // Calculate similarity scores
      console.log(`Found ${stories.length} stories with embeddings for comparison`);

      const storiesWithScores = stories
        .map(story => {
          if (!story.embedding || !Array.isArray(story.embedding)) {
            return null;
          }

          const similarity = embeddingService.calculateCosineSimilarity(
            queryEmbedding,
            story.embedding
          );

          return {
            ...story,
            semanticScore: similarity
          };
        })
        .filter(story => story && story.semanticScore >= this.similarityThreshold)
        .sort((a, b) => b.semanticScore - a.semanticScore);

      console.log(`Semantic search found ${storiesWithScores.length} stories for query: "${searchQuery}"`);
      console.log(`Similarity threshold: ${this.similarityThreshold}`);

      // Log top 3 results with scores for debugging
      if (storiesWithScores.length > 0) {
        console.log('Top search results:');
        storiesWithScores.slice(0, 3).forEach((story, index) => {
          console.log(`${index + 1}. Score: ${story.semanticScore.toFixed(3)} - "${story.title || story.caption || 'No title'}" by ${story.author?.fullName || 'Unknown'}`);
        });
      } else {
        console.log('❌ No stories found above similarity threshold. Checking if any stories have embeddings...');

        // Debug: check if ANY stories have embeddings at all
        const allStoriesWithEmbeddings = await Story.countDocuments({
          embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
        });
        console.log(`📊 Total stories with non-empty embeddings in database: ${allStoriesWithEmbeddings}`);

        // Debug: show similarity scores of all stories (even below threshold)
        const allScores = stories
          .map(story => {
            if (!story.embedding || !Array.isArray(story.embedding)) return null;
            const similarity = embeddingService.calculateCosineSimilarity(queryEmbedding, story.embedding);
            return { title: story.title || story.caption || 'No title', score: similarity };
          })
          .filter(s => s)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        console.log('📈 Top 5 similarity scores (regardless of threshold):');
        allScores.forEach((item, index) => {
          console.log(`${index + 1}. Score: ${item.score.toFixed(3)} - "${item.title}"`);
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = storiesWithScores.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          stories: paginatedResults,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(storiesWithScores.length / limit),
            totalItems: storiesWithScores.length,
            hasNextPage: endIndex < storiesWithScores.length,
            hasPrevPage: page > 1
          },
          searchType: 'semantic'
        }
      };

    } catch (error) {
      console.error('Semantic search error for stories:', error);
      return this.fallbackTextSearch('stories', searchQuery, options);
    }
  }

  /**
   * Perform hybrid search combining semantic and text search
   * @param {string} type - Type of search (dishes, users, stories)
   * @param {string} searchQuery - User's search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Combined search results
   */
  async hybridSearch(type, searchQuery, options = {}) {
    try {
      const trimmedQuery = searchQuery.trim();

      // For very short queries, use text search only to avoid slow embedding
      if (trimmedQuery.length < 3) {
        console.log(`Short query "${trimmedQuery}" - using text search only`);
        return this.fallbackTextSearch(type, searchQuery, options);
      }

      // Use query directly - OpenAI model has native multilingual support
      // Use Promise.allSettled to handle failures gracefully
      const [semanticResult, textResult] = await Promise.allSettled([
        this[`search${type.charAt(0).toUpperCase() + type.slice(1)}`](
          searchQuery,
          { ...options, limit: Math.ceil(options.limit / 2) }
        ),
        this.fallbackTextSearch(
          type,
          searchQuery,
          { ...options, limit: Math.ceil(options.limit / 2) }
        )
      ]);

      // Extract results, handling failures
      const semanticResults = semanticResult.status === 'fulfilled' ? semanticResult.value : { data: { [type]: [] } };
      const textResults = textResult.status === 'fulfilled' ? textResult.value : { data: { [type]: [] } };

      // If both failed, return empty results
      if (semanticResult.status === 'rejected' && textResult.status === 'rejected') {
        console.error('Both semantic and text search failed');
        return {
          success: false,
          error: 'Search temporarily unavailable',
          data: {
            [type]: [],
            pagination: {
              currentPage: options.page || 1,
              totalPages: 0,
              totalItems: 0,
              hasNextPage: false,
              hasPrevPage: false
            },
            searchType: 'hybrid'
          }
        };
      }

      // Combine and deduplicate results
      const combinedResults = this.combineSearchResults(
        semanticResults.data[type] || [],
        textResults.data[type] || [],
        options.limit
      );

      return {
        success: true,
        data: {
          [type]: combinedResults,
          pagination: {
            currentPage: options.page || 1,
            totalPages: Math.max(
              semanticResults.data?.pagination?.totalPages || 1,
              textResults.data?.pagination?.totalPages || 1
            ),
            totalItems: combinedResults.length,
            hasNextPage: combinedResults.length >= options.limit,
            hasPrevPage: (options.page || 1) > 1
          },
          searchType: 'hybrid'
        }
      };

    } catch (error) {
      console.error('Hybrid search error:', error);
      return this.fallbackTextSearch(type, searchQuery, options);
    }
  }

  /**
   * Combine semantic and text search results
   * @param {Array} semanticResults - Results from semantic search
   * @param {Array} textResults - Results from text search
   * @param {number} limit - Maximum number of results
   * @returns {Array} - Combined and deduplicated results
   */
  combineSearchResults(semanticResults, textResults, limit) {
    const seen = new Set();
    const combined = [];

    // Add semantic results first (higher priority)
    for (const item of semanticResults) {
      const id = item._id.toString();
      if (!seen.has(id)) {
        seen.add(id);
        combined.push({ ...item, searchSource: 'semantic' });
      }
    }

    // Add text results
    for (const item of textResults) {
      const id = item._id.toString();
      if (!seen.has(id) && combined.length < limit) {
        seen.add(id);
        combined.push({ ...item, searchSource: 'text' });
      }
    }

    return combined.slice(0, limit);
  }

  /**
   * Fallback to traditional text search
   * @param {string} type - Type of search (dishes, users, stories)
   * @param {string} searchQuery - User's search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Text search results
   */
  async fallbackTextSearch(type, searchQuery, options = {}) {
    // Import controllers dynamically to avoid circular dependencies
    try {
      switch (type) {
        case 'dishes': {
          const searchDishes = require('../controllers/dishController/searchDishes');
          return await this.wrapControllerCall(searchDishes, searchQuery, options);
        }

        case 'users': {
          const searchUser = require('../controllers/userController/searchUser');
          return await this.wrapControllerCall(searchUser, searchQuery, options);
        }

        case 'stories': {
          const searchStories = require('../controllers/storyController/searchStories');
          return await this.wrapControllerCall(searchStories, searchQuery, options);
        }

        default:
          throw new Error(`Unknown search type: ${type}`);
      }
    } catch (error) {
      console.error(`Fallback text search error for ${type}:`, error);
      return {
        success: false,
        error: 'Search temporarily unavailable',
        data: {
          [type]: [],
          pagination: {
            currentPage: options.page || 1,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      };
    }
  }

  /**
   * Wrap controller calls to return consistent format
   * @param {Function} controller - Controller function
   * @param {string} searchQuery - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Wrapped controller response
   */
  async wrapControllerCall(controller, searchQuery, options) {
    return new Promise((resolve) => {
      let resolved = false;

      const mockReq = {
        query: {
          searchString: searchQuery,
          page: options.page || 1,
          limit: options.limit || 10,
          ...options
        }
      };

      const resolveOnce = (data) => {
        if (resolved) return;
        resolved = true;
        resolve(data);
      };

      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log('Text search response:', { code, data });

            if (code === 200 && data) {
              let transformedData = this.transformSearchResponse(data, options);
              resolveOnce(transformedData);
            } else {
              resolveOnce({
                success: false,
                error: data?.error || 'Search failed',
                data: {},
                searchType: 'text'
              });
            }
          }
        }),
        json: (data) => {
          console.log('Direct text search response:', data);
          let transformedData = this.transformSearchResponse(data, options);
          resolveOnce(transformedData);
        }
      };

      try {
        controller(mockReq, mockRes);
      } catch (error) {
        console.error('Controller execution error:', error);
        resolveOnce({
          success: false,
          error: error.message,
          data: {},
          searchType: 'text'
        });
      }
    });
  }

  /**
   * Transform search response to consistent format
   * @param {Object} data - Response data
   * @param {Object} options - Search options
   * @returns {Object} - Transformed response
   */
  transformSearchResponse(data, options) {
    // Handle nested data structure first (most common case from controllers)
    if (data.data) {
      if (data.data.stories) {
        return {
          success: true,
          data: {
            stories: data.data.stories,
            pagination: {
              currentPage: data.data.currentPage || parseInt(options.page || 1),
              totalPages: data.data.totalPages || 1,
              totalItems: data.data.totalItems || data.data.stories.length,
              hasNextPage: data.data.hasNextPage || false,
              hasPrevPage: data.data.hasPrevPage || false
            }
          },
          searchType: 'text'
        };
      } else if (data.data.dishes) {
        return {
          success: true,
          data: {
            dishes: data.data.dishes,
            pagination: data.data.pagination || {
              currentPage: data.data.currentPage || parseInt(options.page || 1),
              totalPages: data.data.totalPages || 1,
              totalItems: data.data.totalItems || data.data.dishes.length,
              hasNextPage: data.data.hasNextPage || false,
              hasPrevPage: data.data.hasPrevPage || false,
              hasMore: data.data.hasMore,
              nextCursor: data.data.nextCursor
            }
          },
          searchType: 'text'
        };
      } else if (data.data.users) {
        return {
          success: true,
          data: {
            users: data.data.users,
            pagination: {
              currentPage: data.data.currentPage || parseInt(options.page || 1),
              totalPages: data.data.totalPages || 1,
              totalItems: data.data.totalItems || data.data.users.length,
              hasNextPage: data.data.hasNextPage || false,
              hasPrevPage: data.data.hasPrevPage || false
            }
          },
          searchType: 'text'
        };
      } else {
        // Generic nested data
        return {
          success: true,
          data: data.data,
          searchType: 'text'
        };
      }
    }

    // Handle direct data structure (legacy format)
    if (data.dishes) {
      return {
        success: true,
        data: {
          dishes: data.dishes,
          pagination: data.pagination || {
            currentPage: parseInt(options.page || 1),
            totalPages: data.totalPages || 1,
            totalItems: data.dishes.length,
            hasNextPage: (parseInt(options.page || 1)) < (data.totalPages || 1),
            hasPrevPage: (parseInt(options.page || 1)) > 1
          }
        },
        searchType: 'text'
      };
    } else if (data.stories) {
      return {
        success: true,
        data: {
          stories: data.stories,
          pagination: data.pagination || {
            currentPage: parseInt(options.page || 1),
            totalPages: data.totalPages || 1,
            totalItems: data.stories.length,
            hasNextPage: (parseInt(options.page || 1)) < (data.totalPages || 1),
            hasPrevPage: (parseInt(options.page || 1)) > 1
          }
        },
        searchType: 'text'
      };
    } else if (data.users) {
      return {
        success: true,
        data: {
          users: data.users,
          pagination: data.pagination || {
            currentPage: parseInt(options.page || 1),
            totalPages: data.totalPages || 1,
            totalItems: data.users.length,
            hasNextPage: (parseInt(options.page || 1)) < (data.totalPages || 1),
            hasPrevPage: (parseInt(options.page || 1)) > 1
          }
        },
        searchType: 'text'
      };
    } else {
      return {
        success: true,
        data: data,
        searchType: 'text'
      };
    }
  }
}

module.exports = new SemanticSearchService(); 