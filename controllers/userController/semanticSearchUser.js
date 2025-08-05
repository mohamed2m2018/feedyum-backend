const semanticSearchService = require('../../services/semanticSearchService');

const semanticSearchUser = async (req, res) => {
  try {
    const {
      searchString,
      page = 1,
      limit = 10,
      currentUserId,
      searchType = 'hybrid' // 'semantic', 'text', or 'hybrid'
    } = req.query;

    console.log('Semantic search users called with:', {
      searchString,
      page,
      limit,
      currentUserId,
      searchType
    });

    // If no search string, return empty results
    if (!searchString || searchString.trim() === '') {
      return res.status(200).json({
        success: true,
        data: {
          users: [],
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
      currentUserId
    };

    let searchResults;

    switch (searchType) {
      case 'semantic':
        searchResults = await semanticSearchService.searchUsers(searchString, options);
        break;
      case 'text':
        searchResults = await semanticSearchService.fallbackTextSearch('users', searchString, options);
        break;
      case 'hybrid':
      default:
        searchResults = await semanticSearchService.hybridSearch('users', searchString, options);
        break;
    }

    // Ensure consistent response format
    if (!searchResults.success) {
      return res.status(500).json({
        success: false,
        error: searchResults.error || 'Search failed',
        data: {
          users: [],
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

    // Remove embedding from response to reduce size (if any)
    const usersWithoutEmbeddings = searchResults.data.users.map(user => {
      const { embedding, embeddingGenerated, ...userWithoutEmbedding } = user;
      return userWithoutEmbedding;
    });

    console.log(`Semantic user search found ${usersWithoutEmbeddings.length} users for query: "${searchString}"`);

    return res.status(200).json({
      ...searchResults,
      data: {
        ...searchResults.data,
        users: usersWithoutEmbeddings
      }
    });

  } catch (error) {
    console.error('Semantic user search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during search',
      data: {
        users: [],
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

module.exports = semanticSearchUser; 