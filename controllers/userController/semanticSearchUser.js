const semanticSearchService = require('../../services/semanticSearchService');
const mongoose = require('mongoose');
const Menu = require('../../models/menu');

/**
 * Bulk lookup dish counts for chef users
 */
async function attachDishCounts(users) {
  const chefIds = users
    .filter(u => u.type === 'chef')
    .map(u => new mongoose.Types.ObjectId(u._id));
  if (chefIds.length === 0) return users;

  const menuCounts = await Menu.aggregate([
    { $match: { chef: { $in: chefIds } } },
    { $project: { chef: 1, dishCount: { $size: { $ifNull: ['$dishes', []] } } } },
  ]);
  const countMap = {};
  menuCounts.forEach(m => { countMap[m.chef.toString()] = m.dishCount; });

  return users.map(u => ({
    ...u,
    ...(u.type === 'chef' && { dishCount: countMap[u._id?.toString()] || 0 }),
  }));
}

const semanticSearchUser = async (req, res) => {
  try {
    const {
      searchString,
      page = 1,
      limit = 10,
      currentUserId,
      searchType = 'hybrid', // 'semantic', 'text', or 'hybrid'
      filters,
      ...rest
    } = req.query;

    console.log('Semantic search users called with:', {
      searchString,
      page,
      limit,
      currentUserId,
      searchType,
      filters
    });

    // Parse filters if it's a string (e.g. from query params)
    let parsedFilters = {};
    if (typeof filters === 'string') {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (e) {
        console.warn('Failed to parse filters json', e);
      }
    } else if (typeof filters === 'object') {
      parsedFilters = filters;
    }

    // If no search string, use fallback text search to get all results
    if (!searchString || searchString.trim() === '') {
      console.log('Empty search string - returning all users');

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        currentUserId,
        filters: parsedFilters
      };

      // Use fallback text search with empty string to get all results
      const searchResults = await semanticSearchService.fallbackTextSearch('users', '', options);

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

      // Attach dish counts for chef users
      const usersWithDishCounts = await attachDishCounts(usersWithoutEmbeddings);

      console.log(`Empty search returned ${usersWithDishCounts.length} users`);

      return res.status(200).json({
        success: true,
        data: {
          users: usersWithDishCounts,
          pagination: searchResults.data.pagination || {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          searchType: 'all'
        }
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      currentUserId,
      filters: parsedFilters
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

    // Attach dish counts for chef users
    const usersWithDishCounts = await attachDishCounts(usersWithoutEmbeddings);

    console.log(`Semantic user search found ${usersWithDishCounts.length} users for query: "${searchString}" with filters:`, parsedFilters);

    return res.status(200).json({
      ...searchResults,
      data: {
        ...searchResults.data,
        users: usersWithDishCounts
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