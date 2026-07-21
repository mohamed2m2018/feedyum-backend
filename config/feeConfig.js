/**
 * Fee Configuration
 * Centralized config for all platform fees and delivery calculations.
 *
 * Business model:
 *   - Customer pays a tiered SERVICE FEE (5/8/12 EGP based on subtotal)
 *   - Chef pays a flat ORDER FEE (4 EGP per order, deducted from wallet)
 */

// Flat fee deducted from chef's wallet per confirmed order
const CHEF_ORDER_FEE = 4; // EGP

// Initial welcome credit given to new chef wallets
const INITIAL_WELCOME_CREDIT = 200; // EGP

// Grace period (in days) after wallet balance hits 0 before orders are blocked
const GRACE_PERIOD_DAYS = 2;

// Special promocode that waives the customer service fee entirely
const SERVICE_FEE_WAIVER_CODE = process.env.SERVICE_FEE_WAIVER_CODE || '';

// Tiered service fee charged to the customer (added on top of subtotal)
// Sorted ascending by maxSubtotal. fee is inclusive for subtotals <= maxSubtotal.
const SERVICE_FEE_TIERS = [
    { maxSubtotal: 200, fee: 5 },
    { maxSubtotal: 400, fee: 8 },
    { maxSubtotal: Infinity, fee: 12 },
];

const ARABIC_INDIC_DIGIT_MAP = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
};

const AREA_NAME_STOP_WORDS = [
    'المنطقة',
    'منطقة',
    'حي',
    'الحي',
    'مدينة',
    'المدينة',
    'مدينه',
    'المدينه',
    'district',
    'area',
    'مدينة',
    'مدينة',
    'شرق',
    'west',
    'east',
    'north',
    'south',
    'cairo',
    'giza',
    'alexandria',
    'governorate',
    'محافظة',
];

const AREA_ALIAS_GROUPS = [
    {
        key: 'cairo',
        aliases: [
            'القاهره',
            'القاهرة',
            'cairo',
            'cairo governorate',
            'new cairo',
            'new cairo city',
        ],
    },
    {
        key: 'giza',
        aliases: [
            'الجيزه',
            'الجيزة',
            'giza',
            'giza governorate',
        ],
    },
    {
        key: 'nasr_city',
        aliases: [
            'مدينه نصر',
            'مدينة نصر',
            'شرق مدينة نصر',
            'غرب مدينة نصر',
            'nasr city',
            'east nasr city',
            'west nasr city',
        ],
    },
    {
        key: 'october_6',
        aliases: [
            'مدينه 6 اكتوبر',
            'مدينة 6 أكتوبر',
            'مدينه ٦ اكتوبر',
            'مدينة ٦ أكتوبر',
            '6 october',
            '6th of october',
            'october city',
            '6 october city',
        ],
    },
];

const arabicToLatinNumeral = (value) =>
    String(value).replace(/[٠-٩]/g, (digit) => ARABIC_INDIC_DIGIT_MAP[digit] || digit);

const normalizeAreaName = (value) =>
    arabicToLatinNumeral((value || ''))
        .toLowerCase()
        .replace(/[إأآٱ]/g, 'ا')
        .replace(/ؤ|ي/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ـ/g, '') // tatweel
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const getAreaNameTokens = (value) => {
    return normalizeAreaName(value)
        .split(' ')
        .filter(Boolean)
        .filter(token => !AREA_NAME_STOP_WORDS.includes(token));
};

const normalizeAreaNameForMatch = (value) => getAreaNameTokens(value).join('');

const normalizeAreaNameForTokenMatch = (value) => {
    const normalized = getAreaNameTokens(value);
    if (normalized.length === 0) return [];
    return normalized;
};

const extractPreferredAreaSegments = (value) => {
    const raw = String(value || '')
        .split(/[،,]/)
        .map(segment => segment.trim())
        .filter(Boolean);

    if (raw.length === 0) return [];

    return [raw[0], ...raw.slice(1)];
};

const getCanonicalAreaKeys = (value) => {
    const segments = extractPreferredAreaSegments(value);
    if (segments.length === 0) return [];

    for (const segment of segments) {
        const normalizedSegment = normalizeAreaName(segment);
        if (!normalizedSegment) continue;

        const matches = AREA_ALIAS_GROUPS
            .filter(group => group.aliases.some(alias => normalizedSegment.includes(normalizeAreaName(alias))))
            .map(group => group.key);

        if (matches.length > 0) {
            return matches;
        }
    }

    return [];
};

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getPositiveDeliveryFees = (items = []) =>
    items
        .map(item => toFiniteNumber(item?.fee))
        .filter(fee => fee !== null && fee > 0);

const getMinimumPositiveDeliveryFee = (items = []) => {
    const fees = getPositiveDeliveryFees(items);
    return fees.length > 0 ? Math.min(...fees) : null;
};

const getSafePositiveDeliveryFee = ({ fallbackFee = 0, areaDeliveryFees = [], tiers = [] } = {}) => {
    const parsedFallbackFee = toFiniteNumber(fallbackFee);
    if (parsedFallbackFee !== null && parsedFallbackFee > 0) {
        return parsedFallbackFee;
    }

    const derivedPositiveFee = getMinimumPositiveDeliveryFee([
        ...areaDeliveryFees,
        ...tiers,
    ]);

    return derivedPositiveFee !== null ? derivedPositiveFee : 1;
};

const normalizeAreaDeliveryFees = (areaDeliveryFees = []) =>
    areaDeliveryFees.map(area => ({
        ...area,
        fee: getSafePositiveDeliveryFee({ fallbackFee: area?.fee }),
    }));

const normalizeDeliveryTiers = (tiers = []) =>
    tiers.map(tier => ({
        ...tier,
        fee: getSafePositiveDeliveryFee({ fallbackFee: tier?.fee }),
    }));

const destinationAreaNameMatches = (configuredName, destinationName) => {
    if (!configuredName || !destinationName) return false;

    const configuredCanonicalKeys = getCanonicalAreaKeys(configuredName);
    const destinationCanonicalKeys = getCanonicalAreaKeys(destinationName);

    if (
        configuredCanonicalKeys.length > 0 &&
        destinationCanonicalKeys.length > 0
    ) {
        return configuredCanonicalKeys.some(key => destinationCanonicalKeys.includes(key));
    }

    const configuredNormalized = normalizeAreaNameForTokenMatch(configuredName);
    const destinationNormalized = normalizeAreaNameForTokenMatch(destinationName);

    if (configuredNormalized.length === 0 || destinationNormalized.length === 0) {
        return normalizeAreaName(configuredName).includes(normalizeAreaName(destinationName));
    }

    // Try token overlap: require either exact single-token match, or partial overlap for multi-token names.
    const overlapCount = configuredNormalized.filter(configuredToken =>
        destinationNormalized.some(destinationToken =>
            configuredToken.includes(destinationToken) ||
            destinationToken.includes(configuredToken)
        )
    ).length;

    if (configuredNormalized.length === 1) {
        return overlapCount > 0;
    }

    if (overlapCount >= configuredNormalized.length) {
        return true;
    }

    const configuredFlat = normalizeAreaNameForMatch(configuredName);
    const destinationFlat = normalizeAreaNameForMatch(destinationName);

    return configuredFlat.includes(destinationFlat) || destinationFlat.includes(configuredFlat);
};

/**
 * Calculate customer service fee based on order subtotal.
 * Uses tiered brackets: ≤200 → 5, 200-400 → 8, >400 → 12.
 *
 * @param {number} subtotal - Order subtotal (before fees/discounts)
 * @returns {number} Service fee amount in EGP
 */
const calculateServiceFee = (subtotal) => {
    for (const tier of SERVICE_FEE_TIERS) {
        if (subtotal <= tier.maxSubtotal) {
            return tier.fee;
        }
    }
    // Fallback (should never reach here due to Infinity tier)
    return SERVICE_FEE_TIERS[SERVICE_FEE_TIERS.length - 1].fee;
};

/**
 * Check if a promocode is the special service fee waiver code.
 * @param {string} code - Promocode string to check
 * @returns {boolean}
 */
const isServiceFeeWaiverCode = (code) => {
    if (!code || !SERVICE_FEE_WAIVER_CODE) return false;
    return code.toUpperCase().trim() === SERVICE_FEE_WAIVER_CODE.toUpperCase().trim();
};

/**
 * Get the flat chef order fee.
 * @returns {number} Order fee in EGP
 */
const getChefOrderFee = () => CHEF_ORDER_FEE;

/**
 * Calculate delivery fee based on customer's delivery area, distance, and branch config.
 * Priority 1: Exact match on Area Address (placeId).
 * Priority 2: Fallback to legacy distance-based tiers.
 * Priority 3: Fallback flat fee.
 * 
 * @param {number} distance - Distance in km between branch and customer
 * @param {Array} tiers - Array of { maxDistance: Number, fee: Number } (deprecated)
 * @param {number} fallbackFee - Fallback fee if no tiers configured (default 0)
 * @param {Array} areaDeliveryFees - Array of { name, placeId, fee }
 * @param {string} destinationPlaceId - The placeId of the customer's delivery area
 * @param {string} destinationAreaName - The area name of the customer's delivery area
 * @returns {number} Delivery fee amount
 */
const calculateDeliveryFee = (distance, tiers, fallbackFee = 0, areaDeliveryFees = [], destinationPlaceId = null, destinationAreaName = null) => {
    const normalizedTiers = normalizeDeliveryTiers(tiers || []);
    const normalizedAreaDeliveryFees = normalizeAreaDeliveryFees(areaDeliveryFees || []);
    const safeFallbackFee = getSafePositiveDeliveryFee({
        fallbackFee,
        areaDeliveryFees: normalizedAreaDeliveryFees,
        tiers: normalizedTiers,
    });

    // 1. Try Area-Based Fee match first
    if (destinationPlaceId && normalizedAreaDeliveryFees.length > 0) {
        const areaMatch = normalizedAreaDeliveryFees.find(a => a.placeId === destinationPlaceId);
        if (areaMatch) {
            return getSafePositiveDeliveryFee({
                fallbackFee: areaMatch.fee,
                areaDeliveryFees: normalizedAreaDeliveryFees,
                tiers: normalizedTiers,
            });
        }
    }

    // 2. Fallback to area-name matching if placeId is unavailable/mismatched
    if (destinationAreaName && normalizedAreaDeliveryFees.length > 0) {
        const destinationMatch = normalizedAreaDeliveryFees.find(a => {
            return destinationAreaNameMatches(a.name, destinationAreaName);
        });
        if (destinationMatch) {
            return getSafePositiveDeliveryFee({
                fallbackFee: destinationMatch.fee,
                areaDeliveryFees: normalizedAreaDeliveryFees,
                tiers: normalizedTiers,
            });
        }
    }

    // 2. Fallback to distance-based tiers (legacy configuration)
    if (normalizedTiers.length === 0) {
        return safeFallbackFee;
    }

    // Sort tiers by maxDistance ascending
    const sortedTiers = [...normalizedTiers].sort((a, b) => a.maxDistance - b.maxDistance);

    // Find the first tier where distance fits
    for (const tier of sortedTiers) {
        if (distance <= tier.maxDistance) {
            return getSafePositiveDeliveryFee({
                fallbackFee: tier.fee,
                areaDeliveryFees: normalizedAreaDeliveryFees,
                tiers: normalizedTiers,
            });
        }
    }

    // If distance exceeds all tiers, return the highest tier's fee
    return getSafePositiveDeliveryFee({
        fallbackFee: sortedTiers[sortedTiers.length - 1].fee,
        areaDeliveryFees: normalizedAreaDeliveryFees,
        tiers: normalizedTiers,
    });
};

module.exports = {
    CHEF_ORDER_FEE,
    INITIAL_WELCOME_CREDIT,
    GRACE_PERIOD_DAYS,
    SERVICE_FEE_TIERS,
    SERVICE_FEE_WAIVER_CODE,
    calculateServiceFee,
    isServiceFeeWaiverCode,
    getChefOrderFee,
    getSafePositiveDeliveryFee,
    normalizeAreaDeliveryFees,
    normalizeDeliveryTiers,
    calculateDeliveryFee,
};
