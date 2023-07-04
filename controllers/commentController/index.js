const addComment = require('./addComment');
const deleteComment = require('./deleteComment');
const getCommentByPostId = require('./getCommentsByPostId');
const getCommentsCountByPostId = require('./getCommentsCount');
const addReplyToComment = require('./addReply');

module.exports = {
    addComment,
    deleteComment,
    getCommentByPostId,
    getCommentsCountByPostId,
    addReplyToComment,
};