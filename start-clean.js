#!/usr/bin/env node

// Clean server startup script that suppresses deprecation warnings
// and provides better error handling

// Suppress deprecation warnings
process.env.NODE_NO_WARNINGS = '1';
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error.message);
  console.error('[FATAL] Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Clear console and show startup banner
console.clear();
console.log('🚀 Starting Food2K Backend Server...\n');

// Check if optimized server exists, otherwise use regular server
const fs = require('fs');
const path = require('path');

let serverFile = 'server.js';
if (fs.existsSync(path.join(__dirname, 'server-optimized.js'))) {
  serverFile = 'server-optimized.js';
  console.log('✅ Using optimized server configuration');
} else {
  console.log('ℹ️  Using standard server configuration');
}

// Start the appropriate server
try {
  require(`./${serverFile}`);
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}