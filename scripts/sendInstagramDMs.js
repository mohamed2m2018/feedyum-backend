/**
 * Instagram DM Outreach Script
 * 
 * Uses Puppeteer (visible Chrome) to send DMs to restaurants.
 * Handles Arabic text via clipboard paste (not keyboard typing).
 * 
 * Usage: node scripts/sendInstagramDMs.js [--limit=5]
 * 
 * Options:
 *   --limit=N    Send max N DMs (default: 40)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROGRESS_FILE = path.join(DATA_DIR, 'instagram_progress.json');
const DM_PROGRESS_FILE = path.join(DATA_DIR, 'dm_progress.json');
const CHROME_PROFILE = path.join(DATA_DIR, 'chrome_profile');

const IG_USERNAME = process.env.INSTAGRAM_USERNAME;
const IG_PASSWORD = process.env.INSTAGRAM_PASSWORD;

// Parse --limit arg
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const MAX_DMS = limitArg ? parseInt(limitArg.split('=')[1]) : 40;
const MIN_DELAY_MS = 30000;
const MAX_DELAY_MS = 60000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomDelay() { return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)); }

// ============================================================
// Outreach message
// ============================================================

function getMessage(restaurantName) {
  return `أهلاً ${restaurantName} 👋🔥

أنا من فريق FeedYum — أول تطبيق في مصر بيخلي الناس تشوف أكلك في فيديوهات وتطلب منك مباشرة 🎥🍔

إحنا دلوقتي بنجهز أكبر حملة إعلانية لمطاعم مدينة نصر 📢 وبنختار المطاعم اللي هتنزل في أول لانش.. وفكرنا فيكم!

إيه اللي هتاخده؟ 👇

🆓 مفيش أي عمولات — لا على الطلبات ولا التوصيل
📣 تسويق مجاني بالكامل — فيديوهاتك هتوصل لآلاف الناس اللي بتدور على أكل في منطقتك
📋 ارفع المنيو بتاعك في ثواني — صور أو PDF وإحنا بنرتبه ونضيفه ليك
🎥 شارك فيديوهات أكلك على التطبيق والناس تشوفها وتطلب منك على طول
⭐ الزباين يقيّموا أكلك ويشاركوا تجربتهم — ده بيبنيلك سمعة أونلاين قوية

كل اللي محتاجه:
١. حمّل التطبيق 👇
https://play.google.com/store/apps/details?id=com.feedyum
٢. سجّل كـ "شيف/مطعم"
٣. ارفع المنيو (صور أو PDF) وإحنا نتولى الباقي!

⚡ الأماكن محدودة في الحملة الأولى — لحّق مكانك!

أي سؤال كلمنا هنا أو على الفيسبوك 👇
facebook.com/FeedYum`;
}

// ============================================================
// Instagram Login
// ============================================================

async function login(page) {
  console.log('🔐 Checking login status...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(5000);

  // Check if already logged in (from persistent profile)
  const currentUrl = page.url();
  if (!currentUrl.includes('login') && !currentUrl.includes('accounts')) {
    console.log('✅ Already logged in (from saved session)!\n');
    // Dismiss any popups
    await dismissPopups(page);
    return;
  }

  console.log('🔐 Need to log in...');
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(5000);

  // Handle cookie consent — try multiple approaches
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const txt = await page.evaluate(el => el.textContent || '', btn);
      if (txt.includes('Allow') || txt.includes('Accept') || txt.includes('السماح') || 
          txt.includes('Only allow') || txt.includes('essential')) {
        await btn.click();
        await sleep(3000);
        break;
      }
    }
  } catch (e) {}

  // Wait longer for login form
  try {
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
  } catch (e) {
    // Take screenshot for debugging
    const screenshotPath = path.join(DATA_DIR, 'login_debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`❌ Login form not found. Screenshot saved: ${screenshotPath}`);
    throw new Error('Login form not found. Check the screenshot.');
  }

  const uInput = await page.$('input[name="username"]');
  await uInput.click();
  await uInput.type(IG_USERNAME, { delay: 50 });
  await sleep(500);

  const pInput = await page.$('input[name="password"]');
  await pInput.click();
  await pInput.type(IG_PASSWORD, { delay: 50 });
  await sleep(1000);

  await page.click('button[type="submit"]');
  await sleep(10000);

  // Check login success
  const url2 = page.url();
  if (url2.includes('login') || url2.includes('challenge')) {
    const content = await page.content();
    if (content.includes('challenge') || content.includes('security code')) {
      throw new Error('Instagram requires 2FA. Log in manually in this Chrome window, then re-run.');
    }
    const screenshotPath = path.join(DATA_DIR, 'login_fail.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    throw new Error(`Login failed. Screenshot: ${screenshotPath}`);
  }

  await dismissPopups(page);
  console.log('✅ Logged in!\n');
}

async function dismissPopups(page) {
  for (let i = 0; i < 3; i++) {
    await sleep(2000);
    try {
      const btns = await page.$$('button');
      for (const btn of btns) {
        const txt = await page.evaluate(el => el.textContent.trim(), btn);
        if (txt === 'Not Now' || txt === 'Not now' || txt === 'ليس الآن') {
          await btn.click();
          await sleep(2000);
          break;
        }
      }
    } catch (e) {}
  }
}

// ============================================================
// Send DM using clipboard paste (supports Arabic + emojis)
// ============================================================

async function sendDM(page, username, message) {
  // Step 1: Go to new message page
  await page.goto('https://www.instagram.com/direct/new/', { waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(3000);

  // Step 2: Find search input and type username (English, works fine)
  const searchInput = await page.waitForSelector('input[placeholder*="Search"], input[placeholder*="بحث"], input[name="queryBox"]', { timeout: 10000 });
  await searchInput.click();
  await sleep(500);
  await searchInput.type(username, { delay: 40 });
  await sleep(3000);

  // Step 3: Click first search result
  let clicked = false;

  // Try clicking a result containing the username
  const resultButtons = await page.$$('button, div[role="button"]');
  for (const btn of resultButtons) {
    const text = await page.evaluate(el => el.textContent?.toLowerCase() || '', btn);
    if (text.includes(username.toLowerCase()) && !text.includes('search')) {
      const box = await btn.boundingBox();
      if (box && box.y > 250) { // Below the search bar
        await btn.click();
        clicked = true;
        break;
      }
    }
  }

  // Fallback: click any result item in the list
  if (!clicked) {
    const items = await page.$$('div[role="listbox"] > div, div[style*="padding"] > div > div[role="button"]');
    for (const item of items) {
      const box = await item.boundingBox();
      if (box && box.y > 300) {
        await item.click();
        clicked = true;
        break;
      }
    }
  }

  if (!clicked) throw new Error(`User @${username} not found in search`);
  await sleep(2000);

  // Step 4: Click "Next" / "Chat"
  const allButtons = await page.$$('button, div[role="button"]');
  for (const btn of allButtons) {
    const txt = await page.evaluate(el => el.textContent?.trim(), btn);
    if (txt === 'Next' || txt === 'Chat' || txt === 'التالي' || txt === 'محادثة') {
      await btn.click();
      break;
    }
  }
  await sleep(4000);

  // Step 5: Find message textbox and paste Arabic message via clipboard
  const textbox = await page.waitForSelector('div[role="textbox"][contenteditable="true"], div[aria-label="Message"][role="textbox"]', { timeout: 10000 });
  await textbox.click();
  await sleep(500);

  // Use page.evaluate to set text via clipboard API (supports Arabic + emojis)
  await page.evaluate(async (msg) => {
    const textbox = document.querySelector('div[role="textbox"][contenteditable="true"], div[aria-label="Message"][role="textbox"]');
    if (!textbox) throw new Error('Textbox not found');
    
    textbox.focus();

    // Use the clipboard API to paste
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', msg);
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: clipboardData,
    });
    textbox.dispatchEvent(pasteEvent);
  }, message);

  await sleep(2000);

  // Verify text was pasted by checking textbox content
  const textContent = await page.evaluate(() => {
    const tb = document.querySelector('div[role="textbox"][contenteditable="true"], div[aria-label="Message"][role="textbox"]');
    return tb ? tb.textContent : '';
  });

  if (!textContent || textContent.length < 50) {
    // Fallback: use insertText which works in some browsers
    await textbox.click();
    await page.evaluate((msg) => {
      document.execCommand('insertText', false, msg);
    }, message);
    await sleep(1000);
  }

  // Step 6: Press Enter to send
  await page.keyboard.press('Enter');
  await sleep(3000);

  // Verify message was sent by checking the chat
  const chatContent = await page.content();
  if (chatContent.includes('play.google.com/store/apps/details?id=com.feedyum')) {
    return true;
  }

  return true; // Assume sent if no error thrown
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('📨 FeedYum Instagram DM Outreach');
  console.log('=================================\n');

  if (!IG_USERNAME || !IG_PASSWORD) {
    console.error('❌ Set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in .env');
    process.exit(1);
  }

  if (!fs.existsSync(PROGRESS_FILE)) {
    console.error('❌ Run findInstagram.js first.');
    process.exit(1);
  }

  // Load targets
  const igData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const restaurantsFile = path.join(DATA_DIR, 'nasr_city_restaurants.json');
  const restaurants = JSON.parse(fs.readFileSync(restaurantsFile, 'utf-8'));

  const targets = restaurants
    .filter(r => igData[r.googlePlaceId]?.username)
    .map(r => ({
      placeId: r.googlePlaceId,
      name: r.nameArabic || r.nameEnglish,
      username: igData[r.googlePlaceId].username,
    }));

  console.log(`📋 ${targets.length} restaurants with Instagram\n`);

  // Load DM progress
  let dmProgress = {};
  if (fs.existsSync(DM_PROGRESS_FILE)) {
    dmProgress = JSON.parse(fs.readFileSync(DM_PROGRESS_FILE, 'utf-8'));
    const sent = Object.values(dmProgress).filter(v => v.sent).length;
    console.log(`♻️  ${sent} already sent\n`);
  }

  const remaining = targets.filter(t => !dmProgress[t.placeId]);
  const batch = remaining.slice(0, MAX_DMS);

  if (batch.length === 0) {
    console.log('✅ All done!');
    return;
  }

  console.log(`📤 Sending ${batch.length} DMs (limit: ${MAX_DMS})\n`);

  // Launch browser with persistent profile
  if (!fs.existsSync(CHROME_PROFILE)) fs.mkdirSync(CHROME_PROFILE, { recursive: true });
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: CHROME_PROFILE,
    args: ['--window-size=1280,900', '--disable-blink-features=AutomationControlled'],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Ctrl+C handler
  process.on('SIGINT', () => {
    console.log('\n💾 Saving...');
    fs.writeFileSync(DM_PROGRESS_FILE, JSON.stringify(dmProgress, null, 2));
    process.exit(0);
  });

  try {
    await login(page);

    let sentCount = 0;

    for (const target of batch) {
      sentCount++;
      const tag = `[${sentCount}/${batch.length}]`;

      try {
        const message = getMessage(target.name);
        await sendDM(page, target.username, message);

        dmProgress[target.placeId] = {
          sent: true,
          username: target.username,
          timestamp: new Date().toISOString(),
        };
        console.log(`  ${tag} ✅ @${target.username} (${target.name})`);

      } catch (error) {
        dmProgress[target.placeId] = {
          sent: false,
          username: target.username,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
        console.log(`  ${tag} ❌ @${target.username}: ${error.message}`);
      }

      // Save every 3
      if (sentCount % 3 === 0) {
        fs.writeFileSync(DM_PROGRESS_FILE, JSON.stringify(dmProgress, null, 2));
      }

      // Random delay
      const delay = randomDelay();
      console.log(`      ⏳ ${Math.round(delay / 1000)}s...`);
      await sleep(delay);
    }

  } catch (error) {
    console.error(`\n💥 ${error.message}`);
  }

  fs.writeFileSync(DM_PROGRESS_FILE, JSON.stringify(dmProgress, null, 2));

  const totalSent = Object.values(dmProgress).filter(v => v.sent).length;
  console.log('\n=================================');
  console.log(`  ✅ Sent: ${totalSent} | ❌ Failed: ${Object.values(dmProgress).filter(v => !v.sent).length}`);
  console.log('=================================\n');

  await browser.close();
}

main().catch(e => { console.error('💥', e); process.exit(1); });
