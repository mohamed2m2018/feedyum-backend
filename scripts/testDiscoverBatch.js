const request = require('supertest');
const express = require('express');

// Simple test to verify the discover batch endpoint
async function testDiscoverBatch() {
  console.log('🧪 Testing Discover Batch Endpoint...\n');
  
  try {
    // Test with sample coordinates
    const testUrl = 'http://localhost:3000/api/discover/batch?lat=30.033&long=31.233&userId=507f1f77bcf86cd799439011';
    
    console.log('📡 Making request to:', testUrl);
    
    const startTime = Date.now();
    
    // Using fetch instead of supertest for simplicity
    const response = await fetch(testUrl);
    const data = await response.json();
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    if (response.ok && data.success) {
      console.log('✅ SUCCESS!');
      console.log(`⏱️  Total Time: ${totalTime}ms`);
      console.log(`🖥️  Server Time: ${data.loadTime}ms`);
      console.log(`📡 Network Time: ${totalTime - data.loadTime}ms`);
      console.log(`💾 Cached: ${data.cached ? 'Yes' : 'No'}`);
      
      // Count data
      const categories = Object.keys(data.data);
      let totalUsers = 0;
      let totalDishes = 0;
      
      categories.forEach(category => {
        const categoryData = data.data[category];
        totalUsers += categoryData.users?.length || 0;
        totalDishes += categoryData.dishes?.length || 0;
        console.log(`📂 ${category}: ${categoryData.users?.length || 0} users, ${categoryData.dishes?.length || 0} dishes`);
      });
      
      console.log(`\n📊 SUMMARY:`);
      console.log(`   Categories: ${categories.length}`);
      console.log(`   Total Users: ${totalUsers}`);
      console.log(`   Total Dishes: ${totalDishes}`);
      
      // Performance rating
      if (totalTime < 100) {
        console.log(`   🚀 EXCELLENT performance (${totalTime}ms)`);
      } else if (totalTime < 500) {
        console.log(`   ✅ GOOD performance (${totalTime}ms)`);
      } else if (totalTime < 1000) {
        console.log(`   ⚠️  ACCEPTABLE performance (${totalTime}ms)`);
      } else {
        console.log(`   ❌ SLOW performance (${totalTime}ms)`);
      }
      
    } else {
      console.log('❌ FAILED!');
      console.log('Status:', response.status);
      console.log('Error:', data.error || 'Unknown error');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ TEST FAILED!');
    console.log('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your server is running on http://localhost:3000');
      console.log('   Run: npm start or node server.js');
    }
  }
}

// Check if fetch is available (Node 18+) or use a polyfill
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch for compatibility...');
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('❌ node-fetch not available. Please install it:');
    console.log('   npm install node-fetch');
    process.exit(1);
  }
}

testDiscoverBatch();