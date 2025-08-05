const { pipeline } = require('@xenova/transformers');

class EmbeddingService {
  constructor() {
    this.model = null;
    this.modelName = 'Xenova/multilingual-e5-small'; // Multilingual model for Arabic + English content
    this.maxTokens = 512; // Max tokens for the local model
    this.isInitializing = false;
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
      this.model = await pipeline('feature-extraction', this.modelName);
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
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text input for embedding generation:', text);
      return null;
    }

    try {
      // Initialize model if not already done
      if (!this.model && !this.isInitializing) {
        console.log('Initializing embedding model...');
        await this.initializeModel();
      }

      // Wait for model to be ready if it's initializing
      let waitCount = 0;
      while (this.isInitializing && waitCount < 100) { // Max 10 seconds wait
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }

      if (!this.model) {
        console.warn('Local embedding model not available. Falling back to text search.');
        return null;
      }

      // Truncate text if it's too long
      const truncatedText = this.truncateText(text, this.maxTokens);
      console.log(`Generating embedding for text: "${truncatedText.substring(0, 100)}${truncatedText.length > 100 ? '...' : ''}"`);
      
      // Generate embedding using local model
      const output = await this.model(truncatedText, { pooling: 'mean', normalize: true });
      
      // Convert tensor to array
      const embedding = Array.from(output.data);
      console.log(`Generated embedding with ${embedding.length} dimensions`);
      
      return embedding;
    } catch (error) {
      console.error('Error generating local embedding:', error.message);
      console.error('Embedding error stack:', error.stack);
      return null;
    }
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