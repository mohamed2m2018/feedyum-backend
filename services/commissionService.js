const mongoose = require('mongoose');
const MissionAttribution = mongoose.model('missionAttribution');
const AmbassadorWallet = mongoose.model('ambassadorWallet');
const MissionParticipation = mongoose.model('missionParticipation');
const Mission = mongoose.model('mission');
const { DEFAULT_ATTRIBUTION_WINDOW_DAYS } = require('../config/missionConfig');
const EnhancedNotificationService = require('./enhancedNotificationService');

async function findAttribution(viewerId, chefId) {
  const now = new Date();
  return MissionAttribution.findOne({
    viewer: viewerId,
    chefId,
    expiresAt: { $gt: now },
    converted: false,
  }).sort({ viewedAt: -1 });
}

async function createAttribution(viewerId, story, source = 'in_app_view') {
  if (!story.missionId || !story.participationId) return null;
  if (story.author.toString() === viewerId.toString()) return null;

  const participation = await MissionParticipation.findById(story.participationId);
  if (!participation || !['active', 'content_submitted'].includes(participation.status)) return null;

  const mission = await Mission.findById(story.missionId);
  if (!mission || !mission.isActive()) return null;

  const windowDays = mission.attributionWindowDays || DEFAULT_ATTRIBUTION_WINDOW_DAYS;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + windowDays);

  const chefId = mission.type === 'reviewing'
    ? mission.targetChefId
    : participation.scoutedRestaurantProfile;

  if (!chefId) return null;

  return MissionAttribution.findOneAndUpdate(
    { viewer: viewerId, storyId: story._id, ambassador: story.author },
    {
      $set: {
        participationId: story.participationId,
        missionId: story.missionId,
        chefId,
        referralCode: participation.referralCode,
        source,
        viewedAt: new Date(),
        expiresAt,
      },
    },
    { upsert: true, new: true }
  );
}

async function creditCommission(order, attribution) {
  const session = await mongoose.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      const claimedAttribution = await MissionAttribution.findOneAndUpdate(
        { _id: attribution._id, converted: false },
        { $set: { converted: true, convertedOrderId: order._id, convertedAt: new Date() } },
        { new: true, session },
      );
      if (!claimedAttribution) return;
      const mission = await Mission.findById(attribution.missionId).session(session);
      if (!mission) throw new Error('Mission not found for attribution');

      const percentage = mission.rewards.commissionPercentage || 0;
      const cap = mission.rewards.commissionCap || Infinity;
      const amount = Math.min(order.subtotal * percentage / 100, cap);

      if (amount <= 0) return;
      const gracePeriodEnds = new Date(Date.now() + require('../config/missionConfig').COMMISSION_GRACE_PERIOD_HOURS * 3600000);
      const idempotencyKey = `order-commission:${order._id}`;
      await AmbassadorWallet.findOneAndUpdate(
        { user: attribution.ambassador, transactions: { $not: { $elemMatch: { idempotencyKey } } } },
        {
          $setOnInsert: { user: attribution.ambassador },
          $inc: { pendingBalance: amount },
          $push: { transactions: {
            type: 'review_commission', amount, orderId: order._id, missionId: attribution.missionId,
            participationId: attribution.participationId, description: 'Commission from order', status: 'pending',
            gracePeriodEnds, timestamp: new Date(), idempotencyKey,
          } },
        },
        { upsert: true, session },
      );
      claimedAttribution.commissionAmount = amount;
      await claimedAttribution.save({ session });

      await MissionParticipation.findByIdAndUpdate(attribution.participationId, {
        $inc: {
          'metrics.totalOrdersGenerated': 1,
          'metrics.totalRevenueGenerated': order.subtotal,
          'metrics.totalCommissionEarned': amount,
        },
      }, { session });
      result = { amount, ambassadorId: attribution.ambassador, missionId: attribution.missionId };
    });
  } finally {
    await session.endSession();
  }

  if (!result) return null;

  // Notify ambassador about commission earned (non-blocking)
  try {
    await EnhancedNotificationService.sendNotification({
      userIds: [attribution.ambassador.toString()],
      title: 'Commission Earned!',
      message: `You earned EGP ${result.amount.toFixed(2)} commission from an order!`,
      type: 'mission',
      targetId: attribution.missionId.toString(),
      additionalData: {
        screen: 'MissionDetail',
        missionId: attribution.missionId.toString(),
        orderId: order._id.toString(),
        commissionAmount: result.amount,
      },
    });
  } catch (notifErr) {
    console.error('[NOTIFICATION] Failed to send commission notification:', notifErr.message);
  }

  return result;
}

async function reverseCommission(orderId) {
  const session = await mongoose.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      const attribution = await MissionAttribution.findOneAndUpdate(
        { convertedOrderId: orderId, converted: true, reversedAt: { $exists: false } },
        { $set: { reversedAt: new Date(), reversalReason: 'Order cancelled' } },
        { new: true, session },
      );
      if (!attribution?.commissionAmount) return;
      const wallet = await AmbassadorWallet.findOne({ user: attribution.ambassador, 'transactions.orderId': orderId }).session(session);
      if (!wallet) throw new Error('Ambassador wallet not found for reversal');
      const original = wallet.transactions.find(tx => tx.orderId?.toString() === orderId.toString() && tx.type === 'review_commission');
      if (!original || original.status === 'reversed') return;
      const wasPending = original.status === 'pending';
      original.status = 'reversed';
      wallet.transactions.push({
        type: 'commission_reversal', amount: -original.amount, orderId,
        missionId: attribution.missionId, participationId: attribution.participationId,
        description: 'Order cancelled', status: 'confirmed', timestamp: new Date(),
        idempotencyKey: `commission-reversal:${orderId}`,
      });
      if (wasPending) wallet.pendingBalance -= original.amount;
      else { wallet.balance -= original.amount; wallet.lifetimeEarnings -= original.amount; }
      await wallet.save({ session });
      const percentage = await getMissionCommissionPercentage(attribution.missionId, session);
      await MissionParticipation.findByIdAndUpdate(attribution.participationId, { $inc: {
        'metrics.totalOrdersGenerated': -1,
        'metrics.totalRevenueGenerated': -(attribution.commissionAmount * 100 / percentage),
        'metrics.totalCommissionEarned': -attribution.commissionAmount,
      } }, { session });
      result = { reversedAmount: attribution.commissionAmount, ambassadorId: attribution.ambassador };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function getMissionCommissionPercentage(missionId, session) {
  const mission = await Mission.findById(missionId).session(session || null);
  return mission?.rewards?.commissionPercentage || 1;
}

module.exports = {
  findAttribution,
  createAttribution,
  creditCommission,
  reverseCommission,
};
