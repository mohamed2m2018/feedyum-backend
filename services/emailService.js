const nodemailer = require('nodemailer');

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Email Service for FeedYum - Password Reset Flow
// Last updated: 2026-01-18
class EmailService {

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      debug: true,
      logger: true,
    });
  }

  /**
   * Send password reset email with reset link
   * @param {string} email - Recipient email
   * @param {string} token - Reset token
   * @param {string} userName - User's display name (optional)
   */
  async sendPasswordResetEmail(email, token, userName = '') {
    // Use backend redirect URL that will open the app via deep link
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:4800';
    const resetLink = `${baseUrl}/api/user/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const displayName = userName || email.split('@')[0];

    const htmlContent = this.getPasswordResetEmailTemplate(displayName, resetLink, resetLink);
    const textContent = this.getPasswordResetEmailText(displayName, resetLink);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'FeedYum <info@feedyum.com>',
      to: email,
      subject: 'Reset Your FeedYum Password | إعادة تعيين كلمة المرور',
      text: textContent,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] Password reset email sent to:', email);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[EmailService] Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Generate HTML email template for password reset
   */
  getPasswordResetEmailTemplate(displayName, resetLink, webResetLink) {
    return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); padding: 40px 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🍽️ FeedYum</h1>
            </td>
          </tr>
          
          <!-- English Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${displayName},
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto 30px auto;">
                <tr>
                  <td style="border-radius: 12px; background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                Or copy and paste this link in your browser:
              </p>
              <p style="color: #FF6B35; font-size: 14px; word-break: break-all; margin: 0 0 30px 0;">
                <a href="${webResetLink}" style="color: #FF6B35;">${webResetLink}</a>
              </p>
              
              <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 0;">
                ⏰ This link will expire in <strong>1 hour</strong>.<br>
                If you didn't request this, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;">
            </td>
          </tr>
          
          <!-- Arabic Content -->
          <tr>
            <td style="padding: 40px;" dir="rtl">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px; text-align: right;">إعادة تعيين كلمة المرور</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; text-align: right;">
                مرحباً ${displayName}،
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; text-align: right;">
                تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:
              </p>
              
              <!-- CTA Button Arabic -->
              <table role="presentation" style="margin: 0 auto 30px auto;">
                <tr>
                  <td style="border-radius: 12px; background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 600;">
                      إعادة تعيين كلمة المرور
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #888888; font-size: 14px; line-height: 1.8; margin: 0; text-align: right;">
                ⏰ ستنتهي صلاحية هذا الرابط خلال <strong>ساعة واحدة</strong>.<br>
                إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 30px 40px; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="color: #888888; font-size: 12px; line-height: 1.6; margin: 0;">
                © ${new Date().getFullYear()} FeedYum. All rights reserved.<br>
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Generate plain text version for email clients that don't support HTML
   */
  getPasswordResetEmailText(displayName, resetLink) {
    return `
Reset Your FeedYum Password
============================

Hi ${displayName},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

---

إعادة تعيين كلمة المرور في FeedYum
===================================

مرحباً ${displayName}،

تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الرابط أدناه لإنشاء كلمة مرور جديدة:

${resetLink}

ستنتهي صلاحية هذا الرابط خلال ساعة واحدة.

إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.

---
© ${new Date().getFullYear()} FeedYum
`;
  }

  /**
   * Verify email transporter connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('[EmailService] Email transporter connected successfully');
      return true;
    } catch (error) {
      console.error('[EmailService] Email transporter connection failed:', error);
      return false;
    }
  }

  /**
   * Notify the team about a new "Join as a chef" application from the website
   * @param {object} application - Saved chefApplication document
   */
  async sendChefApplicationNotification(application) {
    const to = process.env.CHEF_APPLICATIONS_EMAIL || 'mohamed.salah@feedyum.com';
    const rows = [
      ['Name', application.name],
      ['Business name', application.businessName],
      ['Type', application.businessType === 'restaurant' ? 'Restaurant' : 'Home chef'],
      ['Phone / WhatsApp', application.phone],
      ['Email', application.email],
      ['Area', application.area],
      ['Cuisine / dishes', application.cuisine],
      ['Instagram / Facebook', application.socialLink],
      ['Notes', application.notes],
      ['Form language', application.language],
    ];

    const text = rows.map(([label, value]) => `${label}: ${value || '-'}`).join('\n');
    const html = `<h2>New chef application</h2><table cellpadding="6">${rows
      .map(([label, value]) => `<tr><td><b>${escapeHtml(label)}</b></td><td>${escapeHtml(value || '-')}</td></tr>`)
      .join('')}</table>`;

    const result = await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'FeedYum <info@feedyum.com>',
      to,
      replyTo: application.email || undefined,
      subject: `New chef application: ${application.businessName || application.name}`,
      text,
      html,
    });
    console.log('[EmailService] Chef application notification sent to:', to);
    return { success: true, messageId: result.messageId };
  }
}

// Export singleton instance
module.exports = new EmailService();
