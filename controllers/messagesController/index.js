const getChatList = require('./getChatList');
const getMessages = require('./getMessages');
const sendMessage = require('./sendMessage');
const uploadAudio = require('./uploadAudio');
const uploadImage = require('./uploadImage');
const editMessage = require('./editMessage');
const deleteMessage = require('./deleteMessage');
const markMessageAsRead = require('./markMessageAsRead');
const markChatAsRead = require('./markChatAsRead');
const getUnreadCounts = require('./getUnreadCounts');
const getOrderChats = require('./getOrderChats');

module.exports = {
  getChatList,
  getMessages,
  sendMessage,
  uploadAudio,
  uploadImage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markChatAsRead,
  getUnreadCounts,
  getOrderChats
}; 