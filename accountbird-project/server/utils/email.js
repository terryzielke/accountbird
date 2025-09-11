const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

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

        // Ensure email settings exist in the database before proceeding
        if (!settings || !settings.emailSettings.host) {
            console.error('Email settings not found in the database. Email not sent.');
            return;
        }

        const siteName = settings.siteName || 'AccountBird';

        // Create a new transporter with the dynamic settings from the database
        // This is the key change to make the system dynamic again.
        const transporter = nodemailer.createTransport({
            host: settings.emailSettings.host,
            port: settings.emailSettings.port,
            secure: settings.emailSettings.port === 465, // Use SSL for port 465
            auth: {
                user: settings.emailSettings.user,
                pass: settings.emailSettings.pass,
            },
            // The `tls` option from the temporary hardcoded solution is not required
            // if the `secure` option is set correctly based on the port.
        });

        await transporter.sendMail({
            // This is the other key change. Use the emailSettings.user from the
            // database for the 'from' field. This field must be a valid,
            // full email address (e.g., info@constantdesign.ca) as a
            // requirement of the SMTP protocol.
            from: `"${siteName}" <noreply@${settings.emailSettings.user}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });

        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};

// ... (sendTwoFactorCode function remains the same) ...

/**
 * Sends a two-factor authentication code to the user's email.
 * @param {string} to - Recipient's email address.
 * @param {string} code - The 2FA code to be sent.
 */
const sendTwoFactorCode = async (to, code) => {
    const settings = await Settings.findOne();
    const siteName = settings.siteName || 'AccountBird';
    const subject = 'Your Two-Step Verification Code';
    const htmlContent = `
        <div style="width: 100%; text-align: center; margin-bottom: 20px;padding: 50px 0;">
            <div style="margin: auto; width: 80%; max-width: 600px; font-family: Arial, sans-serif; color: #333; text-align: left;">
                <h3 style="margin: 0 10px;">${siteName}</h3>
                <div style="margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fff;">
                    <h2 style="color: #333;">Two-Step Verification</h2>
                    <p style="color: #333;">Hello,</p>
                    <p style="color: #333;">To complete your login, please use the following verification code:</p>
                    <h1 style="background: #f0f0f0; padding: 10px; text-align: center; border-radius: 5px;">${code}</h1>
                    <p style="color: #333;">This code will expire in 5 minutes. If you did not attempt to log in, you can safely ignore this email.</p>
                    <p style="color: #333;">Thank you,</p>
                    <p style="color: #333;">The ${siteName} Team</p>
                </div>
            </div>
        </div>
    `;
    await sendEmail(to, subject, htmlContent);
};

module.exports = {
    sendEmail,
    sendTwoFactorCode
};