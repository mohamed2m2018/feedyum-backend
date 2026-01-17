/**
 * Semantic Search Service Tests
 * Tests Arabic and English query understanding
 */

const semanticSearchService = require('../services/semanticSearchService');

describe('SemanticSearchService', () => {
    describe('isArabicQuery', () => {
        test('detects Arabic text', () => {
            expect(semanticSearchService.isArabicQuery('شاورما')).toBe(true);
            expect(semanticSearchService.isArabicQuery('نفسي في حاجة دسمة')).toBe(true);
            expect(semanticSearchService.isArabicQuery('كشري')).toBe(true);
        });

        test('detects English text', () => {
            expect(semanticSearchService.isArabicQuery('pizza')).toBe(false);
            expect(semanticSearchService.isArabicQuery('burger')).toBe(false);
            expect(semanticSearchService.isArabicQuery('I want something spicy')).toBe(false);
        });

        test('detects mixed Arabic/English', () => {
            expect(semanticSearchService.isArabicQuery('pizza شاورما')).toBe(true);
            expect(semanticSearchService.isArabicQuery('عايز burger')).toBe(true);
        });

        test('handles empty or null input', () => {
            expect(semanticSearchService.isArabicQuery('')).toBe(false);
            expect(semanticSearchService.isArabicQuery(null)).toBe(false);
            expect(semanticSearchService.isArabicQuery(undefined)).toBe(false);
        });
    });

    describe('enhanceArabicQuery', () => {
        test('trims Arabic queries', () => {
            const result = semanticSearchService.enhanceArabicQuery('  شاورما  ');
            expect(result).toBe('شاورما');
        });

        test('preserves Arabic query content', () => {
            const query = 'نفسي في حاجة دسمة';
            const result = semanticSearchService.enhanceArabicQuery(query);
            expect(result).toContain('نفسي');
            expect(result).toContain('دسمة');
        });
    });
});

describe('EmbeddingService', () => {
    const embeddingService = require('../services/embeddingService');

    describe('generateQueryEmbedding', () => {
        test('generates embedding for English query', async () => {
            const embedding = await embeddingService.generateQueryEmbedding('pizza');

            expect(embedding).not.toBeNull();
            expect(Array.isArray(embedding)).toBe(true);
            expect(embedding.length).toBeGreaterThan(0);
        });

        test('generates embedding for Arabic query', async () => {
            const embedding = await embeddingService.generateQueryEmbedding('شاورما');

            expect(embedding).not.toBeNull();
            expect(Array.isArray(embedding)).toBe(true);
            expect(embedding.length).toBeGreaterThan(0);
        });

        test('generates embedding for semantic Arabic query', async () => {
            // This is the key test - semantic understanding of colloquial Arabic
            const embedding = await embeddingService.generateQueryEmbedding('نفسي في حاجة دسمة');

            expect(embedding).not.toBeNull();
            expect(Array.isArray(embedding)).toBe(true);
            expect(embedding.length).toBeGreaterThan(0);
        });

        test('caches embeddings for same query', async () => {
            const query = 'test caching query';
            const embedding1 = await embeddingService.generateQueryEmbedding(query);
            const embedding2 = await embeddingService.generateQueryEmbedding(query);

            expect(embedding1).toEqual(embedding2);
        });
    });

    describe('calculateCosineSimilarity', () => {
        test('returns 1 for identical vectors', () => {
            const vec = [0.1, 0.2, 0.3, 0.4, 0.5];
            const similarity = embeddingService.calculateCosineSimilarity(vec, vec);
            expect(similarity).toBeCloseTo(1, 5);
        });

        test('returns 0 for orthogonal vectors', () => {
            const vec1 = [1, 0, 0];
            const vec2 = [0, 1, 0];
            const similarity = embeddingService.calculateCosineSimilarity(vec1, vec2);
            expect(similarity).toBeCloseTo(0, 5);
        });

        test('handles null inputs', () => {
            expect(embeddingService.calculateCosineSimilarity(null, [1, 2, 3])).toBe(0);
            expect(embeddingService.calculateCosineSimilarity([1, 2, 3], null)).toBe(0);
        });

        test('handles vectors of different lengths', () => {
            expect(embeddingService.calculateCosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
        });
    });

    describe('truncateText', () => {
        test('preserves short text', () => {
            const text = 'short text';
            expect(embeddingService.truncateText(text, 100)).toBe(text);
        });

        test('truncates long text at word boundary', () => {
            const text = 'this is a very long text that needs to be truncated at a word boundary';
            const result = embeddingService.truncateText(text, 10);
            expect(result.length).toBeLessThanOrEqual(30); // 10 tokens * 3 chars
            expect(result.endsWith(' ')).toBe(false);
        });
    });
});

describe('Semantic Search Integration', () => {
    // These tests require API connection - skip in CI if no API key
    const hasApiKey = !!process.env.OPENAI_API_KEY;

    (hasApiKey ? test : test.skip)('Arabic semantic query finds relevant results', async () => {
        // Test that "نفسي في حاجة دسمة" (I want something rich/fatty)
        // would match dishes like كشري, فتة, حواوشي
        const embeddingService = require('../services/embeddingService');

        const queryEmbed = await embeddingService.generateQueryEmbedding('نفسي في حاجة دسمة');
        const dishEmbed1 = await embeddingService.generatePassageEmbedding('كشري بالسمنة والدقة - طبق مصري دسم');
        const dishEmbed2 = await embeddingService.generatePassageEmbedding('سلطة خضراء خفيفة للدايت');

        if (queryEmbed && dishEmbed1 && dishEmbed2) {
            const similarity1 = embeddingService.calculateCosineSimilarity(queryEmbed, dishEmbed1);
            const similarity2 = embeddingService.calculateCosineSimilarity(queryEmbed, dishEmbed2);

            // The "دسم" (rich/fatty) dish should score higher than the "light salad"
            expect(similarity1).toBeGreaterThan(similarity2);
        }
    });
});
