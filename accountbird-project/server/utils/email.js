const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // Use 'false' for ports 587 and 2525
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Add requireTLS to enforce a TLS connection
    // This is recommended for port 587
    tls: {
      ciphers: 'SSLv3'
    }
});

/**
 * Sends an email using the configured transporter.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Subject line of the email.
 * @param {string} htmlContent - HTML content of the email body.
 */
const sendEmail = async (to, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: `"AccountBird" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        // In a production app, you might log this error to a monitoring service
    }
};

module.exports = sendEmail;