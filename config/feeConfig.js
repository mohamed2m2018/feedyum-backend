/**
 * Fee Configuration
 * Centralized config for all platform fees and delivery calculations.
 */

// Chef commission: percentage of subtotal deducted from chef's wallet per order
const CHEF_COMMISSION_PERCENTAGE = 0.05; // 5%

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

/**
 * Calculate chef commission amount from subtotal after discount.
 * Commission is calculated on (subtotal - discount) so chefs
 * only pay commission on what they actually earn.
 * 
 * @param {number} subtotal - Order subtotal
 * @param {number} [discount=0] - Discount amount applied to the order
 * @returns {number} Commission amount
 */
const calculateCommission = (subtotal, discount = 0) => {
    const commissionBase = Math.max(0, subtotal - (discount || 0));
    return Number((commissionBase * CHEF_COMMISSION_PERCENTAGE).toFixed(2));
};

module.exports = {
    CHEF_COMMISSION_PERCENTAGE,
    calculateDeliveryFee,
    calculateCommission,
};
