const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const keys = require('../config/keys');

const router = express.Router();

const hashCode = code => crypto.createHash('sha256').update(code).digest('hex');

router.post('/exchange', async (req, res) => {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!code) return res.status(400).json({ message: 'Impersonation code is required' });

    const Grant = mongoose.model('adminImpersonationGrant');
    const User = mongoose.model('user');
    const now = new Date();
    const grant = await Grant.findOneAndUpdate(
      { codeHash: hashCode(code), usedAt: null, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
      { new: true },
    ).lean();

    if (!grant) {
      return res.status(401).json({ message: 'This impersonation link is invalid, expired, or already used' });
    }

    const user = await User.findById(grant.targetUser).lean();
    if (!user) return res.status(404).json({ message: 'Target user no longer exists' });

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        impersonation: true,
        impersonatedBy: grant.adminEmail,
        grantId: grant._id.toString(),
      },
      keys.secretOrKey,
      { expiresIn: '15m' },
    );

    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.embedding;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;

    return res.json({
      success: true,
      token: `Bearer ${token}`,
      user: safeUser,
      impersonation: {
        adminEmail: grant.adminEmail,
        targetUserId: user._id,
        targetName: user.fullName || user.email,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        readOnly: true,
      },
    });
  } catch (error) {
    console.error('[IMPERSONATION] Exchange failed:', error.message);
    return res.status(500).json({ message: 'Unable to start impersonation session' });
  }
});

module.exports = router;
