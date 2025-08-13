const semanticSearchService = require('../../services/semanticSearchService');

// Request timeout and concurrency control
const SEARCH_TIMEOUT = 15000; // 15 seconds
const activeRequests = new Map();

const semanticSearchDishes = async (req, res) => {
  const startTime = Date.now();
  
  // Helper function to safely send response
  const safeSendResponse = (statusCode, data) => {
    if (!res.headersSent && (!res.timeoutTriggered || !res.timeoutTriggered())) {
      return res.status(statusCode).json(data);
    } else {
      console.log('Response already sent or timeout triggered, skipping duplicate response');
      return;
    }
  };
  
  try {
    const { 
      searchString, 
      cursor = null,
      limit = 10, 
      searchType = 'hybrid', // 'semantic', 'text', or 'hybrid'
      chefId
    } = req.query;

    console.log('Semantic search dishes called with:', { 
      searchString, 
      cursor, 
      limit, 
      searchType 
    });

    // Create request key for deduplication
    const requestKey = `${searchString}-${cursor}-${limit}-${searchType}`;
    
    // Check if same request is already in progress
    if (activeRequests.has(requestKey)) {
      console.log('Duplicate request detected, waiting for existing request...');
      try {
        const result = await activeRequests.get(requestKey);
        return safeSendResponse(200, result);
      } catch (error) {
        // If the existing request failed, continue with new request
        activeRequests.delete(requestKey);
      }
    }

    // If no search string, use fallback text search to get all results
    if (!searchString || searchString.trim() === '') {
      console.log('Empty search string - returning all dishes');
      
      const options = {
        cursor: cursor ? parseFloat(cursor) : null,
        limit: parseInt(limit),
        chefId: chefId || undefined,
        filters: {
          visible: { $ne: false },
          ...(chefId ? { user_id: chefId, chefId: chefId } : {})
        }
      };
      
      // Create promise for search operation
      const searchPromise = (async () => {
        try {
          // Use fallback text search with empty string to get all results
          const searchResults = await semanticSearchService.fallbackTextSearch('dishes', '', options);
          
          if (!searchResults.success) {
            return {
              success: false,
              error: searchResults.error || 'Search failed',
              data: {
                dishes: [],
                pagination: {
                  hasMore: false,
                  nextCursor: null,
                  limit: parseInt(limit)
                }
              }
            };
          }
          
          // Remove embedding from response to reduce size
          const dishesWithoutEmbeddings = searchResults.data.dishes.map(dish => {
            const dishObj = dish.toObject ? dish.toObject() : dish;
            delete dishObj.embedding;
            delete dishObj.embeddingGenerated;
            return dishObj;
          });
          
          console.log(`Empty search returned ${dishesWithoutEmbeddings.length} dishes`);
          
          return {
            success: true,
            data: {
              dishes: dishesWithoutEmbeddings,
              pagination: searchResults.data.pagination || {
                hasMore: false,
                nextCursor: null,
                limit: parseInt(limit)
              },
              searchType: 'all'
            }
          };
        } catch (error) {
          console.error('Error in empty search:', error);
          throw error;
        }
      })();
      
      // Store promise for deduplication
      activeRequests.set(requestKey, searchPromise);
      
      try {
        const result = await searchPromise;
        activeRequests.delete(requestKey);
        return safeSendResponse(result.success ? 200 : 500, result);
      } catch (error) {
        activeRequests.delete(requestKey);
        throw error;
      }
    }

    const options = {
      cursor: cursor ? parseFloat(cursor) : null,
      limit: parseInt(limit),
      chefId: chefId || undefined,
      filters: {
        visible: { $ne: false },
        ...(chefId ? { user_id: chefId, chefId: chefId } : {})
      }
    };

    // Create promise for this search request
    const searchPromise = (async () => {
      // Set timeout for the search operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT);
      });

      let searchResults;
      
      try {
        const searchOperation = (async () => {
          // For short queries (< 3 chars), use text search only to avoid slow embedding
          if (searchString.trim().length < 3) {
            console.log('Short query detected, using text search only');
            return await semanticSearchService.fallbackTextSearch('dishes', searchString, options);
          }

          switch (searchType) {
            case 'semantic':
              return await semanticSearchService.searchDishes(searchString, options);
            case 'text':
              return await semanticSearchService.fallbackTextSearch('dishes', searchString, options);
            case 'hybrid':
            default:
              return await semanticSearchService.hybridSearch('dishes', searchString, options);
          }
        })();

        searchResults = await Promise.race([searchOperation, timeoutPromise]);
      } catch (error) {
        if (error.message === 'Search timeout') {
          console.log('Search timed out, falling back to text search');
          searchResults = await semanticSearchService.fallbackTextSearch('dishes', searchString, options);
        } else {
          throw error;
        }
      }

      return searchResults;
    })();

    // Store the promise for deduplication
    activeRequests.set(requestKey, searchPromise);

    let searchResults;
    try {
      searchResults = await searchPromise;
    } finally {
      // Clean up the request from active requests
      activeRequests.delete(requestKey);
    }

    // Check if response was already sent (by timeout middleware)
    if (res.headersSent || (res.timeoutTriggered && res.timeoutTriggered())) {
      console.log('Response already sent by timeout middleware, cleaning up...');
      return;
    }

    // Ensure consistent response format
    if (!searchResults.success) {
      return safeSendResponse(500, {
        success: false,
        error: searchResults.error || 'Search failed',
        data: {
          dishes: [],
          pagination: {
            hasMore: false,
            nextCursor: null,
            limit: parseInt(limit)
          }
        }
      });
    }

    // Remove embedding from response to reduce size
    const dishesWithoutEmbeddings = searchResults.data.dishes.map(dish => {
      const { embedding, embeddingGenerated, ...dishWithoutEmbedding } = dish;
      return dishWithoutEmbedding;
    });

    const duration = Date.now() - startTime;
    console.log(`Semantic dishes search found ${dishesWithoutEmbeddings.length} dishes for query: "${searchString}" in ${duration}ms`);

    const result = {
      ...searchResults,
      data: {
        ...searchResults.data,
        dishes: dishesWithoutEmbeddings
      }
    };

    return safeSendResponse(200, result);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Semantic search error after ${duration}ms:`, error);
    
    // Clean up any active request
    const requestKey = `${req.query.searchString}-${req.query.cursor || null}-${req.query.limit || 10}-${req.query.searchType || 'hybrid'}`;
    activeRequests.delete(requestKey);
    
    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      return safeSendResponse(500, {
        success: false,
        error: 'Internal server error during search',
        data: {
          dishes: [],
          pagination: {
            hasMore: false,
            nextCursor: null,
            limit: parseInt(req.query.limit || 10)
          }
        }
      });
    } else {
      console.log('Error occurred but response already sent by timeout middleware');
    }
  }
};

module.exports = semanticSearchDishes; 