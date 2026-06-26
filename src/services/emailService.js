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

    //sending password reset email
    async sendPasswordResetEmail(email, firstName, token) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        const mailOptions = {
            From: `"Studio Traffic" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Password Reset Request - Traffic Management System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${firstName || 'user'},</p>
                    <p>We received a request to reset your password. Click the link below to reset it:</p>
                    <div style="text-align: center; margin: 30px 0;">
                    
                        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    </div>
                    <p>or copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all;">${resetLink}</p>
                    <p style="color: #999; font-size: 14px; margin-top: 20px;">This link will expire in 7 days. If you did not request a password reset, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">Studio Traffic Management System &copy; ${new Date().getFullYear()}</p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <p style="font-size: 12px; color: #999;">If you have any questions, feel free to contact our support team at  <a href="mailto:support@studiotraffic.com">support@studiotraffic.com</a>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    //welcome email
    async sendWelcomeEmail(email, firstName) {
        const mailOptions = {
            From: `"Studio Traffic" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Welcome to Studio Traffic Management System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2>Welcome to Studio Traffic Management System</h2>
                    <p>Hi ${firstName || 'user'},</p>
                    <p>Your account has been successfully created. You can now Log in to the system.</p>
                     <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/login"
                               style="background-color: #007bff; color: white; padding: 12px 30px;
                                      text-decoration: none; border-radius: 5px; font-size: 16px;">
                                Log In Now
                            </a>
                        </div>
                    <p>If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:support@studiotraffic.com">support@studiotraffic.com</a>.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">Studio Traffic Management System &copy; ${new Date().getFullYear()}</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Welcome email failed:', error);
            
            return false;

        }
    }
}

module.exports = new EmailService();