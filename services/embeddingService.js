let pipelineInstance = null;

class EmbeddingService {
  constructor() {
    this.model = null;
    this.modelName = 'Xenova/multilingual-e5-base'; // Larger multilingual model - better cross-language understanding
    this.maxTokens = 512; // Max tokens for the local model
    this.isInitializing = false;
    this.embeddingCache = new Map(); // Cache for embeddings
    this.maxCacheSize = 1000; // Maximum cache entries
    this.pendingEmbeddings = new Map(); // Track pending embedding requests
    
    // E5 model prefixes - REQUIRED for proper semantic search
    // See: https://huggingface.co/intfloat/multilingual-e5-small
    this.queryPrefix = 'query: ';
    this.passagePrefix = 'passage: ';
  }

  /**
   * Initialize the local embedding model
   */
  async initializeModel() {
    if (this.model || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    try {
      console.log('🤖 Loading local embedding model...');
      
      // Dynamically import the transformers module
      if (!pipelineInstance) {
        const transformers = await import('@xenova/transformers');
        pipelineInstance = transformers.pipeline;
      }
      
      this.model = await pipelineInstance('feature-extraction', this.modelName);
      console.log('✅ Local embedding model loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load local embedding model:', error.message);
      this.model = null;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Generate embeddings for a given text using local model
   * @param {string} text - Text to generate embeddings for
   * @param {string} type - Type of text: 'query' for search queries, 'passage' for documents/content (default)
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generateEmbedding(text, type = 'passage') {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text input for embedding generation:', text);
      return null;
    }

    // E5 models REQUIRE prefixes for proper semantic search
    // - "query: " for search queries (user input)
    // - "passage: " for documents/content being searched
    const prefix = type === 'query' ? this.queryPrefix : this.passagePrefix;
    const prefixedText = `${prefix}${text}`;
    
    const truncatedText = this.truncateText(prefixedText, this.maxTokens);
    const cacheKey = `${type}:${truncatedText.toLowerCase().trim()}`;

    // Check cache first
    if (this.embeddingCache.has(cacheKey)) {
      console.log(`Cache hit for ${type} embedding: "${text.substring(0, 50)}..."`);
      return this.embeddingCache.get(cacheKey);
    }

    // Check if embedding is already being generated
    if (this.pendingEmbeddings.has(cacheKey)) {
      console.log(`Waiting for pending ${type} embedding: "${text.substring(0, 50)}..."`);
      return await this.pendingEmbeddings.get(cacheKey);
    }

    // Create promise for this embedding generation
    const embeddingPromise = this._generateEmbeddingInternal(truncatedText, cacheKey);
    this.pendingEmbeddings.set(cacheKey, embeddingPromise);

    try {
      const embedding = await embeddingPromise;
      
      // Cache the result
      if (embedding) {
        this._addToCache(cacheKey, embedding);
      }
      
      return embedding;
    } finally {
      // Clean up pending request
      this.pendingEmbeddings.delete(cacheKey);
    }
  }

  /**
   * Generate embedding specifically for search queries
   * Uses the E5 "query: " prefix for optimal cross-language semantic matching
   * @param {string} queryText - Search query text
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generateQueryEmbedding(queryText) {
    return this.generateEmbedding(queryText, 'query');
  }

  /**
   * Generate embedding specifically for documents/passages
   * Uses the E5 "passage: " prefix for optimal semantic indexing
   * @param {string} passageText - Document/passage text
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generatePassageEmbedding(passageText) {
    return this.generateEmbedding(passageText, 'passage');
  }

  /**
   * Internal method to generate embeddings
   * @private
   */
  async _generateEmbeddingInternal(truncatedText, cacheKey) {
    try {
      // Initialize model if not already done
      if (!this.model && !this.isInitializing) {
        console.log('Initializing embedding model...');
        await this.initializeModel();
      }

      // Wait for model to be ready if it's initializing
      let waitCount = 0;
      while (this.isInitializing && waitCount < 50) { // Max 5 seconds wait
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }

      if (!this.model) {
        console.warn('Local embedding model not available. Falling back to text search.');
        return null;
      }

      console.log(`Generating embedding for text: "${truncatedText.substring(0, 100)}${truncatedText.length > 100 ? '...' : ''}"`);
      
      // Generate embedding using local model with timeout
      const embeddingPromise = this.model(truncatedText, { pooling: 'mean', normalize: true });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Embedding generation timeout')), 10000); // 10 second timeout
      });

      const output = await Promise.race([embeddingPromise, timeoutPromise]);
      
      // Convert tensor to array
      const embedding = Array.from(output.data);
      console.log(`Generated embedding with ${embedding.length} dimensions`);
      
      return embedding;
    } catch (error) {
      console.error('Error generating local embedding:', error.message);
      if (error.message === 'Embedding generation timeout') {
        console.error('Embedding generation timed out - model may be overloaded');
      }
      return null;
    }
  }

  /**
   * Add embedding to cache with size management
   * @private
   */
  _addToCache(key, embedding) {
    // Remove oldest entries if cache is full
    if (this.embeddingCache.size >= this.maxCacheSize) {
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }
    
    this.embeddingCache.set(key, embedding);
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param {string[]} texts - Array of texts to generate embeddings for
   * @returns {Promise<(number[]|null)[]>} - Array of embedding arrays
   */
  async generateBatchEmbeddings(texts) {
    if (!Array.isArray(texts)) {
      throw new Error('Input must be an array of texts');
    }

    // Process in chunks to avoid API limits
    const chunkSize = 100;
    const results = [];

    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      const chunkResults = await Promise.allSettled(
        chunk.map(text => this.generateEmbedding(text))
      );

      const embeddings = chunkResults.map(result => 
        result.status === 'fulfilled' ? result.value : null
      );

      results.push(...embeddings);
    }

    return results;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {number[]} embedding1 - First embedding vector
   * @param {number[]} embedding2 - Second embedding vector
   * @returns {number} - Similarity score between 0 and 1
   */
  calculateCosineSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Truncate text to fit within token limits for local model
   * @param {string} text - Text to truncate
   * @param {number} maxTokens - Maximum number of tokens
   * @returns {string} - Truncated text
   */
  truncateText(text, maxTokens) {
    // For local models, use more conservative approximation: 1 token ≈ 3 characters
    const maxChars = maxTokens * 3;
    
    if (text.length <= maxChars) {
      return text;
    }

    // Truncate at word boundary
    const truncated = text.substring(0, maxChars);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;
  }

  /**
   * Prepare text for embedding by cleaning and combining relevant fields
   * @param {Object} item - Object containing text fields
   * @param {string[]} fields - Field names to combine
   * @returns {string} - Combined and cleaned text
   */
  prepareTextForEmbedding(item, fields) {
    const textParts = fields
      .map(field => {
        const value = item[field];
        if (Array.isArray(value)) {
          return value.join(' ');
        }
        return typeof value === 'string' ? value : '';
      })
      .filter(text => text.trim().length > 0);

    return textParts.join(' ').trim();
  }
}

module.exports = new EmbeddingService(); 