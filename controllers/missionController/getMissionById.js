const Mission = require('../../models/mission');
const MissionParticipation = require('../../models/missionParticipation');
const User = require('../../models/user');
const ChefBranch = require('../../models/chefBranch');
const { normalizeTarget } = require('../../services/missionEligibilityService');
const { SCOUTING_ENABLED } = require('../../config/missionConfig');

function buildAvailableActions(mission, participation) {
  if (!participation) return mission.status === 'active' ? ['accept'] : [];
  if (['accepted', 'rejected'].includes(participation.status)) return ['submit_content', 'withdraw'];
  if (['content_submitted', 'under_review'].includes(participation.status)) return ['view_submission'];
  if (['active', 'completed'].includes(participation.status)) return ['share', 'view_wallet'];
  return [];
}

const getMissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const mission = await Mission.findById(id).lean();
    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found',
      });
    }
    if (mission.type === 'scouting' && !SCOUTING_ENABLED) {
      return res.status(503).json({ success: false, code: 'SCOUTING_DISABLED', message: 'Scouting is temporarily unavailable' });
    }

    let participation = null;
    let restaurant = null;

    if (req.user) {
      participation = await MissionParticipation.findOne({
        mission: id,
        user: req.user._id,
      }).lean();
    }

    if (mission.targetChefId) {
      const [chef, branch] = await Promise.all([
        User.findById(mission.targetChefId)
          .select('fullName avatar cover bio averageRating totalReviews locations tags hasMenu')
          .populate('tags', 'name nameAr image')
          .lean(),
        ChefBranch.findOne({ chef: mission.targetChefId, isPrimary: true })
          .select('branchName addressDetails location deliveryRadius minimumOrderAmount operatingHours')
          .lean(),
      ]);

      if (chef) {
        restaurant = {
          _id: chef._id,
          name: chef.fullName,
          avatar: chef.avatar,
          cover: chef.cover,
          bio: chef.bio,
          rating: chef.averageRating,
          reviewCount: chef.totalReviews,
          tags: chef.tags || [],
          hasMenu: chef.hasMenu,
          address: branch?.addressDetails?.formattedAddress
            || branch?.addressDetails?.area
            || mission.targetRestaurantAddress
            || null,
          location: branch?.location || chef.locations?.[0] || null,
          minimumOrder: branch?.minimumOrderAmount || null,
          operatingHours: branch?.operatingHours || null,
        };
      }
    } else if (mission.type === 'scouting' && (mission.target || mission.targetArea || mission.targetRestaurantAddress || mission.targetGooglePlaceId)) {
      // For scouting missions, find a representative location in the target area
      const target = normalizeTarget(mission);
      let areaLocation = target?.center || null;
      let areaAddress = target?.address || mission.targetRestaurantAddress || null;

      if (mission.targetArea) {
        // Split targetArea on comma (e.g. "Nasr City, Cairo" -> "Nasr City")
        // and try each part to find a matching branch with coordinates
        const areaParts = mission.targetArea.split(',').map(s => s.trim()).filter(Boolean);

        for (const part of areaParts) {
          const areaBranch = await ChefBranch.findOne({
            'addressDetails.area': { $regex: part, $options: 'i' },
          }).select('addressDetails location').lean();

          if (areaBranch) {
            areaLocation = areaBranch.location
              ? { lat: areaBranch.location.lat, lng: areaBranch.location.long }
              : null;
            if (!areaAddress) {
              areaAddress = areaBranch.addressDetails?.formattedAddress
                || areaBranch.addressDetails?.area
                || null;
            }
            break;
          }
        }

        // If no branch found by area, try matching by city
        if (!areaLocation) {
          for (const part of areaParts) {
            const cityBranch = await ChefBranch.findOne({
              'addressDetails.city': { $regex: part, $options: 'i' },
            }).select('addressDetails location').lean();

            if (cityBranch) {
              areaLocation = cityBranch.location
                ? { lat: cityBranch.location.lat, lng: cityBranch.location.long }
                : null;
              if (!areaAddress) {
                areaAddress = cityBranch.addressDetails?.formattedAddress
                  || cityBranch.addressDetails?.area
                  || null;
              }
              break;
            }
          }
        }
      }

      restaurant = {
        _id: null,
        name: target?.name || mission.targetRestaurantName || null,
        address: areaAddress,
        area: mission.targetArea || null,
        location: areaLocation,
        isScoutingArea: true,
        targetMode: target?.mode || null,
        radiusMeters: target?.radiusMeters || null,
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Mission retrieved successfully',
      data: {
        mission,
        participation,
        restaurant,
        availableActions: buildAvailableActions(mission, participation),
        targetPresentation: normalizeTarget(mission),
        rewardState: {
          scoutBonus: mission.rewards?.scoutBonusFixed || 0,
          scoutBonusTiming: 'after_claim_approval',
          commissionPercentage: mission.rewards?.commissionPercentage || 0,
          commissionCap: mission.rewards?.commissionCap ?? null,
        },
      },
    });
  } catch (error) {
    console.error('Error getting mission by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving mission',
    });
  }
};

module.exports = getMissionById;
