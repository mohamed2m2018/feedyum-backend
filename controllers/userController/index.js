const getAllUsers = require('./getAllUsers');
const signupUser = require('./signupUser');
const loginUser = require('./loginUser');
const updateUser = require('./updateUser');
const deleteUser = require('./deleteUser');
const getUser = require('./getUser');
const getUserById = require('./getUserById');
const getUserProfile = require('./getUserProfile');
const getChefProfile = require('./getChefProfile');
const searchUser = require('./searchUser');
const semanticSearchUser = require('./semanticSearchUser');
const getAllLocations = require('./getAllUserLocations');
const getUserByTag = require('./getUserByTag');
const forgotPassword = require('./forgotPassword');
const resetPassword = require('./resetPassword');
const uploadProfilePicture = require('./uploadProfilePicture');
const checkAvailability = require('./checkAvailability');

module.exports = {
  getAllUsers,
  signupUser,
  loginUser,
  updateUser,
  deleteUser,
  getUser,
  getUserById,
  getUserProfile,
  getChefProfile,
  searchUser,
  semanticSearchUser,
  getAllLocations,
  getUserByTag,
  forgotPassword,
  resetPassword,
  uploadProfilePicture,
  checkAvailability,
};