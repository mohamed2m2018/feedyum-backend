const cron = require('node-cron');
const mongoose = require('mongoose');
const Mission = mongoose.model('mission');
const MissionParticipation = mongoose.model('missionParticipation');

/**
 * Cron job: Expire missions past their end date
 * Runs daily at midnight (00:00)
 *
 * 1. Finds active missions whose endDate has passed
 * 2. Updates their status to 'expired'
 * 3. Withdraws any participations still in early stages (accepted/content_submitted)
 *    since those ambassadors never became fully active
 */
function startExpireMissions() {
    cron.schedule('0 0 * * *', async () => {
        const now = new Date();

        try {
            // Find active missions past their end date
            const expiredMissions = await Mission.find({
                status: 'active',
                endDate: { $lt: now }
            });

            if (expiredMissions.length === 0) return;

            let missionsExpired = 0;
            let participationsWithdrawn = 0;

            for (const mission of expiredMissions) {
                // Mark mission as expired
                mission.status = 'expired';
                await mission.save();
                missionsExpired++;

                // Withdraw participations that never became active
                const result = await MissionParticipation.updateMany(
                    {
                        mission: mission._id,
                        status: { $in: ['accepted', 'content_submitted'] }
                    },
                    {
                        $set: { status: 'withdrawn' }
                    }
                );

                participationsWithdrawn += result.modifiedCount;
            }

            console.log(
                `[CRON] Expired ${missionsExpired} missions, withdrew ${participationsWithdrawn} incomplete participations`
            );
        } catch (err) {
            console.error('[CRON] Expire missions failed:', err.message);
        }
    });

    console.log('[CRON] Mission expiry scheduled (daily at midnight)');
}

module.exports = { startExpireMissions };
