const getOrderById = require('./getOrderById');
const getOrdersByUser = require('./getOrdersByUser');
const getOrdersByChef = require('./getOrdersByChef');
const getCurrentUserOrders = require('./getCurrentUserOrders');
const createOrder = require('./createOrder');
const updateOrderStatus = require('./updateOrderStatus');
const getChefDashboardStats = require('./getChefDashboardStats');
const getChefAnalytics = require('./getChefAnalytics');
const cancelOrderByUser = require('./cancelOrderByUser');
const confirmOrderByUser = require('./confirmOrderByUser');
const getUnseenOrderCount = require('./getUnseenOrderCount');
const markOrderSeen = require('./markOrderSeen');
const checkDeliveryEligibility = require('./checkDeliveryEligibility');
const getAvailableSlots = require('./getAvailableSlots');
const confirmDepositReceived = require('./confirmDepositReceived');
const updateQuotePrice = require('./updateQuotePrice');
const markAllOrdersSeen = require('./markAllOrdersSeen');

module.exports = {
  getOrderById,
  getOrdersByUser,
  getOrdersByChef,
  getCurrentUserOrders,
  createOrder,
  updateOrderStatus,
  getChefDashboardStats,
  getChefAnalytics,
  cancelOrderByUser,
  confirmOrderByUser,
  getUnseenOrderCount,
  markOrderSeen,
  checkDeliveryEligibility,
  getAvailableSlots,
  confirmDepositReceived,
  updateQuotePrice,
  markAllOrdersSeen,
};
