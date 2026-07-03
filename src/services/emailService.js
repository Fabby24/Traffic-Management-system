const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, token, firstName) {
    const clientUrl = process.env.FRONTEND_URL;
    const baseUrl = clientUrl.replace(/\/$/, ''); 
    const resetLink = `${baseUrl}/reset-password?token=${token}`; 
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - Studio Traffic',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${firstName || 'User'},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #3B82F6; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: 600;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${resetLink}
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            This link will expire in 24 hours.
          </p>
          <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Studio Traffic Management System</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', email);
      return true;
    } catch (error) {
      console.error(' Email sending failed:', error.message);
      throw new Error('Failed to send reset email');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, firstName) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Studio Traffic!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Studio Traffic!</h2>
          <p>Hello ${firstName || 'User'},</p>
          <p>Your account has been successfully created. You can now log in to the system.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL }/login" 
               style="background-color: #3B82F6; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: 600;">
              Login to Your Account
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">Best regards,<br>Studio Traffic Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(' Welcome email sent to:', email);
      return true;
    } catch (error) {
      console.error('Welcome email failed:', error.message);
      return false;
    }
  }
  async sendInvitationEmail(email, role, inviteLink) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'You\'ve been invited to join Studio X',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B132B; color: #FFFFFF; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #2563EB; padding: 12px 24px; border-radius: 8px;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">STUDIO X</h1>
            </div>
          </div>
          
          <h2 style="color: #FFFFFF; margin-bottom: 20px;">You've been invited!</h2>
          
          <p style="color: #94A3B8; margin-bottom: 20px;">
            You have been invited to join Studio X as a <strong style="color: #7C3AED;">${role}</strong>.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background: linear-gradient(135deg, #2563EB, #7C3AED); 
                      color: white; 
                      padding: 14px 40px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block;
                      font-weight: 600;
                      font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #64748B; font-size: 14px; margin-bottom: 10px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="word-break: break-all; color: #64748B; background: #1E293B; padding: 12px; border-radius: 6px; font-size: 12px;">
            ${inviteLink}
          </p>
          
          <hr style="border: none; border-top: 1px solid #1E293B; margin: 30px 0;">
          
          <p style="color: #475569; font-size: 12px; text-align: center;">
            This invitation will expire in 7 days.<br>
            If you didn't expect this invitation, please ignore this email.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(' Invitation email sent to:', email);
      return true;
    } catch (error) {
      console.error(' Invitation email failed:', error.message);
      throw new Error('Failed to send invitation email');
    }
  }
}

module.exports = new EmailService();