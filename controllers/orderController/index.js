const getOrderById = require('./getOrderById');
const getOrdersByUser = require('./getOrdersByUser');
const getOrdersByChef = require('./getOrdersByChef');
const createOrder = require('./createOrder');
const updateOrderStatus = require('./updateOrderStatus');

module.exports = {
  getOrderById,
  getOrdersByUser,
  getOrdersByChef,
  createOrder,
  updateOrderStatus,
};
