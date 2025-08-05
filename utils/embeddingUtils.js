/**
 * Utility functions for handling embeddings in API responses
 * Ensures embeddings are never sent to the frontend
 */

/**
 * Remove embedding fields from a single object
 * @param {Object} obj - The object to clean
 * @returns {Object} - Object with embedding fields removed
 */
function removeEmbeddings(obj) {
  if (!obj) return obj;
  
  // Convert to plain object if it's a Mongoose document
  const cleanObj = obj.toObject ? obj.toObject() : { ...obj };
  
  // Remove embedding fields
  delete cleanObj.embedding;
  delete cleanObj.embeddingGenerated;
  
  return cleanObj;
}

/**
 * Remove embedding fields from an array of objects
 * @param {Array} arr - Array of objects to clean
 * @returns {Array} - Array with embedding fields removed from each object
 */
function removeEmbeddingsFromArray(arr) {
  if (!Array.isArray(arr)) return arr;
  
  return arr.map(item => removeEmbeddings(item));
}

/**
 * Recursively remove embeddings from nested objects and arrays
 * Handles populated references like dishes in stories, etc.
 * @param {Object|Array} data - The data to clean
 * @returns {Object|Array} - Cleaned data
 */
function deepRemoveEmbeddings(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => deepRemoveEmbeddings(item));
  }
  
  if (typeof data === 'object') {
    // Convert to plain object if it's a Mongoose document
    const cleanObj = data.toObject ? data.toObject() : { ...data };
    
    // Remove embedding fields
    delete cleanObj.embedding;
    delete cleanObj.embeddingGenerated;
    
    // Recursively clean nested objects and arrays
    Object.keys(cleanObj).forEach(key => {
      if (cleanObj[key] && typeof cleanObj[key] === 'object') {
        cleanObj[key] = deepRemoveEmbeddings(cleanObj[key]);
      }
    });
    
    return cleanObj;
  }
  
  return data;
}

/**
 * Clean response data before sending to frontend
 * This is the main function that should be used in controllers
 * @param {Object|Array} data - The response data to clean
 * @returns {Object|Array} - Cleaned response data
 */
function cleanResponseData(data) {
  return deepRemoveEmbeddings(data);
}

module.exports = {
  removeEmbeddings,
  removeEmbeddingsFromArray,
  deepRemoveEmbeddings,
  cleanResponseData
}; 