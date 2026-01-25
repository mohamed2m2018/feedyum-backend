/**
 * Story Feed Utility Functions
 * Shared utilities for story recommendation, scoring, and location calculations
 */

/**
 * Calculate the nearest location from a target point using Haversine formula
 * @param {number} targetLat - Target latitude
 * @param {number} targetLong - Target longitude
 * @param {Array} locations - Array of location objects with lat/long
 * @returns {Object|undefined} - { nearestLocation, distance } or undefined
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

/**
 * Shuffle array with bias towards keeping high-priority items near their original position
 * @param {Array} array - Array to shuffle
 * @param {number} biasStrength - 0 to 1, higher = less shuffling
 * @returns {Array} - Shuffled array
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
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Calculate recommendation score for a story
 * Scores range from negative (viewed/low priority) to 150+ (hot/nearby/unseen)
 * 
 * @param {Object} story - Story document
 * @param {Object} userLocation - { lat, long } or null
 * @param {Set} viewedStoryIds - Set of story IDs the user has viewed
 * @param {Set} preferredCategories - Set of category IDs the user prefers
 * @param {number} currentTime - Current timestamp in ms
 * @returns {number} - Score value
 */
function calculateRecommendationScore(story, userLocation, viewedStoryIds, preferredCategories, currentTime) {
    let score = 0;

    // 1. Recency Score (0-40 points)
    // Decay: Half-life of 24 hours
    const storyCreatedAt = story.created_at || story.createdAt || new Date();
    const storyAge = (currentTime - new Date(storyCreatedAt).getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 40 * Math.exp(-storyAge / 24));
    score += recencyScore;

    // 2. View History Logic
    const isViewed = viewedStoryIds.has(story._id.toString());

    if (isViewed) {
        // BURIAL: If seen, massive penalty
        score -= 30;
    } else {
        // BOOST: If unseen AND matches user interest
        let isPreferred = false;
        if (story.category && Array.isArray(story.category)) {
            isPreferred = story.category.some(catId => preferredCategories.has(catId.toString()));
        } else if (story.category) {
            isPreferred = preferredCategories.has(story.category.toString());
        }

        if (isPreferred) {
            score += 15; // "More like this" Bonus
        }
    }

    // 3. Location Proximity Score (0-30 points)
    let locationScore = 0;
    if (story.kmAway !== undefined && story.kmAway !== null) {
        if (story.kmAway <= 5) locationScore = 30;
        else if (story.kmAway <= 15) locationScore = 25;
        else if (story.kmAway <= 30) locationScore = 20;
        else if (story.kmAway <= 50) locationScore = 15;
        else if (story.kmAway <= 80) locationScore = 8;
        else locationScore = 1;
    } else {
        locationScore = 5; // Reduced default
    }
    score += locationScore;

    // 4. Engagement Score (0-15 points)
    const likesScore = Math.min(8, (story.likesNo || 0) * 0.1);
    const viewsScore = Math.min(7, (story.views || 0) * 0.01);
    score += likesScore + viewsScore;

    // 5. Randomness Factor (0-10 points)
    score += Math.random() * 10;

    // 6. Quality/Completeness Bonus (0-10 points)
    if (story.caption && story.caption.length > 10) score += 2;
    if (story.dishes && story.dishes.length > 0) score += 3;
    if (story.reviewMode) score += 3;

    return score;
}

/**
 * Bucket stories by priority based on score and distance
 * @param {Array} candidates - Scored story candidates
 * @returns {Object} - { veryClose, close, nearby, distant }
 */
function bucketByPriority(candidates) {
    const buckets = {
        veryClose: [], // High Priority
        close: [],
        nearby: [],
        distant: []    // Low Priority
    };

    candidates.forEach(story => {
        // Special Rule: If score is very low (likely viewed), force to distant
        if (story._score < 0) {
            buckets.distant.push(story);
            return;
        }

        // Normal Bucketing
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
 * @param {Object} buckets - { veryClose, close, nearby, distant }
 * @returns {Array} - Ordered array of story IDs
 */
function interleaveBuckets(buckets) {
    // Shuffle each bucket first
    Object.keys(buckets).forEach(key => {
        buckets[key] = shuffleWithBias(buckets[key], 0.4);
    });

    const orderedIds = [];
    const maxLen = Math.max(...Object.values(buckets).map(b => b.length));

    for (let i = 0; i < maxLen; i++) {
        // 60% Chance for Top Content
        if (buckets.veryClose.length) {
            if (Math.random() < 0.6 || i < buckets.veryClose.length) {
                orderedIds.push(buckets.veryClose.shift()._id);
            }
        }
        // 25% Chance for Close
        if (buckets.close.length) {
            if (Math.random() < 0.25 || orderedIds.length === 0) {
                orderedIds.push(buckets.close.shift()._id);
            }
        }
        // 10% Chance for Nearby
        if (buckets.nearby.length) {
            if (Math.random() < 0.1 || orderedIds.length === 0) {
                orderedIds.push(buckets.nearby.shift()._id);
            }
        }
        // 5% Chance for Distant/Viewed
        if (buckets.distant.length) {
            if (Math.random() < 0.05 || orderedIds.length === 0) {
                orderedIds.push(buckets.distant.shift()._id);
            }
        }
    }

    // Append remainders
    ['veryClose', 'close', 'nearby', 'distant'].forEach(k => {
        while (buckets[k].length) orderedIds.push(buckets[k].shift()._id);
    });

    return [...new Set(orderedIds.map(id => id.toString()))];
}

// Feed cache constants
const FEED_EXPIRY = 5 * 60 * 1000; // 5 minutes

module.exports = {
    getNearestLocation,
    shuffleWithBias,
    shuffleArray,
    calculateRecommendationScore,
    bucketByPriority,
    interleaveBuckets,
    FEED_EXPIRY
};
