const getChatList = require('./getChatList');
const getMessages = require('./getMessages');
const sendMessage = require('./sendMessage');
const uploadAudio = require('./uploadAudio');
const deleteMessage = require('./deleteMessage');
const markMessageAsRead = require('./markMessageAsRead');
const markChatAsRead = require('./markChatAsRead');
const getUnreadCounts = require('./getUnreadCounts');

module.exports = {
  getChatList,
  getMessages,
  sendMessage,
  uploadAudio,
  deleteMessage,
  markMessageAsRead,
  markChatAsRead,
  getUnreadCounts
}; 