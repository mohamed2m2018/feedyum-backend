
const client = require("../../services/oneSignalNotification");
const {oneSignalAppId } = require("../../config/keys")

module.exports =  sendNotification = (message)=>{
    const notification = new OneSignal.Notification();
    notification.app_id = oneSignalAppId;
    notification.included_segments = ['ALL'];
    notification.contents = {
        en: message,
    };
   await client.createNotification(notification);
}

