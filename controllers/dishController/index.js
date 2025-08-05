const createDish = require('./createDish');
const getAllDishes = require('./getAllDishes');
const getDishById = require('./getDishById');
const updateDish = require('./updateDish');
const deleteDish = require('./deleteDish');
const getDishesByMenuId = require('./getDishesByMenuId');
const getDishesByChef = require('./getDishesByChef');
const getDishesByCategory = require('./getDishesByCategory');
const searchDishes = require('./searchDishes');
const semanticSearchDishes = require('./semanticSearchDishes');

module.exports = {
  createDish,
  getAllDishes,
  getDishById,
  updateDish,
  deleteDish,
  getDishesByMenuId,
  getDishesByChef,
  getDishesByCategory,
  searchDishes,
  semanticSearchDishes,
};
