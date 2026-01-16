/**
 * Guest User Seeder
 * Ensures a guest user exists in the database for guest login functionality
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Get User model
const User = mongoose.model('user');

const GUEST_USER_CONFIG = {
    email: 'guest@foodtok.com',
    password: '123456Ab-',
    username: 'guest_user',
    fullName: 'Guest User',
    type: 'guest',
    profileCompleted: false,
    postsNo: 0,
    likesNo: 0,
};

/**
 * Ensures the guest user exists in the database
 * @returns {Promise<{created: boolean, user: object}>}
 */
async function ensureGuestUser() {
    try {
        // Check if guest user already exists
        let guestUser = await User.findOne({ email: GUEST_USER_CONFIG.email });

        if (guestUser) {
            console.log('[SEED] Guest user already exists');
            return { created: false, user: guestUser };
        }

        // Create guest user with hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(GUEST_USER_CONFIG.password, salt);

        guestUser = new User({
            ...GUEST_USER_CONFIG,
            password: hashedPassword,
        });

        await guestUser.save();
        console.log('[SEED] Guest user created successfully');
        return { created: true, user: guestUser };
    } catch (error) {
        console.error('[SEED] Failed to ensure guest user:', error.message);
        throw error;
    }
}

module.exports = { ensureGuestUser, GUEST_USER_CONFIG };
