const getAllUsers = require('./getAllUsers');
const signupUser = require('./signupUser');
const loginUser = require('./loginUser');
const updateUser = require('./updateUser');
const deleteUser = require('./deleteUser');
const getUser = require('./getUser');
const getUserById = require('./getUserById');
const searchUser = require('./searchUser');
const getAllLocations = require('./getAllUserLocations');

module.exports = {
  getAllUsers,
  signupUser,
  loginUser,
  updateUser,
  deleteUser,
  getUser,
  getUserById,
  searchUser,
  getAllLocations,
};