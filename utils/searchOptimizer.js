/**
 * Search optimization utilities for frontend integration
 */

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function to limit API calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Smart search strategy selector
 * @param {string} query - Search query
 * @returns {string} - Recommended search type
 */
const getOptimalSearchType = (query) => {
  if (!query || query.trim().length === 0) {
    return 'none';
  }
  
  const trimmedQuery = query.trim();
  
  // For very short queries, use text search only
  if (trimmedQuery.length < 3) {
    return 'text';
  }
  
  // For longer queries, use hybrid search
  return 'hybrid';
};

/**
 * Search delay calculator based on query length
 * @param {string} query - Search query
 * @returns {number} - Recommended delay in milliseconds
 */
const getSearchDelay = (query) => {
  if (!query || query.trim().length === 0) {
    return 0;
  }
  
  const trimmedQuery = query.trim();
  
  // Shorter delay for longer queries (user is more likely to be done typing)
  if (trimmedQuery.length >= 5) {
    return 300; // 300ms
  } else if (trimmedQuery.length >= 3) {
    return 500; // 500ms
  } else {
    return 800; // 800ms for very short queries
  }
};

module.exports = {
  debounce,
  throttle,
  getOptimalSearchType,
  getSearchDelay
};