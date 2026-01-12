const axios = require('axios');
const { oneSignalAppId, oneSignalApikey } = require("./config/keys");

const SUBSCRIPTION_ID = "44a69246-0ab8-4c01-a3a9-1334e9d5044d";
const EXTERNAL_USER_ID = "695d4466503c8d9704ccd74c";

async function debugState() {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApikey}`
    };

    try {
        console.log(`--- Checking Subscription: ${SUBSCRIPTION_ID} ---`);
        // Get Device/Subscription Details
        // API: GET https://onesignal.com/api/v1/players/{player_id}?app_id={app_id}
        const subUrl = `https://onesignal.com/api/v1/players/${SUBSCRIPTION_ID}?app_id=${oneSignalAppId}`;
        const subRes = await axios.get(subUrl, { headers });
        console.log("Subscription Data:", JSON.stringify(subRes.data, null, 2));

        // Check if external_user_id matches
        if (subRes.data.external_user_id === EXTERNAL_USER_ID) {
            console.log("SUCCESS: Subscription IS linked to External User ID.");
        } else {
            console.log("FAILURE: Subscription is NOT linked or linked to wrong ID.");
            console.log("Current Link:", subRes.data.external_user_id);
        }

    } catch (error) {
        console.error("Debug failed:", error.response ? error.response.data : error.message);
    }
}

debugState();
