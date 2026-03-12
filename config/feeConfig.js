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

// Special promocode that waives the customer service fee entirely
const SERVICE_FEE_WAIVER_CODE = process.env.SERVICE_FEE_WAIVER_CODE || '';

// Tiered service fee charged to the customer (added on top of subtotal)
// Sorted ascending by maxSubtotal. fee is inclusive for subtotals <= maxSubtotal.
const SERVICE_FEE_TIERS = [
    { maxSubtotal: 150, fee: 5 },
    { maxSubtotal: 400, fee: 8 },
    { maxSubtotal: Infinity, fee: 12 },
];

/**
 * Calculate customer service fee based on order subtotal.
 * Uses tiered brackets: <150 → 5, 150-400 → 8, >400 → 12.
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
 * Calculate delivery fee based on distance and branch delivery tiers.
 * Finds the tier where distance <= maxDistance (tiers sorted ascending).
 * If no tier matches, returns the highest tier's fee or fallback.
 * 
 * @param {number} distance - Distance in km between branch and customer
 * @param {Array} tiers - Array of { maxDistance: Number, fee: Number }
 * @param {number} fallbackFee - Fallback fee if no tiers configured (default 0)
 * @returns {number} Delivery fee amount
 */
const calculateDeliveryFee = (distance, tiers, fallbackFee = 0) => {
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
    SERVICE_FEE_TIERS,
    SERVICE_FEE_WAIVER_CODE,
    calculateServiceFee,
    isServiceFeeWaiverCode,
    getChefOrderFee,
    calculateDeliveryFee,
};
