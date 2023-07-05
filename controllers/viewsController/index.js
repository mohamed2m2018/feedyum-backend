const getViews = require("./getViews");
const updateViews = require("./updateViews");
const getViewsByUser = require('./getViewsByUserId');
const getViewsByPost = require('./getViewsByPostId');

module.exports = {
  getViews,
  updateViews,
  getViewsByPost,
  getViewsByUser,
};
