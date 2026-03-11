/**
 * Instagram DM Outreach — Stagehand AI Agent
 * 
 * Login: act() with variables (keeps credentials private)
 * DMs:   CUA agent (fully autonomous visual navigation)
 * 
 * Usage: node scripts/sendInstagramDMs.mjs [--limit=1]
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Stagehand } from '@browserbasehq/stagehand';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROGRESS_FILE = path.join(DATA_DIR, 'instagram_progress.json');
const DM_PROGRESS_FILE = path.join(DATA_DIR, 'dm_progress.json');
const RESTAURANTS_FILE = path.join(DATA_DIR, 'nasr_city_restaurants.json');

const IG_USERNAME = process.env.INSTAGRAM_USERNAME;
const IG_PASSWORD = process.env.INSTAGRAM_PASSWORD;

const limitArg = process.argv.find(a => a.startsWith('--limit='));
const MAX_DMS = limitArg ? parseInt(limitArg.split('=')[1]) : 40;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomDelay() { return 90000 + Math.floor(Math.random() * 90000); } // 1.5-3 min

// ============================================================
// The outreach message
// ============================================================

const OUTREACH_MESSAGE = `مساء الخير 👋🔥

أنا من تيم FeedYum — أول منصة ريلز وصور أكل في مصر بتحوّل الريلز والصور بتاعتكم لـ طلبات حقيقية مباشرة 🎥🍔

إحنا دلوقتي بنجهز أكبر حملة لمطاعم وشيفات مدينة نصر 📢 وبنختار أماكن محدودة تنزل في أول لانش — وشفنا شغلكم وعجبنا!

إيه اللي هتاخدوه؟ 👇

🆓 تسويق ودعايا مجاناً — إحنا بنشيل التكلفة عنكم
📱 ريلز وصور أكلكم هتوصل لآلاف الناس في منطقتكم
💰 فلوسكم كاش في إيدكم — بدون عمولات في البداية
📋 ارفعوا المنيو في ثواني — صور أو PDF
⭐ تقييمات العملاء بتبنيلكم سمعة قوية

إزاي بيشتغل؟ 🤔

🎁 قدّموا خصم ترحيبي بسيط حصري لعملاء التطبيق
ده بيشجّعهم يجرّبوا أكلكم ويرجعولكم كعملاء دايمين
📣 وإحنا بنتكفل بكل الدعايا عشان نجيبلكم العملاء دول

يعني: الدعايا علينا + مبيعات أكتر + فلوسكم كاش 🤝

حمّلوا التطبيق وسجّلوا 👇
https://play.google.com/store/apps/details?id=com.feedyum

⚡ الأماكن محدودة — الحّقوا مكانكم!`;

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('📨 FeedYum Instagram DM Outreach (Stagehand AI)');
  console.log('=================================================\n');

  if (!IG_USERNAME || !IG_PASSWORD) {
    console.error('❌ Set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in .env');
    process.exit(1);
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('❌ Set GOOGLE_GENERATIVE_AI_API_KEY in .env');
    process.exit(1);
  }

  // Load data
  const igData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const restaurants = JSON.parse(fs.readFileSync(RESTAURANTS_FILE, 'utf-8'));

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
    if (sent > 0) console.log(`♻️  ${sent} already sent\n`);
  }

  const remaining = targets.filter(t => !dmProgress[t.placeId]);
  const batch = remaining.slice(0, MAX_DMS);

  if (batch.length === 0) {
    console.log('✅ All DMs already sent!');
    return;
  }

  console.log(`📤 Sending ${batch.length} DMs (limit: ${MAX_DMS})\n`);

  // Initialize Stagehand
  console.log('🤖 Starting Stagehand...\n');
  const stagehand = new Stagehand({
    env: 'LOCAL',
    model: 'google/gemini-2.5-flash',
    headless: false,
    enableCaching: true,
    verbose: 1,
  });

  await stagehand.init();
  const page = stagehand.context.pages()[0];

  // Ctrl+C handler
  process.on('SIGINT', () => {
    console.log('\n💾 Saving progress...');
    fs.writeFileSync(DM_PROGRESS_FILE, JSON.stringify(dmProgress, null, 2));
    stagehand.close().catch(() => {});
    process.exit(0);
  });

  try {
    // ====== STEP 1: LOGIN ======
    console.log('🔐 Logging into Instagram...');
    await page.goto('https://www.instagram.com/accounts/login/');
    await sleep(4000);

    await stagehand.act('type %username% into the username field', {
      variables: { username: IG_USERNAME },
    });
    await stagehand.act('type %password% into the password field', {
      variables: { password: IG_PASSWORD },
    });
    await stagehand.act('click the Log In button');
    await sleep(8000);

    // Dismiss popups
    try { await stagehand.act('click "Not Now" if there is a popup', { timeout: 5000 }); } catch (e) {}
    await sleep(2000);
    try { await stagehand.act('click "Not Now" if there is a popup', { timeout: 5000 }); } catch (e) {}

    console.log('✅ Logged in!\n');
    let sentCount = 0;

    for (const target of batch) {
      sentCount++;
      const tag = `[${sentCount}/${batch.length}]`;

      try {
        // Navigate to new DM page
        await page.goto('https://www.instagram.com/direct/new/');
        await sleep(3000);

        // Create CUA agent — it sees the screen and acts like a human
        const dmAgent = stagehand.agent({
          mode: 'cua',
          model: 'google/gemini-2.5-computer-use-preview-10-2025',
          systemPrompt: 'You are helping send an Instagram DM. You can see the screen and interact with it.',
        });

        // STEP A: CUA agent handles NAVIGATION only (finding user, opening chat)
        const navResult = await dmAgent.execute({
          instruction: `You are on Instagram's "New Message" page. Navigate to a chat with the user "${target.username}". Follow these steps:

1. Find the search/recipient field and click on it
2. Type "${target.username}" in the search field
3. Wait for search results to load (2-3 seconds)
4. Click on the first matching result
5. If you see a "Next" or "Chat" button, click it
6. You should now see the chat/message window with "Message..." input at the bottom
7. Click on the message input field at the bottom to focus it
8. STOP HERE. Do NOT type any message. Just make sure the message input field is focused and ready for typing.

IMPORTANT: Do NOT type any message text. Only navigate to the chat and click the message input field.`,
          maxSteps: 15,
        });

        if (!navResult.completed) {
          throw new Error('Navigation failed: ' + (navResult.message || 'unknown'));
        }

        await sleep(1000);

        // STEP B: Type message line-by-line using confirmed Stagehand APIs:
        // - locator.type(text) → CDP Input.insertText (from locator.d.ts:137)
        // - page.keyPress('Shift+Enter') → keyDown+keyUp with modifier (from page.d.ts:318)

        const msgInput = page.locator('div[role="textbox"]');
        await msgInput.click();
        await sleep(500);

        const lines = OUTREACH_MESSAGE.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]) {
            await msgInput.type(lines[i]);
          }
          if (i < lines.length - 1) {
            // Shift+Enter = new line without sending (page.keyPress supports combos)
            await page.keyPress('Shift+Enter');
          }
        }

        await sleep(2000);

        // Verify text was actually typed
        const textLength = await page.evaluate(() => {
          const tb = document.querySelector('div[role="textbox"]');
          return tb ? tb.textContent.length : 0;
        });

        if (textLength < 50) {
          throw new Error(`Message text not inserted (only ${textLength} chars)`);
        }

        // STEP C: Send the message (page.keyPress confirmed in page.d.ts:318)
        await page.keyPress('Enter');
        await sleep(3000);

        // Verify via CUA agent
        const verifyAgent = stagehand.agent({
          mode: 'cua',
          model: 'google/gemini-2.5-computer-use-preview-10-2025',
        });
        const verifyResult = await verifyAgent.execute({
          instruction: 'Look at the chat. Has a message been sent successfully? Check if you can see the sent message in the chat window. Just confirm and stop.',
          maxSteps: 3,
        });

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
          error: error.message?.slice(0, 150),
          timestamp: new Date().toISOString(),
        };
        console.log(`  ${tag} ❌ @${target.username}: ${error.message?.slice(0, 100)}`);
      }

      // Save every 3
      if (sentCount % 3 === 0) {
        fs.writeFileSync(DM_PROGRESS_FILE, JSON.stringify(dmProgress, null, 2));
      }

      // Random delay
      if (sentCount < batch.length) {
        const delay = randomDelay();
        console.log(`      ⏳ ${Math.round(delay / 1000)}s...`);
        await sleep(delay);
      }
    }

  } catch (error) {
    console.error(`\n💥 ${error.message}`);
  }

  // Save and close
  fs.writeFileSync(DM_PROGRESS_FILE, JSON.stringify(dmProgress, null, 2));

  const totalSent = Object.values(dmProgress).filter(v => v.sent).length;
  const totalFailed = Object.values(dmProgress).filter(v => v.sent === false).length;
  console.log('\n=================================================');
  console.log(`  ✅ Sent: ${totalSent} | ❌ Failed: ${totalFailed} | 📬 Remaining: ${targets.length - totalSent - totalFailed}`);
  console.log('=================================================\n');

  await stagehand.close();
}

main().catch(e => { console.error('💥', e); process.exit(1); });
