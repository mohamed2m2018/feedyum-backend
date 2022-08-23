const OneSignal = require("onesignal-node")
const {oneSignalAppId,oneSignalApikey } = require("../config/keys")
const oneSignalClient = new OneSignal.Client(oneSignalAppId, oneSignalApikey);
module.exports = oneSignalClient;
