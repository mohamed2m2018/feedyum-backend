const User = require('../../models/user');
const ChefBranch = require('../../models/chefBranch');

/**
 * GET /api/orders/available-slots/:chefId
 *
 * Returns available 30-min time slots for the next 7 days,
 * strictly within the chef's operating hours.
 * Only available if chef has allowScheduledOrders enabled.
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { chefId } = req.params;
    const days = Math.min(parseInt(req.query.days) || 7, 7); // Max 7 days

    // 1. Check chef exists
    const chef = await User.findById(chefId).select('type');
    if (!chef || chef.type !== 'chef') {
      return res.status(404).json({ success: false, message: 'Chef not found' });
    }

    // 2. Get active branches that allow scheduling
    const branches = await ChefBranch.find({
      chef: chefId,
      isActive: true,
      $or: [
        { allowScheduledOrders: true },
        { orderMode: { $in: ['scheduled', 'both'] } },
      ],
    })
      .select('operatingHours timezone manualOverride minLeadTime slotDuration orderMode')
      .lean();

    if (!branches.length) {
      return res.status(400).json({
        success: false,
        message: 'No active branches found',
        messageAr: 'لا توجد فروع نشطة',
      });
    }

    // 3. Merge operating hours from all branches
    // A time slot is available if ANY branch is open during that slot
    const mergedHours = mergeOperatingHours(branches);

    // 4. Generate slots for the next N days
    const now = new Date();
    const slots = {};
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    // Use max slotDuration from active branches (default 60 min)
    const SLOT_DURATION = Math.max(...branches.map(b => b.slotDuration || 60), 30);
    // Use the max minLeadTime from active branches (default 60 min)
    const MIN_ADVANCE_MINUTES = Math.max(...branches.map(b => b.minLeadTime || 60), 30);
    // If lead time is in full days (>= 1440 min), skip entire calendar days
    const SKIP_DAYS = MIN_ADVANCE_MINUTES >= 1440 ? Math.floor(MIN_ADVANCE_MINUTES / 1440) : 0;

    // Helper: format hour:min to 12h label
    const formatTime12 = (h, m) => {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    for (let d = 0; d < days; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);

      const dayKey = dayNames[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = d === 0 ? 'today' : d === 1 ? 'tomorrow' : dayKey;

      // Skip full calendar days if lead time is day-based
      if (d < SKIP_DAYS) continue;

      // Get operating windows for this day of week
      const windows = mergedHours[dayKey];
      if (!windows || windows.length === 0) continue;

      const daySlots = [];

      for (const window of windows) {
        if (!window.isOpen || !window.openTime || !window.closeTime) continue;

        const [openH, openM] = window.openTime.split(':').map(Number);
        const [closeH, closeM] = window.closeTime.split(':').map(Number);

        let slotH = openH;
        let slotM = openM;

        while (slotH < closeH || (slotH === closeH && slotM < closeM)) {
          // For today, filter past/too-early slots
          if (d === 0 || (d === SKIP_DAYS && SKIP_DAYS === 0)) {
            const slotTime = new Date(date);
            slotTime.setHours(slotH, slotM, 0, 0);
            const minTime = new Date(now.getTime() + (SKIP_DAYS > 0 ? 0 : MIN_ADVANCE_MINUTES) * 60000);
            if (slotTime <= minTime) {
              slotM += SLOT_DURATION;
              if (slotM >= 60) { slotH += Math.floor(slotM / 60); slotM = slotM % 60; }
              continue;
            }
          }

          const timeStr = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;

          // Calculate end time for range display
          let endH = slotH;
          let endM = slotM + SLOT_DURATION;
          if (endM >= 60) { endH += Math.floor(endM / 60); endM = endM % 60; }
          // Clamp end time to window close
          if (endH > closeH || (endH === closeH && endM > closeM)) {
            endH = closeH;
            endM = closeM;
          }
          const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

          // Build label: specific time for small slots, range for wider slots
          let label;
          if (SLOT_DURATION <= 30) {
            label = formatTime12(slotH, slotM);
          } else {
            label = `${formatTime12(slotH, slotM)} – ${formatTime12(endH, endM)}`;
          }

          daySlots.push({ time: timeStr, endTime: endTimeStr, label });

          slotM += SLOT_DURATION;
          if (slotM >= 60) { slotH += Math.floor(slotM / 60); slotM = slotM % 60; }
        }
      }

      if (daySlots.length > 0) {
        slots[dateStr] = {
          dayName: dayKey,
          dayLabel,
          slots: daySlots,
        };
      }
    }

    return res.json({
      success: true,
      chefId,
      slotDuration: SLOT_DURATION,
      slots,
    });

  } catch (error) {
    console.error('[getAvailableSlots] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots',
      error: error.message,
    });
  }
};

/**
 * Merge operating hours from multiple branches.
 * Returns { monday: [{ isOpen, openTime, closeTime }], ... }
 * A slot is available if ANY branch is open.
 */
function mergeOperatingHours(branches) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const merged = {};

  for (const day of dayNames) {
    const windows = [];

    for (const branch of branches) {
      // Force-closed branches are skipped entirely
      if (branch.manualOverride === 'forceClosed') continue;

      // Force-open branches count as having a full-day window
      if (branch.manualOverride === 'forceOpen') {
        windows.push({ isOpen: true, openTime: '00:00', closeTime: '23:59' });
        continue;
      }

      // Normal: check operating hours for this day
      const hours = (branch.operatingHours || []).find(h => h.day === day);
      if (hours && hours.isOpen && hours.openTime && hours.closeTime) {
        windows.push({ isOpen: true, openTime: hours.openTime, closeTime: hours.closeTime });
      }
    }

    merged[day] = windows;
  }

  return merged;
}

/**
 * Validate that a scheduled time falls within the chef's operating hours.
 * Used by createOrder to validate scheduling.
 */
async function validateScheduledSlot(chefId, scheduledDate) {
  // CRITICAL: Operating hours are stored in the branch's local timezone.
  // scheduledDate is a UTC Date object (parsed from ISO string).
  // We must extract hour, minute, and day-of-week in each branch's timezone.

  const branches = await ChefBranch.find({ chef: chefId, isActive: true })
    .select('operatingHours manualOverride timezone')
    .lean();

  if (!branches.length) return false;

  // Check if ANY branch is open at this day+time (in the branch's own timezone)
  for (const branch of branches) {
    if (branch.manualOverride === 'forceClosed') continue;
    if (branch.manualOverride === 'forceOpen') return true;

    const tz = branch.timezone || 'Africa/Cairo';

    // Extract local hour, minute, and day in the branch's timezone
    const localParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(scheduledDate);

    const localHour = parseInt(localParts.find(p => p.type === 'hour')?.value || '0', 10);
    const localMinute = parseInt(localParts.find(p => p.type === 'minute')?.value || '0', 10);
    const h = localHour === 24 ? 0 : localHour;
    const timeStr = `${String(h).padStart(2, '0')}:${String(localMinute).padStart(2, '0')}`;

    const dayKey = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' })
      .format(scheduledDate).toLowerCase();

    console.log(`[validateScheduledSlot] UTC: ${scheduledDate.toISOString()} → Branch TZ (${tz}): ${dayKey} ${timeStr}`);

    const hours = (branch.operatingHours || []).find(h => h.day === dayKey);
    if (hours && hours.isOpen && hours.openTime && hours.closeTime) {
      if (timeStr >= hours.openTime && timeStr <= hours.closeTime) {
        return true;
      }
    }
  }

  return false;
}

module.exports = getAvailableSlots;
module.exports.validateScheduledSlot = validateScheduledSlot;
