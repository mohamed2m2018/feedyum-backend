
const client = require("../../services/oneSignalNotification");
const {oneSignalAppId } = require("../../config/keys");

const sendNotification = async (userId, message) => {
    const notification = {};
    notification.app_id = oneSignalAppId;
    notification.contents = {
      en: message,
    };
    notification.include_player_ids = [userId];
  
    try {
      await client.createNotification(notification);
      console.log("Notification sent successfully.");
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  module.exports = sendNotification;
  