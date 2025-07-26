const createDish = require('./createDish');
const getAllDishes = require('./getAllDishes');
const getDishById = require('./getDishById');
const updateDish = require('./updateDish');
const deleteDish = require('./deleteDish');
const getDishesByMenuId = require('./getDishesByMenuId');
const getDishesByChef = require('./getDishesByChef');
const searchDishes = require('./searchDishes');

module.exports = {
  createDish,
  getAllDishes,
  getDishById,
  updateDish,
  deleteDish,
  getDishesByMenuId,
  getDishesByChef,
  searchDishes,
};
