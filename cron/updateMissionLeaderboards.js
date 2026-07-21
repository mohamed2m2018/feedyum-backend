const cron = require('node-cron');
const mongoose = require('mongoose');
const Mission = mongoose.model('mission');
const MissionParticipation = mongoose.model('missionParticipation');
const AmbassadorWallet = mongoose.model('ambassadorWallet');
const EnhancedNotificationService = require('../services/enhancedNotificationService');

/**
 * Cron job: Update mission leaderboards and check milestone rewards
 * Runs every 15 minutes
 *
 * For each active mission:
 * 1. Ranks participants by totalOrdersGenerated (descending)
 * 2. Checks if any participant has newly crossed a milestone threshold
 * 3. Credits milestone bonuses to ambassador wallets
 */
function startUpdateMissionLeaderboards() {
    cron.schedule('*/15 * * * *', async () => {
        try {
            const activeMissions = await Mission.find({ status: 'active' });

            if (activeMissions.length === 0) return;

            let ranksUpdated = 0;
            let milestonesAwarded = 0;

            for (const mission of activeMissions) {
                // Find all active or completed participations for this mission
                const participations = await MissionParticipation.find({
                    mission: mission._id,
                    status: { $in: ['active', 'completed'] }
                }).sort({ 'metrics.totalOrdersGenerated': -1 });

                // Update ranks (1-based)
                for (let i = 0; i < participations.length; i++) {
                    const participation = participations[i];
                    const newRank = i + 1;

                    if (participation.rank !== newRank) {
                        await MissionParticipation.updateOne({ _id: participation._id }, { $set: { rank: newRank } });
                        ranksUpdated++;
                    }

                    // Check milestones
                    const milestones = mission.rewards?.milestones || [];
                    for (const milestone of milestones) {
                        const milestoneKey = milestone._id.toString();
                        const claimedMilestone = await MissionParticipation.findOneAndUpdate(
                            {
                                _id: participation._id,
                                'metrics.totalOrdersGenerated': { $gte: milestone.threshold },
                                'metrics.milestonesReached': { $ne: milestoneKey },
                            },
                            { $addToSet: { 'metrics.milestonesReached': milestoneKey } },
                            { new: true },
                        );

                        if (claimedMilestone) {

                            // Credit milestone bonus to ambassador wallet
                            try {
                                let wallet = await AmbassadorWallet.findOne({ user: participation.user });
                                if (!wallet) {
                                    wallet = new AmbassadorWallet({ user: participation.user });
                                    await wallet.save();
                                }
                                await wallet.addMilestoneBonus(
                                    mission._id,
                                    participation._id,
                                    milestone.rewardAmount,
                                    milestone.description,
                                    `milestone:${participation._id}:${milestoneKey}`,
                                );
                                milestonesAwarded++;

                                // Notify ambassador about milestone reached (non-blocking)
                                try {
                                    await EnhancedNotificationService.sendNotification({
                                        userIds: [participation.user.toString()],
                                        title: 'Milestone Reached!',
                                        message: `Milestone reached! You earned EGP ${milestone.rewardAmount} bonus`,
                                        type: 'mission',
                                        targetId: mission._id.toString(),
                                        additionalData: {
                                            screen: 'MissionDetail',
                                            missionId: mission._id.toString(),
                                            milestoneThreshold: milestone.threshold,
                                            bonusAmount: milestone.rewardAmount,
                                        },
                                    });
                                } catch (notifErr) {
                                    console.error(
                                        `[NOTIFICATION] Failed to send milestone notification for participation ${participation._id}:`,
                                        notifErr.message
                                    );
                                }
                            } catch (walletErr) {
                                console.error(
                                    `[CRON] Failed to credit milestone bonus for participation ${participation._id}:`,
                                    walletErr.message
                                );
                            }
                        }
                    }

                }
            }

            if (ranksUpdated > 0 || milestonesAwarded > 0) {
                console.log(
                    `[CRON] Leaderboards updated: ${ranksUpdated} ranks changed, ${milestonesAwarded} milestones awarded across ${activeMissions.length} missions`
                );
            }
        } catch (err) {
            console.error('[CRON] Update mission leaderboards failed:', err.message);
        }
    });

    console.log('[CRON] Mission leaderboard updates scheduled (every 15 minutes)');
}

module.exports = { startUpdateMissionLeaderboards };
