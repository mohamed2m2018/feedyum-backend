const mongoose = require('mongoose');
const User = mongoose.model('user');

/**
 * Check if registration fields are available (email, phone)
 * @route POST /api/user/check-availability
 * @access Public
 * @body { email?: string, phone?: string }
 * @returns { available: boolean, fields: { email?: { available, message }, phone?: { available, message } } }
 */
const checkAvailability = async (req, res) => {
    try {
        const { email, phone } = req.body;
        const result = {
            available: true,
            fields: {},
        };

        // Check email if provided
        if (email) {
            const existingEmail = await User.findOne({
                email: email.toLowerCase().trim()
            });

            result.fields.email = {
                available: !existingEmail,
                message: existingEmail ? 'Email already registered' : 'Email is available',
            };

            if (existingEmail) {
                result.available = false;
            }
        }

        // Check phone if provided
        if (phone) {
            // Normalize phone number - remove spaces, dashes, etc.
            const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

            const existingPhone = await User.findOne({ phone: normalizedPhone });

            result.fields.phone = {
                available: !existingPhone,
                message: existingPhone ? 'Phone number already registered' : 'Phone number is available',
            };

            if (existingPhone) {
                result.available = false;
            }
        }

        return res.json(result);
    } catch (error) {
        console.error('Check availability error:', error);
        return res.status(500).json({
            available: false,
            message: 'Error checking availability',
        });
    }
};

module.exports = checkAvailability;
