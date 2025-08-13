const mongoose = require('mongoose');

class PaginationOptimizer {
  
  // Cursor-based pagination for better performance on large datasets
  static async getCursorPaginatedResults(model, query, options = {}) {
    const {
      limit = 10,
      cursor = null,
      sortField = 'created_at',
      sortDirection = -1,
      select = null,
      populate = null
    } = options;
    
    // Build the query with cursor
    let aggregatedQuery = { ...query };
    
    if (cursor) {
      const cursorCondition = sortDirection === -1 
        ? { [sortField]: { $lt: cursor } }
        : { [sortField]: { $gt: cursor } };
      
      aggregatedQuery = {
        ...aggregatedQuery,
        ...cursorCondition
      };
    }
    
    // Build the query chain
    let queryChain = model.find(aggregatedQuery);
    
    if (select) {
      queryChain = queryChain.select(select);
    }
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => {
          queryChain = queryChain.populate(pop);
        });
      } else {
        queryChain = queryChain.populate(populate);
      }
    }
    
    queryChain = queryChain
      .sort({ [sortField]: sortDirection })
      .limit(limit + 1) // Fetch one extra to check if there are more
      .lean();
    
    const results = await queryChain.exec();
    
    // Check if there are more results
    const hasMore = results.length > limit;
    if (hasMore) {
      results.pop(); // Remove the extra item
    }
    
    // Get the next cursor
    const nextCursor = results.length > 0 
      ? results[results.length - 1][sortField]
      : null;
    
    return {
      data: results,
      hasMore,
      nextCursor,
      count: results.length
    };
  }
  
  // Optimized offset-based pagination with total count caching
  static async getOffsetPaginatedResults(model, query, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { created_at: -1 },
      select = null,
      populate = null,
      cacheTotalCount = true,
      countCache = null
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Build the query chain
    let queryChain = model.find(query);
    
    if (select) {
      queryChain = queryChain.select(select);
    }
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => {
          queryChain = queryChain.populate(pop);
        });
      } else {
        queryChain = queryChain.populate(populate);
      }
    }
    
    queryChain = queryChain
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Execute query and count in parallel
    const [results, totalCount] = await Promise.all([
      queryChain.exec(),
      cacheTotalCount && countCache 
        ? countCache 
        : model.countDocuments(query)
    ]);
    
    return {
      data: results,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }
  
  // Smart pagination that chooses between cursor and offset based on dataset size
  static async getSmartPaginatedResults(model, query, options = {}) {
    const { estimatedCount = null, threshold = 10000 } = options;
    
    // Estimate document count if not provided
    let docCount = estimatedCount;
    if (!docCount) {
      docCount = await model.estimatedDocumentCount();
    }
    
    // Use cursor pagination for large datasets, offset for smaller ones
    if (docCount > threshold) {
      return this.getCursorPaginatedResults(model, query, options);
    } else {
      return this.getOffsetPaginatedResults(model, query, options);
    }
  }
  
  // Aggregation pipeline pagination
  static async getAggregationPaginatedResults(model, pipeline, options = {}) {
    const {
      page = 1,
      limit = 10,
      countPipeline = null
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Clone pipeline for count
    const countPipelineToUse = countPipeline || [...pipeline];
    
    // Add pagination stages to main pipeline
    const paginatedPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: limit }
    ];
    
    // Add count stage to count pipeline
    const finalCountPipeline = [
      ...countPipelineToUse,
      { $count: "total" }
    ];
    
    // Execute both pipelines in parallel
    const [results, countResult] = await Promise.all([
      model.aggregate(paginatedPipeline),
      model.aggregate(finalCountPipeline)
    ]);
    
    const totalCount = countResult[0]?.total || 0;
    
    return {
      data: results,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }
  
  // Batch processing for large operations
  static async processBatch(items, processor, batchSize = 50, concurrent = 3) {
    const results = [];
    
    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize * concurrent) {
      const batches = [];
      
      // Create concurrent batches
      for (let j = 0; j < concurrent && (i + j * batchSize) < items.length; j++) {
        const batchStart = i + j * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, items.length);
        const batch = items.slice(batchStart, batchEnd);
        
        if (batch.length > 0) {
          batches.push(processor(batch));
        }
      }
      
      // Wait for all batches in this round to complete
      const batchResults = await Promise.all(batches);
      results.push(...batchResults.flat());
    }
    
    return results;
  }
  
  // Infinite scroll pagination for mobile apps
  static async getInfiniteScrollResults(model, query, options = {}) {
    const {
      lastId = null,
      limit = 20,
      sort = { _id: -1 },
      select = null,
      populate = null
    } = options;
    
    // Add cursor condition if lastId provided
    let finalQuery = { ...query };
    if (lastId) {
      const sortField = Object.keys(sort)[0];
      const sortDirection = Object.values(sort)[0];
      
      if (sortField === '_id') {
        finalQuery._id = sortDirection === -1 
          ? { $lt: mongoose.Types.ObjectId(lastId) }
          : { $gt: mongoose.Types.ObjectId(lastId) };
      } else {
        // For non-_id fields, we need a compound condition
        const lastDoc = await model.findById(lastId).select(sortField).lean();
        if (lastDoc) {
          finalQuery.$or = [
            { [sortField]: sortDirection === -1 
              ? { $lt: lastDoc[sortField] } 
              : { $gt: lastDoc[sortField] } 
            },
            {
              [sortField]: lastDoc[sortField],
              _id: sortDirection === -1 
                ? { $lt: mongoose.Types.ObjectId(lastId) }
                : { $gt: mongoose.Types.ObjectId(lastId) }
            }
          ];
        }
      }
    }
    
    // Build query
    let queryChain = model.find(finalQuery);
    
    if (select) {
      queryChain = queryChain.select(select);
    }
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => {
          queryChain = queryChain.populate(pop);
        });
      } else {
        queryChain = queryChain.populate(populate);
      }
    }
    
    queryChain = queryChain
      .sort(sort)
      .limit(limit + 1) // Fetch one extra to check if there are more
      .lean();
    
    const results = await queryChain.exec();
    
    // Check if there are more results
    const hasMore = results.length > limit;
    if (hasMore) {
      results.pop(); // Remove the extra item
    }
    
    // Get the next cursor (last item's ID)
    const nextCursor = results.length > 0 
      ? results[results.length - 1]._id
      : null;
    
    return {
      data: results,
      hasMore,
      nextCursor,
      count: results.length
    };
  }
}

module.exports = PaginationOptimizer;