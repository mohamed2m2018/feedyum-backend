const addStory = require('./addStory');
const getStories = require('./getStories');
const getStoryById = require('./getStoryById');
const getStoriesByUserId = require('./getStoriesByUserId');
const updateStory = require('./updateStory');
const deleteStories = require('./deleteStories');
const searchStoriesByContent = require('./searchStoriesByContent');


module.exports = {
    addStory,
    getStories,
    getStoryById,
    getStoriesByUserId,
    updateStory,
    deleteStories,
    searchStoriesByContent,
};