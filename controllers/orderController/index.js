const getOrderById = require('./getOrderById');
const getOrdersByUser = require('./getOrdersByUser');
const getOrdersByChef = require('./getOrdersByChef');
const getCurrentUserOrders = require('./getCurrentUserOrders');
const createOrder = require('./createOrder');
const updateOrderStatus = require('./updateOrderStatus');
const getChefDashboardStats = require('./getChefDashboardStats');
const cancelOrderByUser = require('./cancelOrderByUser');

module.exports = {
  getOrderById,
  getOrdersByUser,
  getOrdersByChef,
  getCurrentUserOrders,
  createOrder,
  updateOrderStatus,
  getChefDashboardStats,
  cancelOrderByUser,
};
