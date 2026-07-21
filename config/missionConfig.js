const COMMISSION_GRACE_PERIOD_HOURS = 48;

const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 7;

const REFERRAL_CODE_PREFIX = 'FY';
const SCOUTING_ENABLED = process.env.SCOUTING_ENABLED === 'true';
const CLAIMS_ENABLED = SCOUTING_ENABLED && process.env.SCOUTING_CLAIMS_ENABLED === 'true';

const AMBASSADOR_LEVELS = {
  bronze: { threshold: 500, commissionBoost: 0 },
  silver: { threshold: 2000, commissionBoost: 1 },
  gold: { threshold: 10000, commissionBoost: 2 },
  platinum: { threshold: 50000, commissionBoost: 3 },
};

const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${REFERRAL_CODE_PREFIX}-${code}`;
};

const getAmbassadorLevel = (lifetimeEarnings) => {
  if (lifetimeEarnings >= AMBASSADOR_LEVELS.platinum.threshold) return 'platinum';
  if (lifetimeEarnings >= AMBASSADOR_LEVELS.gold.threshold) return 'gold';
  if (lifetimeEarnings >= AMBASSADOR_LEVELS.silver.threshold) return 'silver';
  if (lifetimeEarnings >= AMBASSADOR_LEVELS.bronze.threshold) return 'bronze';
  return 'none';
};

module.exports = {
  COMMISSION_GRACE_PERIOD_HOURS,
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  REFERRAL_CODE_PREFIX,
  AMBASSADOR_LEVELS,
  generateReferralCode,
  getAmbassadorLevel,
  SCOUTING_ENABLED,
  CLAIMS_ENABLED,
};
