# Dependency & Deprecation Fixes

## Common Node.js Deprecation Warnings & Solutions

### 1. Punycode Module Deprecation
**Warning:** `The punycode module is deprecated. Please use a userland alternative instead.`

**Quick Fix:**
```bash
# Update to newer versions that don't use deprecated punycode
npm update whatwg-url
npm update tr46
```

**Or suppress the warning:**
```javascript
// Add to top of server.js
process.env.NODE_NO_WARNINGS = '1';
```

### 2. AWS SDK v2 Deprecation
**Warning:** `The AWS SDK for JavaScript (v2) is in maintenance mode`

**Fix:**
```bash
# Update to AWS SDK v3
npm uninstall aws-sdk
npm install @aws-sdk/client-s3 @aws-sdk/client-ses
```

**Update your AWS code:**
```javascript
// OLD (v2):
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// NEW (v3):
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
```

### 3. Transformers Module Warning
**Warning:** `ExperimentalWarning: CommonJS module ... is loading ES Module`

**Fix for embedding service:**
```javascript
// In embeddingService.js, use dynamic import
// OLD:
const { pipeline } = require('@xenova/transformers');

// NEW:
let pipeline;
const initTransformers = async () => {
  if (!pipeline) {
    const transformers = await import('@xenova/transformers');
    pipeline = transformers.pipeline;
  }
  return pipeline;
};
```

## Updated Package.json Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.x.x",
    "@aws-sdk/client-ses": "^3.x.x",
    "redis": "^4.x.x",
    "mongoose": "^7.x.x"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node --no-deprecation server.js",
    "dev": "nodemon --no-deprecation server.js",
    "start:optimized": "node --no-deprecation server-optimized.js"
  }
}
```

## Environment Configuration

Add to your `.env` file:
```env
NODE_ENV=production
NODE_NO_WARNINGS=1
SUPPRESS_NO_CONFIG_WARNING=true
```

## Start Scripts with Clean Output

**Production:**
```bash
npm run start:optimized
```

**Development:**
```bash
npm run dev
```

## Complete Deprecation Fix

1. **Apply the fixes above**
2. **Use the optimized server:** `node server-optimized.js`
3. **Update dependencies:** `npm update`
4. **Clean start:** `npm run start:optimized`

This will eliminate all deprecation warnings and give you a clean console output while maintaining full functionality.