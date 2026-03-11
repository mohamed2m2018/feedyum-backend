/**
 * Restaurant Discovery Script for Nasr City
 * 
 * Uses Google Places API (New) to find restaurants in Nasr City, Cairo
 * and exports them to an Excel file with all available data.
 * 
 * Usage: node scripts/discoverRestaurants.js
 * 
 * Prerequisites:
 * - GOOGLE_MAPS_API_KEY in .env with Places API (New) enabled
 * - npm install xlsx (run once)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY not found in .env');
  process.exit(1);
}

// ============================================================
// Configuration
// ============================================================

// Nasr City bounding box (approximate)
const NASR_CITY = {
  centerLat: 30.0511,
  centerLng: 31.3456,
  // Grid parameters
  latMin: 30.035,
  latMax: 30.070,
  lngMin: 31.320,
  lngMax: 31.375,
  stepKm: 0.4,       // 400m between grid points
  radiusM: 500,       // 500m search radius per point
};

const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const EXCEL_FILE = path.join(OUTPUT_DIR, 'nasr_city_restaurants.xlsx');
const JSON_FILE = path.join(OUTPUT_DIR, 'nasr_city_restaurants.json');

// Rate limiting
const DELAY_BETWEEN_SEARCHES = 200;  // ms
const DELAY_BETWEEN_DETAILS = 150;   // ms

// ============================================================
// Helpers
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Convert km to degrees (approximate for Egypt's latitude)
function kmToDegLat(km) { return km / 111.0; }
function kmToDegLng(km) { return km / (111.0 * Math.cos(30.05 * Math.PI / 180)); }

// Generate grid points covering Nasr City
function generateGridPoints() {
  const points = [];
  const latStep = kmToDegLat(NASR_CITY.stepKm);
  const lngStep = kmToDegLng(NASR_CITY.stepKm);

  for (let lat = NASR_CITY.latMin; lat <= NASR_CITY.latMax; lat += latStep) {
    for (let lng = NASR_CITY.lngMin; lng <= NASR_CITY.lngMax; lng += lngStep) {
      points.push({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
    }
  }
  return points;
}

// ============================================================
// Google Places API (New) calls
// ============================================================

async function textSearch(query, lat, lng, radiusM, pageToken = null) {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusM,
      }
    },
    maxResultCount: 20,
    languageCode: 'ar',
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.regularOpeningHours',
    'places.types',
    'places.primaryType',
    'places.businessStatus',
  ].join(',');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Text Search failed (${response.status}): ${error}`);
  }

  return response.json();
}

async function getPlaceDetailsEnglish(placeId) {
  const fieldMask = [
    'id',
    'displayName',
    'formattedAddress',
  ].join(',');

  const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': fieldMask,
    },
  });

  if (!response.ok) {
    return null; // Graceful fallback
  }

  return response.json();
}

// ============================================================
// Operating hours formatter
// ============================================================

function formatOpeningHours(hours) {
  if (!hours?.weekdayDescriptions) return '';
  return hours.weekdayDescriptions.join(' | ');
}

function formatOpeningHoursStructured(hours) {
  if (!hours?.periods) return null;
  return hours.periods.map(p => ({
    day: p.open?.day,
    openTime: p.open?.hour !== undefined ? `${String(p.open.hour).padStart(2, '0')}:${String(p.open.minute || 0).padStart(2, '0')}` : '',
    closeTime: p.close?.hour !== undefined ? `${String(p.close.hour).padStart(2, '0')}:${String(p.close.minute || 0).padStart(2, '0')}` : '',
  }));
}

// ============================================================
// Phone number formatting for WhatsApp
// ============================================================

function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let digits = phone.replace(/[^\d+]/g, '');
  
  // Handle Egyptian numbers
  if (digits.startsWith('+2')) {
    digits = digits.substring(1); // Remove +, keep 2
  } else if (digits.startsWith('02')) {
    digits = '2' + digits.substring(1); // 02xxx -> 20xxx? No, landline
  } else if (digits.startsWith('01')) {
    digits = '20' + digits.substring(1); // 01xxx -> 201xxx
  } else if (digits.startsWith('2')) {
    // Already in international format without +
  }
  
  // Remove the + if present
  digits = digits.replace('+', '');
  
  return digits;
}

// ============================================================
// Main discovery logic
// ============================================================

async function discoverRestaurants() {
  console.log('🔍 FeedYum Restaurant Discovery - Nasr City');
  console.log('============================================\n');

  const gridPoints = generateGridPoints();
  console.log(`📍 Generated ${gridPoints.length} grid points covering Nasr City\n`);

  const allPlaces = new Map(); // placeId -> placeData (dedup)
  let searchCount = 0;
  let totalApiCalls = 0;

  // Phase 1: Text Search across grid
  console.log('📡 Phase 1: Searching for restaurants...\n');

  for (let i = 0; i < gridPoints.length; i++) {
    const point = gridPoints[i];
    const progress = `[${i + 1}/${gridPoints.length}]`;

    try {
      // Search for restaurants
      let result = await textSearch('مطعم', point.lat, point.lng, NASR_CITY.radiusM);
      totalApiCalls++;

      const places = result.places || [];
      let newCount = 0;

      for (const place of places) {
        if (!allPlaces.has(place.id)) {
          allPlaces.set(place.id, place);
          newCount++;
        }
      }

      // Follow pagination
      let pageNum = 1;
      while (result.nextPageToken && pageNum < 3) {
        await sleep(DELAY_BETWEEN_SEARCHES);
        result = await textSearch('مطعم', point.lat, point.lng, NASR_CITY.radiusM, result.nextPageToken);
        totalApiCalls++;
        pageNum++;

        for (const place of (result.places || [])) {
          if (!allPlaces.has(place.id)) {
            allPlaces.set(place.id, place);
            newCount++;
          }
        }
      }

      if (newCount > 0) {
        console.log(`  ${progress} (${point.lat}, ${point.lng}) → +${newCount} new (Total: ${allPlaces.size})`);
      }

      searchCount++;
      await sleep(DELAY_BETWEEN_SEARCHES);

    } catch (error) {
      console.error(`  ${progress} ❌ Error at (${point.lat}, ${point.lng}): ${error.message}`);
      await sleep(1000); // Back off on error
    }
  }

  console.log(`\n✅ Phase 1 complete: Found ${allPlaces.size} unique restaurants in ${searchCount} searches (${totalApiCalls} API calls)\n`);

  // Phase 2: Get English names for all restaurants
  console.log('🌐 Phase 2: Fetching English names...\n');

  const restaurants = [];
  let detailCount = 0;

  for (const [placeId, place] of allPlaces) {
    detailCount++;
    const progress = `[${detailCount}/${allPlaces.size}]`;

    try {
      // Get English name
      const enDetails = await getPlaceDetailsEnglish(placeId);
      totalApiCalls++;

      const nameArabic = place.displayName?.text || '';
      const nameEnglish = enDetails?.displayName?.text || nameArabic;
      const addressArabic = place.formattedAddress || '';
      const addressEnglish = enDetails?.formattedAddress || addressArabic;

      const restaurant = {
        googlePlaceId: placeId,
        nameArabic,
        nameEnglish,
        addressArabic,
        addressEnglish,
        lat: place.location?.latitude || '',
        lng: place.location?.longitude || '',
        rating: place.rating || '',
        totalReviews: place.userRatingCount || 0,
        phone: place.nationalPhoneNumber || '',
        internationalPhone: place.internationalPhoneNumber || '',
        whatsappPhone: formatPhoneForWhatsApp(place.internationalPhoneNumber || place.nationalPhoneNumber),
        website: place.websiteUri || '',
        googleMapsUrl: place.googleMapsUri || '',
        openingHours: formatOpeningHours(place.regularOpeningHours),
        businessStatus: place.businessStatus || '',
        type: place.primaryType || '',
        types: (place.types || []).join(', '),
      };

      restaurants.push(restaurant);

      if (detailCount % 50 === 0) {
        console.log(`  ${progress} Processing... (${nameArabic})`);
      }

      await sleep(DELAY_BETWEEN_DETAILS);

    } catch (error) {
      console.error(`  ${progress} ❌ Error for ${placeId}: ${error.message}`);
      // Still add with Arabic-only data
      const place2 = allPlaces.get(placeId);
      restaurants.push({
        googlePlaceId: placeId,
        nameArabic: place2.displayName?.text || '',
        nameEnglish: '',
        addressArabic: place2.formattedAddress || '',
        addressEnglish: '',
        lat: place2.location?.latitude || '',
        lng: place2.location?.longitude || '',
        rating: place2.rating || '',
        totalReviews: place2.userRatingCount || 0,
        phone: place2.nationalPhoneNumber || '',
        internationalPhone: place2.internationalPhoneNumber || '',
        whatsappPhone: formatPhoneForWhatsApp(place2.internationalPhoneNumber || place2.nationalPhoneNumber),
        website: place2.websiteUri || '',
        googleMapsUrl: place2.googleMapsUri || '',
        openingHours: formatOpeningHours(place2.regularOpeningHours),
        businessStatus: place2.businessStatus || '',
        type: place2.primaryType || '',
        types: (place2.types || []).join(', '),
      });
      await sleep(500);
    }
  }

  // Sort by rating (highest first), then by review count
  restaurants.sort((a, b) => {
    if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
    return (b.totalReviews || 0) - (a.totalReviews || 0);
  });

  // Phase 3: Export
  console.log('\n📊 Phase 3: Exporting data...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Export Excel
  const excelData = restaurants.map((r, i) => ({
    '#': i + 1,
    'الاسم بالعربي': r.nameArabic,
    'Name (English)': r.nameEnglish,
    'Rating ⭐': r.rating,
    'Reviews': r.totalReviews,
    'Phone': r.phone,
    'International Phone': r.internationalPhone,
    'WhatsApp Number': r.whatsappPhone,
    'العنوان بالعربي': r.addressArabic,
    'Address (English)': r.addressEnglish,
    'Website': r.website,
    'Google Maps': r.googleMapsUrl,
    'Opening Hours': r.openingHours,
    'Business Status': r.businessStatus,
    'Type': r.type,
    'Lat': r.lat,
    'Lng': r.lng,
    'Google Place ID': r.googlePlaceId,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 4 },   // #
    { wch: 30 },  // Arabic name
    { wch: 30 },  // English name
    { wch: 8 },   // Rating
    { wch: 8 },   // Reviews
    { wch: 18 },  // Phone
    { wch: 18 },  // Int'l Phone
    { wch: 15 },  // WhatsApp
    { wch: 45 },  // Arabic address
    { wch: 45 },  // English address
    { wch: 35 },  // Website
    { wch: 50 },  // Google Maps
    { wch: 60 },  // Hours
    { wch: 15 },  // Status
    { wch: 20 },  // Type
    { wch: 10 },  // Lat
    { wch: 10 },  // Lng
    { wch: 35 },  // Place ID
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Nasr City Restaurants');
  XLSX.writeFile(workbook, EXCEL_FILE);
  console.log(`  ✅ Excel: ${EXCEL_FILE}`);

  // Export JSON (for the outreach script)
  fs.writeFileSync(JSON_FILE, JSON.stringify(restaurants, null, 2));
  console.log(`  ✅ JSON: ${JSON_FILE}`);

  // Summary
  const withPhone = restaurants.filter(r => r.phone).length;
  const withWebsite = restaurants.filter(r => r.website).length;
  const withWhatsApp = restaurants.filter(r => r.whatsappPhone).length;
  const operational = restaurants.filter(r => r.businessStatus === 'OPERATIONAL').length;

  console.log('\n============================================');
  console.log('📋 SUMMARY');
  console.log('============================================');
  console.log(`  Total restaurants found:    ${restaurants.length}`);
  console.log(`  With phone number:          ${withPhone} (${Math.round(withPhone / restaurants.length * 100)}%)`);
  console.log(`  With WhatsApp-ready phone:  ${withWhatsApp}`);
  console.log(`  With website:               ${withWebsite}`);
  console.log(`  Operational:                ${operational}`);
  console.log(`  Total API calls made:       ${totalApiCalls}`);
  console.log(`\n  📁 Files saved to: ${OUTPUT_DIR}/`);
  console.log('============================================\n');
}

// ============================================================
// Run
// ============================================================

discoverRestaurants().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
