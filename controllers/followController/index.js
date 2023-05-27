const followUser = require('./followUser');
const getFollowers = require('./getFollowers');
const getFollowing = require('./getFollowing');
const unfollowUser = require('./unfollowUser');

module.exports = {
    getFollowers,
    followUser,
    getFollowing,
    unfollowUser,
};