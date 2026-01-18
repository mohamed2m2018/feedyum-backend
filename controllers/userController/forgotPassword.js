const crypto = require('crypto');
const User = require('../../models/User');
const emailService = require('../../services/emailService');

/**
 * POST /user/forgot-password
 * Request password reset email
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Find user by email (include reset token fields)
        const user = await User.findOne({ email: normalizedEmail })
            .select('+resetPasswordToken +resetPasswordExpires');

        // Always return success to prevent email enumeration attacks
        const successResponse = {
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link shortly.',
            messageAr: 'إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، ستتلقى رابط إعادة تعيين كلمة المرور قريباً.',
        };

        if (!user) {
            // Don't reveal if user exists or not
            return res.status(200).json(successResponse);
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash the token before storing (for security)
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set token expiry (1 hour from now)
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

        // Save hashed token and expiry to user
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = tokenExpiry;
        await user.save();

        // Send email with the plain token (not hashed)
        try {
            await emailService.sendPasswordResetEmail(
                user.email,
                resetToken,
                user.fullName || user.username
            );
            console.log('[ForgotPassword] Reset email sent to:', normalizedEmail);
        } catch (emailError) {
            console.error('[ForgotPassword] Failed to send email:', emailError);
            // Don't reveal email failure to user for security
        }

        return res.status(200).json(successResponse);

    } catch (error) {
        console.error('[ForgotPassword] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request.',
            messageAr: 'حدث خطأ أثناء معالجة طلبك.',
        });
    }
};

module.exports = forgotPassword;
