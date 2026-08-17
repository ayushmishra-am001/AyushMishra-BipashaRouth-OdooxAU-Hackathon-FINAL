const sgMail = require('@sendgrid/mail');
const env = require('../config/env');

// Initialize SendGrid
sgMail.setApiKey(env.sendgridApiKey);

async function sendVerificationEmail(email, name, verificationToken) {
  const verificationLink = `${env.frontendUrl}/pages/verify-email.html?token=${verificationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3498db; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Rental Management System!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <center>
            <a href="${verificationLink}" class="button">Verify Email</a>
          </center>
          <p>Or copy and paste this link in your browser:<br/>
          <code>${verificationLink}</code></p>
          <p><strong>⏱️ This link will expire in 24 hours.</strong></p>
          <p>If you didn't create this account, please ignore this email.</p>
          <p>Best regards,<br/>Rental Management System Team</p>
        </div>
        <div class="footer">
          <p>© 2026 Rental Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const msg = {
    to: email,
    from: env.emailFrom,
    subject: 'Verify Your Email Address - Rental Management System',
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

async function sendPasswordResetEmail(email, name, resetToken) {
  const resetLink = `${env.frontendUrl}/pages/reset-password.html?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 3px; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <center>
            <a href="${resetLink}" class="button">Reset Password</a>
          </center>
          <p>Or copy and paste this link in your browser:<br/>
          <code>${resetLink}</code></p>
          <div class="warning">
            <strong>⏱️ ⚠️ This link will expire in 1 hour.</strong>
          </div>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <p>For security reasons, never share your password reset link with anyone.</p>
          <p>Best regards,<br/>Rental Management System Team</p>
        </div>
        <div class="footer">
          <p>© 2026 Rental Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const msg = {
    to: email,
    from: env.emailFrom,
    subject: 'Reset Your Password - Rental Management System',
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
