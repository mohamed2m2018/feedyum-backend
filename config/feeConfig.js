/**
 * Fee Configuration
 * Centralized config for all platform fees and delivery calculations.
 *
 * Business model:
 *   - Customer pays a tiered SERVICE FEE (5/8/12 EGP based on subtotal)
 *   - Chef pays a flat ORDER FEE (4 EGP per order, deducted from wallet)
 */

// Flat fee deducted from chef's wallet per confirmed order
const CHEF_ORDER_FEE = 4; // EGP

// Initial welcome credit given to new chef wallets
const INITIAL_WELCOME_CREDIT = 200; // EGP

// Grace period (in days) after wallet balance hits 0 before orders are blocked
const GRACE_PERIOD_DAYS = 2;

// Special promocode that waives the customer service fee entirely
const SERVICE_FEE_WAIVER_CODE = process.env.SERVICE_FEE_WAIVER_CODE || '';

// Tiered service fee charged to the customer (added on top of subtotal)
// Sorted ascending by maxSubtotal. fee is inclusive for subtotals <= maxSubtotal.
const SERVICE_FEE_TIERS = [
    { maxSubtotal: 200, fee: 5 },
    { maxSubtotal: 400, fee: 8 },
    { maxSubtotal: Infinity, fee: 12 },
];

/**
 * Calculate customer service fee based on order subtotal.
 * Uses tiered brackets: ≤200 → 5, 200-400 → 8, >400 → 12.
 *
 * @param {number} subtotal - Order subtotal (before fees/discounts)
 * @returns {number} Service fee amount in EGP
 */
const calculateServiceFee = (subtotal) => {
    for (const tier of SERVICE_FEE_TIERS) {
        if (subtotal <= tier.maxSubtotal) {
            return tier.fee;
        }
    }
    // Fallback (should never reach here due to Infinity tier)
    return SERVICE_FEE_TIERS[SERVICE_FEE_TIERS.length - 1].fee;
};

/**
 * Check if a promocode is the special service fee waiver code.
 * @param {string} code - Promocode string to check
 * @returns {boolean}
 */
const isServiceFeeWaiverCode = (code) => {
    if (!code || !SERVICE_FEE_WAIVER_CODE) return false;
    return code.toUpperCase().trim() === SERVICE_FEE_WAIVER_CODE.toUpperCase().trim();
};

/**
 * Get the flat chef order fee.
 * @returns {number} Order fee in EGP
 */
const getChefOrderFee = () => CHEF_ORDER_FEE;

/**
 * Calculate delivery fee based on customer's delivery area, distance, and branch config.
 * Priority 1: Exact match on Area Address (placeId).
 * Priority 2: Fallback to legacy distance-based tiers.
 * Priority 3: Fallback flat fee.
 * 
 * @param {number} distance - Distance in km between branch and customer
 * @param {Array} tiers - Array of { maxDistance: Number, fee: Number } (deprecated)
 * @param {number} fallbackFee - Fallback fee if no tiers configured (default 0)
 * @param {Array} areaDeliveryFees - Array of { name, placeId, fee }
 * @param {string} destinationPlaceId - The placeId of the customer's delivery area
 * @returns {number} Delivery fee amount
 */
const calculateDeliveryFee = (distance, tiers, fallbackFee = 0, areaDeliveryFees = [], destinationPlaceId = null) => {
    // 1. Try Area-Based Fee match first
    if (destinationPlaceId && areaDeliveryFees && areaDeliveryFees.length > 0) {
        const areaMatch = areaDeliveryFees.find(a => a.placeId === destinationPlaceId);
        if (areaMatch) {
            return areaMatch.fee;
        }
    }

    // 2. Fallback to distance-based tiers (legacy configuration)
    if (!tiers || tiers.length === 0) {
        return fallbackFee;
    }

    // Sort tiers by maxDistance ascending
    const sortedTiers = [...tiers].sort((a, b) => a.maxDistance - b.maxDistance);

    // Find the first tier where distance fits
    for (const tier of sortedTiers) {
        if (distance <= tier.maxDistance) {
            return tier.fee;
        }
    }

    // If distance exceeds all tiers, return the highest tier's fee
    return sortedTiers[sortedTiers.length - 1].fee;
};

module.exports = {
    CHEF_ORDER_FEE,
    INITIAL_WELCOME_CREDIT,
    GRACE_PERIOD_DAYS,
    SERVICE_FEE_TIERS,
    SERVICE_FEE_WAIVER_CODE,
    calculateServiceFee,
    isServiceFeeWaiverCode,
    getChefOrderFee,
    calculateDeliveryFee,
};
