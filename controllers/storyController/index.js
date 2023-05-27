const addStory = require('./addStory');
const getStories = require('./getStories');
const getStoryById = require('./getStoryById');
const getStoriesByUserId = require('./getStoriesByUserId');
const updateStory = require('./updateStory');
const deleteStories = require('./deleteStories');
const searchStories = require('./searchStories');
const getFollowingStories = require('./getFollowingStories');
const getSubscribedCategoriesStories = require('./getSubscribedCategoriesStories');


module.exports = {
    addStory,
    getStories,
    getStoryById,
    getStoriesByUserId,
    updateStory,
    deleteStories,
    searchStories,
    getFollowingStories,
    getSubscribedCategoriesStories
};