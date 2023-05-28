const followUser = require('./followUser');
const getFollowers = require('./getFollowers');
const getFollowing = require('./getFollowing');
const unfollowUser = require('./unfollowUser');
const getStatisticsbyUser = require('./getStatisticsbyUser');

module.exports = {
    getFollowers,
    followUser,
    getFollowing,
    unfollowUser,
    getStatisticsbyUser,
};