const mongoose = require('mongoose');
const { mongoURI } = require('./config/keys');
const { oneSignalAppId, oneSignalApikey } = require("./config/keys");
const OneSignal = require("onesignal-node");

// DATA
const SUBSCRIPTION_ID = "44a69246-0ab8-4c01-a3a9-1334e9d5044d";
const TARGET_USER_ID = "695d4466503c8d9704ccd74c"; // Used for db lookups only
const SENDER_ID = "686c07e8643281d2101d66e6";
const TARGET_POST_ID = "695d54b2503c8d9704cd0853";
const TARGET_COMMENT_ID = "695d45be503c8d9704ccdd5f";
const COMMENT_POST_ID = "695d4500503c8d9704ccdd2c";

const client = new OneSignal.Client(oneSignalAppId, oneSignalApikey);

async function sendDirectNotifications() {
    try {
        console.log(`Sending Targeted Notifications to Subscription ID: ${SUBSCRIPTION_ID}...`);

        // 1. CHAT NOTIFICATION
        console.log('--- Sending CHAT Notification ---');
        await client.createNotification({
            app_id: oneSignalAppId,
            headings: { en: "Test Sender (Chat)" },
            contents: { en: "Final verification: Chat notification test." },
            include_subscription_ids: [SUBSCRIPTION_ID],
            data: {
                type: 'chat',
                senderId: SENDER_ID,
                chatId: SENDER_ID
            }
        });

        // 2. LIKE NOTIFICATION
        console.log('--- Sending LIKE Notification ---');
        await client.createNotification({
            app_id: oneSignalAppId,
            headings: { en: "New Like!" },
            contents: { en: "Test Sender liked your post" },
            include_subscription_ids: [SUBSCRIPTION_ID],
            data: {
                type: 'post',
                targetId: TARGET_POST_ID,
                action: 'new_like'
            }
        });

        // 3. REPLY NOTIFICATION
        console.log('--- Sending REPLY Notification ---');
        await client.createNotification({
            app_id: oneSignalAppId,
            headings: { en: "New Reply!" },
            contents: { en: 'Test Sender replied to your comment: "Final verification..."' },
            include_subscription_ids: [SUBSCRIPTION_ID],
            data: {
                type: 'reply',
                postId: COMMENT_POST_ID,
                commentId: TARGET_COMMENT_ID,
                replyId: "mock_reply_id",
                openComment: true
            }
        });

        console.log('--- DONE ---');

    } catch (error) {
        console.error("Notification failed:", error);
    }
}

sendDirectNotifications();
