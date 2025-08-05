const express = require('express');
const passport = require('passport');
const router = express.Router();

// Import branch controllers
const {
  addBranch,
  getBranches,
  editBranch,
  deleteBranch
} = require('../controllers/branchController');

// @route   POST /api/branches/add
// @desc    Add a new branch for chef
// @access  Private (Chef only)
router.post('/add', passport.authenticate("jwt", { session: false }), addBranch);

// @route   GET /api/branches/
// @desc    Get branches (for chef's own branches or specific chef by ID)
// @access  Private
router.get('/', passport.authenticate("jwt", { session: false }), getBranches);

// @route   PUT /api/branches/edit
// @desc    Edit an existing branch
// @access  Private (Chef only, own branches)
router.put('/edit', passport.authenticate("jwt", { session: false }), editBranch);

// @route   DELETE /api/branches/delete
// @desc    Delete a branch
// @access  Private (Chef only, own branches)
router.delete('/delete', passport.authenticate("jwt", { session: false }), deleteBranch);

module.exports = router; 