const axios = require('axios');
const { oneSignalAppId, oneSignalApikey } = require("./config/keys");

const SUBSCRIPTION_ID = "44a69246-0ab8-4c01-a3a9-1334e9d5044d";
const EXTERNAL_USER_ID = "695d4466503c8d9704ccd74c";

async function linkUser() {
    try {
        console.log(`Linking Subscription ${SUBSCRIPTION_ID} to User ${EXTERNAL_USER_ID}...`);

        // OneSignal API to update the user identity associated with a subscription
        // Endpoint: PATCH https://onesignal.com/api/v1/apps/{app_id}/users/by/subscription_id/{subscription_id}/identity
        const url = `https://onesignal.com/api/v1/apps/${oneSignalAppId}/users/by/subscription_id/${SUBSCRIPTION_ID}/identity`;

        const body = {
            identity: {
                external_id: EXTERNAL_USER_ID
            }
        };

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${oneSignalApikey}`
            }
        };

        const response = await axios.patch(url, body, config);
        console.log("Link successful:", response.data);

    } catch (error) {
        if (error.response) {
            console.error("Link failed:", error.response.status, error.response.data);
        } else {
            console.error("Link failed:", error.message);
        }
    }
}

linkUser();
