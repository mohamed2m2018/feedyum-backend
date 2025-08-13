// Fix for Node.js deprecation warnings

// Suppress punycode deprecation warning
process.env.NODE_NO_WARNINGS = '1';

// Alternative: suppress specific deprecation warnings
const originalEmit = process.emit;
process.emit = function(name, data, ...args) {
  // Suppress punycode deprecation warning
  if (
    name === 'warning' && 
    data.name === 'DeprecationWarning' &&
    data.message.includes('punycode')
  ) {
    return;
  }
  
  // Suppress other common deprecation warnings that don't affect functionality
  if (
    name === 'warning' && 
    data.name === 'DeprecationWarning' &&
    (data.message.includes('buffer') || data.message.includes('util.isArray'))
  ) {
    return;
  }
  
  return originalEmit.apply(process, arguments);
};

module.exports = {
  suppressDeprecationWarnings: () => {
    console.log('[SYSTEM] Deprecation warnings suppressed for cleaner logs');
  }
};