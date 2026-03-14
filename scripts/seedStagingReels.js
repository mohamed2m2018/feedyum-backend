/**
 * Seed Staging Reels
 * ------------------
 * Connects to the STAGING MongoDB and seeds realistic food reels
 * for the test chef account. Uses Pexels API to fetch real food videos,
 * uploads them to R2 (staging/ prefix), and creates stories.
 *
 * Usage: node scripts/seedStagingReels.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const { uploadToR2 } = require('../utils/r2Client');

// ── Config ─────────────────────────────────────────────────────
const STAGING_URI = process.env.MONGO_URI_STAGING;
if (!STAGING_URI) {
  console.error('❌ MONGO_URI_STAGING not set in .env');
  process.exit(1);
}

// ── Reel content definitions ──────────────────────────────────
// We'll search for these on Pexels API and pick the first HD video result
const REEL_CONTENT = [
  {
    query: 'cooking meat grill restaurant',
    caption: 'شاورما طازة على الفحم 🔥 Fresh shawarma on the grill',
    title: 'شاورما الفحم',
  },
  {
    query: 'pizza making chef kitchen',
    caption: 'بيتزا إيطالية أصلية 🍕 Authentic Italian pizza',
    title: 'بيتزا إيطالية',
  },
  {
    query: 'burger food preparation close up',
    caption: 'برجر لحم واجيو فاخر 🍔 Premium wagyu beef burger',
    title: 'برجر واجيو',
  },
  {
    query: 'sushi chef preparing japanese food',
    caption: 'سوشي طازج يتحضر قدامك 🍣 Fresh sushi prepared in front of you',
    title: 'سوشي طازج',
  },
  {
    query: 'steak grilling restaurant kitchen',
    caption: 'ستيك مشوي على درجة حرارة مثالية 🥩 Perfectly grilled steak',
    title: 'ستيك مشوي',
  },
  {
    query: 'pasta cooking cream sauce italian',
    caption: 'باستا كريمية بالجبنة 🍝 Creamy cheese pasta',
    title: 'باستا كريمية',
  },
];

// ── Helpers ────────────────────────────────────────────────────

/**
 * Make an HTTPS request and return the response body as a string/buffer
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'FeedYum-Seeder/1.0',
        ...options.headers,
      },
    };

    const req = https.request(reqOptions, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location;
        console.log(`  ↪ Redirect → ${redirectUrl.substring(0, 80)}...`);
        return httpsRequest(redirectUrl, options).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        if (options.raw) {
          resolve(Buffer.concat(chunks));
        } else {
          resolve(Buffer.concat(chunks).toString('utf-8'));
        }
      });
      response.on('error', reject);
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Search Pexels API for a video and return the best video file URL + poster
 */
async function searchPexelsVideo(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  
  // Build search URL — prefer portrait/vertical orientation for reels
  const searchUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`;
  
  const responseStr = await httpsRequest(searchUrl, {
    headers: { Authorization: apiKey },
  });
  
  const data = JSON.parse(responseStr);
  
  if (!data.videos || data.videos.length === 0) {
    // Fallback: try without orientation filter
    const fallbackUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3`;
    const fallbackStr = await httpsRequest(fallbackUrl, {
      headers: { Authorization: apiKey },
    });
    const fallbackData = JSON.parse(fallbackStr);
    
    if (!fallbackData.videos || fallbackData.videos.length === 0) {
      throw new Error(`No videos found for query: "${query}"`);
    }
    
    return pickBestVideo(fallbackData.videos[0]);
  }
  
  return pickBestVideo(data.videos[0]);
}

/**
 * Pick the best video file from a Pexels video object
 * Prefer SD quality (smaller files) with portrait orientation
 */
function pickBestVideo(video) {
  const files = video.video_files || [];
  
  // Prefer SD quality (around 360-480p) for smaller file size
  // Sort by height ascending, pick smallest that's >= 360p
  const sorted = files
    .filter(f => f.height && f.width)
    .sort((a, b) => a.height - b.height);
  
  // Pick the one closest to 480p
  let best = sorted.find(f => f.height >= 360 && f.height <= 720) || sorted[0];
  
  if (!best) {
    throw new Error(`No suitable video file for video ${video.id}`);
  }
  
  // Get poster from video pictures
  const poster = video.video_pictures?.[0]?.picture || video.image;
  
  return {
    videoUrl: best.link,
    posterUrl: poster,
    width: best.width,
    height: best.height,
    quality: best.quality,
  };
}

/**
 * Download a file (video/image) as a Buffer
 */
async function downloadBuffer(url) {
  return httpsRequest(url, { raw: true });
}

/**
 * Upload a buffer to R2 and return the CDN URL
 */
async function uploadMediaToR2(buffer, folder, extension, contentType) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const key = `${folder}/seed_chef/${timestamp}_${random}.${extension}`;

  const result = await uploadToR2({
    key,
    body: buffer,
    contentType,
  });

  console.log(`  ✅ Uploaded to R2: ${result.url}`);
  return result.url;
}

// ── Main seed function ────────────────────────────────────────
async function seedStagingReels() {
  // Check for Pexels API key
  if (!process.env.PEXELS_API_KEY) {
    console.error('❌ PEXELS_API_KEY not set.');
    console.error('   Get a free API key at https://www.pexels.com/api/');
    console.error('   Then add PEXELS_API_KEY=your_key_here to your .env file');
    process.exit(1);
  }
  
  console.log('🔗 Connecting to STAGING MongoDB...');
  await mongoose.connect(STAGING_URI);
  console.log('✅ Connected to staging DB');

  // Load models
  require('../models/loadModels');
  const User = mongoose.model('user');
  const Story = mongoose.model('story');
  const Category = mongoose.model('category');
  const Menu = mongoose.model('menu');
  const Dish = mongoose.model('dish');
  const Section = mongoose.model('section');

  // ── Step 1: Find or create test chef ──────────────────────
  let chef = await User.findOne({ type: 'chef' });

  if (!chef) {
    console.log('🧑‍🍳 No chef found. Creating test chef...');
    chef = new User({
      username: 'testchef',
      email: 'testchef@feedyum.com',
      fullName: 'مطبخ الشيف أحمد',
      type: 'chef',
      profileCompleted: true,
      postsNo: 0,
      bio: 'شيف تجريبي لاختبار التطبيق | Test chef for app testing',
      avatar: 'https://images.pexels.com/photos/887827/pexels-photo-887827.jpeg?auto=compress&cs=tinysrgb&w=400',
      chefSettings: {
        country: 'Egypt',
        currency: 'EGP',
        currencySymbol: '£E',
        isCountryLocked: true,
        totalBranches: 1,
        hasBranches: true,
      },
    });
    await chef.save();
    console.log(`✅ Created chef: ${chef.fullName} (${chef._id})`);
  } else {
    console.log(`🧑‍🍳 Found existing chef: ${chef.fullName || chef.username} (${chef._id})`);
  }

  // ── Step 2: Ensure chef has a menu with dishes ──────────
  let menu = await Menu.findOne({ chef: chef._id });

  if (!menu) {
    console.log('📋 Creating menu for chef...');

    const section = new Section({
      name: 'Main Dishes',
      nameArabic: 'الأطباق الرئيسية',
    });
    await section.save();

    menu = new Menu({
      name: 'قائمة الشيف أحمد',
      description: 'أشهى الأطباق المصرية والشرقية',
      chef: chef._id,
      sections: [section._id],
      dishes: [],
    });
    await menu.save();

    const dishesData = [
      { name: 'شاورما لحم', nameEnglish: 'Beef Shawarma', category: 'Grills', price: 85 },
      { name: 'بيتزا مارجريتا', nameEnglish: 'Margherita Pizza', category: 'Pizza', price: 120 },
      { name: 'برجر واجيو', nameEnglish: 'Wagyu Burger', category: 'Burgers', price: 150 },
      { name: 'سوشي سالمون', nameEnglish: 'Salmon Sushi', category: 'Sushi', price: 200 },
      { name: 'ستيك ريب آي', nameEnglish: 'Rib Eye Steak', category: 'Grills', price: 350 },
      { name: 'باستا ألفريدو', nameEnglish: 'Alfredo Pasta', category: 'Pasta', price: 95 },
    ];

    const createdDishes = [];
    for (let i = 0; i < dishesData.length; i++) {
      const d = dishesData[i];
      const dish = new Dish({
        id: i + 1,
        name: d.name,
        nameEnglish: d.nameEnglish,
        nameArabic: d.name,
        category: d.category,
        price: d.price,
        menu: menu._id,
        menu_id: 1,
        user_id: chef._id,
        section: section._id,
        visible: true,
        description: `${d.nameEnglish} - أطيب ${d.name} في المنطقة`,
      });
      await dish.save();
      createdDishes.push(dish);
    }

    menu.dishes = createdDishes.map((d) => d._id);
    await menu.save();
    await User.findByIdAndUpdate(chef._id, { hasMenu: true });
    console.log(`✅ Created menu with ${createdDishes.length} dishes`);
  } else {
    console.log(`📋 Chef already has a menu (${menu.dishes.length} dishes)`);
  }

  // ── Step 3: Get or create a food category ─────────────────
  let category = await Category.findOne({ name: 'Food' });
  if (!category) {
    category = new Category({ name: 'Food', nameArabic: 'طعام', description: 'Food category' });
    await category.save();
  }
  console.log(`📂 Using category: ${category.name} (${category._id})`);

  const dishes = await Dish.find({ user_id: chef._id }).limit(6);

  // ── Step 4: Search Pexels, download, upload, create stories ──
  console.log('\n🎬 Searching Pexels and creating reels...\n');

  let successCount = 0;

  for (let i = 0; i < REEL_CONTENT.length; i++) {
    const item = REEL_CONTENT[i];
    console.log(`📹 [${i + 1}/${REEL_CONTENT.length}] ${item.title}`);

    try {
      // Search Pexels for the video
      console.log(`  🔍 Searching Pexels: "${item.query}"`);
      const pexelsResult = await searchPexelsVideo(item.query);
      console.log(`  📐 Found video: ${pexelsResult.width}x${pexelsResult.height} (${pexelsResult.quality})`);

      // Download video
      console.log(`  ⬇ Downloading video...`);
      const videoBuffer = await downloadBuffer(pexelsResult.videoUrl);
      console.log(`  📦 Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB`);

      // Upload video to R2
      console.log(`  ⬆ Uploading video to R2...`);
      const videoR2Url = await uploadMediaToR2(videoBuffer, 'story_videos', 'mp4', 'video/mp4');

      // Download poster image
      console.log(`  ⬇ Downloading poster...`);
      const posterBuffer = await downloadBuffer(pexelsResult.posterUrl);

      // Upload poster to R2
      console.log(`  ⬆ Uploading poster to R2...`);
      const posterR2Url = await uploadMediaToR2(posterBuffer, 'story_images', 'jpg', 'image/jpeg');

      // Create story document
      const story = new Story({
        author: chef._id,
        uri: videoR2Url,
        poster: posterR2Url,
        avatarUri: posterR2Url,
        caption: item.caption,
        title: item.title,
        category: [category._id],
        governorate: 'Cairo',
        areas: ['Maadi', 'Zamalek', 'Heliopolis'],
        likesNo: Math.floor(Math.random() * 50) + 5,
        views: Math.floor(Math.random() * 200) + 20,
        commentsNo: Math.floor(Math.random() * 15),
        dishes: dishes.length > i ? [dishes[i]._id] : [],
        created_at: new Date(Date.now() - i * 3600 * 1000), // Stagger by 1 hour
      });

      await story.save();
      successCount++;
      console.log(`  ✅ Story created: ${story._id}\n`);

      // Small delay to be nice to Pexels API
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}\n`);
    }
  }

  // Update chef post count
  await User.findByIdAndUpdate(chef._id, { $inc: { postsNo: successCount } });

  console.log(`\n🎉 Done! Created ${successCount}/${REEL_CONTENT.length} reels for chef "${chef.fullName || chef.username}"`);
  console.log(`   Chef ID: ${chef._id}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from staging DB');
}

// ── Run ───────────────────────────────────────────────────────
seedStagingReels().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
