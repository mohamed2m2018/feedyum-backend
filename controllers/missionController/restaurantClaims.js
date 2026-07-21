const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const RestaurantClaim = require('../../models/restaurantClaim');
const ScoutedRestaurant = require('../../models/scoutedRestaurant');
const MissionParticipation = require('../../models/missionParticipation');
const AmbassadorWallet = require('../../models/ambassadorWallet');
const User = require('../../models/user');
const { r2Client, R2_BUCKET, prefixKey } = require('../../utils/r2Client');
const { CLAIMS_ENABLED } = require('../../config/missionConfig');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

const ALLOWED_CONTENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

async function createEvidenceUploadUrl(req, res) {
  if (!CLAIMS_ENABLED) return res.status(503).json({ success: false, code: 'CLAIMS_DISABLED', message: 'Claims are temporarily unavailable' });
  const contentType = String(req.body.contentType || '');
  const fileName = path.basename(String(req.body.fileName || 'evidence'));
  const size = Number(req.body.size);
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return res.status(400).json({ success: false, message: 'Evidence must be a PDF, JPEG, or PNG file' });
  }
  if (!Number.isFinite(size) || size <= 0 || size > 10 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'Evidence must be smaller than 10 MB' });
  }
  const extension = path.extname(fileName).toLowerCase();
  const objectKey = prefixKey(`private/restaurant-claims/${req.user._id}/${crypto.randomUUID()}${extension}`);
  const uploadUrl = await r2Client.getSignedUrl('putObject', {
    Bucket: R2_BUCKET,
    Key: objectKey,
    ContentType: contentType,
    Expires: 600,
  });
  return res.json({ success: true, data: { uploadUrl, objectKey, expiresInSeconds: 600 } });
}

async function createClaim(req, res) {
  const session = await mongoose.startSession();
  try {
    if (!CLAIMS_ENABLED) return res.status(503).json({ success: false, code: 'CLAIMS_DISABLED', message: 'Claims are temporarily unavailable' });
    const { contactName, contactEmail, contactPhone, relationship, evidence, idempotencyKey } = req.body;
    if (!contactName || !contactEmail || !contactPhone || !relationship || !idempotencyKey || !Array.isArray(evidence) || !evidence.length) {
      return res.status(400).json({ success: false, message: 'Contact details, relationship, evidence, and idempotencyKey are required' });
    }
    const replay = await RestaurantClaim.findOne({ claimant: req.user._id, idempotencyKey });
    if (replay) {
      if (replay.scoutedRestaurant.toString() !== req.params.restaurantId) {
        return res.status(409).json({ success: false, message: 'This idempotency key belongs to another restaurant claim' });
      }
      return res.json({ success: true, data: replay, idempotentReplay: true });
    }
    const evidencePrefix = prefixKey(`private/restaurant-claims/${req.user._id}/`);
    const validEvidence = evidence.every(item =>
      item.objectKey?.startsWith(evidencePrefix)
      && item.fileName && ALLOWED_CONTENT_TYPES.has(item.contentType)
      && Number(item.size) > 0 && Number(item.size) <= 10 * 1024 * 1024,
    );
    if (!validEvidence) return res.status(400).json({ success: false, message: 'Invalid evidence metadata' });

    try {
      const uploadedEvidence = await Promise.all(evidence.map(item => r2Client.headObject({
        Bucket: R2_BUCKET,
        Key: item.objectKey,
      }).promise()));
      const metadataMatches = uploadedEvidence.every((metadata, index) =>
        Number(metadata.ContentLength) === Number(evidence[index].size)
        && metadata.ContentType === evidence[index].contentType,
      );
      if (!metadataMatches) return res.status(400).json({ success: false, message: 'Uploaded evidence metadata does not match the claim' });
    } catch (error) {
      console.warn(JSON.stringify({ event: 'scouting.claim_evidence_missing', claimantId: req.user._id, message: error.message }));
      return res.status(400).json({ success: false, message: 'Upload the evidence before submitting the claim' });
    }

    let claim;
    let restaurant;
    let created = false;
    await session.withTransaction(async () => {
      restaurant = await ScoutedRestaurant.findById(req.params.restaurantId).session(session);
      if (!restaurant) {
        const error = new Error('Scouted restaurant not found');
        error.status = 404;
        throw error;
      }

      const existing = await RestaurantClaim.findOne({ claimant: req.user._id, idempotencyKey }).session(session);
      if (existing) {
        if (existing.scoutedRestaurant.toString() !== restaurant._id.toString()) {
          const error = new Error('This idempotency key belongs to another restaurant claim');
          error.status = 409;
          throw error;
        }
        claim = existing;
        return;
      }
      if (restaurant.status !== 'unclaimed') {
        const error = new Error('Restaurant is no longer available to claim');
        error.status = 409;
        throw error;
      }
      if (restaurant.scoutedBy.toString() === req.user._id.toString()) {
        const error = new Error('The scout cannot claim this restaurant');
        error.status = 403;
        throw error;
      }
      const participation = await MissionParticipation.findById(restaurant.participation).select('status').session(session);
      if (!participation || !['active', 'completed'].includes(participation.status)) {
        const error = new Error('This restaurant can be claimed after the scout submission is approved');
        error.status = 409;
        throw error;
      }

      [claim] = await RestaurantClaim.create([{
          scoutedRestaurant: restaurant._id,
          claimant: req.user._id,
          contactName,
          contactEmail,
          contactPhone,
          relationship,
          evidence,
          idempotencyKey,
          status: 'pending',
      }], { session });
      restaurant.status = 'claim_pending';
      await restaurant.save({ session });
      created = true;
    });

    console.log(JSON.stringify({ event: 'scouting.claim_submitted', claimId: claim._id, restaurantId: restaurant._id, claimantId: req.user._id }));
    return res.status(created ? 201 : 200).json({ success: true, data: claim, idempotentReplay: !created });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A claim is already pending for this restaurant' });
    console.error(JSON.stringify({ event: 'scouting.claim_create_failed', message: error.message }));
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Could not submit restaurant claim' });
  } finally {
    await session.endSession();
  }
}

async function getScoutedRestaurant(req, res) {
  const restaurant = await ScoutedRestaurant.findById(req.params.restaurantId)
    .select('name address location status googlePlaceId profile')
    .lean();
  if (!restaurant) return res.status(404).json({ success: false, message: 'Scouted restaurant not found' });
  return res.json({
    success: true,
    data: restaurant,
    availableActions: ['unclaimed', 'claim_pending'].includes(restaurant.status) ? ['claim'] : [],
  });
}

async function getMyClaims(req, res) {
  const claims = await RestaurantClaim.find({ claimant: req.user._id })
    .select('-evidence.objectKey')
    .populate('scoutedRestaurant', 'name address googlePlaceId status')
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ success: true, data: claims });
}

async function reviewClaim(req, res) {
  const session = await mongoose.startSession();
  try {
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    if (action === 'reject' && !String(reason || '').trim()) return res.status(400).json({ success: false, message: 'A rejection reason is required' });

    let claim;
    let restaurant;
    let bonusAmount = 0;
    await session.withTransaction(async () => {
      claim = await RestaurantClaim.findOne({ _id: req.params.claimId, status: 'pending' }).session(session);
      if (!claim) {
        const error = new Error('Pending claim not found');
        error.status = 404;
        throw error;
      }
      restaurant = await ScoutedRestaurant.findById(claim.scoutedRestaurant).session(session);
      if (!restaurant) throw new Error('Scouted restaurant not found');

      claim.status = action === 'approve' ? 'approved' : 'rejected';
      claim.reviewReason = reason;
      claim.reviewedBy = req.user._id;
      claim.reviewedByAdminEmail = req.user.email;
      claim.reviewedAt = new Date();
      await claim.save({ session });

      if (action === 'reject') {
        restaurant.status = 'unclaimed';
        await restaurant.save({ session });
        return;
      }

      const duplicate = await User.findOne({ type: 'chef', googlePlaceId: restaurant.googlePlaceId, _id: { $ne: claim.claimant } }).session(session);
      if (duplicate) {
        const error = new Error('An existing chef profile already owns this Google Place ID; resolve it before approval');
        error.status = 409;
        throw error;
      }
      const claimant = await User.findById(claim.claimant).session(session);
      if (!claimant) throw new Error('Claimant not found');
      claimant.type = 'chef';
      claimant.googlePlaceId = restaurant.googlePlaceId;
      claimant.fullName = claimant.fullName || restaurant.name;
      claimant.locations = claimant.locations?.length ? claimant.locations : [{
        description: restaurant.address,
        lat: restaurant.location.lat,
        long: restaurant.location.lng,
      }];
      await claimant.save({ session });

      restaurant.status = 'claimed';
      restaurant.profile = claimant._id;
      restaurant.claimedBy = claimant._id;
      restaurant.claimedAt = new Date();
      await restaurant.save({ session });

      const participation = await MissionParticipation.findById(restaurant.participation).populate('mission').session(session);
      bonusAmount = participation?.mission?.rewards?.scoutBonusFixed || 0;
      if (bonusAmount > 0) {
        const idempotencyKey = `claim-bonus:${claim._id}`;
        await AmbassadorWallet.findOneAndUpdate(
          { user: restaurant.scoutedBy, transactions: { $not: { $elemMatch: { idempotencyKey } } } },
          {
            $setOnInsert: { user: restaurant.scoutedBy },
            $inc: { balance: bonusAmount, lifetimeEarnings: bonusAmount },
            $push: { transactions: {
              type: 'scout_bonus', amount: bonusAmount, missionId: participation.mission._id,
              participationId: participation._id, description: `Scout bonus for approved claim: ${restaurant.name}`,
              status: 'confirmed', timestamp: new Date(), idempotencyKey,
            } },
          },
          { upsert: true, session },
        );
      }
    });

    if (action === 'approve' && bonusAmount > 0) {
      EnhancedNotificationService.sendNotification({
        userIds: [restaurant.scoutedBy.toString()], title: 'Scout Bonus Earned!',
        message: `${restaurant.name} was claimed. EGP ${bonusAmount} was credited.`, type: 'mission',
        additionalData: { screen: 'AmbassadorWallet', bonusAmount },
      }).catch(error => console.error('[NOTIFICATION] Claim bonus:', error.message));
    }
    console.log(JSON.stringify({ event: action === 'approve' ? 'scouting.claim_approved' : 'scouting.claim_rejected', claimId: claim._id, restaurantId: restaurant._id, bonusAmount }));
    return res.json({ success: true, data: claim });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Could not review claim' });
  } finally {
    await session.endSession();
  }
}

async function getEvidenceDownloadUrl(req, res) {
  const claim = await RestaurantClaim.findById(req.params.claimId).select('evidence');
  const evidence = claim?.evidence?.id(req.params.evidenceId);
  if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
  const downloadUrl = await r2Client.getSignedUrl('getObject', { Bucket: R2_BUCKET, Key: evidence.objectKey, Expires: 300 });
  return res.json({ success: true, data: { downloadUrl, expiresInSeconds: 300 } });
}

module.exports = { createEvidenceUploadUrl, createClaim, getScoutedRestaurant, getMyClaims, reviewClaim, getEvidenceDownloadUrl };
