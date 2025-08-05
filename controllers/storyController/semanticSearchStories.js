const semanticSearchService = require('../../services/semanticSearchService');

const semanticSearchStories = async (req, res) => {
  try {
    const {
      searchString,
      page = 1,
      limit = 10,
      excludeReviews,
      reviewsOnly,
      searchType = 'hybrid' // 'semantic', 'text', or 'hybrid'
    } = req.query;

    console.log('Semantic search stories called with:', {
      searchString,
      page,
      limit,
      excludeReviews,
      reviewsOnly,
      searchType
    });

    // If no search string, return empty results
    if (!searchString || searchString.trim() === '') {
      return res.status(200).json({
        success: true,
        data: {
          stories: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          searchType: 'empty'
        }
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      excludeReviews,
      reviewsOnly
    };

    let searchResults;

    switch (searchType) {
      case 'semantic':
        searchResults = await semanticSearchService.searchStories(searchString, options);
        break;
      case 'text':
        searchResults = await semanticSearchService.fallbackTextSearch('stories', searchString, options);
        break;
      case 'hybrid':
      default:
        searchResults = await semanticSearchService.hybridSearch('stories', searchString, options);
        break;
    }

    // Ensure consistent response format
    if (!searchResults.success) {
      return res.status(500).json({
        success: false,
        error: searchResults.error || 'Search failed',
        data: {
          stories: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // Remove embedding from response to reduce size
    const storiesWithoutEmbeddings = searchResults.data.stories.map(story => {
      const storyObj = story.toObject ? story.toObject() : story;
      delete storyObj.embedding;
      
      // Also remove embeddings from populated dishes
      if (storyObj.dishes && Array.isArray(storyObj.dishes)) {
        storyObj.dishes = storyObj.dishes.map(dish => {
          const dishObj = dish.toObject ? dish.toObject() : dish;
          delete dishObj.embedding;
          delete dishObj.embeddingGenerated;
          return dishObj;
        });
      }
      
      return storyObj;
    });

    console.log(`Semantic search found ${storiesWithoutEmbeddings.length} stories for query: "${searchString}"`);

    return res.status(200).json({
        success: true,
        data: {
            stories: storiesWithoutEmbeddings,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(searchResults.data.totalItems / limit),
                totalItems: searchResults.data.totalItems,
                hasNextPage: page < Math.ceil(searchResults.data.totalItems / limit),
                hasPrevPage: page > 1,
            },
            searchType
        }
    });

  } catch (error) {
    console.error('Semantic story search error:', error);
    
    // Check if response already sent to prevent "Cannot set headers" error
    if (res.headersSent) {
      console.log('Response already sent, skipping error response');
      return;
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during search',
      data: {
        stories: [],
        pagination: {
          currentPage: parseInt(req.query.page || 1),
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  }
};

module.exports = semanticSearchStories; 