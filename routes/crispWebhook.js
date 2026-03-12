const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('user');
const EnhancedNotificationService = require('../services/enhancedNotificationService');

/**
 * Crisp Webhook Handler
 * 
 * Receives webhook events from Crisp when:
 * - message:send — a new message is sent (by agent or visitor)
 * 
 * We filter for agent messages only and send a push notification
 * to the customer so they know support has replied.
 * 
 * Crisp webhook payload (message:send):
 * {
 *   event: "message:send",
 *   data: {
 *     website_id: "...",
 *     session_id: "...",
 *     content: "Hello!",
 *     type: "text",
 *     from: "operator",  // "operator" = agent, "user" = visitor
 *     origin: "chat",
 *     user: { nickname: "...", user_id: "..." },
 *     stamped: true,
 *     timestamp: 1234567890
 *   }
 * }
 * 
 * Setup in Crisp:
 * 1. Go to Settings > Workspace Settings > Website Hooks
 * 2. Add your webhook URL: https://your-backend/api/webhooks/crisp
 * 3. Select event: message:send
 */

// POST /api/webhooks/crisp — no auth needed (webhook from external service)
router.post('/', async (req, res) => {
  try {
    const { event, data } = req.body;

    console.log(`[Crisp Webhook] Received event: ${event}`, {
      from: data?.from || 'unknown',
      type: data?.type || 'unknown',
      sessionId: data?.session_id || 'none',
    });

    // Only process message:send events from operators (agents)
    if (event !== 'message:send' || data?.from !== 'operator') {
      return res.status(200).json({ status: 'ok', message: 'Event ignored (not agent message)' });
    }

    // Get visitor email from Crisp session data
    // Crisp includes visitor info in the webhook or we match by email passed via URL params
    const visitorEmail = data?.user?.email;
    const visitorNickname = data?.user?.nickname;

    if (!visitorEmail) {
      console.log('[Crisp Webhook] No visitor email in webhook data, cannot send notification');
      return res.status(200).json({ status: 'ok', message: 'No visitor email' });
    }

    // Find the user by email
    const user = await User.findOne({ email: visitorEmail }).select('_id fullName username').lean();
    if (!user) {
      console.log(`[Crisp Webhook] No user found for email: ${visitorEmail}`);
      return res.status(200).json({ status: 'ok', message: 'User not found' });
    }

    // Get a preview of the agent's message
    const messagePreview = data?.content
      ? (data.content.length > 80 ? data.content.substring(0, 80) + '...' : data.content)
      : '';

    // Send push notification to the user
    await EnhancedNotificationService.sendNotification({
      userIds: [user._id],
      title: {
        en: '💬 Support Reply',
        ar: '💬 رد الدعم',
      },
      message: {
        en: messagePreview || 'You have a new message from FeedYum support',
        ar: messagePreview || 'لديك رسالة جديدة من دعم فيديم',
      },
      type: 'supportChat',
      additionalData: {
        sessionId: data?.session_id,
        type: 'supportChat',
      },
    });

    console.log(`[Crisp Webhook] Push notification sent to user ${user._id} (${user.fullName || user.username})`);
    return res.status(200).json({ status: 'ok', message: 'Notification sent' });

  } catch (error) {
    console.error('[Crisp Webhook] Error processing webhook:', error);
    // Always return 200 to prevent Crisp from retrying
    return res.status(200).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
