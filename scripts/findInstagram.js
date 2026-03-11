/**
 * Instagram Finder — visible Chrome browser + Google Search
 * 
 * Opens a real Chrome window so Google doesn't block us.
 * You'll see the searches happening — just let it run.
 * 
 * Usage: node scripts/findInstagram.js
 * Auto-saves progress — safe to stop (Ctrl+C) and resume.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const puppeteer = require('puppeteer');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JSON_FILE = path.join(DATA_DIR, 'nasr_city_restaurants.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'instagram_progress.json');
const EXCEL_FILE = path.join(DATA_DIR, 'nasr_city_restaurants.xlsx');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay between 4-7 seconds (human-like)
function randomDelay() {
  return 4000 + Math.floor(Math.random() * 3000);
}

// ============================================================
// Extract from website field
// ============================================================

function extractInstagramFromWebsite(websiteUrl) {
  if (!websiteUrl) return null;
  const m = websiteUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  return m ? { url: `https://instagram.com/${m[1]}`, username: m[1] } : null;
}

// ============================================================
// Google Search via visible browser
// ============================================================

async function searchForInstagram(page, restaurantName) {
  const query = `${restaurantName} instagram`;

  // Use the Google search bar if we're already on Google
  const currentUrl = page.url();
  if (currentUrl.includes('google.com')) {
    // Clear and type in existing search bar
    const searchInput = await page.$('textarea[name="q"], input[name="q"]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 }); // Select all
      await sleep(200);
      await searchInput.type(query, { delay: 30 }); // Type like a human
      await sleep(300);
      await page.keyboard.press('Enter');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await sleep(1500);
    } else {
      // Fallback: navigate directly
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ar`, {
        waitUntil: 'domcontentloaded', timeout: 15000
      });
      await sleep(2000);
    }
  } else {
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ar`, {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await sleep(2000);
  }

  // Check for CAPTCHA
  const content = await page.content();
  if (content.includes('detected unusual traffic') || content.includes('recaptcha') || content.includes('captcha')) {
    throw new Error('CAPTCHA');
  }

  // Extract Instagram links from results
  const igData = await page.evaluate(() => {
    const skip = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'about',
                          'legal', 'developer', 'directory', 'direct', 'static', 'help',
                          'privacy', 'terms', 'api', 'press', 'blog', 'tags', 'nametag']);

    // Check all anchor links
    const links = document.querySelectorAll('a[href*="instagram.com"]');
    for (const link of links) {
      const href = link.href || '';
      const m = href.match(/instagram\.com\/([a-zA-Z0-9._]{2,30})\/?(\?|#|$)/);
      if (m && !skip.has(m[1].toLowerCase())) {
        return { url: `https://instagram.com/${m[1]}`, username: m[1] };
      }
    }

    // Check visible text too (Google sometimes shows URLs in snippets)
    const bodyText = document.body.innerText || '';
    const textMatch = bodyText.match(/(?:@|instagram\.com\/)([a-zA-Z0-9._]{2,30})/);
    if (textMatch && !skip.has(textMatch[1].toLowerCase())) {
      return { url: `https://instagram.com/${textMatch[1]}`, username: textMatch[1] };
    }

    return null;
  });

  return igData;
}

// ============================================================
// Handle Google consent page (cookie consent)
// ============================================================

async function handleGoogleConsent(page) {
  try {
    // Google consent page buttons
    const acceptButton = await page.$('button[id="L2AGLb"]');
    if (acceptButton) {
      await acceptButton.click();
      await sleep(2000);
      return;
    }
    // Alternative consent selectors
    const forms = await page.$$('form[action*="consent"]');
    if (forms.length > 0) {
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.includes('Accept') || text.includes('قبول') || text.includes('I agree') || text.includes('موافق')) {
          await btn.click();
          await sleep(2000);
          return;
        }
      }
    }
  } catch (e) {
    // No consent page, continue
  }
}

// ============================================================
// Update Excel
// ============================================================

function updateExcel(restaurants, progress) {
  const excelData = restaurants.map((r, i) => {
    const ig = progress[r.googlePlaceId] || {};
    return {
      '#': i + 1,
      'Instagram': ig.url || '',
      'IG Username': ig.username || '',
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
    };
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws['!cols'] = [
    { wch: 4 }, { wch: 35 }, { wch: 20 }, { wch: 30 }, { wch: 30 },
    { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 15 },
    { wch: 45 }, { wch: 45 }, { wch: 35 }, { wch: 50 }, { wch: 60 },
    { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 35 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nasr City Restaurants');
  XLSX.writeFile(wb, EXCEL_FILE);
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('📸 FeedYum Instagram Finder');
  console.log('===========================\n');

  if (!fs.existsSync(JSON_FILE)) {
    console.error(`❌ ${JSON_FILE} not found. Run discoverRestaurants.js first.`);
    process.exit(1);
  }

  const restaurants = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
  console.log(`📋 ${restaurants.length} restaurants loaded\n`);

  // Load progress
  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    console.log(`♻️  ${Object.keys(progress).length} already processed\n`);
  }

  // Phase 1: Website field extraction
  let fromWeb = 0;
  for (const r of restaurants) {
    if (progress[r.googlePlaceId]) continue;
    const ig = extractInstagramFromWebsite(r.website);
    if (ig) { progress[r.googlePlaceId] = ig; fromWeb++; }
  }
  if (fromWeb > 0) {
    console.log(`🔗 ${fromWeb} found from website field\n`);
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  }

  // Phase 2: Google Search
  const remaining = restaurants.filter(r => !progress[r.googlePlaceId]);
  if (remaining.length === 0) {
    console.log('✅ All done!\n');
    updateExcel(restaurants, progress);
    return;
  }

  console.log(`🔍 Searching for ${remaining.length} remaining...`);
  console.log('🖥️  Opening Chrome — don\'t close the window!\n');

  const browser = await puppeteer.launch({
    headless: false,  // VISIBLE browser — Google trusts this more
    args: [
      '--window-size=1280,900',
      '--disable-blink-features=AutomationControlled', // Hide automation flag
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // Set a real user agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  // Remove webdriver flag
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Go to Google first and handle consent
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await handleGoogleConsent(page);
  await sleep(1000);

  let found = 0;
  let count = 0;

  // Save progress on Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n💾 Saving progress before exit...');
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    updateExcel(restaurants, progress);
    const totalIG = Object.values(progress).filter(p => p.url).length;
    console.log(`   ${totalIG} Instagram accounts found so far.`);
    console.log('   Run again to continue.\n');
    process.exit(0);
  });

  for (const r of remaining) {
    count++;
    const name = r.nameArabic || r.nameEnglish;
    const tag = `[${count}/${remaining.length}]`;

    try {
      const ig = await searchForInstagram(page, name);

      if (ig) {
        progress[r.googlePlaceId] = ig;
        found++;
        console.log(`  ${tag} ✅ ${name} → @${ig.username}`);
      } else {
        progress[r.googlePlaceId] = { url: '', username: '' };
        console.log(`  ${tag} ⬜ ${name}`);
      }

      // Save every 5
      if (count % 5 === 0) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      }

      await sleep(randomDelay());

    } catch (error) {
      if (error.message === 'CAPTCHA') {
        console.log(`\n⚠️  CAPTCHA detected after ${count} searches.`);
        console.log('   ⏳ Waiting 60 seconds and retrying...\n');
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        await sleep(60000); // Wait 1 minute
        
        // Try to reload Google
        try {
          await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
          await sleep(3000);
          await handleGoogleConsent(page);
          // Retry this same restaurant
          count--;
          continue;
        } catch (e2) {
          console.log('   ❌ Still blocked. Progress saved. Run again later.\n');
          break;
        }
      }
      console.error(`  ${tag} ❌ ${name}: ${error.message}`);
      progress[r.googlePlaceId] = { url: '', username: '' };
      await sleep(8000);
    }
  }

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  await browser.close();

  // Update Excel
  console.log('\n📊 Updating Excel...');
  updateExcel(restaurants, progress);

  const totalIG = Object.values(progress).filter(p => p.url).length;
  console.log(`\n✅ Done! ${totalIG}/${restaurants.length} Instagram accounts found (${Math.round(totalIG / restaurants.length * 100)}%)\n`);
}

main().catch(e => { console.error('\n💥', e); process.exit(1); });
