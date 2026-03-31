const nodemailer = require('nodemailer');
const { generatePartnerWelcomeEmail } = require('../utils/partnerEmailTemplate');
const { generateAdminWelcomeEmail, generateUserWelcomeEmail, generateCSRWelcomeEmail } = require('../utils/welcomeEmailTemplates');

const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CloudLiteracy" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - CloudLiteracy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; border: 2px solid #FFD700; border-bottom: none; }
            .logo { color: #FFD700; font-size: 32px; font-weight: bold; margin: 0; }
            .content { background-color: #1a1a1a; padding: 40px 30px; border: 2px solid #FFD700; border-top: none; border-bottom: none; }
            .greeting { color: #FFD700; font-size: 20px; margin-bottom: 20px; }
            .message { color: #cccccc; line-height: 1.6; margin-bottom: 30px; }
            .button-container { text-align: center; margin: 30px 0; }
            .reset-button { display: inline-block; background-color: #FFD700; color: #000000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
            .footer { background-color: #0d0d0d; padding: 20px 30px; text-align: center; border: 2px solid #FFD700; border-top: none; border-radius: 0 0 10px 10px; }
            .footer-text { color: #999999; font-size: 12px; margin: 5px 0; }
            .warning { background-color: #2d1a1a; border-left: 4px solid #ff4444; padding: 15px; margin: 20px 0; color: #ff9999; }
            .link-text { color: #FFD700; word-break: break-all; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">CloudLiteracy</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello ${userName || 'User'},</p>
              <p class="message">
                We received a request to reset your password for your CloudLiteracy account. 
                Click the button below to create a new password:
              </p>
              <div class="button-container">
                <a href="${resetUrl}" class="reset-button">Reset Password</a>
              </div>
              <div class="warning">
                ⚠️ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              <p class="message">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p class="link-text">${resetUrl}</p>
              <p class="message" style="margin-top: 30px;">
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </div>
            <div class="footer">
              <p class="footer-text">© ${new Date().getFullYear()} CloudLiteracy - Pre-DevOps Educational Platform</p>
              <p class="footer-text">This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

const sendPartnerWelcomeEmail = async (email, partnerName, partnerTier, accessCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CloudLiteracy" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `🌟 Welcome ${partnerTier} Partner - Your Lifetime Access Code`,
      html: generatePartnerWelcomeEmail(partnerName, partnerTier, accessCode)
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Partner welcome email error:', error);
    return { success: false, error: error.message };
  }
};

const sendAdminWelcomeEmail = async (email, adminName, tempPassword, isSuperAdmin) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CloudLiteracy" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `🌟 Welcome ${isSuperAdmin ? 'Super Admin' : 'Admin'} - CloudLiteracy`,
      html: generateAdminWelcomeEmail(adminName, tempPassword, isSuperAdmin)
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Admin welcome email error:', error);
    return { success: false, error: error.message };
  }
};

const sendUserWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CloudLiteracy" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: '🌟 Welcome to CloudLiteracy - Your Learning Journey Begins',
      html: generateUserWelcomeEmail(userName)
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('User welcome email error:', error);
    return { success: false, error: error.message };
  }
};

const sendCSRWelcomeEmail = async (email, userName, accessDuration) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CloudLiteracy" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: '🌟 CSR Program - Free Access Granted - CloudLiteracy',
      html: generateCSRWelcomeEmail(userName, accessDuration)
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('CSR welcome email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { 
  sendPasswordResetEmail, 
  sendPartnerWelcomeEmail, 
  sendAdminWelcomeEmail, 
  sendUserWelcomeEmail, 
  sendCSRWelcomeEmail 
};
