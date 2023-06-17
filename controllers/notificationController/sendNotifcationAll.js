
const client = require("../../services/oneSignalNotification");
const {oneSignalAppId } = require("../../config/keys");


const  sendNotificationAll = async (message)=>{
    const notification = {};
    notification.app_id = oneSignalAppId;
    notification.included_segments = ['ALL'];
    notification.contents = {
        en: message,
    };
   await client.createNotification(notification);
};

module.exports = sendNotificationAll;

