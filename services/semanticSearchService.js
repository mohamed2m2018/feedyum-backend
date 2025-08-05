const embeddingService = require('./embeddingService');
const Dish = require('../models/dish');
const User = require('../models/user');
const Story = require('../models/story');

class SemanticSearchService {
  constructor() {
    this.similarityThreshold = 0.2; // Temporarily lowered for debugging Arabic search
    this.maxResults = 50; // Maximum number of results to consider
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

    /**
   * Enhance Arabic queries for better semantic search
   * @param {string} text - Arabic text to enhance
   * @returns {string} - Enhanced query
   */
  enhanceArabicQuery(text) {
    console.log(`🌍 Processing Arabic query: "${text}"`);
    
    // The multilingual model handles Arabic directly - no translation needed!
    console.log(`✨ Using multilingual model directly for: "${text}"`);
    return text.trim();
  }

  /**
   * Perform semantic search for dishes
   * @param {string} searchQuery - User's search query
   * @param {Object} options - Search options (page, limit, filters)
   * @returns {Promise<Object>} - Search results with similarity scores
   */
  async searchDishes(searchQuery, options = {}) {
    const { page = 1, limit = 10, filters = {} } = options;

    try {
      // Enhance Arabic queries for better semantic search
      let effectiveQuery = searchQuery;
      if (this.isArabicQuery(searchQuery)) {
        console.log(`Arabic dish search: "${searchQuery}" - Enhancing`);
        effectiveQuery = this.enhanceArabicQuery(searchQuery);
      }
      
      // Generate embedding for search query
      const queryEmbedding = await embeddingService.generateEmbedding(effectiveQuery);
      
      if (!queryEmbedding) {
        // Fallback to text search if embedding generation fails
        return this.fallbackTextSearch('dishes', searchQuery, options);
      }

      // Get dishes that have embeddings
      const dishes = await Dish.find({
        visible: { $ne: false },
        embedding: { $exists: true, $ne: null },
        ...filters
      })
      .select('+embedding +embeddingGenerated') // Explicitly include embeddings
      .populate('user_id', 'fullName avatar')
      .limit(this.maxResults * 2) // Get more to account for filtering
      .lean();

      // Calculate similarity scores
      const dishesWithScores = dishes
        .map(dish => {
          if (!dish.embedding || !Array.isArray(dish.embedding)) {
            return null;
          }

          const similarity = embeddingService.calculateCosineSimilarity(
            queryEmbedding,
            dish.embedding
          );

          return {
            ...dish,
            chef: dish.user_id,
            semanticScore: similarity
          };
        })
        .filter(dish => dish && dish.semanticScore >= this.similarityThreshold)
        .sort((a, b) => b.semanticScore - a.semanticScore);

      console.log(`Semantic search found ${dishesWithScores.length} dishes for query: "${searchQuery}"`);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = dishesWithScores.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          dishes: paginatedResults,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(dishesWithScores.length / limit),
            totalItems: dishesWithScores.length,
            hasNextPage: endIndex < dishesWithScores.length,
            hasPrevPage: page > 1
          },
          searchType: 'semantic'
        }
      };

    } catch (error) {
      console.error('Semantic search error for dishes:', error);
      // Fallback to text search
      return this.fallbackTextSearch('dishes', searchQuery, options);
    }
  }

  /**
   * Perform semantic search for users
   * @param {string} searchQuery - User's search query
   * @param {Object} options - Search options (page, limit, currentUserId)
   * @returns {Promise<Object>} - Search results with similarity scores
   */
  async searchUsers(searchQuery, options = {}) {
    const { page = 1, limit = 10, currentUserId } = options;

    try {
      // Enhance Arabic queries for better semantic search
      let effectiveQuery = searchQuery;
      if (this.isArabicQuery(searchQuery)) {
        console.log(`Arabic user search: "${searchQuery}" - Enhancing`);
        effectiveQuery = this.enhanceArabicQuery(searchQuery);
      }
      
      const queryEmbedding = await embeddingService.generateEmbedding(effectiveQuery);
      
      if (!queryEmbedding) {
        return this.fallbackTextSearch('users', searchQuery, options);
      }

      // Get users that have embeddings
      const users = await User.find({
        _id: { $ne: currentUserId },
        type: { $ne: "guest" },
        embedding: { $exists: true, $ne: null }
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
    const { page = 1, limit = 10, excludeReviews, reviewsOnly } = options;

    try {
      // Enhance Arabic queries for better semantic search
      let effectiveQuery = searchQuery;
      if (this.isArabicQuery(searchQuery)) {
        console.log(`Arabic semantic search: "${searchQuery}" - Enhancing`);
        effectiveQuery = this.enhanceArabicQuery(searchQuery);
      }
      
      const queryEmbedding = await embeddingService.generateEmbedding(effectiveQuery);
      
      if (!queryEmbedding) {
        console.log(`❌ Failed to generate embedding for "${effectiveQuery}" - falling back to text search`);
        return this.fallbackTextSearch('stories', searchQuery, options);
      }
      
      console.log(`✅ Generated embedding for "${effectiveQuery}" successfully`);

      // Build query based on review filtering
      let query = {
        embedding: { $exists: true, $ne: null }
      };

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
          embedding: { $exists: true, $ne: null }
        });
        console.log(`📊 Total stories with embeddings in database: ${allStoriesWithEmbeddings}`);
        
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
      // Smart enhancement for Arabic queries
      let effectiveQuery = searchQuery;
      if (this.isArabicQuery(searchQuery)) {
        console.log(`Arabic hybrid search: "${searchQuery}" - Enhancing for better results`);
        effectiveQuery = this.enhanceArabicQuery(searchQuery);
      }

      // Standard hybrid search with translated query if needed
      // Get semantic search results using translated query
      const semanticResults = await this[`search${type.charAt(0).toUpperCase() + type.slice(1)}`](
        effectiveQuery, 
        { ...options, limit: Math.ceil(options.limit / 2) }
      );

      // Get text search results using original query (for exact matches)
      const textResults = await this.fallbackTextSearch(
        type, 
        searchQuery, 
        { ...options, limit: Math.ceil(options.limit / 2) }
      );

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
              semanticResults.data.pagination?.totalPages || 1,
              textResults.data.pagination?.totalPages || 1
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
      const mockReq = {
        query: {
          searchString: searchQuery,
          page: options.page || 1,
          limit: options.limit || 10,
          ...options
        }
      };

      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log('Text search response:', { code, data });
            
            // Transform the response to match semantic search format
            if (code === 200 && data) {
              let transformedData;
              
              if (data.dishes) {
                transformedData = {
                  success: true,
                  data: {
                    dishes: data.dishes,
                    pagination: {
                      currentPage: parseInt(data.currentPage || options.page || 1),
                      totalPages: data.totalPages || 1,
                      totalItems: data.dishes.length,
                      hasNextPage: (data.currentPage || 1) < (data.totalPages || 1),
                      hasPrevPage: (data.currentPage || 1) > 1
                    }
                  },
                  searchType: 'text'
                };
              } else if (data.stories) {
                transformedData = {
                  success: true,
                  data: {
                    stories: data.stories,
                    pagination: {
                      currentPage: parseInt(data.currentPage || options.page || 1),
                      totalPages: data.totalPages || 1,
                      totalItems: data.stories.length,
                      hasNextPage: (data.currentPage || 1) < (data.totalPages || 1),
                      hasPrevPage: (data.currentPage || 1) > 1
                    }
                  },
                  searchType: 'text'
                };
              } else if (data.users) {
                transformedData = {
                  success: true,
                  data: {
                    users: data.users,
                    pagination: {
                      currentPage: parseInt(data.currentPage || options.page || 1),
                      totalPages: data.totalPages || 1,
                      totalItems: data.users.length,
                      hasNextPage: (data.currentPage || 1) < (data.totalPages || 1),
                      hasPrevPage: (data.currentPage || 1) > 1
                    }
                  },
                  searchType: 'text'
                };
              } else {
                // Handle cases where the response format doesn't match expected
                transformedData = {
                  success: true,
                  data: data,
                  searchType: 'text'
                };
              }
              
              resolve(transformedData);
            } else {
              resolve({
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
          
          // Handle direct json calls (without status)
          let transformedData;
          
          if (data.dishes) {
            transformedData = {
              success: true,
              data: {
                dishes: data.dishes,
                pagination: {
                  currentPage: parseInt(data.currentPage || options.page || 1),
                  totalPages: data.totalPages || 1,
                  totalItems: data.dishes.length,
                  hasNextPage: (data.currentPage || 1) < (data.totalPages || 1),
                  hasPrevPage: (data.currentPage || 1) > 1
                }
              },
              searchType: 'text'
            };
          } else if (data.stories) {
            transformedData = {
              success: true,
              data: {
                stories: data.stories,
                pagination: {
                  currentPage: parseInt(data.currentPage || options.page || 1),
                  totalPages: data.totalPages || 1,
                  totalItems: data.stories.length,
                  hasNextPage: (data.currentPage || 1) < (data.totalPages || 1),
                  hasPrevPage: (data.currentPage || 1) > 1
                }
              },
              searchType: 'text'
            };
          } else if (data.users) {
            transformedData = {
              success: true,
              data: {
                users: data.users,
                pagination: {
                  currentPage: parseInt(data.currentPage || options.page || 1),
                  totalPages: data.totalPages || 1,
                  totalItems: data.users.length,
                  hasNextPage: (data.currentPage || 1) < (data.totalPages || 1),
                  hasPrevPage: (data.currentPage || 1) > 1
                }
              },
              searchType: 'text'
            };
          } else {
            transformedData = {
              success: true,
              data: data,
              searchType: 'text'
            };
          }
          
          resolve(transformedData);
        }
      };

      try {
        controller(mockReq, mockRes);
      } catch (error) {
        console.error('Controller execution error:', error);
        resolve({
          success: false,
          error: error.message,
          data: {},
          searchType: 'text'
        });
      }
    });
  }
}

module.exports = new SemanticSearchService(); 