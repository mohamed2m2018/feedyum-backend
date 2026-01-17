const OpenAI = require('openai');
let pipelineInstance = null;

class EmbeddingService {
  constructor() {
    // OpenAI client (primary) - using large model for better Arabic support
    this.openai = null;
    this.openaiModel = 'text-embedding-3-large';
    this.openaiDimensions = 3072;

    // Local model (fallback)
    this.localModel = null;
    this.localModelName = 'Xenova/multilingual-e5-small';
    this.isInitializingLocal = false;

    // Common settings
    this.maxTokens = 8191; // OpenAI limit
    this.embeddingCache = new Map();
    this.maxCacheSize = 1000;
    this.pendingEmbeddings = new Map();

    // E5 model prefixes (for local fallback)
    this.queryPrefix = 'query: ';
    this.passagePrefix = 'passage: ';

    // Initialize OpenAI if API key available
    this._initOpenAI();
  }

  /**
   * Initialize OpenAI client
   */
  _initOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI embedding client initialized');
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found, using local model only');
    }
  }

  /**
   * Initialize local embedding model (fallback)
   */
  async initializeLocalModel() {
    if (this.localModel || this.isInitializingLocal) {
      return;
    }

    this.isInitializingLocal = true;
    try {
      console.log('🤖 Loading local embedding model...');
      if (!pipelineInstance) {
        const transformers = await import('@xenova/transformers');
        pipelineInstance = transformers.pipeline;
      }
      this.localModel = await pipelineInstance('feature-extraction', this.localModelName);
      console.log('✅ Local embedding model loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load local embedding model:', error.message);
      this.localModel = null;
    } finally {
      this.isInitializingLocal = false;
    }
  }

  /**
   * Generate embeddings - tries OpenAI first, falls back to local
   * @param {string} text - Text to generate embeddings for
   * @param {string} type - 'query' or 'passage'
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text, type = 'passage') {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text input for embedding generation:', text);
      return null;
    }

    const cacheKey = `${type}:${text.toLowerCase().trim().substring(0, 200)}`;

    // Check cache first
    if (this.embeddingCache.has(cacheKey)) {
      console.log(`📦 Cache hit for ${type} embedding`);
      return this.embeddingCache.get(cacheKey);
    }

    // Check if embedding is already being generated
    if (this.pendingEmbeddings.has(cacheKey)) {
      return await this.pendingEmbeddings.get(cacheKey);
    }

    // Generate embedding
    const embeddingPromise = this._generateEmbeddingInternal(text, type, cacheKey);
    this.pendingEmbeddings.set(cacheKey, embeddingPromise);

    try {
      const embedding = await embeddingPromise;
      if (embedding) {
        this._addToCache(cacheKey, embedding);
      }
      return embedding;
    } finally {
      this.pendingEmbeddings.delete(cacheKey);
    }
  }

  /**
   * Internal embedding generation - OpenAI primary, local fallback
   */
  async _generateEmbeddingInternal(text, type, cacheKey) {
    // Try OpenAI first (better Arabic semantic understanding)
    if (this.openai) {
      try {
        const truncatedText = this.truncateText(text, this.maxTokens);
        console.log(`🌐 OpenAI embedding for: "${truncatedText.substring(0, 60)}..."`);

        const response = await this.openai.embeddings.create({
          model: this.openaiModel,
          input: truncatedText,
        });

        const embedding = response.data[0].embedding;
        console.log(`✅ OpenAI embedding: ${embedding.length} dimensions`);
        return embedding;
      } catch (error) {
        console.error('❌ OpenAI embedding failed, trying local:', error.message);
      }
    }

    // Fallback to local model
    return await this._generateLocalEmbedding(text, type);
  }

  /**
   * Generate embedding using local model
   */
  async _generateLocalEmbedding(text, type) {
    try {
      if (!this.localModel && !this.isInitializingLocal) {
        await this.initializeLocalModel();
      }

      let waitCount = 0;
      while (this.isInitializingLocal && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }

      if (!this.localModel) {
        console.warn('Local model not available');
        return null;
      }

      const prefix = type === 'query' ? this.queryPrefix : this.passagePrefix;
      const prefixedText = `${prefix}${text}`;
      const truncatedText = this.truncateText(prefixedText, 512 * 3);

      console.log(`🔧 Local embedding for: "${truncatedText.substring(0, 60)}..."`);

      const embeddingPromise = this.localModel(truncatedText, { pooling: 'mean', normalize: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      const output = await Promise.race([embeddingPromise, timeoutPromise]);
      const embedding = Array.from(output.data);
      console.log(`✅ Local embedding: ${embedding.length} dimensions`);

      return embedding;
    } catch (error) {
      console.error('Error generating local embedding:', error.message);
      return null;
    }
  }

  /**
   * Generate embedding for search queries
   */
  async generateQueryEmbedding(queryText) {
    return this.generateEmbedding(queryText, 'query');
  }

  /**
   * Generate embedding for documents/passages
   */
  async generatePassageEmbedding(passageText) {
    return this.generateEmbedding(passageText, 'passage');
  }

  /**
   * Add to cache with size management
   */
  _addToCache(key, embedding) {
    if (this.embeddingCache.size >= this.maxCacheSize) {
      const firstKey = this.embeddingCache.keys().next().value;
      this.embeddingCache.delete(firstKey);
    }
    this.embeddingCache.set(key, embedding);
  }

  /**
   * Generate batch embeddings
   */
  async generateBatchEmbeddings(texts) {
    if (!Array.isArray(texts)) {
      throw new Error('Input must be an array of texts');
    }

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
   * Calculate cosine similarity
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
   * Truncate text to token limit
   */
  truncateText(text, maxTokens) {
    const maxChars = maxTokens * 3;
    if (text.length <= maxChars) {
      return text;
    }
    const truncated = text.substring(0, maxChars);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;
  }

  /**
   * Prepare text for embedding
   */
  prepareTextForEmbedding(item, fields) {
    // Arabic food category & brand keywords for better semantic matching
    const arabicFoodKeywords = {
      // Fast food + brands
      'burger': 'فاست فود وجبات سريعة برجر همبرجر ماكدونالدز ماك هارديز fast food mcdonalds',
      'برجر': 'فاست فود وجبات سريعة برجر همبرجر ماكدونالدز ماك هارديز fast food mcdonalds',
      'ماكدونالدز': 'burger برجر همبرجر فاست فود وجبات سريعة ماك mcdonalds fast food',
      'ماك': 'burger برجر همبرجر فاست فود وجبات سريعة ماكدونالدز mcdonalds fast food',
      'هارديز': 'burger برجر همبرجر فاست فود وجبات سريعة hardees fast food',
      'كنتاكي': 'chicken فراخ دجاج مقلي فاست فود kfc fried',
      'kfc': 'chicken فراخ دجاج مقلي فاست فود كنتاكي fried',
      'pizza': 'بيتزا فاست فود إيطالي بيتزا هت دومينوز fast food',
      'بيتزا': 'بيتزا فاست فود إيطالي بيتزا هت دومينوز pizza fast food',
      'sandwich': 'ساندويتش سندوتش وجبات سريعة صب واي',
      'سندوتش': 'ساندويتش سندوتش وجبات سريعة صب واي sandwich',
      'fried': 'مقلي قلي مقرمش كنتاكي crispy kfc',
      // Sweets
      'cake': 'كيك حلويات تورتة باسكن روبنز dessert',
      'كيك': 'كيك حلويات تورتة dessert cake',
      'dessert': 'حلويات حلو سكر كيك sweet',
      // Healthy
      'salad': 'سلطة صحي دايت healthy diet',
      'سلطة': 'سلطة صحي دايت salad healthy diet',
      // Main courses
      'chicken': 'فراخ دجاج فرخة كنتاكي مقلي',
      'دجاج': 'فراخ دجاج فرخة كنتاكي مقلي chicken kfc',
      'meat': 'لحم لحمة ستيك كباب',
      'لحم': 'لحم لحمة ستيك كباب meat steak',
      'rice': 'أرز رز كشري',
      'أرز': 'أرز رز كشري rice',
      // Drinks
      'juice': 'عصير مشروب شراب',
      'عصير': 'عصير مشروب شراب juice drink',
      'coffee': 'قهوة كافيه ستاربكس',
      'قهوة': 'قهوة كافيه ستاربكس coffee starbucks',
      'ستاربكس': 'coffee قهوة كافيه starbucks',
    };

    const textParts = fields
      .map(field => {
        const value = item[field];
        if (Array.isArray(value)) {
          return value.join(' ');
        }
        return typeof value === 'string' ? value : '';
      })
      .filter(text => text.trim().length > 0);

    let fullText = textParts.join(' ').trim();

    // Add relevant Arabic keywords based on content
    const lowerText = fullText.toLowerCase();
    Object.entries(arabicFoodKeywords).forEach(([keyword, arabicTerms]) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        fullText += ' ' + arabicTerms;
      }
    });

    return fullText;
  }
}

module.exports = new EmbeddingService();