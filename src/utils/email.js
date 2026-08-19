const brevo = require('@getbrevo/brevo');
const logger = require('./logger');

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

/**
 * Parses "Name <email@example.com>" into { name, email } for Brevo's API.
 */
const parseFromAddress = (raw) => {
    const match = /^(.*)<(.+)>$/.exec(raw || '');
    if (match) {
        return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
    }
    return { email: raw };
};

/**
 * Send email via Brevo (HTTPS API — works on Render, unlike raw SMTP).
 * EMAIL_FROM must match (or be close to) the sender verified in
 * Brevo → Senders, Domains & Dedicated IPs.
 */
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.sender = parseFromAddress(process.env.EMAIL_FROM || 'Studio X <noreply@studiotraffic.com>');
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;
        sendSmtpEmail.textContent = text;

        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        logger.info(`Email sent to ${to}: ${response.body?.messageId}`);
        return response.body;
    } catch (error) {
        logger.error('Email sending failed:', error.response?.body || error);
        throw new Error('Failed to send email');
    }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (email, firstName, orgName) => {
    const subject = `Welcome to Studio X - ${orgName}`;

    const text = `Welcome to Studio X, ${firstName}!

Your organization "${orgName}" has been successfully created.

You can now log in to your account and start managing your projects, tasks, and team.

Login here: ${process.env.FRONTEND_URL}/login

---
Studio X - Multi-Tenant Traffic Management System
You received this email because you registered on our platform.`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B132B; color: #FFFFFF; padding: 40px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 12px 24px; border-radius: 8px;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">STUDIO X</h1>
                </div>
            </div>
            
            <h2 style="color: #FFFFFF; margin-bottom: 20px;">Welcome to Studio X, ${firstName}!</h2>
            
            <p style="color: #94A3B8; margin-bottom: 20px;">
                Your organization <strong style="color: #7C3AED;">${orgName}</strong> has been successfully created.
            </p>
            
            <p style="color: #94A3B8; margin-bottom: 20px;">
                You can now log in to your account and start managing your projects, tasks, and team.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/login" 
                   style="background: linear-gradient(135deg, #2563EB, #7C3AED); 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block;
                          font-weight: 600;
                          font-size: 16px;">
                    Login to Your Account
                </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #1E293B; margin: 30px 0;">
            
            <p style="color: #475569; font-size: 12px; text-align: center;">
                Studio X - Multi-Tenant Traffic Management System<br>
                You received this email because you registered on our platform.
            </p>
        </div>
    `;

    return sendEmail({ to: email, subject, html, text });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, token, firstName) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Reset Your Password - Studio X';

    const text = `Password Reset Request

Hello ${firstName || 'User'},

You requested to reset your password. Use the link below to reset it:

${resetLink}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

---
Studio X - Multi-Tenant Traffic Management System`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B132B; color: #FFFFFF; padding: 40px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 12px 24px; border-radius: 8px;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">STUDIO X</h1>
                </div>
            </div>
            
            <h2 style="color: #FFFFFF; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #94A3B8; margin-bottom: 20px;">
                Hello ${firstName || 'User'},
            </p>
            
            <p style="color: #94A3B8; margin-bottom: 20px;">
                You requested to reset your password. Click the button below to reset it:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background: linear-gradient(135deg, #2563EB, #7C3AED); 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block;
                          font-weight: 600;
                          font-size: 16px;">
                    Reset Password
                </a>
            </div>
            
            <p style="color: #64748B; font-size: 14px; margin-bottom: 10px;">
                Or copy and paste this link in your browser:
            </p>
            <p style="word-break: break-all; color: #64748B; background: #1E293B; padding: 12px; border-radius: 6px; font-size: 12px;">
                ${resetLink}
            </p>
            
            <p style="color: #475569; font-size: 14px; margin-top: 20px;">
                This link will expire in 24 hours.
            </p>
            
            <p style="color: #475569; font-size: 14px;">
                If you didn't request this, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #1E293B; margin: 30px 0;">
            
            <p style="color: #475569; font-size: 12px; text-align: center;">
                Studio X - Multi-Tenant Traffic Management System
            </p>
        </div>
    `;

    return sendEmail({ to: email, subject, html, text });
};

/**
 * Send invitation email
 */
const sendInvitationEmail = async (email, orgName, role, token) => {
    const frontendUrl = process.env.FRONTEND_URL;
    const acceptInviteLink = `${frontendUrl}/accept-invite?token=${token}`;
    const roleDisplay = role === 'org_admin' ? 'Organization Admin' : 'Team Member';
    const subject = `You've been invited to join ${orgName} on Studio X`;

    const text = `You've Been Invited!

${orgName} has invited you to join as ${roleDisplay} on Studio X.

Accept your invitation here:
${acceptInviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, please ignore this email.

---
Studio X - Multi-Tenant Traffic Management System`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B132B; color: #FFFFFF; padding: 40px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 12px 24px; border-radius: 8px;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">STUDIO X</h1>
                </div>
            </div>
            
            <h2 style="color: #FFFFFF; margin-bottom: 20px;">You've Been Invited!</h2>
            
            <p style="color: #94A3B8; margin-bottom: 20px;">
                <strong style="color: #FFFFFF;">${orgName}</strong> has invited you to join 
                <strong style="color: #7C3AED;">${roleDisplay}</strong> on Studio X.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptInviteLink}" 
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
                ${acceptInviteLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #1E293B; margin: 30px 0;">
            
            <p style="color: #475569; font-size: 12px; text-align: center;">
                This invitation will expire in 7 days.<br>
                If you didn't expect this invitation, please ignore this email.
            </p>
        </div>
    `;

    return sendEmail({ to: email, subject, html, text });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendInvitationEmail
};