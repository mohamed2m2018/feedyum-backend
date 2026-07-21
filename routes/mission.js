const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  createMission,
  updateMission,
  getMissions,
  getMissionById,
  acceptMission,
  submitMissionContent,
  getMyMissions,
  getMissionLeaderboard,
  withdrawFromMission,
  reviewSubmission,
  claimRestaurant,
  getMissionParticipants,
  searchPlaces,
  createEvidenceUploadUrl,
  createClaim,
  getScoutedRestaurant,
  getMyClaims,
  reviewClaim,
  getEvidenceDownloadUrl,
  trackAttribution,
} = require('../controllers/missionController');

const authenticateUser = passport.authenticate('jwt', { session: false });

const requireAdmin = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

// Optionally authenticate — sets req.user if token present, continues otherwise
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// @route  POST api/missions
// @desc   Create a new mission (admin only)
// @access Admin
router.post('/', authenticateUser, requireAdmin, createMission);

// @route  PUT api/missions/:id
// @desc   Update a mission (admin only)
// @access Admin
router.put('/:id', authenticateUser, requireAdmin, updateMission);

// @route  GET api/missions
// @desc   Get all missions with filters
// @access Public
router.get('/', getMissions);

// @route  GET api/missions/search-places
// @desc   Search for restaurants via Google Places and check if they're on FeedYum
// @access Private
// NOTE: Must be defined before /:id to avoid matching "search-places" as an id
router.get('/search-places', authenticateUser, searchPlaces);

router.post('/claims/evidence-upload-url', authenticateUser, createEvidenceUploadUrl);
router.get('/claims/my', authenticateUser, getMyClaims);
router.post('/scouted-restaurants/:restaurantId/claims', authenticateUser, createClaim);
router.get('/scouted-restaurants/:restaurantId', authenticateUser, getScoutedRestaurant);
router.put('/claims/:claimId/review', authenticateUser, requireAdmin, reviewClaim);
router.get('/claims/:claimId/evidence/:evidenceId', authenticateUser, requireAdmin, getEvidenceDownloadUrl);

// @route  GET api/missions/my
// @desc   Get current user's mission participations
// @access Private
// NOTE: Must be defined before /:id to avoid matching "my" as an id
router.get('/my', authenticateUser, getMyMissions);

// @route  GET api/missions/:id
// @desc   Get a single mission by ID
// @access Public (with optional auth for participation data)
router.get('/:id', optionalAuth, getMissionById);

// @route  POST api/missions/:id/accept
// @desc   Accept/join a mission
// @access Private
router.post('/:id/accept', authenticateUser, acceptMission);

// @route  POST api/missions/:id/submit
// @desc   Submit content for a mission
// @access Private
router.post('/:id/submit', authenticateUser, submitMissionContent);

// @route  PUT api/missions/:id/withdraw
// @desc   Withdraw from a mission
// @access Private
router.put('/:id/withdraw', authenticateUser, withdrawFromMission);

// @route  GET api/missions/:id/leaderboard
// @desc   Get mission leaderboard
// @access Public
router.get('/:id/leaderboard', getMissionLeaderboard);

// @route  PUT api/missions/:id/submissions/:pid/review
// @desc   Review a submission (admin only)
// @access Admin
router.put('/:id/submissions/:pid/review', authenticateUser, requireAdmin, reviewSubmission);

// @route  GET api/missions/:id/participants
// @desc   Get all participants for a mission (admin only)
// @access Admin
router.get('/:id/participants', authenticateUser, requireAdmin, getMissionParticipants);

// @route  POST api/missions/claim-restaurant/:profileId
// @desc   Claim a scouted restaurant profile
// @access Private
router.post('/claim-restaurant/:profileId', authenticateUser, (req, res) => res.status(410).json({
  success: false,
  code: 'CLAIM_FLOW_UPGRADED',
  message: 'Use the restaurant claim review flow',
}));

// @route  POST api/missions/track-attribution
// @desc   Track attribution (placeholder)
// @access Private
router.post('/track-attribution', authenticateUser, trackAttribution);

module.exports = router;
