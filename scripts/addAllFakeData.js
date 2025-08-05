const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting to add all fake data...\n');

const runScript = (scriptName) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`📄 Running ${scriptName}...`);
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error running ${scriptName}:`, error);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`⚠️  ${scriptName} stderr:`, stderr);
      }
      
      console.log(stdout);
      console.log(`✅ ${scriptName} completed!\n`);
      resolve();
    });
  });
};

const addAllFakeData = async () => {
  try {
    console.log('🎯 This script will add fake notifications and messages to test the notification system\n');
    
    // Add fake messages first
    await runScript('addFakeMessages.js');
    
    // Wait a bit before adding notifications
    console.log('⏳ Waiting 2 seconds before adding notifications...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add fake notifications
    await runScript('addFakeNotifications.js');
    
    console.log('🎉 All fake data added successfully!');
    console.log('📱 Your app should now show notification badges with unread counts');
    console.log('💬 Test the chat and orders tabs to see the badges in action');
    console.log('🔄 The badges will update in real-time as you interact with the app');
    
  } catch (error) {
    console.error('❌ Error adding fake data:', error);
    process.exit(1);
  }
};

// Run the combined script
addAllFakeData(); 