const semanticSearchService = require('../../services/semanticSearchService');

const semanticSearchDishes = async (req, res) => {
  try {
    const { 
      searchString, 
      page = 1, 
      limit = 10, 
      searchType = 'hybrid' // 'semantic', 'text', or 'hybrid'
    } = req.query;

    console.log('Semantic search dishes called with:', { 
      searchString, 
      page, 
      limit, 
      searchType 
    });

    // If no search string, return empty results
    if (!searchString || searchString.trim() === '') {
      return res.status(200).json({
        success: true,
        data: {
          dishes: [],
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
      filters: { visible: { $ne: false } }
    };

    let searchResults;

    switch (searchType) {
      case 'semantic':
        searchResults = await semanticSearchService.searchDishes(searchString, options);
        break;
      case 'text':
        searchResults = await semanticSearchService.fallbackTextSearch('dishes', searchString, options);
        break;
      case 'hybrid':
      default:
        searchResults = await semanticSearchService.hybridSearch('dishes', searchString, options);
        break;
    }

    // Ensure consistent response format
    if (!searchResults.success) {
      return res.status(500).json({
        success: false,
        error: searchResults.error || 'Search failed',
        data: {
          dishes: [],
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
    const dishesWithoutEmbeddings = searchResults.data.dishes.map(dish => {
      const { embedding, embeddingGenerated, ...dishWithoutEmbedding } = dish;
      return dishWithoutEmbedding;
    });

    console.log(`Semantic dishes search found ${dishesWithoutEmbeddings.length} dishes for query: "${searchString}"`);

    return res.status(200).json({
      ...searchResults,
      data: {
        ...searchResults.data,
        dishes: dishesWithoutEmbeddings
      }
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during search',
      data: {
        dishes: [],
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

module.exports = semanticSearchDishes; 