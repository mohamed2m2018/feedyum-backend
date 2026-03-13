const express = require('express');
const passport = require('passport');
const router = express.Router();

// Import branch controllers
const {
  addBranch,
  getBranches,
  editBranch,
  deleteBranch,
  getCoverageAreas,
  toggleBranchStatus,
  getChefOpenStatus
} = require('../controllers/branchController');

// @route   POST /api/branches/add
// @desc    Add a new branch for chef
// @access  Private (Chef only)
router.post('/add', passport.authenticate("jwt", { session: false }), addBranch);

// @route   GET /api/branches/
// @desc    Get branches (for chef's own branches or specific chef by ID)
// @access  Private
router.get('/', passport.authenticate("jwt", { session: false }), getBranches);

// @route   GET /api/branches/coverage-areas
// @desc    Get areas/neighborhoods within a delivery radius
// @access  Public (no auth required - used during branch setup)
router.get('/coverage-areas', getCoverageAreas);

// @route   PUT /api/branches/edit
// @desc    Edit an existing branch
// @access  Private (Chef only, own branches)
router.put('/edit', passport.authenticate("jwt", { session: false }), editBranch);

// @route   DELETE /api/branches/delete
// @desc    Delete a branch
// @access  Private (Chef only, own branches)
router.delete('/delete', passport.authenticate("jwt", { session: false }), deleteBranch);

// @route   PUT /api/branches/toggle-status
// @desc    Toggle branch open/close (manual override)
// @access  Private (Chef only)
router.put('/toggle-status', passport.authenticate("jwt", { session: false }), toggleBranchStatus);

// @route   GET /api/branches/status/:chefId
// @desc    Get open/closed status for a chef's branches
// @access  Public
router.get('/status/:chefId', getChefOpenStatus);

module.exports = router; 