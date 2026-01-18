const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../../models/user');

/**
 * POST /user/reset-password
 * Reset password using token from email
 */
const resetPassword = async (req, res) => {
    try {
        const { token, email, newPassword } = req.body;

        // Validate required fields
        if (!token || !email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token, email, and new password are required',
                messageAr: 'الرمز والبريد الإلكتروني وكلمة المرور الجديدة مطلوبة',
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
                messageAr: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
            });
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Hash the provided token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with matching email and valid token
        const user = await User.findOne({
            email: normalizedEmail,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }, // Token not expired
        }).select('+resetPasswordToken +resetPasswordExpires +password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token. Please request a new password reset.',
                messageAr: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.',
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log('[ResetPassword] Password reset successful for:', normalizedEmail);

        return res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.',
            messageAr: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.',
        });

    } catch (error) {
        console.error('[ResetPassword] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while resetting your password.',
            messageAr: 'حدث خطأ أثناء إعادة تعيين كلمة المرور.',
        });
    }
};

module.exports = resetPassword;
