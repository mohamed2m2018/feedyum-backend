const User = require('../../models/user');
const MissionParticipation = require('../../models/missionParticipation');
const AmbassadorWallet = require('../../models/ambassadorWallet');
const Mission = require('../../models/mission');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

const claimRestaurant = async (req, res) => {
  try {
    const { profileId } = req.params;
    const claimingUserId = req.user._id;

    // Find the unclaimed restaurant profile
    const restaurantProfile = await User.findById(profileId);
    if (!restaurantProfile) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found',
      });
    }

    if (!restaurantProfile.isUnclaimed) {
      return res.status(400).json({
        success: false,
        message: 'This restaurant has already been claimed',
      });
    }

    // Basic identity check: the claiming user should be the one making the request
    if (claimingUserId.toString() === restaurantProfile.scoutedBy?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'The scout cannot claim the restaurant they scouted',
      });
    }

    // Claim the restaurant
    restaurantProfile.isUnclaimed = false;
    restaurantProfile.claimedAt = Date.now();
    await restaurantProfile.save();

    // Credit the scout who found this restaurant
    if (restaurantProfile.scoutedBy) {
      const scoutParticipation = await MissionParticipation.findOne({
        user: restaurantProfile.scoutedBy,
        scoutedRestaurantProfile: profileId,
      }).populate('mission');

      if (scoutParticipation && scoutParticipation.mission) {
        const bonusAmount = scoutParticipation.mission.rewards?.scoutBonusFixed || 0;

        if (bonusAmount > 0) {
          let wallet = await AmbassadorWallet.findOne({ user: restaurantProfile.scoutedBy });
          if (!wallet) {
            wallet = new AmbassadorWallet({ user: restaurantProfile.scoutedBy });
            await wallet.save();
          }

          await wallet.addScoutBonus(
            scoutParticipation.mission._id,
            scoutParticipation._id,
            bonusAmount,
            `Scout bonus for restaurant claim: ${restaurantProfile.fullName || profileId}`
          );

          // Notify the scout about the claim and bonus (non-blocking)
          try {
            const restaurantName = restaurantProfile.fullName || 'A restaurant';
            await EnhancedNotificationService.sendNotification({
              userIds: [restaurantProfile.scoutedBy.toString()],
              title: 'Scout Bonus Earned!',
              message: `Great news! ${restaurantName} claimed their account. Your scout bonus has been credited!`,
              type: 'mission',
              targetId: scoutParticipation.mission._id.toString(),
              additionalData: {
                screen: 'MissionDetail',
                missionId: scoutParticipation.mission._id.toString(),
                bonusAmount,
              },
            });
          } catch (notifErr) {
            console.error('[NOTIFICATION] Failed to send scout bonus notification:', notifErr.message);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Restaurant claimed successfully',
      data: {
        profileId: restaurantProfile._id,
        claimedAt: restaurantProfile.claimedAt,
      },
    });
  } catch (error) {
    console.error('Error claiming restaurant:', error);
    return res.status(500).json({
      success: false,
      message: 'Error claiming restaurant',
    });
  }
};

module.exports = claimRestaurant;
