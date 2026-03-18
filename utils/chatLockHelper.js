const Order = require('../models/order');

/**
 * Checks if the chat between two users is locked.
 * A chat is locked if the most recent order between them
 * is completed/cancelled/rejected and it has been more than 48 hours.
 */
const isChatLocked = async (userId1, userId2) => {
  if (!userId1 || !userId2) return false;

  try {
    const latestOrder = await Order.findOne({
      $or: [
        { user: userId1, chef: userId2 },
        { user: userId2, chef: userId1 }
      ]
    })
      .sort({ created_at: -1 })
      .lean();

    if (!latestOrder) {
      // If there are no orders, they can chat (e.g., initial inquiry)
      return false;
    }

    if (['completed', 'cancelled', 'rejected'].includes(latestOrder.status)) {
      const lastUpdateDate = latestOrder.lastUpdated || latestOrder.created_at || new Date();
      const hoursSinceUpdate = (Date.now() - new Date(lastUpdateDate).getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate > 48) {
        return true; // Locked
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking chat lock:', error);
    return false;
  }
};

/**
 * Checks if a specific order object is expired (completed > 48h).
 * Used for redacting sensitive info like phone numbers.
 */
const isOrderExpired = (order) => {
  if (!order || !order.status) return false;

  if (['completed', 'cancelled', 'rejected'].includes(order.status)) {
    const lastUpdateDate = order.lastUpdated || order.created_at || new Date();
    const hoursSinceUpdate = (Date.now() - new Date(lastUpdateDate).getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate > 48;
  }

  return false;
};

module.exports = {
  isChatLocked,
  isOrderExpired
};
