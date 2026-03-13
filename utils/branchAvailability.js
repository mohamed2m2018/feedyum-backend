/**
 * Branch Availability Utility
 * Determines if a branch/chef is currently open based on:
 * 1. manualOverride (forceOpen / forceClosed)
 * 2. operatingHours schedule + branch timezone
 * 3. Default: open if no hours configured (backward compat)
 */
const mongoose = require('mongoose');

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Get the current time in a specific IANA timezone.
 * Uses native Intl.DateTimeFormat (no external dependencies).
 * @param {string} timezone - IANA timezone string (e.g. 'Africa/Cairo')
 * @returns {{ dayName: string, hours: number, minutes: number, timeStr: string }}
 */
function getCurrentTimeInTimezone(timezone) {
  const now = new Date();
  try {
    // Get day of week in the target timezone
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
    });
    const dayName = dayFormatter.format(now).toLowerCase();

    // Get hours and minutes in the target timezone
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = timeFormatter.formatToParts(now);
    const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return { dayName, hours, minutes, timeStr };
  } catch (err) {
    // Fallback to UTC if timezone is invalid
    console.error(`[branchAvailability] Invalid timezone "${timezone}", falling back to UTC:`, err.message);
    const dayName = DAY_NAMES[now.getUTCDay()];
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return { dayName, hours, minutes, timeStr };
  }
}

/**
 * Compare two time strings "HH:MM"
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
function compareTime(a, b) {
  const [aH, aM] = a.split(':').map(Number);
  const [bH, bM] = b.split(':').map(Number);
  return (aH * 60 + aM) - (bH * 60 + bM);
}

/**
 * Check if a single branch is currently open.
 * @param {Object} branch - Branch document (or lean object)
 * @returns {{ isOpen: boolean, reason: string, nextOpenTime: string|null, nextOpenDay: string|null }}
 */
function isBranchOpen(branch) {
  if (!branch) {
    return { isOpen: false, reason: 'branch_not_found', nextOpenTime: null, nextOpenDay: null };
  }

  // 1. Check manual override
  if (branch.manualOverride === 'forceOpen') {
    return { isOpen: true, reason: 'manual_override', nextOpenTime: null, nextOpenDay: null };
  }
  if (branch.manualOverride === 'forceClosed') {
    return { isOpen: false, reason: 'manual_override', nextOpenTime: null, nextOpenDay: null };
  }

  // 2. Check operating hours (auto mode or no override)
  const operatingHours = branch.operatingHours || [];

  // No hours configured = always open (backward compatibility)
  if (operatingHours.length === 0) {
    return { isOpen: true, reason: 'no_schedule', nextOpenTime: null, nextOpenDay: null };
  }

  const timezone = branch.timezone || 'Africa/Cairo';
  const { dayName, timeStr } = getCurrentTimeInTimezone(timezone);

  // Find today's schedule
  const todaySchedule = operatingHours.find(h => h.day === dayName);

  // If today has no schedule entry, treat as closed for today
  if (!todaySchedule) {
    const next = findNextOpenSlot(operatingHours, dayName);
    return { isOpen: false, reason: 'no_schedule_today', ...next };
  }

  // If today is marked closed
  if (!todaySchedule.isOpen) {
    const next = findNextOpenSlot(operatingHours, dayName);
    return { isOpen: false, reason: 'day_closed', ...next };
  }

  // If open/close times not set, treat as open all day
  if (!todaySchedule.openTime || !todaySchedule.closeTime) {
    return { isOpen: true, reason: 'open_all_day', nextOpenTime: null, nextOpenDay: null };
  }

  // Check if current time is within open-close window
  const isAfterOpen = compareTime(timeStr, todaySchedule.openTime) >= 0;
  const isBeforeClose = compareTime(timeStr, todaySchedule.closeTime) < 0;

  if (isAfterOpen && isBeforeClose) {
    return { isOpen: true, reason: 'within_hours', nextOpenTime: null, nextOpenDay: null };
  }

  // Currently outside hours
  if (!isAfterOpen) {
    // Before opening time today
    return { isOpen: false, reason: 'before_open', nextOpenTime: todaySchedule.openTime, nextOpenDay: dayName };
  }

  // After closing time, find next open slot
  const next = findNextOpenSlot(operatingHours, dayName);
  return { isOpen: false, reason: 'after_close', ...next };
}

/**
 * Find the next open slot starting from the day AFTER the given day.
 * @param {Array} operatingHours
 * @param {string} currentDay
 * @returns {{ nextOpenTime: string|null, nextOpenDay: string|null }}
 */
function findNextOpenSlot(operatingHours, currentDay) {
  const currentIndex = DAY_NAMES.indexOf(currentDay);
  if (currentIndex === -1) return { nextOpenTime: null, nextOpenDay: null };

  for (let i = 1; i <= 7; i++) {
    const dayIndex = (currentIndex + i) % 7;
    const dayName = DAY_NAMES[dayIndex];
    const schedule = operatingHours.find(h => h.day === dayName);

    if (schedule && schedule.isOpen) {
      return {
        nextOpenTime: schedule.openTime || null,
        nextOpenDay: dayName,
      };
    }
  }

  return { nextOpenTime: null, nextOpenDay: null };
}

/**
 * Check if a chef is currently open for orders.
 * A chef is open if ANY of their active branches is open.
 * @param {string} chefId
 * @returns {{ isOpen: boolean, openBranches: Array, closedBranches: Array, nextOpenTime: string|null, nextOpenDay: string|null }}
 */
async function isChefOpen(chefId) {
  if (!chefId) {
    return { isOpen: false, openBranches: [], closedBranches: [], nextOpenTime: null, nextOpenDay: null };
  }

  const ChefBranch = mongoose.model('chefBranch');
  const branches = await ChefBranch.find({ chef: chefId, isActive: true })
    .select('branchName operatingHours timezone manualOverride')
    .lean();

  if (!branches || branches.length === 0) {
    // No branches = treat as open (backward compat, chef might not have set up branches yet)
    return { isOpen: true, openBranches: [], closedBranches: [], nextOpenTime: null, nextOpenDay: null };
  }

  const openBranches = [];
  const closedBranches = [];
  let earliestNextOpen = null;
  let earliestNextDay = null;

  for (const branch of branches) {
    const status = isBranchOpen(branch);
    const branchInfo = {
      branchId: branch._id,
      branchName: branch.branchName,
      ...status,
    };

    if (status.isOpen) {
      openBranches.push(branchInfo);
    } else {
      closedBranches.push(branchInfo);
      // Track earliest next open
      if (status.nextOpenTime && !earliestNextOpen) {
        earliestNextOpen = status.nextOpenTime;
        earliestNextDay = status.nextOpenDay;
      }
    }
  }

  return {
    isOpen: openBranches.length > 0,
    openBranches,
    closedBranches,
    nextOpenTime: openBranches.length > 0 ? null : earliestNextOpen,
    nextOpenDay: openBranches.length > 0 ? null : earliestNextDay,
  };
}

module.exports = {
  isBranchOpen,
  isChefOpen,
  findNextOpenSlot,
  getCurrentTimeInTimezone,
  compareTime,
  DAY_NAMES,
};
