/**
 * Country to IANA Timezone mapping.
 * Auto-detects timezone based on branch country (matches the country list in branchService.js).
 * Falls back to 'UTC' if country is not found.
 */

const COUNTRY_TIMEZONE_MAP = {
  'Egypt': 'Africa/Cairo',
  'United Kingdom': 'Europe/London',
  'United States': 'America/New_York',
  'Canada': 'America/Toronto',
  'Australia': 'Australia/Sydney',
  'France': 'Europe/Paris',
  'Germany': 'Europe/Berlin',
  'Spain': 'Europe/Madrid',
  'Italy': 'Europe/Rome',
  'India': 'Asia/Kolkata',
  'Japan': 'Asia/Tokyo',
  'China': 'Asia/Shanghai',
  'Brazil': 'America/Sao_Paulo',
  'Mexico': 'America/Mexico_City',
  'South Africa': 'Africa/Johannesburg',
  'UAE': 'Asia/Dubai',
  'Saudi Arabia': 'Asia/Riyadh',
};

/**
 * Get IANA timezone from country name.
 * @param {string} country
 * @returns {string} IANA timezone identifier
 */
function getTimezoneFromCountry(country) {
  if (!country) return 'Africa/Cairo'; // Default for missing country
  return COUNTRY_TIMEZONE_MAP[country] || 'UTC';
}

module.exports = { getTimezoneFromCountry, COUNTRY_TIMEZONE_MAP };
