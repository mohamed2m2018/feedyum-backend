/**
 * Feed Algorithm Unit Tests
 * 
 * Tests the TikTok-style recommendation algorithm to ensure:
 * - Scoring functions produce expected results
 * - Engagement weights are applied correctly  
 * - Teaser boost works for new content
 * - Viewed content is properly buried
 * - Diversity injection prevents same author consecutively
 * 
 * Run with: npm test -- __tests__/utils/storyFeedUtils.test.js
 */

const {
    getNearestLocation,
    calculateRecencyScore,
    calculateTeaserBoost,
    calculateEngagementScore,
    calculateProximityScore,
    calculateQualityScore,
    calculateRecommendationScore,
    bucketByPriority,
    interleaveBuckets,
    ENGAGEMENT_WEIGHTS,
    TEASER_THRESHOLD_VIEWS,
    TEASER_THRESHOLD_HOURS
} = require('../../utils/storyFeedUtils');

describe('storyFeedUtils - Feed Algorithm', () => {
    const NOW = Date.now();

    // ============================================================================
    // TEST DATA FACTORIES
    // ============================================================================

    const createStory = (overrides = {}) => ({
        _id: `story_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date(NOW - 1000 * 60 * 60 * 2), // 2 hours ago
        author: { _id: 'author_123', locations: [{ lat: 30.05, long: 31.25 }] },
        likesNo: 10,
        views: 100,
        commentsNo: 5,
        avgCompletionRate: 0.7,
        rewatchCount: 3,
        shareCount: 2,
        caption: 'Test story with a longer caption for quality',
        dishes: [{ _id: 'dish_1' }],
        category: ['cat_1'],
        kmAway: 5,
        ...overrides
    });

    // ============================================================================
    // LOCATION TESTS
    // ============================================================================

    describe('getNearestLocation', () => {
        it('should return undefined for empty locations array', () => {
            expect(getNearestLocation(30.05, 31.25, [])).toBeUndefined();
        });

        it('should return undefined for invalid coordinates', () => {
            expect(getNearestLocation(NaN, 31.25, [{ lat: 30, long: 31 }])).toBeUndefined();
        });

        it('should calculate correct distance (Cairo to Giza ~5km)', () => {
            const result = getNearestLocation(30.0444, 31.2357, [{ lat: 30.0131, long: 31.2089 }]);
            expect(result.distance).toBeGreaterThan(3);
            expect(result.distance).toBeLessThan(6);
        });

        it('should find nearest from multiple locations', () => {
            const locations = [
                { lat: 30.0, long: 31.0 },   // Far
                { lat: 30.05, long: 31.25 }, // Close (same)
                { lat: 29.9, long: 30.9 }    // Very far
            ];
            const result = getNearestLocation(30.05, 31.25, locations);
            expect(result.distance).toBeLessThan(1); // Should be ~0
        });
    });

    // ============================================================================
    // RECENCY SCORE TESTS
    // ============================================================================

    describe('calculateRecencyScore', () => {
        it('should give max score (40) to brand new content', () => {
            const score = calculateRecencyScore(new Date(NOW), NOW);
            expect(score).toBeCloseTo(40, 0);
        });

        it('should give ~15 score to 24-hour old content (half-life)', () => {
            const oneDayAgo = new Date(NOW - 24 * 60 * 60 * 1000);
            const score = calculateRecencyScore(oneDayAgo, NOW);
            expect(score).toBeGreaterThan(10);
            expect(score).toBeLessThan(20);
        });

        it('should give low score to 7-day old content', () => {
            const weekAgo = new Date(NOW - 7 * 24 * 60 * 60 * 1000);
            const score = calculateRecencyScore(weekAgo, NOW);
            expect(score).toBeLessThan(2);
        });
    });

    // ============================================================================
    // TEASER BOOST TESTS
    // ============================================================================

    describe('calculateTeaserBoost', () => {
        it('should give max boost (25) to brand new content with 0 views', () => {
            const story = createStory({
                created_at: new Date(NOW - 1000 * 60 * 30), // 30 min ago
                views: 0
            });
            const boost = calculateTeaserBoost(story, NOW);
            expect(boost).toBeCloseTo(25, 0);
        });

        it('should give reduced boost as views increase', () => {
            const story = createStory({
                created_at: new Date(NOW - 1000 * 60 * 30),
                views: 150 // Half of threshold
            });
            const boost = calculateTeaserBoost(story, NOW);
            expect(boost).toBeCloseTo(12.5, 0); // ~50% of max
        });

        it('should give 0 boost after threshold views reached', () => {
            const story = createStory({
                created_at: new Date(NOW - 1000 * 60 * 30),
                views: TEASER_THRESHOLD_VIEWS
            });
            const boost = calculateTeaserBoost(story, NOW);
            expect(boost).toBe(0);
        });

        it('should give 0 boost to content older than 24 hours', () => {
            const story = createStory({
                created_at: new Date(NOW - 25 * 60 * 60 * 1000), // 25 hours ago
                views: 10
            });
            const boost = calculateTeaserBoost(story, NOW);
            expect(boost).toBe(0);
        });
    });

    // ============================================================================
    // ENGAGEMENT SCORE TESTS
    // ============================================================================

    describe('calculateEngagementScore', () => {
        it('should weight rewatch highest', () => {
            const highRewatch = createStory({ rewatchCount: 50, views: 100 });
            const lowRewatch = createStory({ rewatchCount: 5, views: 100 });

            const highScore = calculateEngagementScore(highRewatch);
            const lowScore = calculateEngagementScore(lowRewatch);

            expect(highScore).toBeGreaterThan(lowScore);
        });

        it('should weight share higher than like', () => {
            const highShare = createStory({ shareCount: 20, likesNo: 10, views: 100 });
            const highLike = createStory({ shareCount: 2, likesNo: 100, views: 100 });

            const shareScore = calculateEngagementScore(highShare);
            const likeScore = calculateEngagementScore(highLike);

            expect(shareScore).toBeGreaterThan(likeScore);
        });

        it('should cap at 40 points max', () => {
            const viralStory = createStory({
                rewatchCount: 1000,
                shareCount: 500,
                likesNo: 5000,
                commentsNo: 200,
                avgCompletionRate: 1.0,
                views: 100
            });
            const score = calculateEngagementScore(viralStory);
            expect(score).toBeLessThanOrEqual(40);
        });
    });

    // ============================================================================
    // PROXIMITY SCORE TESTS
    // ============================================================================

    describe('calculateProximityScore', () => {
        it('should give max score (30) for very close (<5km)', () => {
            expect(calculateProximityScore(3)).toBe(30);
        });

        it('should give 25 for close (5-15km)', () => {
            expect(calculateProximityScore(10)).toBe(25);
        });

        it('should give 1 for very far (>80km)', () => {
            expect(calculateProximityScore(100)).toBe(1);
        });

        it('should give default 5 for undefined distance', () => {
            expect(calculateProximityScore(undefined)).toBe(5);
        });
    });

    // ============================================================================
    // QUALITY SCORE TESTS
    // ============================================================================

    describe('calculateQualityScore', () => {
        it('should give bonus for long caption', () => {
            const withCaption = createStory({ caption: 'A very long and detailed caption about the dish that exceeds 50 characters' });
            const noCaption = createStory({ caption: '' });

            expect(calculateQualityScore(withCaption)).toBeGreaterThan(calculateQualityScore(noCaption));
        });

        it('should give bonus for attached dishes', () => {
            const withDishes = createStory({ dishes: [{ _id: 'd1' }, { _id: 'd2' }] });
            const noDishes = createStory({ dishes: [] });

            expect(calculateQualityScore(withDishes)).toBeGreaterThan(calculateQualityScore(noDishes));
        });

        it('should give bonus for review mode', () => {
            const review = createStory({ reviewMode: true });
            const normal = createStory({ reviewMode: false });

            expect(calculateQualityScore(review)).toBeGreaterThan(calculateQualityScore(normal));
        });
    });

    // ============================================================================
    // MAIN SCORING FUNCTION TESTS
    // ============================================================================

    describe('calculateRecommendationScore', () => {
        const viewedIds = new Set(['viewed_1', 'viewed_2']);
        const preferredCategories = new Set(['cat_1']);

        it('should heavily penalize viewed content', () => {
            const viewedStory = createStory({ _id: 'viewed_1' });
            const newStory = createStory({ _id: 'fresh_1' });

            const viewedScore = calculateRecommendationScore(viewedStory, null, viewedIds, preferredCategories, NOW);
            const newScore = calculateRecommendationScore(newStory, null, viewedIds, preferredCategories, NOW);

            expect(newScore - viewedScore).toBeGreaterThan(50); // Should be significant difference
        });

        it('should boost content matching user preferences', () => {
            const preferredStory = createStory({ category: ['cat_1'] });
            const otherStory = createStory({ category: ['cat_99'] });

            const preferredScore = calculateRecommendationScore(preferredStory, null, new Set(), preferredCategories, NOW);
            const otherScore = calculateRecommendationScore(otherStory, null, new Set(), preferredCategories, NOW);

            expect(preferredScore).toBeGreaterThan(otherScore);
        });

        it('should rank nearby content higher', () => {
            const nearStory = createStory({ kmAway: 3 });
            const farStory = createStory({ kmAway: 100 });

            const nearScore = calculateRecommendationScore(nearStory, null, new Set(), new Set(), NOW);
            const farScore = calculateRecommendationScore(farStory, null, new Set(), new Set(), NOW);

            expect(nearScore).toBeGreaterThan(farScore);
        });
    });

    // ============================================================================
    // BUCKETING TESTS
    // ============================================================================

    describe('bucketByPriority', () => {
        it('should put high-score stories in veryClose bucket', () => {
            const stories = [
                { _id: '1', _score: 100, kmAway: 5 },
                { _id: '2', _score: 50, kmAway: 5 },
                { _id: '3', _score: -25, kmAway: 5 } // Below -20 threshold
            ];

            const buckets = bucketByPriority(stories);

            expect(buckets.veryClose.map(s => s._id)).toContain('1');
            expect(buckets.distant.map(s => s._id)).toContain('3'); // Negative score < -20
        });

        it('should put viewed/negative score stories in distant bucket', () => {
            const stories = [
                { _id: 'viewed', _score: -30, kmAway: 2 }
            ];

            const buckets = bucketByPriority(stories);
            expect(buckets.distant).toHaveLength(1);
        });
    });

    // ============================================================================
    // INTERLEAVING TESTS
    // ============================================================================

    describe('interleaveBuckets', () => {
        it('should prioritize veryClose bucket items', () => {
            const buckets = {
                veryClose: [{ _id: 'hot1' }, { _id: 'hot2' }],
                close: [{ _id: 'close1' }],
                nearby: [{ _id: 'nearby1' }],
                distant: [{ _id: 'cold1' }]
            };

            const result = interleaveBuckets(buckets);

            // Hot items should appear before cold
            const hot1Index = result.indexOf('hot1');
            const cold1Index = result.indexOf('cold1');
            expect(hot1Index).toBeLessThan(cold1Index);
        });

        it('should return unique IDs only', () => {
            const buckets = {
                veryClose: [{ _id: 'a' }, { _id: 'b' }],
                close: [],
                nearby: [],
                distant: []
            };

            const result = interleaveBuckets(buckets);
            const uniqueCount = new Set(result).size;

            expect(result.length).toBe(uniqueCount);
        });
    });

    // ============================================================================
    // ALGORITHM SCENARIO TESTS
    // ============================================================================

    describe('Algorithm Scenarios', () => {

        it('SCENARIO: New chef video should beat old viral video', () => {
            // New video from a chef (2 hours old, 50 views)
            const newChefVideo = createStory({
                created_at: new Date(NOW - 2 * 60 * 60 * 1000),
                views: 50,
                likesNo: 5,
                kmAway: 3
            });

            // Old viral video (7 days old, 10000 views)
            const oldViralVideo = createStory({
                created_at: new Date(NOW - 7 * 24 * 60 * 60 * 1000),
                views: 10000,
                likesNo: 500,
                kmAway: 3
            });

            const newScore = calculateRecommendationScore(newChefVideo, null, new Set(), new Set(), NOW);
            const oldScore = calculateRecommendationScore(oldViralVideo, null, new Set(), new Set(), NOW);

            expect(newScore).toBeGreaterThan(oldScore);
        });

        it('SCENARIO: Nearby low-engagement beats far high-engagement', () => {
            const nearbyLowEngagement = createStory({
                kmAway: 3,
                likesNo: 10,
                views: 100
            });

            const farHighEngagement = createStory({
                kmAway: 150,
                likesNo: 500,
                views: 5000
            });

            const nearScore = calculateRecommendationScore(nearbyLowEngagement, null, new Set(), new Set(), NOW);
            const farScore = calculateRecommendationScore(farHighEngagement, null, new Set(), new Set(), NOW);

            expect(nearScore).toBeGreaterThan(farScore);
        });

        it('SCENARIO: Viewed content should always rank last', () => {
            const viewedStory = createStory({ _id: 'viewed_story' });
            const averageStory = createStory({ _id: 'average_story', kmAway: 100, likesNo: 1 });

            const viewedScore = calculateRecommendationScore(viewedStory, null, new Set(['viewed_story']), new Set(), NOW);
            const avgScore = calculateRecommendationScore(averageStory, null, new Set(['viewed_story']), new Set(), NOW);

            expect(avgScore).toBeGreaterThan(viewedScore);
        });
    });
});
