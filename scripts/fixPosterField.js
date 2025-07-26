const mongoose = require('mongoose');
const Story = require('../models/story');

// Use the same connection as the backend
const mongoURI = require('../config/keys').mongoURI;

// Sample food images for poster field
const foodImages = [
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=600&fit=crop'
];

async function connectToDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

async function fixPosterField() {
  try {
    console.log('🔍 Finding stories with poster field as names...');
    
    // Find all stories where poster field doesn't start with 'http' (i.e., it's a name, not a URL)
    const stories = await Story.find({
      poster: { $exists: true, $not: /^https?:\/\// }
    });
    
    console.log(`📊 Found ${stories.length} stories with poster names instead of URLs`);
    
    if (stories.length === 0) {
      console.log('✅ All stories already have proper poster URLs!');
      return;
    }
    
    let updatedCount = 0;
    
    for (const story of stories) {
      // Get a random food image
      const randomImage = foodImages[Math.floor(Math.random() * foodImages.length)];
      
      // Update the poster field with the image URL
      await Story.findByIdAndUpdate(story._id, {
        poster: randomImage
      });
      
      console.log(`✅ Updated story "${story.title}" - poster: "${story.poster}" → "${randomImage}"`);
      updatedCount++;
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} stories!`);
    
    // Verify the changes
    console.log('\n🔍 Verification - checking updated stories:');
    const updatedStories = await Story.find({
      poster: { $regex: /^https?:\/\// }
    }).limit(5);
    
    updatedStories.forEach((story, index) => {
      console.log(`   ${index + 1}. ${story.title} - poster: ${story.poster}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing poster field:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting poster field fix process...\n');
    
    await connectToDatabase();
    await fixPosterField();
    
    console.log('\n✅ Process completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted, cleaning up...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
main();