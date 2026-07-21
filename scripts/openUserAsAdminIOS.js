require('dotenv').config();

const crypto = require('crypto');
const { spawnSync } = require('child_process');
const mongoose = require('mongoose');
const keys = require('../config/keys');

require('../models/loadModels');

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/openUserAsAdminIOS.js <user-id-or-email> [--open]');
  process.exit(1);
}

async function main() {
  if (!keys.adminEmail) throw new Error('ADMIN_EMAIL must be configured');
  await mongoose.connect(keys.mongoURI, { serverSelectionTimeoutMS: 20000 });

  const User = mongoose.model('user');
  const Grant = mongoose.model('adminImpersonationGrant');
  const query = mongoose.isValidObjectId(target) ? { _id: target } : { email: target.toLowerCase() };
  const user = await User.findOne(query).select('_id fullName email type').lean();
  if (!user) throw new Error('User not found');

  const code = crypto.randomBytes(32).toString('base64url');
  await Grant.create({
    codeHash: crypto.createHash('sha256').update(code).digest('hex'),
    targetUser: user._id,
    adminEmail: keys.adminEmail,
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    metadata: { source: 'local-ios-shortcut', readOnly: true },
  });

  const url = `feedyum://admin-impersonate?code=${encodeURIComponent(code)}&env=local`;
  console.log(`Created one-use, read-only shortcut for ${user.fullName || user.email} (${user.type}).`);
  console.log('The link expires in 2 minutes; the resulting session expires in 15 minutes.');

  if (process.argv.includes('--open')) {
    const result = spawnSync('xcrun', ['simctl', 'openurl', 'booted', url], { stdio: 'inherit' });
    if (result.status !== 0) throw new Error('Could not open the shortcut in the booted iOS simulator');
    console.log('Opened in the booted iOS simulator.');
  } else {
    console.log(url);
  }
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
