const ChefWallet = require('../models/chefWallet');
const { GRACE_PERIOD_DAYS } = require('../config/feeConfig');

/**
 * Get an array of chef ObjectIds whose wallets are blocked
 * (balance ≤ 0 and grace period expired).
 * Used to exclude blocked chefs from customer-facing queries.
 *
 * @returns {Promise<Array<ObjectId>>} Array of blocked chef ObjectIds
 */
async function getBlockedChefIds() {
  try {
    const gracePeriodCutoff = new Date();
    gracePeriodCutoff.setDate(gracePeriodCutoff.getDate() - GRACE_PERIOD_DAYS);

    const blockedWallets = await ChefWallet.find({
      balance: { $lte: 0 },
      gracePeriodStartDate: { $lte: gracePeriodCutoff },
    }).select('chef').lean();

    return blockedWallets.map(w => w.chef);
  } catch (error) {
    console.error('[getBlockedChefIds] Error:', error.message);
    // On error, don't block anyone — fail open
    return [];
  }
}

module.exports = { getBlockedChefIds };
