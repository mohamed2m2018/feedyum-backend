/**
 * Story Feed Utility Functions
 * TikTok/Facebook-inspired recommendation algorithm
 * @see /docs/feed_algorithm.md for detailed documentation
 */

// ============================================================================
// ENGAGEMENT WEIGHTS (TikTok Style)
// ============================================================================
const ENGAGEMENT_WEIGHTS = {
    rewatch: 3.0,      // User loved it enough to watch again
    share: 2.5,        // User wants others to see it
    complete: 2.0,     // Watched to the end
    comment: 1.5,      // Took effort to respond
    like: 1.0          // Passive acknowledgment
};

// Feed cache constants
const FEED_EXPIRY = 5 * 60 * 1000; // 5 minutes
const TEASER_THRESHOLD_VIEWS = 300;  // New video boost threshold
const TEASER_THRESHOLD_HOURS = 24;   // New video boost window

// ============================================================================
// LOCATION UTILITIES
// ============================================================================

/**
 * Calculate the nearest location from a target point using Haversine formula
 */
function getNearestLocation(targetLat, targetLong, locations) {
    if (!Array.isArray(locations) || locations.length === 0) return undefined;
    if (isNaN(targetLat) || isNaN(targetLong)) return undefined;

    const earthRadius = 6371; // km
    let nearestLocation = null;
    let nearestDistance = Infinity;

    for (const location of locations) {
        const { lat, long } = location;
        if (isNaN(lat) || isNaN(long)) continue;

        const latDiff = (lat - targetLat) * (Math.PI / 180);
        const longDiff = (long - targetLong) * (Math.PI / 180);

        const a =
            Math.sin(latDiff / 2) ** 2 +
            Math.cos(targetLat * (Math.PI / 180)) *
            Math.cos(lat * (Math.PI / 180)) *
            Math.sin(longDiff / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;

        if (distance < nearestDistance) {
            nearestLocation = location;
            nearestDistance = distance;
        }
    }

    return {
        nearestLocation,
        distance: nearestDistance !== Infinity ? parseFloat(nearestDistance.toFixed(2)) : undefined,
    };
}

// ============================================================================
// SHUFFLE UTILITIES
// ============================================================================

/**
 * Shuffle array with bias towards keeping high-priority items near their original position
 */
function shuffleWithBias(array, biasStrength = 0.3) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const maxSwapDistance = Math.floor((1 - biasStrength) * i + 1);
        const swapIndex = Math.max(0, i - Math.floor(Math.random() * maxSwapDistance));
        [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
    }
    return result;
}

/**
 * Fisher-Yates shuffle algorithm (fully random)
 */
function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ============================================================================
// SCORING COMPONENTS (TikTok-Style)
// ============================================================================

/**
 * Calculate recency score with exponential decay
 * Half-life of 24 hours
 */
function calculateRecencyScore(storyCreatedAt, currentTime) {
    const age = (currentTime - new Date(storyCreatedAt).getTime()) / (1000 * 60 * 60);
    return Math.max(0, 40 * Math.exp(-age / 24));
}

/**
 * Calculate teaser boost for new content
 * Videos < 24 hours with < 300 views get boosted
 */
function calculateTeaserBoost(story, currentTime) {
    const storyCreatedAt = story.created_at || story.createdAt || new Date();
    const ageHours = (currentTime - new Date(storyCreatedAt).getTime()) / (1000 * 60 * 60);
    const views = story.views || 0;

    if (ageHours < TEASER_THRESHOLD_HOURS && views < TEASER_THRESHOLD_VIEWS) {
        // Linear decay: more views = less boost
        return 25 * (1 - views / TEASER_THRESHOLD_VIEWS);
    }
    return 0;
}

/**
 * Calculate weighted engagement score (TikTok style)
 * Rewatch > Share > Complete > Comment > Like
 */
function calculateEngagementScore(story) {
    const views = Math.max(story.views || 1, 1);

    // Calculate rates
    const rewatchRate = (story.rewatchCount || 0) / views;
    const shareRate = (story.shareCount || 0) / views;
    const completionRate = story.avgCompletionRate || 0;
    const commentRate = (story.commentsNo || 0) / views;
    const likeRate = (story.likesNo || 0) / views;

    // Apply weights
    const rewatchScore = rewatchRate * ENGAGEMENT_WEIGHTS.rewatch * 15;
    const shareScore = shareRate * ENGAGEMENT_WEIGHTS.share * 12;
    const completionScore = completionRate * ENGAGEMENT_WEIGHTS.complete * 10;
    const commentScore = Math.min(commentRate * ENGAGEMENT_WEIGHTS.comment * 8, 8);
    const likeScore = Math.min(likeRate * ENGAGEMENT_WEIGHTS.like * 5, 5);

    return Math.min(40, rewatchScore + shareScore + completionScore + commentScore + likeScore);
}

/**
 * Calculate affinity score between user and creator
 * Based on past interaction history
 */
function calculateAffinityScore(story, userAffinityMap) {
    if (!userAffinityMap || !story.author) return 0;

    const authorId = story.author._id?.toString() || story.author.toString();
    const affinity = userAffinityMap.get(authorId);

    if (!affinity) return 0;

    // Affinity formula: likes + comments*3 + views*0.5 + follow*20
    const score = (affinity.likes || 0) * 1 +
        (affinity.comments || 0) * 3 +
        (affinity.views || 0) * 0.5 +
        (affinity.followed ? 20 : 0);

    return Math.min(35, score);
}

/**
 * Calculate proximity score based on distance
 */
function calculateProximityScore(kmAway) {
    if (kmAway === undefined || kmAway === null) return 5;

    if (kmAway <= 5) return 30;
    if (kmAway <= 15) return 25;
    if (kmAway <= 30) return 20;
    if (kmAway <= 50) return 15;
    if (kmAway <= 80) return 8;
    return 1;
}

/**
 * Calculate quality score based on content completeness
 */
function calculateQualityScore(story) {
    let score = 0;
    if (story.caption && story.caption.length > 10) score += 2;
    if (story.caption && story.caption.length > 50) score += 2;
    if (story.dishes && story.dishes.length > 0) score += 3;
    if (story.reviewMode) score += 3;
    if (story.poster || story.avatarUri) score += 2;
    return Math.min(15, score);
}

/**
 * Calculate diversity penalty
 * Penalizes stories from same author/category shown recently
 */
function calculateDiversityPenalty(story, recentAuthors, recentCategories) {
    let penalty = 0;

    const authorId = story.author?._id?.toString() || story.author?.toString();
    const categories = Array.isArray(story.category) ? story.category : [story.category];

    // Penalty for same author appearing consecutively
    if (authorId && recentAuthors.includes(authorId)) {
        penalty -= 15;
    }

    // Penalty for same category appearing too often
    for (const cat of categories) {
        if (cat && recentCategories.includes(cat.toString())) {
            penalty -= 5;
            break;
        }
    }

    return Math.max(-20, penalty);
}

// ============================================================================
// MAIN SCORING FUNCTION (Enhanced TikTok-Style)
// ============================================================================

/**
 * Calculate recommendation score for a story
 * Enhanced TikTok/Facebook-style algorithm
 * 
 * Score Components:
 * - Recency (0-40): Exponential decay
 * - Teaser Boost (0-25): New content exploration
 * - Engagement (0-40): Weighted signals
 * - Affinity (0-35): User-creator relationship
 * - Proximity (0-30): Location relevance
 * - Quality (0-15): Content completeness
 * - Diversity (-20 to 0): Repetition penalty
 * - Viewed (-50 to 0): Already-seen penalty
 * - Random (0-10): Exploration factor
 * 
 * @param {Object} story - Story document with populated author
 * @param {Object} context - Scoring context
 * @param {Set} context.viewedStoryIds - Set of viewed story IDs
 * @param {Set} context.preferredCategories - User's preferred categories
 * @param {Map} context.affinityMap - User-creator affinity scores
 * @param {Array} context.recentAuthors - Recently shown author IDs
 * @param {Array} context.recentCategories - Recently shown category IDs
 * @param {number} context.currentTime - Current timestamp
 * @returns {number} - Score value
 */
function calculateRecommendationScore(story, userLocation, viewedStoryIds, preferredCategories, currentTime, context = {}) {
    let score = 0;

    const storyCreatedAt = story.created_at || story.createdAt || new Date();

    // 1. RECENCY (0-40)
    score += calculateRecencyScore(storyCreatedAt, currentTime);

    // 2. TEASER BOOST (0-25) - New content gets fair exposure
    score += calculateTeaserBoost(story, currentTime);

    // 3. ENGAGEMENT (0-40) - TikTok-style weighted signals
    score += calculateEngagementScore(story);

    // 4. AFFINITY (0-35) - User-creator relationship
    if (context.affinityMap) {
        score += calculateAffinityScore(story, context.affinityMap);
    }

    // 5. PROXIMITY (0-30)
    score += calculateProximityScore(story.kmAway);

    // 6. QUALITY (0-15)
    score += calculateQualityScore(story);

    // 7. DIVERSITY PENALTY (-20 to 0)
    if (context.recentAuthors || context.recentCategories) {
        score += calculateDiversityPenalty(
            story,
            context.recentAuthors || [],
            context.recentCategories || []
        );
    }

    // 8. VIEW HISTORY (-50 to +15)
    const isViewed = viewedStoryIds.has(story._id.toString());
    if (isViewed) {
        // BURIAL: Seen content gets massive penalty
        score -= 50;
    } else {
        // BOOST: Unseen + preferred category
        let isPreferred = false;
        if (story.category && Array.isArray(story.category)) {
            isPreferred = story.category.some(catId => preferredCategories.has(catId.toString()));
        } else if (story.category) {
            isPreferred = preferredCategories.has(story.category.toString());
        }
        if (isPreferred) {
            score += 15;
        }
    }

    // 9. RANDOMNESS (0-10) - Exploration factor
    score += Math.random() * 10;

    return score;
}

// ============================================================================
// BUCKETING & INTERLEAVING
// ============================================================================

/**
 * Bucket stories by priority based on score and distance
 */
function bucketByPriority(candidates) {
    const buckets = {
        veryClose: [],
        close: [],
        nearby: [],
        distant: []
    };

    candidates.forEach(story => {
        if (story._score < -20) {
            // Viewed content goes to distant
            buckets.distant.push(story);
            return;
        }

        if (story._score > 80) {
            buckets.veryClose.push(story);
        } else if (story.kmAway !== undefined) {
            if (story.kmAway <= 10) buckets.veryClose.push(story);
            else if (story.kmAway <= 50) buckets.close.push(story);
            else if (story.kmAway <= 150) buckets.nearby.push(story);
            else buckets.distant.push(story);
        } else {
            buckets.distant.push(story);
        }
    });

    return buckets;
}

/**
 * Interleave stories from buckets with weighted probability
 * Includes diversity injection every 5th position
 */
function interleaveBuckets(buckets) {
    // Shuffle each bucket
    Object.keys(buckets).forEach(key => {
        buckets[key] = shuffleWithBias(buckets[key], 0.4);
    });

    const orderedIds = [];
    const recentAuthors = [];
    const recentCategories = [];
    const maxLen = Math.max(...Object.values(buckets).map(b => b.length));
    let position = 0;

    for (let i = 0; i < maxLen; i++) {
        position++;

        // Diversity injection: every 5th position, prefer different author/category
        const enforceDiversity = position % 5 === 0;

        // 60% Chance for Top Content
        if (buckets.veryClose.length) {
            const story = selectWithDiversity(buckets.veryClose, recentAuthors, recentCategories, enforceDiversity);
            if (story) {
                orderedIds.push(story._id);
                trackRecent(story, recentAuthors, recentCategories);
            }
        }

        // 25% Chance for Close
        if (buckets.close.length && (Math.random() < 0.25 || orderedIds.length === 0)) {
            const story = selectWithDiversity(buckets.close, recentAuthors, recentCategories, enforceDiversity);
            if (story) {
                orderedIds.push(story._id);
                trackRecent(story, recentAuthors, recentCategories);
            }
        }

        // 10% Chance for Nearby
        if (buckets.nearby.length && (Math.random() < 0.1 || orderedIds.length === 0)) {
            const story = selectWithDiversity(buckets.nearby, recentAuthors, recentCategories, enforceDiversity);
            if (story) {
                orderedIds.push(story._id);
                trackRecent(story, recentAuthors, recentCategories);
            }
        }

        // 5% Chance for Distant/Viewed
        if (buckets.distant.length && (Math.random() < 0.05 || orderedIds.length === 0)) {
            const story = buckets.distant.shift();
            if (story) {
                orderedIds.push(story._id);
                trackRecent(story, recentAuthors, recentCategories);
            }
        }
    }

    // Append remainders
    ['veryClose', 'close', 'nearby', 'distant'].forEach(k => {
        while (buckets[k].length) {
            const story = buckets[k].shift();
            orderedIds.push(story._id);
        }
    });

    return [...new Set(orderedIds.map(id => id.toString()))];
}

/**
 * Select a story with diversity preference
 */
function selectWithDiversity(bucket, recentAuthors, recentCategories, enforceDiversity) {
    if (bucket.length === 0) return null;

    if (enforceDiversity && bucket.length > 1) {
        // Try to find a story from different author/category
        for (let i = 0; i < bucket.length; i++) {
            const story = bucket[i];
            const authorId = story.author?._id?.toString() || story.author?.toString();

            if (!recentAuthors.slice(-3).includes(authorId)) {
                bucket.splice(i, 1);
                return story;
            }
        }
    }

    return bucket.shift();
}

/**
 * Track recently shown content for diversity
 */
function trackRecent(story, recentAuthors, recentCategories) {
    const authorId = story.author?._id?.toString() || story.author?.toString();
    if (authorId) {
        recentAuthors.push(authorId);
        if (recentAuthors.length > 5) recentAuthors.shift();
    }

    const categories = Array.isArray(story.category) ? story.category : [story.category];
    for (const cat of categories) {
        if (cat) {
            recentCategories.push(cat.toString());
            if (recentCategories.length > 10) recentCategories.shift();
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Location
    getNearestLocation,

    // Shuffle
    shuffleWithBias,
    shuffleArray,

    // Scoring components
    calculateRecencyScore,
    calculateTeaserBoost,
    calculateEngagementScore,
    calculateAffinityScore,
    calculateProximityScore,
    calculateQualityScore,
    calculateDiversityPenalty,

    // Main scoring
    calculateRecommendationScore,

    // Bucketing
    bucketByPriority,
    interleaveBuckets,

    // Constants
    FEED_EXPIRY,
    ENGAGEMENT_WEIGHTS,
    TEASER_THRESHOLD_VIEWS,
    TEASER_THRESHOLD_HOURS
};
