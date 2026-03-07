
const client = require("../../services/oneSignalNotification");
const { oneSignalAppId } = require("../../config/keys");

const sendNotification = async (userId, message, additionalData) => {
  const notification = {};
  notification.app_id = oneSignalAppId;
  notification.contents = {
    en: message,
  };
  notification.include_aliases = { external_id: [userId.toString()] };
  notification.target_channel = 'push';

  notification.data = additionalData;


  try {
    await client.createNotification(notification);
    console.log("Notification sent successfully.");
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};

module.exports = sendNotification;
