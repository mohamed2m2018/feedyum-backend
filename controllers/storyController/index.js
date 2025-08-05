const addStory = require('./addStory');
const getStories = require('./getStories');
const getStoryById = require('./getStoryById');
const getStoriesByUserId = require('./getStoriesByUserId');
const updateStory = require('./updateStory');
const deleteStories = require('./deleteStories');
const searchStories = require('./searchStories');
const semanticSearchStories = require('./semanticSearchStories');
const getFollowingStories = require('./getFollowingStories');
const getSubscribedCategoriesStories = require('./getSubscribedCategoriesStories');
const getReviewsStories = require ('./getReviewsStories');
const getReviewStoriesByDish = require('./getReviewStoriesByDish');
const deleteStoryById = require('./deleteStoryById');
const reportStory = require('./reportStory');
const createReviewReel = require('./createReviewReel');

module.exports = {
    addStory,
    getStories,
    getStoryById,
    getStoriesByUserId,
    updateStory,
    deleteStories,
    searchStories,
    semanticSearchStories,
    getFollowingStories,
    getSubscribedCategoriesStories,
    getReviewsStories,
    getReviewStoriesByDish,
    deleteStoryById,
    reportStory,
    createReviewReel,
};