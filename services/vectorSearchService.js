const { Pinecone } = require("@pinecone-database/pinecone");

class VectorSearchService {
  constructor() {
    this.pinecone = null;
    this.indexes = {
      dishes: null,
      users: null,
      stories: null,
    };
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Initialize Pinecone client and indexes
   */
  async initialize() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._initializeInternal();
    return this.initializationPromise;
  }

  async _initializeInternal() {
    try {
      if (!process.env.PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY environment variable is required");
      }

      console.log("🚀 Initializing Pinecone client...");
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });

      // Initialize indexes
      const indexNames = {
        dishes: process.env.PINECONE_DISHES_INDEX || "dishes-index",
        users: process.env.PINECONE_USERS_INDEX || "users-index",
        stories: process.env.PINECONE_STORIES_INDEX || "stories-index",
      };

      for (const [type, indexName] of Object.entries(indexNames)) {
        try {
          this.indexes[type] = this.pinecone.index(indexName);
          console.log(`✅ Connected to ${type} index: ${indexName}`);
        } catch (error) {
          console.warn(
            `⚠️ Failed to connect to ${type} index: ${indexName}`,
            error.message
          );
          this.indexes[type] = null;
        }
      }

      this.isInitialized = true;
      console.log("✅ Pinecone initialization complete");
    } catch (error) {
      console.error("❌ Failed to initialize Pinecone:", error.message);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Search dishes using vector similarity with cursor-based pagination
   */
  async searchDishes(queryEmbedding, options = {}) {
    await this.initialize();

    if (!this.indexes.dishes) {
      throw new Error("Dishes index not available");
    }

    const {
      limit = 10,
      filters = {},
      includeMetadata = true,
      minScore = 0.2,
      cursor = null, // Score-based cursor for pagination
    } = options;

    try {
      console.log(
        `🔍 Searching dishes with vector (${queryEmbedding.length} dimensions), cursor: ${cursor}`
      );

      // Build Pinecone filters
      const pineconeFilter = this._buildPineconeFilter(filters);

      // Add cursor filter if provided
      if (cursor && pineconeFilter) {
        pineconeFilter.score = { $lt: cursor };
      } else if (cursor) {
        pineconeFilter = { score: { $lt: cursor } };
      }

      const searchResults = await this.indexes.dishes.query({
        vector: queryEmbedding,
        topK: limit + 1, // Get one extra to determine if there are more results
        includeMetadata,
        filter: pineconeFilter,
      });

      // Filter by minimum score
      const filteredMatches = searchResults.matches.filter(
        (match) => match.score >= minScore
      );

      // Check if there are more results
      const hasMore = filteredMatches.length > limit;
      const results = filteredMatches.slice(0, limit);

      // Get next cursor (score of last item)
      const nextCursor = hasMore ? results[results.length - 1]?.score : null;

      const formattedResults = results.map((match) => ({
        dishId: match.id,
        score: match.score,
        semanticScore: match.score,
        ...match.metadata,
      }));

      console.log(
        `✅ Found ${formattedResults.length} dishes with scores >= ${minScore}, hasMore: ${hasMore}`
      );

      return {
        results: formattedResults,
        pagination: {
          hasMore,
          nextCursor,
          limit,
        },
      };
    } catch (error) {
      console.error("❌ Pinecone dishes search error:", error.message);
      throw error;
    }
  }

  /**
   * Search users using vector similarity with cursor-based pagination
   */
  async searchUsers(queryEmbedding, options = {}) {
    await this.initialize();

    if (!this.indexes.users) {
      throw new Error("Users index not available");
    }

    const {
      limit = 10,
      filters = {},
      includeMetadata = true,
      minScore = 0.2,
      cursor = null,
    } = options;

    try {
      const pineconeFilter = this._buildPineconeFilter(filters);

      if (cursor && pineconeFilter) {
        pineconeFilter.score = { $lt: cursor };
      } else if (cursor) {
        pineconeFilter = { score: { $lt: cursor } };
      }

      const searchResults = await this.indexes.users.query({
        vector: queryEmbedding,
        topK: limit + 1,
        includeMetadata,
        filter: pineconeFilter,
      });

      const filteredMatches = searchResults.matches.filter(
        (match) => match.score >= minScore
      );
      const hasMore = filteredMatches.length > limit;
      const results = filteredMatches.slice(0, limit);
      const nextCursor = hasMore ? results[results.length - 1]?.score : null;

      const formattedResults = results.map((match) => ({
        userId: match.id,
        score: match.score,
        semanticScore: match.score,
        ...match.metadata,
      }));

      console.log(
        `✅ Found ${formattedResults.length} users with scores >= ${minScore}, hasMore: ${hasMore}`
      );

      return {
        results: formattedResults,
        pagination: {
          hasMore,
          nextCursor,
          limit,
        },
      };
    } catch (error) {
      console.error("❌ Pinecone users search error:", error.message);
      throw error;
    }
  }

  /**
   * Search stories using vector similarity with cursor-based pagination
   */
  async searchStories(queryEmbedding, options = {}) {
    await this.initialize();

    if (!this.indexes.stories) {
      throw new Error("Stories index not available");
    }

    const {
      limit = 10,
      filters = {},
      includeMetadata = true,
      minScore = 0.2,
      cursor = null,
    } = options;

    try {
      const pineconeFilter = this._buildPineconeFilter(filters);

      if (cursor && pineconeFilter) {
        pineconeFilter.score = { $lt: cursor };
      } else if (cursor) {
        pineconeFilter = { score: { $lt: cursor } };
      }

      const searchResults = await this.indexes.stories.query({
        vector: queryEmbedding,
        topK: limit + 1,
        includeMetadata,
        filter: pineconeFilter,
      });

      const filteredMatches = searchResults.matches.filter(
        (match) => match.score >= minScore
      );
      const hasMore = filteredMatches.length > limit;
      const results = filteredMatches.slice(0, limit);
      const nextCursor = hasMore ? results[results.length - 1]?.score : null;

      const formattedResults = results.map((match) => ({
        storyId: match.id,
        score: match.score,
        semanticScore: match.score,
        ...match.metadata,
      }));

      console.log(
        `✅ Found ${formattedResults.length} stories with scores >= ${minScore}, hasMore: ${hasMore}`
      );

      return {
        results: formattedResults,
        pagination: {
          hasMore,
          nextCursor,
          limit,
        },
      };
    } catch (error) {
      console.error("❌ Pinecone stories search error:", error.message);
      throw error;
    }
  }

  /**
   * Upsert (insert/update) vectors to Pinecone
   */
  async upsertVectors(indexType, vectors) {
    await this.initialize();

    const index = this.indexes[indexType];
    if (!index) {
      throw new Error(`${indexType} index not available`);
    }

    try {
      // Batch upsert in chunks of 100 (Pinecone limit)
      const chunkSize = 100;
      const results = [];

      for (let i = 0; i < vectors.length; i += chunkSize) {
        const chunk = vectors.slice(i, i + chunkSize);
        const result = await index.upsert(chunk);
        results.push(result);
 
        console.log(
          `📤 Upserted ${chunk.length} vectors to ${indexType} index`
        );

        // Small delay to avoid rate limits
        if (i + chunkSize < vectors.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error(
        `❌ Failed to upsert vectors to ${indexType}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Delete vectors from Pinecone
   */
  async deleteVectors(indexType, ids) {
    await this.initialize();

    const index = this.indexes[indexType];
    if (!index) {
      throw new Error(`${indexType} index not available`);
    }

    try {
      await index.deleteMany(ids);
      console.log(`🗑️ Deleted ${ids.length} vectors from ${indexType} index`);
    } catch (error) {
      console.error(
        `❌ Failed to delete vectors from ${indexType}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Build Pinecone filter from MongoDB-style filters
   */
  _buildPineconeFilter(mongoFilters) {
    const pineconeFilter = {};

    for (const [key, value] of Object.entries(mongoFilters)) {
      if (
        key === "visible" &&
        typeof value === "object" &&
        value.$ne !== undefined
      ) {
        // Convert { visible: { $ne: false } } to { visible: true }
        pineconeFilter.visible = true;
      } else if (
        key === "type" &&
        typeof value === "object" &&
        value.$ne !== undefined
      ) {
        // Convert { type: { $ne: "guest" } } to exclude guests
        // Pinecone doesn't support $ne directly, so we'll handle this in post-processing
        continue;
      } else if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        pineconeFilter[key] = value;
      }
    }

    return Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined;
  }

  /**
   * Get index statistics
   */
  async getIndexStats(indexType) {
    await this.initialize();

    const index = this.indexes[indexType];
    if (!index) {
      throw new Error(`${indexType} index not available`);
    }

    try {
      const stats = await index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error(
        `❌ Failed to get ${indexType} index stats:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return (
      this.isInitialized &&
      Object.values(this.indexes).some((index) => index !== null)
    );
  }
}

module.exports = new VectorSearchService();
