/**
 * Get nearest active branch for a chef or batch of chefs.
 * Uses Haversine formula for accurate distance calculation.
 * 
 * Replaces all usage of User.locations for chef distance.
 */
const mongoose = require('mongoose');
const ChefBranch = require('../models/chefBranch');

/**
 * Get the nearest active branch for a single chef.
 * @param {string} chefId - Chef user ID
 * @param {number} lat - Target latitude
 * @param {number} long - Target longitude
 * @returns {{ distance: number, branch: Object } | undefined}
 */
async function getNearestBranch(chefId, lat, long) {
  if (!chefId || isNaN(lat) || isNaN(long)) return undefined;

  const branches = await ChefBranch.find({ chef: chefId, isActive: true })
    .select('location branchName addressDetails')
    .lean();

  if (!branches || branches.length === 0) return undefined;

  return findNearestFromBranches(branches, lat, long);
}

/**
 * Batch version: get nearest active branch for multiple chefs in ONE query.
 * Returns Map<chefId, { distance, branch }>.
 * 
 * @param {string[]} chefIds - Array of chef user IDs
 * @param {number} lat - Target latitude
 * @param {number} long - Target longitude
 * @returns {Map<string, { distance: number, branch: Object }>}
 */
async function getNearestBranchBatch(chefIds, lat, long) {
  const result = new Map();

  if (!chefIds || chefIds.length === 0 || isNaN(lat) || isNaN(long)) {
    return result;
  }

  // ONE query for all chefs' branches
  const allBranches = await ChefBranch.find({
    chef: { $in: chefIds },
    isActive: true
  })
    .select('chef location branchName addressDetails')
    .lean();

  // Group branches by chef ID
  const branchesByChef = new Map();
  allBranches.forEach(branch => {
    const chefId = branch.chef.toString();
    if (!branchesByChef.has(chefId)) {
      branchesByChef.set(chefId, []);
    }
    branchesByChef.get(chefId).push(branch);
  });

  // Find nearest branch for each chef
  branchesByChef.forEach((branches, chefId) => {
    const nearest = findNearestFromBranches(branches, lat, long);
    if (nearest) {
      result.set(chefId, nearest);
    }
  });

  return result;
}

/**
 * Find the nearest branch from a list using Haversine formula.
 * @param {Object[]} branches - Array of branch documents with location.lat/long
 * @param {number} targetLat
 * @param {number} targetLong
 * @returns {{ distance: number, branch: Object } | undefined}
 */
function findNearestFromBranches(branches, targetLat, targetLong) {
  const earthRadius = 6371; // km
  let nearestBranch = null;
  let nearestDistance = Infinity;

  for (const branch of branches) {
    const branchLat = branch.location?.lat;
    const branchLong = branch.location?.long;

    if (branchLat == null || branchLong == null || isNaN(branchLat) || isNaN(branchLong)) {
      continue;
    }

    const latDiff = (branchLat - targetLat) * (Math.PI / 180);
    const longDiff = (branchLong - targetLong) * (Math.PI / 180);

    const a =
      Math.sin(latDiff / 2) ** 2 +
      Math.cos(targetLat * (Math.PI / 180)) *
      Math.cos(branchLat * (Math.PI / 180)) *
      Math.sin(longDiff / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    if (distance < nearestDistance) {
      nearestBranch = branch;
      nearestDistance = distance;
    }
  }

  if (!nearestBranch) return undefined;

  return {
    distance: parseFloat(nearestDistance.toFixed(2)),
    branch: nearestBranch
  };
}

module.exports = { getNearestBranch, getNearestBranchBatch, findNearestFromBranches };
