const nodemailer = require('nodemailer');
const Settings = require('../models/Settings'); // Import the Settings model

/**
 * Sends an email using the configured transporter.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Subject line of the email.
 * @param {string} htmlContent - HTML content of the email body.
 */
const sendEmail = async (to, subject, htmlContent) => {
    try {
        // Fetch the email settings and site name from the database
        const settings = await Settings.findOne();
        if (!settings || !settings.emailSettings.host) {
            console.error('Email settings not found in the database. Email not sent.');
            return;
        }

        const siteName = settings.siteName || 'AccountBird';

        // Create a new transporter with the dynamic settings from the database
        const transporter = nodemailer.createTransport({
            host: settings.emailSettings.host,
            port: settings.emailSettings.port,
            secure: settings.emailSettings.port === 465, // true for 465, false for other ports
            auth: {
                user: settings.emailSettings.user,
                pass: settings.emailSettings.pass,
            },
        });
        
        await transporter.sendMail({
            from: `"${siteName}" <${settings.emailSettings.user}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};

/**
 * Sends a two-factor authentication code to the user's email.
 * @param {string} to - Recipient's email address.
 * @param {string} code - The 2FA code to be sent.
 */
const sendTwoFactorCode = async (to, code) => {
    const subject = 'Your Two-Step Verification Code';
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Two-Step Verification</h2>
            <p>Hello,</p>
            <p>To complete your login, please use the following verification code:</p>
            <h1 style="background: #f4f4f4; padding: 10px; text-align: center; border-radius: 5px;">${code}</h1>
            <p>This code will expire in 5 minutes. If you did not attempt to log in, you can safely ignore this email.</p>
            <p>Thank you,<br>The AccountBird Team</p>
        </div>
    `;

    // Reuse the existing sendEmail function
    await sendEmail(to, subject, htmlContent);
};

module.exports = {
    sendEmail,
    sendTwoFactorCode
};