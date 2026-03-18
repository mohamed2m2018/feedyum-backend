const cron = require('node-cron');
const mongoose = require('mongoose');
const User = mongoose.model('user');
const EnhancedNotificationService = require('../services/enhancedNotificationService');
const trans = require('../services/notificationTranslations');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Sends push notifications to users who haven't opened the app in 7+ days.
 * Cooldown: at most one nudge per user every 7 days.
 */
async function runInactiveNudge() {
  console.log('[CRON] Running inactive user nudge...');
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);

  try {
    const inactiveUsers = await User.find({
      type: { $ne: 'chef' },
      lastActiveAt: { $lt: sevenDaysAgo },
      $or: [
        { lastReengagementSentAt: null },
        { lastReengagementSentAt: { $lt: sevenDaysAgo } },
      ],
    })
      .select('_id')
      .limit(500) // Batch limit to prevent overload
      .lean();

    if (inactiveUsers.length === 0) {
      console.log('[CRON] No inactive users to nudge');
      return;
    }

    const userIds = inactiveUsers.map(u => u._id.toString());

    await EnhancedNotificationService.sendNotification({
      userIds,
      title: trans.missYouTitle,
      message: trans.missYouMessage,
      type: 'discover',
      targetId: null,
      additionalData: { action: 'reengagement_nudge' },
    });

    // Update cooldown timestamp
    await User.updateMany(
      { _id: { $in: inactiveUsers.map(u => u._id) } },
      { $set: { lastReengagementSentAt: now } },
    );

    console.log(`[CRON] Sent inactive nudge to ${userIds.length} users`);
  } catch (err) {
    console.error('[CRON] Inactive nudge failed:', err.message);
  }
}

/**
 * Sends weekly trending reels digest to active users.
 * Aggregates top 3 reels by likes in the past 7 days.
 */
async function runWeeklyTrendingReels() {
  console.log('[CRON] Running weekly trending reels digest...');
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);

  try {
    const Story = mongoose.model('story');

    // Top 3 reels by likes in the last 7 days
    const topReels = await Story.find({
      created_at: { $gte: sevenDaysAgo },
    })
      .sort({ likesNo: -1 })
      .limit(3)
      .select('_id title caption')
      .lean();

    if (topReels.length === 0) {
      console.log('[CRON] No trending reels found this week');
      return;
    }

    // Target: users active in the last 30 days (engaged audience)
    const activeUsers = await User.find({
      type: { $ne: 'chef' },
      lastActiveAt: { $gte: thirtyDaysAgo },
    })
      .select('_id')
      .limit(1000)
      .lean();

    if (activeUsers.length === 0) {
      console.log('[CRON] No active users for trending digest');
      return;
    }

    const userIds = activeUsers.map(u => u._id.toString());
    const firstReelId = topReels[0]._id.toString();

    await EnhancedNotificationService.sendNotification({
      userIds,
      title: trans.weeklyTrendingTitle,
      message: trans.weeklyTrendingMessage,
      type: 'reels',
      targetId: firstReelId,
      additionalData: {
        action: 'weekly_trending',
        reelIds: topReels.map(r => r._id.toString()),
      },
    });

    console.log(`[CRON] Sent weekly trending digest to ${userIds.length} users (${topReels.length} reels)`);
  } catch (err) {
    console.error('[CRON] Weekly trending reels failed:', err.message);
  }
}

/**
 * Starts re-engagement cron jobs:
 * - Daily inactive nudge at 12:00 PM (Cairo time, UTC+2 → 10:00 UTC)
 * - Weekly trending reels every Sunday at 6:00 PM (Cairo → 16:00 UTC)
 */
function startReengagementNotifications() {
  // Daily at 10:00 UTC = 12:00 Cairo
  cron.schedule('0 10 * * *', runInactiveNudge);
  console.log('[CRON] Inactive user nudge scheduled (daily at 12:00 PM Cairo)');

  // Sunday at 16:00 UTC = 18:00 Cairo
  cron.schedule('0 16 * * 0', runWeeklyTrendingReels);
  console.log('[CRON] Weekly trending reels scheduled (Sunday at 6:00 PM Cairo)');
}

module.exports = { startReengagementNotifications, runInactiveNudge, runWeeklyTrendingReels };
